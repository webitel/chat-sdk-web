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
