import type { EventPayload } from '../../../gen/ws/EventPayload';
import type { ServiceConfig } from '../../configs';
import type { MessageModel } from '../../messages/types/Message.types';
import type { ThreadModel } from '../../threads/types/Thread.types';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type { ChatsSocketClientEventPayloadMap } from '../types/ChatsSocketClientEventsPayload.types';
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
	if (name === ChatsSocketMessage.ThreadMessage) {
		return instantiateSocketEventEntities(
			{
				name,
				payload: payload as MessageModel,
			},
			{
				serviceConfig,
			},
		);
	}
	if (name === ChatsSocketMessage.ThreadCreated) {
		return instantiateSocketEventEntities(
			{
				name,
				payload: payload as ThreadModel,
			},
			{
				serviceConfig,
			},
		);
	}

	return payload as ChatsSocketClientEventPayloadMap[ChatsSocketMessage];
}
