import type { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type {
	ChatsSocketClientEventPayloadMap,
	SocketThreadTagsChangedEventPayload,
	SocketVariablesEventPayload,
} from './ChatsSocketClientEventsPayload.types';
import type { SocketMessageModel } from './models/SocketMessageModel.types';
import type { SocketThreadModel } from './models/SocketThreadModel.types';

/** `variables` skips the camelCase transform, so variable names stay as sent. */
type WsVariablesPayload = Pick<SocketVariablesEventPayload, 'action'> & {
	variables?: Record<
		string,
		{
			value: unknown;
			set_by: string;
			set_at: string;
		}
	>;
};

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
	[ChatsSocketMessage.VariableSet]: WsVariablesPayload;
	[ChatsSocketMessage.VariableFlush]: WsVariablesPayload;
};

/** The server frame's camelCased `payload`: exactly one key is set. */
export type EventPayload = {
	[Name in ChatsSocketMessage]?: Name extends keyof WsPayloadOverrides
		? WsPayloadOverrides[Name]
		: ChatsSocketClientEventPayloadMap[Name];
};
