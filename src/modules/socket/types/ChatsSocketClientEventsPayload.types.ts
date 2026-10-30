import type { IMessage } from '../../messages/types/Message.types';
import type { IThread } from '../../threads/types/Thread.types';
import type { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type { SocketMessageType } from './models/SocketMessageModel.types';
import type { SocketPeerModel } from './models/SocketPeerModel.types';

export type SocketMemberAddedEventPayload = {
	threadId: string;
	contactId: string;
	metadata: {
		threadId: string;
		newMemberContactId: string;
		newMemberId: string;
		newMemberRole: number;
	};
	/** the recipient's `GET /v1/updates` cursor after this change */
	updatesCursor?: string;
	action?: 'joined';
};

export type SocketMemberLeftEventPayload = {
	threadId: string;
	contactId: string;
	metadata: {
		threadId: string;
		removedMemberContactId: string;
		removedMemberId: string;
	};
	/** the recipient's `GET /v1/updates` cursor after this change */
	updatesCursor?: string;
	action?: 'left';
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
 * Live events for this connection were dropped: catch up via `GET /v1/updates`.
 */
export type SocketResyncEventPayload = {
	/** cursor to resume from; missing means the one you saved */
	cursor?: string;
};

/** Match the message by `id` and replace its content. */
export type SocketMessageEditedEventPayload = {
	id: string;
	threadId: string;
	editedBy: SocketPeerModel;
	body: string;
	type: SocketMessageType;
	/** ignore an edit older than the one you applied */
	version?: number;
	/** Unix ms */
	createdAt: number;
	/** Unix ms */
	editedAt: number;
	metadata?: Record<string, unknown>;
	/** the recipient's `GET /v1/updates` cursor after this change */
	updatesCursor?: string;
};

/** Match the message by `id` and remove it. */
export type SocketMessageDeletedEventPayload = {
	id: string;
	threadId: string;
	deletedBy: SocketPeerModel;
	/** Unix ms */
	createdAt: number;
	/** Unix ms */
	deletedAt: number;
	/** the recipient's `GET /v1/updates` cursor after this change */
	updatesCursor?: string;
};

/**
 * A member's delivery status changed. `delivered` / `read` move the member up
 * to `upToSeq`; `failed` names the single `messageId`.
 */
export type SocketMessageStatusEventPayload = {
	threadId: string;
	status: 'delivered' | 'read' | 'failed';
	member: SocketPeerModel;
	/** the message that failed; set only with `failed` */
	messageId?: string;
	upToSeq?: number;
	/** the reader's unread count after a `read` */
	unreadCount?: number;
	via?: 'ws' | 'push' | 'provider' | 'bot';
	/** why the message did not reach the member */
	error?: {
		code: string;
		message: string;
	};
	/** Unix ms */
	occurredAt: number;
	/** the recipient's `GET /v1/updates` cursor after this change */
	updatesCursor?: string;
};

export type SocketMessageReactionAggregate = {
	emoji: string;
	count: number;
	/** resolved for the recipient */
	reactedByMe: boolean;
	reactorIds?: string[];
	/** Unix ms, as a string */
	lastReactedAt: string;
};

/**
 * A message's reactions changed. `reactions` is the whole bar after the
 * change: replace what you hold; `[]` means none are left.
 */
export type SocketMessageReactionEventPayload = {
	messageId: string;
	threadId: string;
	reactions: SocketMessageReactionAggregate[];
	/** the recipient's `GET /v1/updates` cursor after this change */
	updatesCursor?: string;
};

/** Someone is typing. Ephemeral: never replayed by `GET /v1/updates`. */
export type SocketTypingEventPayload = {
	threadId: string;
	/** hide the indicator after this many ms without a new event */
	timeoutMs: number;
	from: SocketPeerModel;
	previewText?: string;
};

export type SocketInteractiveCallbackPeer = {
	id: string;
	/** 1 user, 2 group, 3 channel */
	type: number;
	sub?: string;
	issuer?: string;
	name?: string;
	username?: string;
	isBot: boolean;
	memberId?: string;
	role?: number;
	domainId?: number;
};

/** A participant pressed an interactive button. */
export type SocketInteractiveCallbackEventPayload = {
	reactedBy: SocketInteractiveCallbackPeer;
	/** the message the button belongs to */
	inReplyTo: string;
	buttonCode: string;
	callbackData: string;
	reactedAt: string;
	domainId: number;
	threadId: string;
	receiver: SocketInteractiveCallbackPeer;
};

export type SocketThreadVariable = {
	value: unknown;
	setBy: string;
	setAt: string;
};

/**
 * Thread variables were set or flushed. The server does not say which thread.
 */
export type SocketVariablesEventPayload = {
	/** keyed by variable name, as sent (names are not camelCased) */
	variables: Record<string, SocketThreadVariable>;
	action: 'set' | 'flush';
};

/** Emitted payloads: message/thread socket events are upgraded to SDK entities. */
export type ChatsSocketClientEventPayloadMap = {
	[ChatsSocketMessage.ThreadMessage]: IMessage;
	[ChatsSocketMessage.ThreadCreated]: IThread;
	[ChatsSocketMessage.Connected]: {
		ok: boolean;
		connectionId: string;
		serverVersion: string;
		/** the user's `GET /v1/updates` cursor now; equal to the saved one means nothing was missed */
		updatesCursor?: string;
	};
	[ChatsSocketMessage.Disconnected]: {
		code: number;
		reason: string;
		/** `UNAUTHORIZED`, `FORBIDDEN`, `TIMEOUT`, `INTERNAL_SERVER_ERROR`, `SHUTDOWN`, `EVICTED` */
		status: string;
	};
	[ChatsSocketMessage.Resync]: SocketResyncEventPayload;
	[ChatsSocketMessage.Error]: {
		code: number;
		message: string;
		details: Record<string, unknown>;
	};
	[ChatsSocketMessage.MessageEdited]: SocketMessageEditedEventPayload;
	[ChatsSocketMessage.MessageDeleted]: SocketMessageDeletedEventPayload;
	[ChatsSocketMessage.MessageStatus]: SocketMessageStatusEventPayload;
	[ChatsSocketMessage.MessageReaction]: SocketMessageReactionEventPayload;
	[ChatsSocketMessage.Typing]: SocketTypingEventPayload;
	[ChatsSocketMessage.MemberAdded]: SocketMemberAddedEventPayload;
	[ChatsSocketMessage.MemberLeft]: SocketMemberLeftEventPayload;
	[ChatsSocketMessage.ThreadTagsChanged]: SocketThreadTagsChangedEventPayload;
	[ChatsSocketMessage.InteractiveCallback]: SocketInteractiveCallbackEventPayload;
	[ChatsSocketMessage.VariableSet]: SocketVariablesEventPayload;
	[ChatsSocketMessage.VariableFlush]: SocketVariablesEventPayload;
	[ChatsSocketMessage.Ack]: {
		id: string;
		status: string;
	};
	[ChatsSocketMessage.Ping]: {
		timestamp: number;
	};
};
