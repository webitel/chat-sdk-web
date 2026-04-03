import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSocketConfig } from '../../configs';
import { createChatsSocketClient } from '../classes/ChatsSoketClient';
import { SocketClientConnectionStatus } from '../enums/SocketClientConnectionStatus.enum';

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
	close = vi.fn(() => {
		this.onclose?.();
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

describe('createChatsSocketClient', () => {
	it('moves to Connected when the socket opens and sends the access payload after the delay', async () => {
		const client = createChatsSocketClient(socketInput());
		const finished = client.connect();

		const ws = MockWebSocket.instances[0];
		expect(ws).toBeDefined();
		expect(client.connectionState).toBe(
			SocketClientConnectionStatus.Connecting,
		);

		ws.onopen?.();
		await finished;
		expect(client.connectionState).toBe(SocketClientConnectionStatus.Connected);

		await vi.advanceTimersByTimeAsync(1000);
		expect(ws.send).toHaveBeenCalledWith(
			JSON.stringify({
				'x-webitel-access': 'token-123',
			}),
		);
	});

	it('sets Error when the socket errors', async () => {
		const client = createChatsSocketClient(socketInput());
		await client.connect();
		const ws = MockWebSocket.instances[0];
		ws.onerror?.();
		expect(client.connectionState).toBe(SocketClientConnectionStatus.Error);
	});

	it('disconnect closes the socket and clears state', async () => {
		const client = createChatsSocketClient(socketInput());
		await client.connect();
		const ws = MockWebSocket.instances[0];
		ws.onopen?.();
		await client.disconnect();
		expect(ws.close).toHaveBeenCalled();
		expect(client.connectionState).toBe(
			SocketClientConnectionStatus.Disconnected,
		);
	});

	it('reconnect is not implemented', async () => {
		const client = createChatsSocketClient(socketInput());
		await expect(client.reconnect()).rejects.toThrow('Not implemented');
	});
});
