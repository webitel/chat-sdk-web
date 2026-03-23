export type SocketConfigInputSchema = {
	baseUrl: string;
	accessToken: string | (() => string) | (() => Promise<string>);
};

export class SocketConfig implements SocketConfigInputSchema {
	baseUrl: string;
	accessToken: string | (() => string) | (() => Promise<string>);

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
