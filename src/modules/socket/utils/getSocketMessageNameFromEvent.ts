import { EventPayload } from '../../../gen/ws/EventPayload';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';

export function getSocketMessageNameFromEvent(sourceEvent: EventPayload): ChatsSocketMessage {
    for (const [key, value] of Object.entries(ChatsSocketMessage)) {
        if (sourceEvent[value]) {
            return key as ChatsSocketMessage;
        }
    }
    throw new Error(`Unknown event: ${sourceEvent}`);
}