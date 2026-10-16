import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	createServiceConfig,
	createSocketConfig,
	type SocketConfigInputSchema,
} from '../../../configs';
import { createChatsSocketClient } from '../../classes/ChatsSocketClient';
import { ChatsSocketConnectionStatus } from '../../enums/ChatsSocketConnectionStatus.enum';
import { type FakeChatsServer, startFakeChatsServer } from './fakeChatsServer';

// Real sockets and real timers: Node's built-in WebSocket against a local
// server, with short delays so a full outage fits in well under a second.
const waitUntil = (assertion: () => void) =>
	vi.waitFor(assertion, {
		timeout: 3_000,
		interval: 10,
	});
const pause = (milliseconds: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});

let server: FakeChatsServer;
const clients: ReturnType<typeof createChatsSocketClient>[] = [];

beforeEach(async () => {
	server = await startFakeChatsServer();
});

afterEach(async () => {
	for (const client of clients.splice(0)) {
		await client.disconnect();
	}
	await server.stop();
});

function createClient(
	accessToken: SocketConfigInputSchema['accessToken'] = 'token-1',
) {
	const client = createChatsSocketClient({
		socketConfig: createSocketConfig({
			baseUrl: server.url,
			accessToken,
		}),
		serviceConfig: createServiceConfig({
			baseUrl: 'http://127.0.0.1:1',
			accessToken: 'unused',
		}),
		connectTimeout: 300,
		reconnect: {
			initialDelay: 50,
			maxDelay: 200,
		},
	});
	clients.push(client);
	return client;
}

describe('ChatsSocketClient against a real socket server', () => {
	it('connects and authenticates', async () => {
		const client = createClient();

		await client.connect();

		expect(client.connectionState).toBe(ChatsSocketConnectionStatus.Connected);
		expect(server.receivedTokens).toEqual([
			'token-1',
		]);
	});

	it('reconnects after the server restarts', async () => {
		const reconnected = vi.fn();
		const client = createClient();
		client.onReconnected(reconnected);
		await client.connect();

		await server.stop();
		await waitUntil(() => {
			expect(client.connectionState).not.toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});
		await pause(150);
		await server.start();

		await waitUntil(() => {
			expect(reconnected).toHaveBeenCalledOnce();
		});
		expect(reconnected.mock.calls[0][0].attempt).toBeGreaterThanOrEqual(1);
		expect(client.connectionState).toBe(ChatsSocketConnectionStatus.Connected);
	});

	it('reconnects after the server closes the socket cleanly', async () => {
		const reconnected = vi.fn();
		const client = createClient();
		client.onReconnected(reconnected);
		await client.connect();

		server.closeClientsCleanly();

		await waitUntil(() => {
			expect(reconnected).toHaveBeenCalledWith({
				attempt: 1,
			});
		});
		expect(server.connections).toBe(2);
	});

	it('times out a server that never answers, and retries until it does', async () => {
		server.setAnswers(false);
		const reconnected = vi.fn();
		const client = createClient();
		client.onReconnected(reconnected);

		await expect(client.connect()).rejects.toThrow('socket connect timed out');
		server.setAnswers(true);

		await waitUntil(() => {
			expect(reconnected).toHaveBeenCalledOnce();
		});
		expect(client.connectionState).toBe(ChatsSocketConnectionStatus.Connected);
	});

	it('authenticates a retry with the current token', async () => {
		server.setAcceptsToken((token) => token === 'token-2');
		let currentToken = 'token-1';
		const client = createClient(() => currentToken);

		await expect(client.connect()).rejects.toThrow('socket disconnected');
		currentToken = 'token-2';

		await waitUntil(() => {
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});
		expect(server.receivedTokens[0]).toBe('token-1');
		expect(server.receivedTokens.at(-1)).toBe('token-2');
	});

	it('stops connecting after disconnect()', async () => {
		const client = createClient();
		await client.connect();

		await client.disconnect();
		await pause(400);

		expect(server.connections).toBe(1);
		expect(client.connectionState).toBe(
			ChatsSocketConnectionStatus.Disconnected,
		);
	});
});
