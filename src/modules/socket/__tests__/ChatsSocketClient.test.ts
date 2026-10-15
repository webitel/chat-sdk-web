import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	createServiceConfig,
	createSocketConfig,
	type SocketConfigInputSchema,
} from '../../configs';
import { createChatsSocketClient } from '../classes/ChatsSocketClient';
import { ChatsSocketConnectionStatus } from '../enums/ChatsSocketConnectionStatus.enum';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type { ChatsSocketClientOptions } from '../types/ChatsSocketClientOptions.types';

class MockWebSocket {
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

beforeEach(() => {
	MockWebSocket.instances.length = 0;
	vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);
	vi.useFakeTimers();
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

const socketInput = () =>
	createSocketConfig({
		baseUrl: 'ws://example.test/ws',
		accessToken: 'token-123',
	});

const clientConfigs = () => ({
	socketConfig: socketInput(),
	serviceConfig: createServiceConfig({
		baseUrl: 'https://api.example.test',
		accessToken: 'svc-token',
	}),
});

/** Minimal wire payload so `connect()` resolves after `connectedEvent` from the server. */
function connectedEventWireJson() {
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
const flushPromises = () => vi.advanceTimersByTimeAsync(0);

const latestSocket = () =>
	MockWebSocket.instances[MockWebSocket.instances.length - 1];

/** the server accepts the socket: it opens, then answers with `connectedEvent` */
async function answer(socket: MockWebSocket) {
	socket.onopen?.();
	await flushPromises();
	socket.onmessage?.({
		data: connectedEventWireJson(),
	});
}

/** a drop as a browser reports it: `error`, then `close` */
function drop(socket: MockWebSocket) {
	socket.onerror?.();
	socket.onclose?.();
}

async function connectedClient(
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

const clientWithToken = (accessToken: SocketConfigInputSchema['accessToken']) =>
	createChatsSocketClient({
		...clientConfigs(),
		socketConfig: createSocketConfig({
			baseUrl: 'ws://example.test/ws',
			accessToken,
		}),
	});

describe('createChatsSocketClient', () => {
	it('moves to Connected when the socket opens and sends the access payload after the delay', async () => {
		const client = createChatsSocketClient(clientConfigs());
		const finished = client.connect();

		const ws = MockWebSocket.instances[0];
		expect(ws).toBeDefined();
		expect(client.connectionState).toBe(ChatsSocketConnectionStatus.Connecting);

		ws.onopen?.();
		expect(client.connectionState).toBe(ChatsSocketConnectionStatus.Connected);
		await flushPromises();
		expect(ws.send).toHaveBeenCalledWith(
			JSON.stringify({
				'x-webitel-access': 'token-123',
			}),
		);

		ws.onmessage?.({
			data: connectedEventWireJson(),
		});
		await finished;
	});

	it('sets Error when the socket errors', async () => {
		const client = createChatsSocketClient(clientConfigs());
		const finished = client.connect();
		const ws = MockWebSocket.instances[0];
		ws.onerror?.();
		await expect(finished).rejects.toThrow('failed to connect to socket');
		expect(client.connectionState).toBe(ChatsSocketConnectionStatus.Error);
	});

	it('disconnect closes the socket and clears state', async () => {
		const client = createChatsSocketClient(clientConfigs());
		const finished = client.connect();
		const ws = MockWebSocket.instances[0];
		ws.onopen?.();
		ws.onmessage?.({
			data: connectedEventWireJson(),
		});
		await finished;
		await client.disconnect();
		expect(ws.close).toHaveBeenCalled();
		expect(client.connectionState).toBe(
			ChatsSocketConnectionStatus.Disconnected,
		);
	});

	it('reconnect is not implemented', async () => {
		const client = createChatsSocketClient(clientConfigs());
		await expect(client.reconnect()).rejects.toThrow('Not implemented');
	});

	it('notifies onState subscribers when connection state changes', () => {
		const transitions: Array<{
			state: ChatsSocketConnectionStatus;
			previous: ChatsSocketConnectionStatus;
		}> = [];
		const client = createChatsSocketClient(clientConfigs());
		client.onState(ChatsSocketConnectionStatus.Connecting, ({ previous }) => {
			transitions.push({
				state: ChatsSocketConnectionStatus.Connecting,
				previous,
			});
		});
		client.onState(ChatsSocketConnectionStatus.Connected, ({ previous }) => {
			transitions.push({
				state: ChatsSocketConnectionStatus.Connected,
				previous,
			});
		});

		void client.connect();
		expect(transitions[0]).toEqual({
			state: ChatsSocketConnectionStatus.Connecting,
			previous: ChatsSocketConnectionStatus.Idle,
		});

		const ws = MockWebSocket.instances[0];
		ws.onopen?.();
		expect(transitions[1]).toEqual({
			state: ChatsSocketConnectionStatus.Connected,
			previous: ChatsSocketConnectionStatus.Connecting,
		});
	});

	describe('socket ownership', () => {
		it('closes the previous socket when connect() is called again', async () => {
			const client = await connectedClient();
			const oldSocket = latestSocket();

			void client.connect();

			expect(oldSocket.close).toHaveBeenCalled();
			expect(MockWebSocket.instances).toHaveLength(2);
		});

		it('ignores events from a socket it no longer uses', async () => {
			const client = await connectedClient();
			const oldSocket = latestSocket();
			const connectedMessage = vi.fn();
			const disconnectedState = vi.fn();
			client.onMessage(ChatsSocketMessage.Connected, connectedMessage);
			client.onState(
				ChatsSocketConnectionStatus.Disconnected,
				disconnectedState,
			);

			void client.connect();
			oldSocket.onopen?.();
			oldSocket.onerror?.();
			oldSocket.onmessage?.({
				data: connectedEventWireJson(),
			});
			oldSocket.onclose?.();
			await flushPromises();

			// once, by the handshake before it was replaced
			expect(oldSocket.send).toHaveBeenCalledOnce();
			expect(connectedMessage).not.toHaveBeenCalled();
			expect(disconnectedState).not.toHaveBeenCalled();
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connecting,
			);
		});

		it('rejects a pending connect() superseded by another one', async () => {
			const client = createChatsSocketClient(clientConfigs());
			const first = client.connect();
			const firstOutcome = expect(first).rejects.toThrow(
				'socket connect superseded',
			);

			const second = client.connect();
			await firstOutcome;
			await answer(latestSocket());
			await second;
		});

		it('rejects a pending connect() when disconnect() is called', async () => {
			const client = createChatsSocketClient(clientConfigs());
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow('socket disconnected');

			await client.disconnect();

			await outcome;
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Disconnected,
			);
		});
	});

	describe('state subscribers calling back into the client', () => {
		it('settles each connect() by its own socket when an Error subscriber connects again', async () => {
			const client = createChatsSocketClient(clientConfigs());
			let reconnecting: Promise<void> | null = null;
			client.onState(ChatsSocketConnectionStatus.Error, () => {
				reconnecting ??= client.connect();
			});
			const first = client.connect();
			const firstOutcome = expect(first).rejects.toThrow(
				'failed to connect to socket',
			);

			latestSocket().onerror?.();
			await firstOutcome;
			await answer(latestSocket());

			await expect(reconnecting).resolves.toBeUndefined();
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});

		it('closes the new socket when a Connecting subscriber disconnects', async () => {
			const client = createChatsSocketClient(clientConfigs());
			client.onState(ChatsSocketConnectionStatus.Connecting, () => {
				void client.disconnect();
			});
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow('socket disconnected');
			const socket = latestSocket();

			await outcome;
			socket.onopen?.();
			await flushPromises();

			expect(socket.close).toHaveBeenCalled();
			expect(socket.send).not.toHaveBeenCalled();
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Disconnected,
			);
		});
	});

	describe('access token', () => {
		it('sends the token returned by a getter', async () => {
			const client = clientWithToken(() => 'getter-token');
			void client.connect();
			const socket = latestSocket();

			socket.onopen?.();
			await flushPromises();

			expect(socket.send).toHaveBeenCalledWith(
				JSON.stringify({
					'x-webitel-access': 'getter-token',
				}),
			);
		});

		it('sends the token resolved by an async getter', async () => {
			const client = clientWithToken(async () => 'async-token');
			void client.connect();
			const socket = latestSocket();

			socket.onopen?.();
			await flushPromises();

			expect(socket.send).toHaveBeenCalledWith(
				JSON.stringify({
					'x-webitel-access': 'async-token',
				}),
			);
		});

		it('fails the attempt when the getter throws', async () => {
			const client = clientWithToken(() => {
				throw new Error('token unavailable');
			});
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow('token unavailable');
			const socket = latestSocket();

			socket.onopen?.();
			await outcome;

			expect(socket.send).not.toHaveBeenCalled();
			expect(socket.close).toHaveBeenCalled();
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Disconnected,
			);
		});

		it('keeps a newer socket when the getter of a replaced attempt fails late', async () => {
			let failFirstToken: (error: Error) => void = () => {};
			let calls = 0;
			const client = clientWithToken(async () => {
				calls += 1;
				if (calls === 1) {
					return new Promise<string>((_resolve, reject) => {
						failFirstToken = reject;
					});
				}
				return 'second-token';
			});
			const first = client.connect();
			const firstOutcome = expect(first).rejects.toThrow(
				'socket connect superseded',
			);
			latestSocket().onopen?.();

			void client.connect();
			await firstOutcome;
			const secondSocket = latestSocket();
			secondSocket.onopen?.();
			failFirstToken(new Error('token refresh failed'));
			await flushPromises();

			expect(secondSocket.close).not.toHaveBeenCalled();
			expect(secondSocket.send).toHaveBeenCalledWith(
				JSON.stringify({
					'x-webitel-access': 'second-token',
				}),
			);
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});

		it('does not call the getter when a Connected subscriber disconnects', async () => {
			const getter = vi.fn(() => 'unused-token');
			const client = clientWithToken(getter);
			client.onState(ChatsSocketConnectionStatus.Connected, () => {
				void client.disconnect();
			});
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow('socket disconnected');

			latestSocket().onopen?.();
			await outcome;

			expect(getter).not.toHaveBeenCalled();
		});

		it('does not send a token that resolves after disconnect()', async () => {
			let releaseToken: (token: string) => void = () => {};
			const client = clientWithToken(
				() =>
					new Promise<string>((resolve) => {
						releaseToken = resolve;
					}),
			);
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow('socket disconnected');
			const socket = latestSocket();
			socket.onopen?.();

			await client.disconnect();
			releaseToken('late-token');
			await flushPromises();

			await outcome;
			expect(socket.send).not.toHaveBeenCalled();
		});
	});

	describe('automatic retry', () => {
		it('retries after 1s, doubling the delay while attempts fail', async () => {
			await connectedClient();

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(999);
			expect(MockWebSocket.instances).toHaveLength(1);
			await vi.advanceTimersByTimeAsync(1);
			expect(MockWebSocket.instances).toHaveLength(2);

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_999);
			expect(MockWebSocket.instances).toHaveLength(2);
			await vi.advanceTimersByTimeAsync(1);
			expect(MockWebSocket.instances).toHaveLength(3);
		});

		it('caps the delay at 30s', async () => {
			await connectedClient();
			const expectedDelays = [
				1_000,
				2_000,
				4_000,
				8_000,
				16_000,
				30_000,
				30_000,
			];

			for (const [index, delay] of expectedDelays.entries()) {
				drop(latestSocket());
				await vi.advanceTimersByTimeAsync(delay - 1);
				expect(MockWebSocket.instances).toHaveLength(index + 1);
				await vi.advanceTimersByTimeAsync(1);
				expect(MockWebSocket.instances).toHaveLength(index + 2);
			}
		});

		it('starts the backoff over once an attempt is answered', async () => {
			await connectedClient();
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);
			await answer(latestSocket());

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);

			expect(MockWebSocket.instances).toHaveLength(3);
		});

