import type { IMessage } from '../../messages/types/Message.types';
import type { IThread } from '../../threads/types/Thread.types';
import type { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';

export type SocketMemberAddedEventPayload = {
	threadId: string;
	contactId: string;
	metadata: {
		threadId: string;
		newMemberContactId: string;
		newMemberId: string;
		newMemberRole: number;
	};
};

export type SocketMemberLeftEventPayload = {
	threadId: string;
	contactId: string;
	metadata: {
		threadId: string;
		removedMemberContactId: string;
		removedMemberId: string;
	};
};

/** Emitted payloads: message/thread socket events are upgraded to SDK entities. */
export type ChatsSocketClientEventPayloadMap = {
	[ChatsSocketMessage.ThreadMessage]: IMessage;
	[ChatsSocketMessage.ThreadCreated]: IThread;
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
	[ChatsSocketMessage.MemberAdded]: SocketMemberAddedEventPayload;
	[ChatsSocketMessage.MemberLeft]: SocketMemberLeftEventPayload;
	[ChatsSocketMessage.Ack]: {
		id: string;
		status: string;
	};
	[ChatsSocketMessage.Ping]: {
		timestamp: number;
	};
};
