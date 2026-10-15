import { afterEach, beforeEach, vi } from 'vitest';

import {
	createServiceConfig,
	createSocketConfig,
	type SocketConfigInputSchema,
} from '../../../configs';
import { createChatsSocketClient } from '../../classes/ChatsSocketClient';
import type { ChatsSocketClientOptions } from '../../types/ChatsSocketClientOptions.types';

export class MockWebSocket {
	static instances: MockWebSocket[] = [];
	url: string;
	onopen: (() => void) | null = null;
	onmessage: ((ev: { data: string }) => void) | null = null;
	onerror: (() => void) | null = null;
	onclose: (() => void) | null = null;

	constructor(url: string) {
		this.url = url;
		MockWebSocket.instances.push(this);
	}

	send = vi.fn();
	// browsers report the close asynchronously
	close = vi.fn(() => {
		queueMicrotask(() => {
			this.onclose?.();
		});
	});
}

/** Registers the per-test socket mock, fake timers and cleanup; call at the top of a test file. */
export function setupSocketTestEnvironment() {
	beforeEach(() => {
		MockWebSocket.instances.length = 0;
		vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});
}

const socketInput = () =>
	createSocketConfig({
		baseUrl: 'ws://example.test/ws',
		accessToken: 'token-123',
	});

export const clientConfigs = () => ({
	socketConfig: socketInput(),
	serviceConfig: createServiceConfig({
		baseUrl: 'https://api.example.test',
		accessToken: 'svc-token',
	}),
});

/** Minimal wire payload so `connect()` resolves after `connectedEvent` from the server. */
export function connectedEventWireJson() {
	return JSON.stringify({
		payload: {
			connected_event: {
				ok: true,
				connection_id: 'test-conn',
				server_version: '1.0.0',
			},
		},
	});
}

/** lets pending promise callbacks (e.g. an async token getter) run */
export const flushPromises = () => vi.advanceTimersByTimeAsync(0);

export const latestSocket = () =>
	MockWebSocket.instances[MockWebSocket.instances.length - 1];

/** the server accepts the socket: it opens, then answers with `connectedEvent` */
export async function answer(socket: MockWebSocket) {
	socket.onopen?.();
	await flushPromises();
	socket.onmessage?.({
		data: connectedEventWireJson(),
	});
}

/** a drop as a browser reports it: `error`, then `close` */
export function drop(socket: MockWebSocket) {
	socket.onerror?.();
	socket.onclose?.();
}

export async function connectedClient(
	options: Partial<ChatsSocketClientOptions> = {},
) {
	const client = createChatsSocketClient({
		...clientConfigs(),
		...options,
	});
	const connecting = client.connect();
	await answer(latestSocket());
	await connecting;
	return client;
}

export const clientWithToken = (
	accessToken: SocketConfigInputSchema['accessToken'],
) =>
	createChatsSocketClient({
		...clientConfigs(),
		socketConfig: createSocketConfig({
			baseUrl: 'ws://example.test/ws',
			accessToken,
		}),
	});
