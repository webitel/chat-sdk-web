export type SocketConfigSchema = {
    baseUrl: string;
    accessToken: string | (() => string) | (() => Promise<string>);
}

class SocketConfig implements SocketConfigSchema {
    baseUrl: string;
    accessToken: string | (() => string) | (() => Promise<string>);

    constructor({
        baseUrl,
        accessToken,
    }: SocketConfigSchema) {
        this.baseUrl = baseUrl;
        this.accessToken = accessToken;
    }
}

export function createSocketConfig(rawSocketConfig: SocketConfigSchema): SocketConfig {
    return new SocketConfig(rawSocketConfig);
}