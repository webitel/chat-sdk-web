import type { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type {
	ChatsSocketClientEventPayloadMap,
	SocketThreadTagsChangedEventPayload,
} from './ChatsSocketClientEventsPayload.types';
import type { SocketMessageModel } from './models/SocketMessageModel.types';
import type { SocketThreadModel } from './models/SocketThreadModel.types';

/** Wire shapes that differ from what subscribers get. */
type WsPayloadOverrides = {
	[ChatsSocketMessage.ThreadMessage]: SocketMessageModel;
	[ChatsSocketMessage.ThreadCreated]: SocketThreadModel;
	// protobuf JSON leaves out an empty list, so `tags` may be missing
	[ChatsSocketMessage.ThreadTagsChanged]: Omit<
		SocketThreadTagsChangedEventPayload,
		'tags'
	> & {
		tags?: string[];
	};
};

/** The server frame's camelCased `payload`: exactly one key is set. */
export type EventPayload = {
	[Name in ChatsSocketMessage]?: Name extends keyof WsPayloadOverrides
		? WsPayloadOverrides[Name]
		: ChatsSocketClientEventPayloadMap[Name];
};
