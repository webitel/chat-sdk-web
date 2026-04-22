import type { ServiceConfig } from '../../configs';

import { createMessage } from '../../messages/classes/Message.class';
import type {
	IMessage,
	MessageModel,
} from '../../messages/types/Message.types';
import { createThread } from '../../threads/classes/Thread.class';
import type { IThread, ThreadModel } from '../../threads/types/Thread.types';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';

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
