import { createServiceConfig, createSocketConfig } from '@webitel/chat-web-sdk';

export const serviceConfig = createServiceConfig({
	baseUrl: import.meta.env.VITE_HTTP_BASE_URL,
	accessToken: import.meta.env.VITE_WS_ACCESS_TOKEN,
});

export const socketConfig = createSocketConfig({
	baseUrl: import.meta.env.VITE_WS_BASE_URL,
	accessToken: import.meta.env.VITE_WS_ACCESS_TOKEN,
});
