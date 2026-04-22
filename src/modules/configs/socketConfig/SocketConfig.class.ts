import type { Config } from '../types/Config.types';
export interface SocketConfigInputSchema extends Config {
	baseUrl: string;
}

export class SocketConfig implements SocketConfigInputSchema {
	accessToken;
	baseUrl;

	constructor({ baseUrl, accessToken }: SocketConfigInputSchema) {
		this.baseUrl = baseUrl;
		this.accessToken = accessToken;
	}
}

export function createSocketConfig(
	rawSocketConfig: SocketConfigInputSchema,
): SocketConfig {
	return new SocketConfig(rawSocketConfig);
}
