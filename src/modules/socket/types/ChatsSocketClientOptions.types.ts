import type { ServiceConfig, SocketConfig } from '../../configs';

export type ChatsSocketClientOptions = {
	socketConfig: SocketConfig;
	serviceConfig: ServiceConfig;
	/**
	 * A dropped socket is connected again after `initialDelay` (default 1s),
	 * doubling up to `maxDelay` (default 30s) while attempts fail. `false` turns
	 * this off.
	 */
	reconnect?:
		| false
		| {
				initialDelay?: number;
				maxDelay?: number;
		  };
};
