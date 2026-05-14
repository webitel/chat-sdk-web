import type { ServiceConfig } from '../../configs';
import type { MessageModel } from '../../messages/types/Message.types';
import type { ThreadModel } from '../../threads/types/Thread.types';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type { ChatsSocketClientEventPayloadMap } from '../types/ChatsSocketClientEventsPayload.types';
import type { EventPayload } from '../types/WsEventPayload.types';
import { instantiateSocketEventEntities } from './instantiateSocketEventEntities';

function getSocketMessageNameFromEvent(
	sourceEvent: EventPayload,
): ChatsSocketMessage {
	if (sourceEvent.connectedEvent) {
		return ChatsSocketMessage.Connected;
	}
	if (sourceEvent.disconnectedEvent) {
		return ChatsSocketMessage.Disconnected;
	}
	if (sourceEvent.errorEvent) {
		return ChatsSocketMessage.Error;
	}
	if (sourceEvent.messageEvent) {
		return ChatsSocketMessage.ThreadMessage;
	}
	if (sourceEvent.threadCreatedEvent) {
		return ChatsSocketMessage.ThreadCreated;
	}
	if (sourceEvent.ackEvent) {
		return ChatsSocketMessage.Ack;
	}
	if (sourceEvent.pingEvent) {
		return ChatsSocketMessage.Ping;
	}
	throw new Error(`Unknown event: ${JSON.stringify(sourceEvent)}`);
}

function extractRawPayload(
	sourceEvent: EventPayload,
	eventName: ChatsSocketMessage,
): unknown {
	switch (eventName) {
		case ChatsSocketMessage.Connected:
			return sourceEvent.connectedEvent;
		case ChatsSocketMessage.Disconnected:
			return sourceEvent.disconnectedEvent;
		case ChatsSocketMessage.Error:
			return sourceEvent.errorEvent;
		case ChatsSocketMessage.ThreadMessage:
			return sourceEvent.messageEvent;
		case ChatsSocketMessage.ThreadCreated:
			return sourceEvent.threadCreatedEvent;
		case ChatsSocketMessage.Ack:
			return sourceEvent.ackEvent;
		case ChatsSocketMessage.Ping:
			return sourceEvent.pingEvent;
		default: {
			const _exhaustive: never = eventName;
			return _exhaustive;
		}
	}
}

export function processSocketEventPayload(
	sourceEvent: EventPayload,
	{
		serviceConfig,
	}: {
		serviceConfig: ServiceConfig;
	},
): {
	eventName: ChatsSocketMessage;
	eventPayload: ChatsSocketClientEventPayloadMap[ChatsSocketMessage];
} {
	const eventName = getSocketMessageNameFromEvent(sourceEvent);
	const rawPayload = extractRawPayload(sourceEvent, eventName);
	const eventPayload = processEventPayload(
		{
			name: eventName,
			payload: rawPayload,
		},
		{
			serviceConfig,
		},
	);
	return {
		eventName,
		eventPayload,
	};
}

function processEventPayload(
	{
		name,
		payload,
	}: {
		name: ChatsSocketMessage;
		payload: unknown;
	},
	{
		serviceConfig,
	}: {
		serviceConfig: ServiceConfig;
	},
): ChatsSocketClientEventPayloadMap[ChatsSocketMessage] {
	switch (name) {
		case ChatsSocketMessage.ThreadMessage:
			return instantiateSocketEventEntities(
				{
					name,
					payload: payload as MessageModel,
				},
				{
					serviceConfig,
				},
			);
		case ChatsSocketMessage.ThreadCreated:
			return instantiateSocketEventEntities(
				{
					name,
					payload: payload as ThreadModel,
				},
				{
					serviceConfig,
				},
			);
		case ChatsSocketMessage.Connected:
		case ChatsSocketMessage.Disconnected:
		case ChatsSocketMessage.Error:
		case ChatsSocketMessage.Ack:
		case ChatsSocketMessage.Ping:
			return payload as ChatsSocketClientEventPayloadMap[typeof name];
		default: {
			const _exhaustive: never = name;
			return _exhaustive;
		}
	}
}
