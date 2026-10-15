import { describe, expect, it, vi } from 'vitest';

import { createChatsSocketClient } from '../classes/ChatsSocketClient';
import { ChatsSocketConnectionStatus } from '../enums/ChatsSocketConnectionStatus.enum';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import {
	answer,
	clientConfigs,
	connectedClient,
	connectedEventWireJson,
	drop,
	latestSocket,
	MockWebSocket,
	setupSocketTestEnvironment,
} from './helpers/socketTestUtils';

setupSocketTestEnvironment();

describe('createChatsSocketClient', () => {
	describe('onReconnected', () => {
		it('fires once a retry is answered, never on the first connect', async () => {
			const reconnected = vi.fn();
			const client = createChatsSocketClient(clientConfigs());
			client.onReconnected(reconnected);

			const connecting = client.connect();
			await answer(latestSocket());
			await connecting;
			expect(reconnected).not.toHaveBeenCalled();

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);
			await answer(latestSocket());

			expect(reconnected).toHaveBeenCalledOnce();
			expect(reconnected).toHaveBeenCalledWith({
				attempt: 1,
			});
		});

		it('reports how many attempts the outage took', async () => {
			const reconnected = vi.fn();
			const client = await connectedClient();
			client.onReconnected(reconnected);

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(2_000);
			await answer(latestSocket());

			expect(reconnected).toHaveBeenCalledWith({
				attempt: 2,
			});
		});

		it('counts from one again for the next outage', async () => {
			const reconnected = vi.fn();
			const client = await connectedClient();
			client.onReconnected(reconnected);
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(2_000);
			await answer(latestSocket());

			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);
			await answer(latestSocket());

			expect(reconnected).toHaveBeenLastCalledWith({
				attempt: 1,
			});
		});

		it('fires when a retry answers after a failed first connect()', async () => {
			const reconnected = vi.fn();
			const client = createChatsSocketClient(clientConfigs());
			client.onReconnected(reconnected);
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow(
				'failed to connect to socket',
			);
			drop(latestSocket());
			await outcome;

			await vi.advanceTimersByTimeAsync(1_000);
			await answer(latestSocket());

			expect(reconnected).toHaveBeenCalledWith({
				attempt: 1,
			});
		});
	});
	describe('reconnect()', () => {
		it('replaces the socket right away and resolves once answered', async () => {
			const reconnected = vi.fn();
			const client = await connectedClient();
			client.onReconnected(reconnected);
			const oldSocket = latestSocket();

			const reconnecting = client.reconnect();
			expect(oldSocket.close).toHaveBeenCalled();
			expect(MockWebSocket.instances).toHaveLength(2);
			await answer(latestSocket());
			await reconnecting;

			expect(reconnected).toHaveBeenCalledWith({
				attempt: 1,
			});
		});

		it('replaces a pending retry', async () => {
			const client = await connectedClient();
			drop(latestSocket());

			const reconnecting = client.reconnect();
			await answer(latestSocket());
			await reconnecting;
			await vi.advanceTimersByTimeAsync(5_000);

			expect(MockWebSocket.instances).toHaveLength(2);
		});

		it('rejects when its attempt fails, and keeps retrying', async () => {
			const client = await connectedClient();
			const reconnecting = client.reconnect();
			const outcome = expect(reconnecting).rejects.toThrow(
				'failed to connect to socket',
			);

			drop(latestSocket());
			await outcome;
			await vi.advanceTimersByTimeAsync(1_000);

			expect(MockWebSocket.instances).toHaveLength(3);
		});

		it('turns retries back on after disconnect()', async () => {
			const client = await connectedClient();
			await client.disconnect();

			const reconnecting = client.reconnect();
			await answer(latestSocket());
			await reconnecting;
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);

			expect(MockWebSocket.instances).toHaveLength(3);
		});

		it('still resolves when an onReconnected subscriber throws', async () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const client = await connectedClient();
			const failingSubscriber = vi.fn(() => {
				throw new Error('subscriber failed');
			});
			const errorMessage = vi.fn();
			client.onReconnected(failingSubscriber);
			client.onMessage(ChatsSocketMessage.Error, errorMessage);

			const reconnecting = client.reconnect();
			await answer(latestSocket());

			await expect(reconnecting).resolves.toBeUndefined();
			expect(failingSubscriber).toHaveBeenCalled();
			// a subscriber's bug is not a protocol error
			expect(errorMessage).not.toHaveBeenCalled();
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});

		it('tells every onReconnected subscriber, even after one throws', async () => {
			const consoleError = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			const client = await connectedClient();
			const later = vi.fn();
			client.onReconnected(() => {
				throw new Error('subscriber failed');
			});
			client.onReconnected(later);

			const reconnecting = client.reconnect();
			await answer(latestSocket());
			await reconnecting;

			expect(later).toHaveBeenCalledWith({
				attempt: 1,
			});
			expect(consoleError).toHaveBeenCalled();
		});

		it('fires onReconnected even if a Connected-message subscriber throws', async () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const client = await connectedClient();
			const reconnected = vi.fn();
			client.onMessage(ChatsSocketMessage.Connected, () => {
				throw new Error('subscriber failed');
			});
			client.onReconnected(reconnected);

			const reconnecting = client.reconnect();
			await answer(latestSocket());
			await reconnecting;

			expect(reconnected).toHaveBeenCalledOnce();
		});

		it('fires once per attempt when the server repeats connectedEvent', async () => {
			const client = await connectedClient();
			const reconnected = vi.fn();
			client.onReconnected(reconnected);

			const reconnecting = client.reconnect();
			await answer(latestSocket());
			await reconnecting;
			latestSocket().onmessage?.({
				data: connectedEventWireJson(),
			});

			expect(reconnected).toHaveBeenCalledOnce();
		});

		it('does not fire when a Connected-message subscriber disconnects', async () => {
			const client = await connectedClient();
			const reconnected = vi.fn();
			client.onReconnected(reconnected);
			client.onMessage(ChatsSocketMessage.Connected, () => {
				void client.disconnect();
			});

			const reconnecting = client.reconnect();
			await answer(latestSocket());
			await reconnecting;

			expect(reconnected).not.toHaveBeenCalled();
		});

		it('works but does not retry when reconnect is false', async () => {
			const reconnected = vi.fn();
			const client = await connectedClient({
				reconnect: false,
			});
			client.onReconnected(reconnected);

			const answered = client.reconnect();
			await answer(latestSocket());
			await answered;
			expect(reconnected).toHaveBeenCalledWith({
				attempt: 1,
			});

			const failing = client.reconnect();
			const outcome = expect(failing).rejects.toThrow(
				'failed to connect to socket',
			);
			drop(latestSocket());
			await outcome;
			await vi.advanceTimersByTimeAsync(60_000);

			expect(MockWebSocket.instances).toHaveLength(3);
		});
	});
});
