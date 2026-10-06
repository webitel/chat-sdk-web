import {
	applyTransform,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';
import mitt from 'mitt';

import type { ServiceConfig, SocketConfig } from '../../configs';
import { ChatsSocketConnectionStatus } from '../enums/ChatsSocketConnectionStatus.enum';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type { ChatsSocketClientEventPayloadMap } from '../types/ChatsSocketClientEventsPayload.types';
import type { ChatsSocketClientOptions } from '../types/ChatsSocketClientOptions.types';
import type {
	ChatsSocketConnectionStatePayloadMap,
	ChatsSocketReconnectedPayload,
	IChatsSocketClientReconnectedSubscriber,
	IChatsSocketClientStateSubscriber,
} from '../types/ChatsSocketConnectionState.types';
import type { EventPayload } from '../types/WsEventPayload.types';
import { processSocketEventPayload } from '../utils/processSocketEventPayload';

const DEFAULT_CONNECT_TIMEOUT = 10_000;
const DEFAULT_INITIAL_RETRY_DELAY = 1_000;
const DEFAULT_MAX_RETRY_DELAY = 30_000;
/** setTimeout fires right away for anything longer */
const MAX_TIMER_DELAY = 2 ** 31 - 1;

/** A subscriber's bug is reported, never allowed to stop the client or other subscribers. */
function notifySafely(notify: () => void): void {
	try {
		notify();
	} catch (err) {
		console.error('[@webitel/chat-web-sdk] a socket subscriber threw', err);
	}
}

/**
 * Unusable delays (NaN, Infinity, `maxDelay` <= 0) fall back to the defaults.
 * The first delay is kept between 1ms and `maxDelay`, so a failing server is
 * never retried in a hot loop.
 */
function toRetryPolicy({
	initialDelay,
	maxDelay,
}: {
	initialDelay?: number;
	maxDelay?: number;
}): {
	initialDelay: number;
	maxDelay: number;
} {
	const usableMaxDelay =
		maxDelay !== undefined && Number.isFinite(maxDelay) && maxDelay > 0
			? Math.min(maxDelay, MAX_TIMER_DELAY)
			: DEFAULT_MAX_RETRY_DELAY;
	const usableInitialDelay =
		initialDelay !== undefined && Number.isFinite(initialDelay)
			? initialDelay
			: DEFAULT_INITIAL_RETRY_DELAY;
	return {
		initialDelay: Math.min(Math.max(usableInitialDelay, 1), usableMaxDelay),
		maxDelay: usableMaxDelay,
	};
}

export interface IChatsSocketClient {
	connect: () => Promise<void>;
	disconnect: () => void;
	reconnect: () => Promise<void>;
	onMessage: (
		event: ChatsSocketMessage,
		callback: IChatsSocketClientEventSubscriber,
	) => void;
	onState: (
		state: ChatsSocketConnectionStatus,
		callback: IChatsSocketClientStateSubscriber,
	) => void;
	onReconnected: (callback: IChatsSocketClientReconnectedSubscriber) => void;
}

export type IChatsSocketClientEventSubscriber = (
	data: unknown, // todo
	// rawData: EventPayload, // todo: should i emit raw data too ??
) => unknown;

class ChatsSocketClient implements IChatsSocketClient {
	private emitter = mitt<ChatsSocketClientEventPayloadMap>();
	private stateEmitter = mitt<ChatsSocketConnectionStatePayloadMap>();
	private reconnectedEmitter = mitt<{
		reconnected: ChatsSocketReconnectedPayload;
	}>();

	private socketConfig: SocketConfig;
	private serviceConfig: ServiceConfig;

	private ws: WebSocket | null = null;
	/** rejects the `connect()` call still waiting for `connectedEvent` */
	private rejectAttempt: ((error: Error) => void) | null = null;
	private connectTimeout: number;
	private connectTimer: ReturnType<typeof setTimeout> | null = null;
	private retryPolicy: {
		initialDelay: number;
		maxDelay: number;
	} | null;
	private retryTimer: ReturnType<typeof setTimeout> | null = null;
	private retryDelay: number;
	/** attempts made for the current outage */
	private attempt = 0;

	private wsConnectionState: ChatsSocketConnectionStatus =
		ChatsSocketConnectionStatus.Idle;

	constructor({
		socketConfig,
		serviceConfig,
		connectTimeout = DEFAULT_CONNECT_TIMEOUT,
		reconnect,
	}: ChatsSocketClientOptions) {
		this.socketConfig = socketConfig;
		this.serviceConfig = serviceConfig;
		this.connectTimeout = connectTimeout;
		this.retryPolicy =
			reconnect === false ? null : toRetryPolicy(reconnect ?? {});
		this.retryDelay =
			this.retryPolicy?.initialDelay ?? DEFAULT_INITIAL_RETRY_DELAY;
	}

	get connectionState(): ChatsSocketConnectionStatus {
		return this.wsConnectionState;
	}

	private setConnectionState(next: ChatsSocketConnectionStatus): void {
		const previous = this.wsConnectionState;
		if (previous === next) {
			return;
		}
		this.wsConnectionState = next;
		this.stateEmitter.emit(next, {
			previous,
		});
	}

	async connect(): Promise<void> {
		return this.openSocket({
			isRetry: false,
		});
	}

	/**
	 * Connects again right away, without waiting for a pending retry; resolves
	 * once the server answers, which fires `onReconnected`. With
	 * `reconnect: false` a failed call just rejects and nothing retries.
	 */
	async reconnect(): Promise<void> {
		this.attempt += 1;
		return this.openSocket({
			isRetry: true,
		});
	}

	/**
	 * Every attempt gets its own socket. Handlers of a socket that is no longer
	 * `this.ws` return early, so a replaced socket never changes state.
	 *
	 * State subscribers may call back into the client (an app's own retry
	 * loop does), so every state change is emitted after the bookkeeping.
	 */
	private openSocket({ isRetry }: { isRetry: boolean }): Promise<void> {
		this.clearRetryTimer();
		this.dropSocket(new Error('socket connect superseded'));

		return new Promise((resolve, reject) => {
			this.rejectAttempt = reject;

			const socket = new WebSocket(
				new URL(this.socketConfig.baseUrl).toString(),
			);
			this.ws = socket;
			// a server that opens the socket but never answers would stall retries
			this.connectTimer = setTimeout(() => {
				this.failAttempt(new Error('socket connect timed out'));
			}, this.connectTimeout);

			socket.onopen = () => {
				void this.authenticate(socket);
			};
			socket.onerror = () => {
				if (socket !== this.ws) {
					return;
				}
				this.rejectPendingAttempt(new Error('failed to connect to socket'));
				this.scheduleRetry();
				this.setConnectionState(ChatsSocketConnectionStatus.Error);
			};
			socket.onclose = () => {
				if (socket !== this.ws) {
					return;
				}
				this.failAttempt(new Error('socket disconnected'));
			};
			// a server may repeat connectedEvent; only the first one answers the attempt
			let answered = false;
			socket.onmessage = (event) => {
				if (socket !== this.ws) {
					return;
				}
				const message = this.parseMessage(event);
				if (!message) {
					return;
				}

				const answers =
					message.eventName === ChatsSocketMessage.Connected && !answered;
				const attempt = this.attempt;
				if (answers) {
					answered = true;
					this.markAnswered();
					resolve();
				}

				notifySafely(() => {
					this.emitter.emit(message.eventName, message.eventPayload);
				});

				// last, and only if no subscriber dropped or replaced the socket meanwhile
				if (answers && isRetry && socket === this.ws) {
					this.reconnectedEmitter.emit('reconnected', {
						attempt,
					});
				}
			};

			this.setConnectionState(ChatsSocketConnectionStatus.Connecting);
		});
	}

	private async authenticate(socket: WebSocket): Promise<void> {
		if (socket !== this.ws) {
			return;
		}
		this.setConnectionState(ChatsSocketConnectionStatus.Connected);
		// a subscriber may have disconnected; a getter can be a network call
		if (socket !== this.ws) {
			return;
		}

		let accessToken: string;
		try {
			accessToken = await this.resolveAccessToken();
		} catch (err) {
			if (socket === this.ws) {
				this.failAttempt(err instanceof Error ? err : new Error(String(err)));
			}
			return;
		}
		// the socket may have been replaced or dropped while the token resolved
		if (socket !== this.ws) {
			return;
		}
		socket.send(
			JSON.stringify({
				'x-webitel-access': accessToken,
			}),
		);
	}

	/** Read on every attempt, so a reconnect authenticates with the current token. */
	private async resolveAccessToken(): Promise<string> {
		const { accessToken } = this.socketConfig;
		return typeof accessToken === 'function'
			? await accessToken()
			: accessToken;
	}

	/** Parse failures are reported as an SDK `Error` message and dropped. */
	private parseMessage(
		event: MessageEvent,
	): ReturnType<typeof processSocketEventPayload> | null {
		try {
			const eventData = applyTransform(JSON.parse(event.data), [
				snakeToCamel(),
			]) as {
				payload: EventPayload;
			};

			return processSocketEventPayload(eventData.payload, {
				serviceConfig: this.serviceConfig,
			});
		} catch (err) {
			notifySafely(() => {
				this.emitter.emit(ChatsSocketMessage.Error, {
					code: -1,
					message:
						'SDK failed to parse incoming socket event. Check "details.cause" for the original error.',
					details: {
						cause: err instanceof Error ? err.message : String(err),
					},
				});
			});
			return null;
		}
	}

	/** The server answered the attempt with `connectedEvent`. */
	private markAnswered(): void {
		this.clearConnectTimer();
		this.rejectAttempt = null;
		this.resetRetryDelay();
		this.attempt = 0;
	}

	/** Forgets the current socket and fails the attempt still waiting on it. */
	private dropSocket(error: Error): void {
		this.clearConnectTimer();
		this.rejectPendingAttempt(error);
		const socket = this.ws;
		if (!socket) {
			return;
		}
		// cleared before close(): the socket's own close event must read as stale
		this.ws = null;
		socket.close();
	}

	private failAttempt(error: Error): void {
		this.dropSocket(error);
		this.scheduleRetry();
		this.setConnectionState(ChatsSocketConnectionStatus.Disconnected);
	}

	private rejectPendingAttempt(error: Error): void {
		this.rejectAttempt?.(error);
		this.rejectAttempt = null;
	}

	/** One retry per drop: a drop reports both `error` and `disconnected`. */
	private scheduleRetry(): void {
		if (!this.retryPolicy || this.retryTimer) {
			return;
		}
		this.retryTimer = setTimeout(() => {
			this.retryTimer = null;
			this.attempt += 1;
			void this.retry();
		}, this.retryDelay);
		this.retryDelay = Math.min(this.retryDelay * 2, this.retryPolicy.maxDelay);
	}

	private async retry(): Promise<void> {
		try {
			await this.openSocket({
				isRetry: true,
			});
		} catch {
			// a failed attempt schedules the next one itself
		}
	}

	private clearRetryTimer(): void {
		if (this.retryTimer) {
			clearTimeout(this.retryTimer);
		}
		this.retryTimer = null;
	}

	private clearConnectTimer(): void {
		if (this.connectTimer) {
			clearTimeout(this.connectTimer);
		}
		this.connectTimer = null;
	}

	private resetRetryDelay(): void {
		this.retryDelay =
			this.retryPolicy?.initialDelay ?? DEFAULT_INITIAL_RETRY_DELAY;
	}

	async disconnect(): Promise<void> {
		// the dropped socket's handlers read as stale, so only a pending retry
		// can still reconnect it
		this.clearRetryTimer();
		this.resetRetryDelay();
		this.attempt = 0;
		this.dropSocket(new Error('socket disconnected'));
		this.setConnectionState(ChatsSocketConnectionStatus.Disconnected);
	}

	onMessage(
		event: ChatsSocketMessage,
		callback: IChatsSocketClientEventSubscriber,
	): void {
		this.emitter.on(event, callback);
	}

	onState(
		state: ChatsSocketConnectionStatus,
		callback: IChatsSocketClientStateSubscriber,
	): void {
		this.stateEmitter.on(state, callback);
	}

	/**
	 * Called each time the server answers again after the socket dropped, and
	 * after every answered `reconnect()` — never for `connect()`. Anything sent
	 * while the socket was down was not pushed: this is the moment to catch up.
	 * A subscriber that throws is logged and does not affect the others.
	 */
	onReconnected(callback: IChatsSocketClientReconnectedSubscriber): void {
		// isolated per subscriber: one app's bug must not cancel another's catch-up
		this.reconnectedEmitter.on('reconnected', (payload) => {
			notifySafely(() => {
				callback(payload);
			});
		});
	}
}

export function createChatsSocketClient(
	options: ChatsSocketClientOptions,
): ChatsSocketClient {
	return new ChatsSocketClient(options);
}
