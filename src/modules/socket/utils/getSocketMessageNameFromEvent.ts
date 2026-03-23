import { EventPayload } from '../../../gen/ws/EventPayload';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';

const wireToGetter: Record<string, (e: EventPayload) => unknown> = {
	[ChatsSocketMessage.Connected]: (e) => e.connected,
	[ChatsSocketMessage.Disconnected]: (e) => e.disconnected,
	[ChatsSocketMessage.Error]: (e) => e.error,
	[ChatsSocketMessage.ThreadMessage]: (e) => e.message,
	[ChatsSocketMessage.ThreadCreated]: (e) => e.threadCreated,
};

export function getSocketMessageNameFromEvent(
	sourceEvent: EventPayload,
): ChatsSocketMessage {
	for (const value of Object.values(ChatsSocketMessage)) {
		const get = wireToGetter[value];
		if (get?.(sourceEvent)) {
			return value;
		}
	}
	throw new Error(`Unknown event: ${JSON.stringify(sourceEvent)}`);
}
