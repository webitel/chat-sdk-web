import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';

import { createMessage } from '../../messages/classes/Message.class';
import { createThread } from '../../threads/classes/Thread.class';
import type { ServiceConfig } from '../../configs';
import type { ChatsSocketClientEventPayloadMap } from '../types/ChatsSocketClientEventsPayload.types';
import type { SocketMessageModel } from '../types/models/SocketMessageModel.types';
import type { SocketThreadModel } from '../types/models/SocketThreadModel.types';

export function instantiateSocketEventEntities<
	EventName extends
		| typeof ChatsSocketMessage.ThreadMessage
		| typeof ChatsSocketMessage.ThreadCreated,
>(
	{
		name,
		payload,
	}: {
		name: EventName;
		payload: ChatsSocketClientEventPayloadMap[EventName];
	},
	{
		serviceConfig,
	}: {
		serviceConfig: ServiceConfig;
	},
) {
	if (name === ChatsSocketMessage.ThreadMessage) {
		return createMessage(payload as SocketMessageModel, {
			serviceConfig,
		});
	}
	if (name === ChatsSocketMessage.ThreadCreated) {
		return createThread(payload as SocketThreadModel, {
			serviceConfig,
		});
	}
}
