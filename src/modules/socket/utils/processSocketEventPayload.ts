import { EventPayload } from '../../../gen/ws/EventPayload';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';

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
	throw new Error(`Unknown event: ${JSON.stringify(sourceEvent)}`);
}

const getSocketEventPayload = (
	sourceEvent: EventPayload,
	eventName: ChatsSocketMessage,
): unknown => {
	if (eventName === ChatsSocketMessage.Connected) {
		return sourceEvent.connectedEvent;
	}
	if (eventName === ChatsSocketMessage.Disconnected) {
		return sourceEvent.disconnectedEvent;
	}
	if (eventName === ChatsSocketMessage.Error) {
		return sourceEvent.errorEvent;
	}
	if (eventName === ChatsSocketMessage.ThreadMessage) {
		return sourceEvent.messageEvent;
	}
	if (eventName === ChatsSocketMessage.ThreadCreated) {
		return sourceEvent.threadCreatedEvent;
	}
	throw new Error(`Unknown event: ${eventName}`);
};

export function processSocketEventPayload(sourceEvent: EventPayload): {
	eventName: ChatsSocketMessage;
	eventPayload: unknown;
} {
	const eventName = getSocketMessageNameFromEvent(sourceEvent);
	const eventPayload = getSocketEventPayload(sourceEvent, eventName);
	return {
		eventName,
		eventPayload,
	};
}
