import mitt from 'mitt';
import {
	applyTransform,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';

import { EventPayload } from '../../../gen/ws/EventPayload';
import type { ServiceConfig, SocketConfig } from '../../configs';
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

	private socketConfig: SocketConfig;
	private serviceConfig: ServiceConfig;

	private ws: WebSocket | null = null;

	private wsConnectionState: SocketClientConnectionStatus =
		SocketClientConnectionStatus.Idle;

	constructor({
		socketConfig,
		serviceConfig,
	}: {
		socketConfig: SocketConfig;
		serviceConfig: ServiceConfig;
	}) {
		this.socketConfig = socketConfig;
		this.serviceConfig = serviceConfig;
	}

	get connectionState(): SocketClientConnectionStatus {
		return this.wsConnectionState;
	}

	async connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.wsConnectionState = SocketClientConnectionStatus.Connecting;

			this.ws = new WebSocket(new URL(this.socketConfig.baseUrl).toString());

			this.ws.onopen = () => {
				this.wsConnectionState = SocketClientConnectionStatus.Connected;
				this.ws!.send(
					JSON.stringify({
						'x-webitel-access': this.socketConfig.accessToken,
					}),
				);
			};
			this.ws.onerror = () => {
				this.wsConnectionState = SocketClientConnectionStatus.Error;
				reject(new Error('failed to connect to socket'));
			};
			this.ws.onclose = () => {
				this.wsConnectionState = SocketClientConnectionStatus.Disconnected;
				this.ws = null;
				reject(new Error('socket disconnected'));
			};
			this.ws.onmessage = (event) => {
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
					resolve();
				}

				this.emitter.emit(eventName, eventPayload);
			};
		});
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

export function createChatsSocketClient({
	socketConfig,
	serviceConfig,
}: {
	socketConfig: SocketConfig;
	serviceConfig: ServiceConfig;
}): ChatsSocketClient {
	return new ChatsSocketClient({
		socketConfig,
		serviceConfig,
	});
}
