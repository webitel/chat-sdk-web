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

/**
 * The caller's own tags on a thread changed: their snooze, or the backend
 * clearing it. Sent to the tag owner only.
 */
export type SocketThreadTagsChangedEventPayload = {
	threadId: string;
	/** every tag the caller now has on the thread; replaces what you hold */
	tags: string[];
	/** the caller's `GET /v1/updates` cursor after this change */
	updatesCursor: string;
};

/**
 * How many messages the caller has not read in a thread changed: a message
 * arrived, or the caller (on any device) read the thread. Sent to the caller only.
 */
export type SocketThreadUnreadChangedEventPayload = {
	threadId: string;
	/** the caller's unread messages in the thread now; replaces what you hold */
	unreadCount: number;
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
	[ChatsSocketMessage.ThreadTagsChanged]: SocketThreadTagsChangedEventPayload;
	[ChatsSocketMessage.ThreadUnreadChanged]: SocketThreadUnreadChangedEventPayload;
	[ChatsSocketMessage.Ack]: {
		id: string;
		status: string;
	};
	[ChatsSocketMessage.Ping]: {
		timestamp: number;
	};
};
