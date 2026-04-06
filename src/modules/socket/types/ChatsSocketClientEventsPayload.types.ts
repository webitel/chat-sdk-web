import type { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type { SocketMessageModel } from './models/SocketMessageModel.types';
import type { SocketThreadModel } from './models/SocketThreadModel.types';

export type ChatsSocketClientEventPayloadMap = {
	[ChatsSocketMessage.ThreadMessage]: SocketMessageModel;
	[ChatsSocketMessage.ThreadCreated]: SocketThreadModel;
	[ChatsSocketMessage.Connected]: {
		ok: boolean;
		connectionId: string;
		serverVersion: string;
	};
	[ChatsSocketMessage.Disconnected]: {
		code: number;
		reason: string;
		status: string;
	};
	[ChatsSocketMessage.Error]: {
		code: number;
		message: string;
		details: Record<string, unknown>;
	};
	[ChatsSocketMessage.Ack]: {
		id: string;
		status: string;
	};
	[ChatsSocketMessage.Ping]: {
		timestamp: number;
	};
};
