import type { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type { ChatsSocketClientEventPayloadMap } from './ChatsSocketClientEventsPayload.types';
import type { SocketMessageModel } from './models/SocketMessageModel.types';
import type { SocketThreadModel } from './models/SocketThreadModel.types';

export interface EventPayload {
	connectedEvent?: ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.Connected];
	disconnectedEvent?: ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.Disconnected];
	messageEvent?: SocketMessageModel;
	threadCreatedEvent?: SocketThreadModel;
	memberAddedEvent?: ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.MemberAdded];
	memberLeftEvent?: ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.MemberLeft];
	// protobuf JSON leaves out an empty list, so `tags` may be missing
	threadTagsChangedEvent?: Omit<
		ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.ThreadTagsChanged],
		'tags'
	> & {
		tags?: string[];
	};
	// protobuf JSON leaves out a zero, so `unreadCount` may be missing
	threadUnreadChangedEvent?: Omit<
		ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.ThreadUnreadChanged],
		'unreadCount'
	> & {
		unreadCount?: number;
	};
	ackEvent?: ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.Ack];
	errorEvent?: ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.Error];
	pingEvent?: ChatsSocketClientEventPayloadMap[typeof ChatsSocketMessage.Ping];
}
