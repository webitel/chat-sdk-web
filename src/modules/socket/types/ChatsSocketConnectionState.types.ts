import type { ChatsSocketConnectionStatus } from '../enums/ChatsSocketConnectionStatus.enum';

/** Emitted when the client enters a given connection state. */
export type ChatsSocketConnectionStateChangePayload = {
	previous: ChatsSocketConnectionStatus;
};

export type ChatsSocketConnectionStatePayloadMap = {
	[K in ChatsSocketConnectionStatus]: ChatsSocketConnectionStateChangePayload;
};

export type IChatsSocketClientStateSubscriber = (
	payload: ChatsSocketConnectionStateChangePayload,
) => unknown;

/** Emitted when a dropped socket is answered by the server again. */
export type ChatsSocketReconnectedPayload = {
	/** connect attempts this outage took, including the answered one */
	attempt: number;
};

export type IChatsSocketClientReconnectedSubscriber = (
	payload: ChatsSocketReconnectedPayload,
) => unknown;
