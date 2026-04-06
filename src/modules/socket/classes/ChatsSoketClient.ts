import mitt from 'mitt';
import {
	applyTransform,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';

import { EventPayload } from '../../../gen/ws/EventPayload';
import type { SocketConfig } from '../../configs';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import { SocketClientConnectionStatus } from '../enums/SocketClientConnectionStatus.enum';
import type { ChatsSocketClientEventPayloadMap } from '../types/ChatsSocketClientEventsPayload.types';
import { processSocketEventPayload } from '../utils/processSocketEventPayload';

export interface IChatsSocketClient {
	connect: () => Promise<void>;
	disconnect: () => void;
	reconnect: () => Promise<void>; // todo
	on: (
		event: ChatsSocketMessage,
		callback: IChatsSocketClientEventSubscriber,
	) => void;
}

export type IChatsSocketClientEventSubscriber = (
	data: unknown, // todo
	// rawData: EventPayload, // todo: should i emit raw data too ??
) => unknown;

class ChatsSocketClient implements IChatsSocketClient {
	private emitter = mitt<ChatsSocketClientEventPayloadMap>();

	private ws: WebSocket | null = null;

	private wsConnectionState: SocketClientConnectionStatus =
		SocketClientConnectionStatus.Idle;

	constructor(private config: SocketConfig) {}

	get connectionState(): SocketClientConnectionStatus {
		return this.wsConnectionState;
	}

	async connect(): Promise<void> {
		this.wsConnectionState = SocketClientConnectionStatus.Connecting;
		const ws = new WebSocket(new URL(this.config.baseUrl).toString());
		this.ws = ws;
		setTimeout(() => {
			ws.send(
				JSON.stringify({
					'x-webitel-access': this.config.accessToken,
				}),
			);
		}, 1000);
		this.ws.onopen = () => {
			this.wsConnectionState = SocketClientConnectionStatus.Connected;
		};
		this.ws.onerror = () => {
			this.wsConnectionState = SocketClientConnectionStatus.Error;
		};
		this.ws.onclose = () => {
			this.wsConnectionState = SocketClientConnectionStatus.Disconnected;
			this.ws = null;
		};
		this.ws.onmessage = (event) => {
			const eventData = applyTransform(JSON.parse(event.data), [
				snakeToCamel(),
			]) as {
				payload: EventPayload;
			};

			const { eventName, eventPayload } = processSocketEventPayload(
				eventData.payload,
			);
			// const processEvent = (event: unknown) => event; // todo: implement event processing

			this.emitter.emit(eventName, eventPayload);
		};
	}

	async reconnect(): Promise<void> {
		throw new Error('Not implemented');
	}

	async disconnect(): Promise<void> {
		this.ws?.close();
		this.wsConnectionState = SocketClientConnectionStatus.Disconnected;
		this.ws = null;
	}

	on(
		event: ChatsSocketMessage,
		callback: IChatsSocketClientEventSubscriber,
	): void {
		this.emitter.on(event, callback);
	}
}

export function createChatsSocketClient(
	config: SocketConfig,
): ChatsSocketClient {
	return new ChatsSocketClient(config);
}
