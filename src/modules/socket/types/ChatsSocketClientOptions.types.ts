import type { ServiceConfig, SocketConfig } from '../../configs';

export type ChatsSocketClientOptions = {
	socketConfig: SocketConfig;
	serviceConfig: ServiceConfig;
	/**
	 * An attempt the server has not answered with `connectedEvent` within this
	 * many ms fails and is retried (default 10s). It includes resolving an
	 * `accessToken` getter. `0` or `Infinity` turns the timeout off.
	 */
	connectTimeout?: number;
	/**
	 * A dropped socket — or a first `connect()` that failed — is connected again
	 * after `initialDelay` (default 1s), doubling up to `maxDelay` (default 30s)
	 * while attempts fail. Retries never give up on their own: call
	 * `disconnect()` when the socket is no longer needed. `false` turns this off.
	 */
	reconnect?:
		| false
		| {
				initialDelay?: number;
				maxDelay?: number;
		  };
};
