import { describe, expect, it, vi } from 'vitest';

import { createChatsSocketClient } from '../classes/ChatsSocketClient';
import { ChatsSocketConnectionStatus } from '../enums/ChatsSocketConnectionStatus.enum';
import {
	answer,
	clientConfigs,
	clientWithToken,
	connectedClient,
	drop,
	flushPromises,
	latestSocket,
	MockWebSocket,
	setupSocketTestEnvironment,
} from './helpers/socketTestUtils';

setupSocketTestEnvironment();

describe('createChatsSocketClient', () => {
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

		it.each([
			0,
			-5,
			Number.NaN,
			Number.POSITIVE_INFINITY,
		])('falls back to 1s for initialDelay %s', async (initialDelay) => {
			await connectedClient({
				reconnect: {
					initialDelay,
				},
			});

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(999);
			expect(MockWebSocket.instances).toHaveLength(1);
			await vi.advanceTimersByTimeAsync(1);
			expect(MockWebSocket.instances).toHaveLength(2);
		});

		it.each([
			0,
			-5,
			Number.NaN,
			Number.POSITIVE_INFINITY,
		])('falls back to 30s for maxDelay %s', async (maxDelay) => {
			await connectedClient({
				reconnect: {
					initialDelay: 20_000,
					maxDelay,
				},
			});
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(20_000);

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(29_999);
			expect(MockWebSocket.instances).toHaveLength(2);
			await vi.advanceTimersByTimeAsync(1);
			expect(MockWebSocket.instances).toHaveLength(3);
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
