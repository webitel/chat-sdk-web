export const SocketClientConnectionStatus = {
    Idle: 'idle',
    Connecting: 'connecting',
    Connected: 'connected',
    Disconnected: 'disconnected',
    Error: 'error',
} as const;

export type SocketClientConnectionStatus = (typeof SocketClientConnectionStatus)[keyof typeof SocketClientConnectionStatus];