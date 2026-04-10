export type SocketConfigInputSchema = {
	baseUrl: string;
	accessToken: string | (() => string) | (() => Promise<string>);
	/**
	 * When `true`, the socket client listens for the browser `offline` event and calls
	 * `WebSocket.close()` so connection state updates promptly. The TCP stack alone often
	 * does not fire `close` immediately when the network drops.
	 * @default false
	 */
	closeOnBrowserOffline?: boolean;
};

export class SocketConfig implements SocketConfigInputSchema {
	baseUrl: string;
	accessToken: string | (() => string) | (() => Promise<string>);
	closeOnBrowserOffline: boolean;

	constructor({
		baseUrl,
		accessToken,
		closeOnBrowserOffline = false,
	}: SocketConfigInputSchema) {
		this.baseUrl = baseUrl;
		this.accessToken = accessToken;
		this.closeOnBrowserOffline = closeOnBrowserOffline;
	}
}

export function createSocketConfig(
	rawSocketConfig: SocketConfigInputSchema,
): SocketConfig {
	return new SocketConfig(rawSocketConfig);
}
