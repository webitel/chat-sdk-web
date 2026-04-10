export const ChatsSocketConnectionStatus = {
	Idle: 'idle',
	Connecting: 'connecting',
	Connected: 'connected',
	Disconnected: 'disconnected',
	Error: 'error',
} as const;

export type ChatsSocketConnectionStatus =
	(typeof ChatsSocketConnectionStatus)[keyof typeof ChatsSocketConnectionStatus];
