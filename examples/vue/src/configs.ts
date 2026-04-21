import { createServiceConfig, createSocketConfig } from '@webitel/chat-web-sdk';

export const defaultWsBaseUrl = import.meta.env.VITE_WS_BASE_URL ?? '';
export const defaultHttpBaseUrl = import.meta.env.VITE_HTTP_BASE_URL ?? '';
export const defaultAccessToken = import.meta.env.VITE_WS_ACCESS_TOKEN ?? '';

export function makeServiceConfig(baseUrl: string, accessToken: string) {
	return createServiceConfig({
		baseUrl,
		accessToken,
	});
}

export function makeSocketConfig(baseUrl: string, accessToken: string) {
	return createSocketConfig({
		baseUrl,
		accessToken,
	});
}
