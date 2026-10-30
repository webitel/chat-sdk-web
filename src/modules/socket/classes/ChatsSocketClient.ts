import {
	applyTransform,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';
import mitt from 'mitt';

import type { ServiceConfig, SocketConfig } from '../../configs';
import { ChatsSocketConnectionStatus } from '../enums/ChatsSocketConnectionStatus.enum';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import { BrowserNetworkWatcher } from '../modules/browserNetwork/classes/BrowserNetworkWatcher.class';
import { RetryScheduler } from '../modules/reconnect/classes/RetryScheduler.class';
import { toRetryPolicy } from '../modules/reconnect/utils/toRetryPolicy';
import type { ChatsSocketClientEventPayloadMap } from '../types/ChatsSocketClientEventsPayload.types';
import type { ChatsSocketClientOptions } from '../types/ChatsSocketClientOptions.types';
import type {
	ChatsSocketConnectionStatePayloadMap,
	ChatsSocketReconnectedPayload,
	IChatsSocketClientReconnectedSubscriber,
	IChatsSocketClientStateSubscriber,
} from '../types/ChatsSocketConnectionState.types';
import type { EventPayload } from '../types/WsEventPayload.types';
import { notifySafely } from '../utils/notifySafely';
import { processSocketEventPayload } from '../utils/processSocketEventPayload';
import {
	DEFAULT_CONNECT_TIMEOUT,
	toConnectTimeout,
} from '../utils/toConnectTimeout';

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
	/** null: no timeout */
	private connectTimeout: number | null;
	private connectTimer: ReturnType<typeof setTimeout> | null = null;
	private retries: RetryScheduler;
	/** attempts made for the current outage */
	private attempt = 0;
	private network: BrowserNetworkWatcher | null;

	private wsConnectionState: ChatsSocketConnectionStatus =
		ChatsSocketConnectionStatus.Idle;

	constructor({
		socketConfig,
		serviceConfig,
		connectTimeout = DEFAULT_CONNECT_TIMEOUT,
		reconnect,
		followBrowserNetwork = false,
	}: ChatsSocketClientOptions) {
		this.socketConfig = socketConfig;
		this.serviceConfig = serviceConfig;
		this.connectTimeout = toConnectTimeout(connectTimeout);
		this.retries = new RetryScheduler(
			reconnect === false ? null : toRetryPolicy(reconnect ?? {}),
			() => {
				this.attempt += 1;
				void this.retry();
			},
		);
		this.network = followBrowserNetwork
			? new BrowserNetworkWatcher({
					// the TCP stack often notices a dead network late
					onOffline: () => {
						if (this.ws) {
							this.failAttempt(new Error('browser went offline'));
						}
					},
					// a pending retry means the client still wants the socket: run it
					// now. A returning network is a fresh start — `online` often fires
					// before DNS or a VPN is up, and a failed first try must not wait
					// out the grown backoff.
					onOnline: () => {
						if (this.retries.isPending) {
							this.retries.runNow();
						}
					},
				})
			: null;
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
		notifySafely(() => {
			this.stateEmitter.emit(next, {
				previous,
			});
		});
	}

	async connect(): Promise<void> {
		this.network?.start();
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
		this.network?.start();
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
		this.retries.cancel();
		this.dropSocket(new Error('socket connect superseded'));

		return new Promise((resolve, reject) => {
			this.rejectAttempt = reject;

			const socket = new WebSocket(
				new URL(this.socketConfig.baseUrl).toString(),
			);
			this.ws = socket;
			// a server that opens the socket but never answers would stall retries
			if (this.connectTimeout !== null) {
				this.connectTimer = setTimeout(() => {
					if (socket !== this.ws) {
						return;
					}
					this.failAttempt(new Error('socket connect timed out'));
				}, this.connectTimeout);
			}

			socket.onopen = () => {
				void this.authenticate(socket);
			};
			socket.onerror = () => {
				if (socket !== this.ws) {
					return;
				}
				this.rejectPendingAttempt(new Error('failed to connect to socket'));
				// a drop reports both error and close; the scheduler keeps one retry
				this.retries.schedule();
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

	/** Unknown events are dropped; parse failures are reported as an SDK `Error` message and dropped. */
	private parseMessage(
		event: MessageEvent,
	): ReturnType<typeof processSocketEventPayload> | null {
		try {
			// variable names are the user's own: keep them as sent
			const eventData = applyTransform(JSON.parse(event.data), [
				snakeToCamel([
					'variables',
				]),
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
		this.retries.restart();
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
		this.retries.schedule();
		this.setConnectionState(ChatsSocketConnectionStatus.Disconnected);
	}

	private rejectPendingAttempt(error: Error): void {
		this.rejectAttempt?.(error);
		this.rejectAttempt = null;
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

	private clearConnectTimer(): void {
		if (this.connectTimer) {
			clearTimeout(this.connectTimer);
		}
		this.connectTimer = null;
	}

	async disconnect(): Promise<void> {
		this.network?.stop();
		// the dropped socket's handlers read as stale, so only a pending retry
		// can still reconnect it
		this.retries.cancel();
		this.retries.restart();
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
