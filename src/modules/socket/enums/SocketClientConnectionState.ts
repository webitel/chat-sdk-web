export const SocketClientConnectionState = {
    Idle: 'idle',
    Connecting: 'connecting',
    Connected: 'connected',
    Disconnected: 'disconnected',
    Error: 'error',
} as const;

export type SocketClientConnectionState = (typeof SocketClientConnectionState)[keyof typeof SocketClientConnectionState];