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
	describe('connect timeout', () => {
		it('fails an attempt the server never answers after 10s', async () => {
			const client = createChatsSocketClient(clientConfigs());
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow(
				'socket connect timed out',
			);
			const socket = latestSocket();
			socket.onopen?.();

			await vi.advanceTimersByTimeAsync(9_999);
			expect(socket.close).not.toHaveBeenCalled();
			await vi.advanceTimersByTimeAsync(1);

			await outcome;
			expect(socket.close).toHaveBeenCalled();
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Disconnected,
			);
		});

		it('retries after a timed-out attempt', async () => {
			const client = createChatsSocketClient(clientConfigs());
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow(
				'socket connect timed out',
			);

			await vi.advanceTimersByTimeAsync(10_000);
			await outcome;
			await vi.advanceTimersByTimeAsync(1_000);

			expect(MockWebSocket.instances).toHaveLength(2);
		});

		it('times out a silent retry too', async () => {
			await connectedClient();
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);
			expect(MockWebSocket.instances).toHaveLength(2);

			await vi.advanceTimersByTimeAsync(10_000);
			await vi.advanceTimersByTimeAsync(2_000);

			expect(MockWebSocket.instances).toHaveLength(3);
		});

		it('leaves an answered socket alone', async () => {
			const client = await connectedClient();

			await vi.advanceTimersByTimeAsync(60_000);

			expect(MockWebSocket.instances).toHaveLength(1);
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});

		it('honours a custom connectTimeout', async () => {
			const client = createChatsSocketClient({
				...clientConfigs(),
				connectTimeout: 500,
			});
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow(
				'socket connect timed out',
			);
			const socket = latestSocket();

			await vi.advanceTimersByTimeAsync(499);
			expect(socket.close).not.toHaveBeenCalled();
			await vi.advanceTimersByTimeAsync(1);

			await outcome;
		});

		it.each([
			0,
			Number.POSITIVE_INFINITY,
		])('never times out with connectTimeout %s', async (connectTimeout) => {
			const client = createChatsSocketClient({
				...clientConfigs(),
				connectTimeout,
			});
			const connecting = client.connect();

			await vi.advanceTimersByTimeAsync(60_000);
			await answer(latestSocket());

			await expect(connecting).resolves.toBeUndefined();
			expect(MockWebSocket.instances).toHaveLength(1);
		});

		it.each([
			Number.NaN,
			-5,
		])('falls back to 10s for connectTimeout %s', async (connectTimeout) => {
			const client = createChatsSocketClient({
				...clientConfigs(),
				connectTimeout,
			});
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow(
				'socket connect timed out',
			);
			const socket = latestSocket();

			await vi.advanceTimersByTimeAsync(9_999);
			expect(socket.close).not.toHaveBeenCalled();
			await vi.advanceTimersByTimeAsync(1);

			await outcome;
		});

		it('does not retry when disconnect() lands mid-attempt', async () => {
			const client = createChatsSocketClient(clientConfigs());
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow('socket disconnected');
			latestSocket().onopen?.();

			await client.disconnect();
			await outcome;
			await vi.advanceTimersByTimeAsync(60_000);

			expect(MockWebSocket.instances).toHaveLength(1);
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Disconnected,
			);
		});

		it('does not let a replaced attempt time out the newer socket', async () => {
			const client = createChatsSocketClient(clientConfigs());
			const first = client.connect();
			const firstOutcome = expect(first).rejects.toThrow(
				'socket connect superseded',
			);
			await vi.advanceTimersByTimeAsync(5_000);

			const second = client.connect();
			await firstOutcome;
			await answer(latestSocket());
			await second;
			await vi.advanceTimersByTimeAsync(60_000);

			expect(MockWebSocket.instances).toHaveLength(2);
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});

		it('does not retry a timed-out attempt when reconnect is false', async () => {
			const client = createChatsSocketClient({
				...clientConfigs(),
				reconnect: false,
			});
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow(
				'socket connect timed out',
			);

			await vi.advanceTimersByTimeAsync(10_000);
			await outcome;
			await vi.advanceTimersByTimeAsync(60_000);

			expect(MockWebSocket.instances).toHaveLength(1);
		});

		it('times out an attempt whose token getter never resolves', async () => {
			let releaseToken: (token: string) => void = () => {};
			const client = clientWithToken(
				() =>
					new Promise<string>((resolve) => {
						releaseToken = resolve;
					}),
			);
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow(
				'socket connect timed out',
			);
			const socket = latestSocket();
			socket.onopen?.();

			await vi.advanceTimersByTimeAsync(10_000);
			await outcome;
			releaseToken('late-token');
			await flushPromises();

			expect(socket.send).not.toHaveBeenCalled();
		});

		it('keeps a reconnected socket when an onReconnected subscriber throws', async () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const client = await connectedClient();
			const failingSubscriber = vi.fn(() => {
				throw new Error('subscriber failed');
			});
			client.onReconnected(failingSubscriber);
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);
			await answer(latestSocket());

			await vi.advanceTimersByTimeAsync(60_000);

			expect(failingSubscriber).toHaveBeenCalled();
			expect(MockWebSocket.instances).toHaveLength(2);
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});
	});
});
