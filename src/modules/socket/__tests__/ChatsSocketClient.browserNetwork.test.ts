import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createChatsSocketClient } from '../classes/ChatsSocketClient';
import { ChatsSocketConnectionStatus } from '../enums/ChatsSocketConnectionStatus.enum';
import {
	answer,
	clientConfigs,
	connectedClient,
	drop,
	latestSocket,
	MockWebSocket,
	setupSocketTestEnvironment,
} from './helpers/socketTestUtils';

setupSocketTestEnvironment();

describe('createChatsSocketClient', () => {
	describe('followBrowserNetwork', () => {
		let browserWindow: EventTarget;

		beforeEach(() => {
			browserWindow = new EventTarget();
			vi.stubGlobal('window', browserWindow);
		});

		const goOffline = () => browserWindow.dispatchEvent(new Event('offline'));
		const goOnline = () => browserWindow.dispatchEvent(new Event('online'));

		it('drops the socket when the browser goes offline, and retries', async () => {
			const client = await connectedClient({
				followBrowserNetwork: true,
			});
			const socket = latestSocket();

			goOffline();

			expect(socket.close).toHaveBeenCalled();
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Disconnected,
			);
			await vi.advanceTimersByTimeAsync(1_000);
			expect(MockWebSocket.instances).toHaveLength(2);
		});

		it('rejects a pending connect() when the browser goes offline', async () => {
			const client = createChatsSocketClient({
				...clientConfigs(),
				followBrowserNetwork: true,
			});
			const connecting = client.connect();
			const outcome = expect(connecting).rejects.toThrow(
				'browser went offline',
			);

			goOffline();

			await outcome;
		});

		it('reconnects right away when the browser is back online', async () => {
			const reconnected = vi.fn();
			const client = await connectedClient({
				followBrowserNetwork: true,
			});
			client.onReconnected(reconnected);
			goOffline();

			goOnline();
			expect(MockWebSocket.instances).toHaveLength(2);
			await answer(latestSocket());

			expect(reconnected).toHaveBeenCalledWith({
				attempt: 1,
			});
			await vi.advanceTimersByTimeAsync(5_000);
			expect(MockWebSocket.instances).toHaveLength(2);
		});

		it('leaves a connected socket alone when the browser reports online', async () => {
			await connectedClient({
				followBrowserNetwork: true,
			});

			goOnline();

			expect(MockWebSocket.instances).toHaveLength(1);
		});

		it('stops following the network after disconnect()', async () => {
			const removeListener = vi.spyOn(browserWindow, 'removeEventListener');
			const client = await connectedClient({
				followBrowserNetwork: true,
			});
			await client.disconnect();
			expect(removeListener).toHaveBeenCalledWith(
				'offline',
				expect.any(Function),
			);
			expect(removeListener).toHaveBeenCalledWith(
				'online',
				expect.any(Function),
			);

			goOffline();
			goOnline();
			await vi.advanceTimersByTimeAsync(60_000);

			expect(MockWebSocket.instances).toHaveLength(1);
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Disconnected,
			);
		});

		it('listens once however often it connects', async () => {
			const addListener = vi.spyOn(browserWindow, 'addEventListener');
			const client = await connectedClient({
				followBrowserNetwork: true,
			});

			const superseded = client.connect();
			const outcome = expect(superseded).rejects.toThrow(
				'socket connect superseded',
			);
			void client.reconnect();
			await outcome;

			expect(addListener).toHaveBeenCalledTimes(2);
		});

		it('starts the backoff over when the browser is back online', async () => {
			await connectedClient({
				followBrowserNetwork: true,
			});
			goOffline();
			for (const delay of [
				1_000,
				2_000,
				4_000,
			]) {
				await vi.advanceTimersByTimeAsync(delay);
				drop(latestSocket());
			}
			expect(MockWebSocket.instances).toHaveLength(4);

			goOnline();
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(999);
			expect(MockWebSocket.instances).toHaveLength(5);
			await vi.advanceTimersByTimeAsync(1);

			expect(MockWebSocket.instances).toHaveLength(6);
		});

		it('follows the network again after disconnect() and connect()', async () => {
			const client = await connectedClient({
				followBrowserNetwork: true,
			});
			await client.disconnect();
			const connecting = client.connect();
			await answer(latestSocket());
			await connecting;
			const socket = latestSocket();

			goOffline();

			expect(socket.close).toHaveBeenCalled();
		});

		it('follows the network when reconnect() is the first call', async () => {
			const client = createChatsSocketClient({
				...clientConfigs(),
				followBrowserNetwork: true,
			});
			const reconnecting = client.reconnect();
			await answer(latestSocket());
			await reconnecting;
			const socket = latestSocket();

			goOffline();

			expect(socket.close).toHaveBeenCalled();
		});

		it('keeps following when a Disconnected subscriber connects during disconnect()', async () => {
			const client = await connectedClient({
				followBrowserNetwork: true,
			});
			let connecting: Promise<void> | null = null;
			client.onState(ChatsSocketConnectionStatus.Disconnected, () => {
				connecting ??= client.connect();
			});
			await client.disconnect();
			await answer(latestSocket());
			await connecting;
			const socket = latestSocket();

			goOffline();

			expect(socket.close).toHaveBeenCalled();
		});

		it('does not reconnect on online when reconnect is false', async () => {
			await connectedClient({
				followBrowserNetwork: true,
				reconnect: false,
			});

			goOffline();
			goOnline();
			await vi.advanceTimersByTimeAsync(60_000);

			expect(MockWebSocket.instances).toHaveLength(1);
		});

		it('ignores the browser network by default', async () => {
			const client = await connectedClient();
			const socket = latestSocket();

			goOffline();

			expect(socket.close).not.toHaveBeenCalled();
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});

		it('connects where window is not declared at all (Node, SSR)', async () => {
			vi.unstubAllGlobals();
			vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);

			const client = await connectedClient({
				followBrowserNetwork: true,
			});

			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});

		it.each([
			[
				'no window',
				undefined,
			],
			[
				'a window without addEventListener',
				{},
			],
		])('connects where there is %s', async (_where, stubbedWindow) => {
			vi.stubGlobal('window', stubbedWindow);

			const client = await connectedClient({
				followBrowserNetwork: true,
			});

			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});
	});
});
