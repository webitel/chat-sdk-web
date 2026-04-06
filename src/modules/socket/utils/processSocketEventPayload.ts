import { EventPayload } from '../../../gen/ws/EventPayload';
import { type ChatsSocketClientEventPayloadMap } from '../types/ChatsSocketClientEventsPayload.types';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type { ServiceConfig } from '../../configs';
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

const getSocketEventPayload = (
	sourceEvent: EventPayload,
	eventName: ChatsSocketMessage,
): ChatsSocketClientEventPayloadMap[ChatsSocketMessage] => {
	return sourceEvent[
		eventName
	] as ChatsSocketClientEventPayloadMap[ChatsSocketMessage];
};

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
	const eventPayload = getSocketEventPayload(sourceEvent, eventName);
	const processedPayload = processEventPayload<ChatsSocketMessage[eventName]>(
		{
			name: eventName,
			payload: eventPayload,
		},
		{
			serviceConfig,
		},
	);
	return {
		eventName,
		eventPayload: processedPayload,
	};
}

function processEventPayload<EventName extends keyof typeof ChatsSocketMessage>(
	{
		name,
		payload,
	}: {
		name: EventName;
		payload: ChatsSocketClientEventPayloadMap[(typeof ChatsSocketMessage)[EventName]];
	},
	{
		serviceConfig,
	}: {
		serviceConfig: ServiceConfig;
	},
) {
	if (ChatsSocketMessage.ThreadMessage === name) {
		return instantiateSocketEventEntities<
			typeof ChatsSocketMessage.ThreadMessage
		>(
			{
				name,
				payload:
					payload as ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.ThreadMessage],
			},
			{
				serviceConfig,
			},
		);
	}
	if (ChatsSocketMessage.ThreadCreated === name) {
		return instantiateSocketEventEntities<
			typeof ChatsSocketMessage.ThreadCreated
		>(
			{
				name,
				payload:
					payload as ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.ThreadCreated],
			},
			{
				serviceConfig,
			},
		);
	}

	return payload;
}
