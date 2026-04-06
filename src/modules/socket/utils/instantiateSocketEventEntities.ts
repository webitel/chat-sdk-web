import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';

import { createMessage } from '../../messages/classes/Message.class';
import { createThread } from '../../threads/classes/Thread.class';
import type { ServiceConfig } from '../../configs';
import type {
	IMessage,
	MessageModel,
} from '../../messages/types/Message.types';
import type { IThread } from '../../threads/types/Thread.types';
import type { ThreadModel } from '../../threads/types/Thread.types';

export function instantiateSocketEventEntities(
	args:
		| {
				name: typeof ChatsSocketMessage.ThreadMessage;
				payload: MessageModel;
		  }
		| {
				name: typeof ChatsSocketMessage.ThreadCreated;
				payload: ThreadModel;
		  },
	{
		serviceConfig,
	}: {
		serviceConfig: ServiceConfig;
	},
): IMessage | IThread {
	if (args.name === ChatsSocketMessage.ThreadMessage) {
		return createMessage(args.payload, {
			serviceConfig,
		});
	}
	return createThread(args.payload, {
		serviceConfig,
	});
}