		it('makes one attempt for a drop that reports both error and close', async () => {
			await connectedClient();

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(5_000);

			expect(MockWebSocket.instances).toHaveLength(2);
		});

		it('retries a first connect() that fails, which still rejects', async () => {
			const client = createChatsSocketClient(clientConfigs());
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow(
				'failed to connect to socket',
			);

			drop(latestSocket());
			await outcome;
			await vi.advanceTimersByTimeAsync(1_000);

			expect(MockWebSocket.instances).toHaveLength(2);
		});

		it('does not retry after disconnect()', async () => {
			const client = await connectedClient();

			await client.disconnect();
			await vi.advanceTimersByTimeAsync(60_000);

			expect(MockWebSocket.instances).toHaveLength(1);
		});

		it('cancels a pending retry on disconnect()', async () => {
			const client = await connectedClient();
			drop(latestSocket());

			await client.disconnect();
			await vi.advanceTimersByTimeAsync(60_000);

			expect(MockWebSocket.instances).toHaveLength(1);
		});

		it('retries again after connect() follows a disconnect()', async () => {
			const client = await connectedClient();
			await client.disconnect();

			const connecting = client.connect();
			await answer(latestSocket());
			await connecting;
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);

			expect(MockWebSocket.instances).toHaveLength(3);
		});

		it('lets connect() replace a pending retry', async () => {
			const client = await connectedClient();
			drop(latestSocket());

			void client.connect();
			await vi.advanceTimersByTimeAsync(5_000);

			expect(MockWebSocket.instances).toHaveLength(2);
		});

		it('does not retry when reconnect is false', async () => {
			await connectedClient({
				reconnect: false,
			});

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(60_000);

			expect(MockWebSocket.instances).toHaveLength(1);
		});

		it('honours custom initialDelay and maxDelay', async () => {
			await connectedClient({
				reconnect: {
					initialDelay: 100,
					maxDelay: 150,
				},
			});

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(100);
			expect(MockWebSocket.instances).toHaveLength(2);

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(149);
			expect(MockWebSocket.instances).toHaveLength(2);
			await vi.advanceTimersByTimeAsync(1);
			expect(MockWebSocket.instances).toHaveLength(3);
		});

		it('retries an attempt whose token getter throws', async () => {
			let calls = 0;
			const client = clientWithToken(() => {
				calls += 1;
				if (calls === 1) {
					throw new Error('token unavailable');
				}
				return 'second-token';
			});
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow('token unavailable');
			latestSocket().onopen?.();
			await outcome;

			await vi.advanceTimersByTimeAsync(1_000);
			const retrySocket = latestSocket();
			retrySocket.onopen?.();
			await flushPromises();

			expect(MockWebSocket.instances).toHaveLength(2);
			expect(retrySocket.send).toHaveBeenCalledWith(
				JSON.stringify({
					'x-webitel-access': 'second-token',
				}),
			);
		});

		it('keeps the socket a Disconnected subscriber opened during a drop', async () => {
			const client = await connectedClient();
			let reconnecting: Promise<void> | null = null;
			client.onState(ChatsSocketConnectionStatus.Disconnected, () => {
				reconnecting ??= client.connect();
			});

			drop(latestSocket());
			await answer(latestSocket());
			await reconnecting;
			await vi.advanceTimersByTimeAsync(5_000);

			expect(MockWebSocket.instances).toHaveLength(2);
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});

		it('does not retry when a Disconnected subscriber disconnects', async () => {
			const client = await connectedClient();
			client.onState(ChatsSocketConnectionStatus.Disconnected, () => {
				void client.disconnect();
			});

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(60_000);

			expect(MockWebSocket.instances).toHaveLength(1);
		});

		it('retries a socket the server closes without an error', async () => {
			await connectedClient();

			latestSocket().onclose?.();
			await vi.advanceTimersByTimeAsync(1_000);

			expect(MockWebSocket.instances).toHaveLength(2);
		});

		it('keeps the socket an Error subscriber opened during a drop', async () => {
			const client = await connectedClient();
			let reconnecting: Promise<void> | null = null;
			client.onState(ChatsSocketConnectionStatus.Error, () => {
				reconnecting ??= client.connect();
			});

			drop(latestSocket());
			await answer(latestSocket());
			await reconnecting;
			await vi.advanceTimersByTimeAsync(5_000);

			expect(MockWebSocket.instances).toHaveLength(2);
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});

		it('starts the backoff over after disconnect()', async () => {
			const client = await connectedClient();
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(2_000);
			await client.disconnect();

			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow(
				'failed to connect to socket',
			);
			drop(latestSocket());
			await outcome;
			await vi.advanceTimersByTimeAsync(1_000);

			expect(MockWebSocket.instances).toHaveLength(5);
		});

		it('keeps backing off when initialDelay is 0', async () => {
			await connectedClient({
				reconnect: {
					initialDelay: 0,
				},
			});

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1);
			expect(MockWebSocket.instances).toHaveLength(2);

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1);
			expect(MockWebSocket.instances).toHaveLength(2);
			await vi.advanceTimersByTimeAsync(1);
			expect(MockWebSocket.instances).toHaveLength(3);
		});

		it('falls back to the defaults for delays that are not positive numbers', async () => {
			await connectedClient({
				reconnect: {
					initialDelay: Number.NaN,
					maxDelay: -5,
				},
			});

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(999);
			expect(MockWebSocket.instances).toHaveLength(1);
			await vi.advanceTimersByTimeAsync(1);
			expect(MockWebSocket.instances).toHaveLength(2);
		});

		it('never waits longer than maxDelay, even for the first retry', async () => {
			await connectedClient({
				reconnect: {
					initialDelay: 5_000,
					maxDelay: 1_000,
				},
			});

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);

			expect(MockWebSocket.instances).toHaveLength(2);
		});

		it('authenticates a retry with the current token', async () => {
			let currentToken = 'first-token';
			const client = clientWithToken(() => currentToken);
			const connecting = client.connect();
			await answer(latestSocket());
			await connecting;

			currentToken = 'rotated-token';
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);
			const retrySocket = latestSocket();
			retrySocket.onopen?.();
			await flushPromises();

			expect(retrySocket.send).toHaveBeenCalledWith(
				JSON.stringify({
					'x-webitel-access': 'rotated-token',
				}),
			);
		});
	});
});
