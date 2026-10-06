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
	IChatsSocketClientStateSubscriber,
} from '../types/ChatsSocketConnectionState.types';
import type { EventPayload } from '../types/WsEventPayload.types';
import { processSocketEventPayload } from '../utils/processSocketEventPayload';

export interface IChatsSocketClient {
	connect: () => Promise<void>;
	disconnect: () => void;
	reconnect: () => Promise<void>; // todo
	onMessage: (
		event: ChatsSocketMessage,
		callback: IChatsSocketClientEventSubscriber,
	) => void;
	onState: (
		state: ChatsSocketConnectionStatus,
		callback: IChatsSocketClientStateSubscriber,
	) => void;
}

export type IChatsSocketClientEventSubscriber = (
	data: unknown, // todo
	// rawData: EventPayload, // todo: should i emit raw data too ??
) => unknown;

class ChatsSocketClient implements IChatsSocketClient {
	private emitter = mitt<ChatsSocketClientEventPayloadMap>();
	private stateEmitter = mitt<ChatsSocketConnectionStatePayloadMap>();

	private socketConfig: SocketConfig;
	private serviceConfig: ServiceConfig;

	private ws: WebSocket | null = null;
	/** rejects the `connect()` call still waiting for `connectedEvent` */
	private rejectAttempt: ((error: Error) => void) | null = null;

	private wsConnectionState: ChatsSocketConnectionStatus =
		ChatsSocketConnectionStatus.Idle;

	constructor({ socketConfig, serviceConfig }: ChatsSocketClientOptions) {
		this.socketConfig = socketConfig;
		this.serviceConfig = serviceConfig;
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
		return this.openSocket();
	}

	/**
	 * Every attempt gets its own socket. Handlers of a socket that is no longer
	 * `this.ws` return early, so a replaced socket never changes state.
	 *
	 * State subscribers may call back into the client (an app's own retry
	 * loop does), so every state change is emitted after the bookkeeping.
	 */
	private openSocket(): Promise<void> {
		this.dropSocket(new Error('socket connect superseded'));

		return new Promise((resolve, reject) => {
			this.rejectAttempt = reject;

			const socket = new WebSocket(
				new URL(this.socketConfig.baseUrl).toString(),
			);
			this.ws = socket;

			socket.onopen = () => {
				void this.authenticate(socket);
			};
			socket.onerror = () => {
				if (socket !== this.ws) {
					return;
				}
				this.rejectPendingAttempt(new Error('failed to connect to socket'));
				this.setConnectionState(ChatsSocketConnectionStatus.Error);
			};
			socket.onclose = () => {
				if (socket !== this.ws) {
					return;
				}
				this.failAttempt(new Error('socket disconnected'));
			};
			socket.onmessage = (event) => {
				if (socket !== this.ws) {
					return;
				}
				this.handleMessage(event, resolve);
			};

			this.setConnectionState(ChatsSocketConnectionStatus.Connecting);
		});
	}

	private async authenticate(socket: WebSocket): Promise<void> {
		if (socket !== this.ws) {
			return;
		}
		this.setConnectionState(ChatsSocketConnectionStatus.Connected);

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

	private handleMessage(event: MessageEvent, resolve: () => void): void {
		try {
			const eventData = applyTransform(JSON.parse(event.data), [
				snakeToCamel(),
			]) as {
				payload: EventPayload;
			};

			const { eventName, eventPayload } = processSocketEventPayload(
				eventData.payload,
				{
					serviceConfig: this.serviceConfig,
				},
			);

			if (eventName === ChatsSocketMessage.Connected) {
				this.markAnswered();
				resolve();
			}

			this.emitter.emit(eventName, eventPayload);
		} catch (err) {
			this.emitter.emit(ChatsSocketMessage.Error, {
				code: -1,
				message:
					'SDK failed to parse incoming socket event. Check "details.cause" for the original error.',
				details: {
					cause: err instanceof Error ? err.message : String(err),
				},
			});
		}
	}

	/** The server answered the attempt with `connectedEvent`. */
	private markAnswered(): void {
		this.rejectAttempt = null;
	}

	/** Forgets the current socket and fails the attempt still waiting on it. */
	private dropSocket(error: Error): void {
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
		this.setConnectionState(ChatsSocketConnectionStatus.Disconnected);
	}

	private rejectPendingAttempt(error: Error): void {
		this.rejectAttempt?.(error);
		this.rejectAttempt = null;
	}

	async reconnect(): Promise<void> {
		throw new Error('Not implemented');
	}

	async disconnect(): Promise<void> {
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
}

export function createChatsSocketClient(
	options: ChatsSocketClientOptions,
): ChatsSocketClient {
	return new ChatsSocketClient(options);
}
