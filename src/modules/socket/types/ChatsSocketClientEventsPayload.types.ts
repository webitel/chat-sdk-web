import type { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';

export type ChatsSocketClientEventPayloadMap = {
	[ChatsSocketMessage.ThreadMessage]: unknown; // todo
	[ChatsSocketMessage.ThreadCreated]: unknown; // todo
	[ChatsSocketMessage.Connected]: unknown; // todo
	[ChatsSocketMessage.Disconnected]: unknown; // todo
	[ChatsSocketMessage.Error]: unknown; // todo
};
