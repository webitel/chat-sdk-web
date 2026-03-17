import { SocketClientConnectionState } from '../enums/SocketClientConnectionState';

export type ChatsSocketClientConfig = {
    baseUrl: string;
    getToken: () => string | Promise<string>;
    onStatusChange?: (status: SocketClientConnectionState) => void;
    onMessage?: (message: unknown) => void;
};

export interface IChatsSocketClient {
    connect: () => Promise<void>;
    disconnect: () => void;
};

class ChatsSocketClient implements IChatsSocketClient {
    private ws: WebSocket | null = null;
    
    private wsConnectionState: SocketClientConnectionState = SocketClientConnectionState.Idle;


    constructor(private config: ChatsSocketClientConfig) {}
    
    get connectionState(): SocketClientConnectionState {
        return this.wsConnectionState;
    }

    async connect(): Promise<void> {
        this.wsConnectionState = SocketClientConnectionState.Connecting;
        this.ws = new WebSocket(new URL(this.config.baseUrl).toString());
        this.ws.onopen = () => {
            this.wsConnectionState = SocketClientConnectionState.Connected;
        };
        this.ws.onerror = () => {
            this.wsConnectionState = SocketClientConnectionState.Error;
        };
        this.ws.onclose = () => {
            this.wsConnectionState = SocketClientConnectionState.Disconnected;
            this.ws = null;
        };
        this.ws.onmessage = (event) => {
            this.config.onMessage?.(event.data);
        };
    }

    // todo: implement reconnect
    async reconnect(): Promise<void> {}

    async disconnect(): Promise<void> {
        this.ws?.close();
        this.wsConnectionState = SocketClientConnectionState.Disconnected;
        this.ws = null;
    }
}

export function createChatsSocketClient(config: ChatsSocketClientConfig): ChatsSocketClient {
    return new ChatsSocketClient(config);
}