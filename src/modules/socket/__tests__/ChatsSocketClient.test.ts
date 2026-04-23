import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createServiceConfig, createSocketConfig } from '../../configs';
import { createChatsSocketClient } from '../classes/ChatsSocketClient';
import { ChatsSocketConnectionStatus } from '../enums/ChatsSocketConnectionStatus.enum';

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

describe('createChatsSocketClient', () => {
	it('moves to Connected when the socket opens and sends the access payload after the delay', async () => {
		const client = createChatsSocketClient(clientConfigs());
		const finished = client.connect();

		const ws = MockWebSocket.instances[0];
		expect(ws).toBeDefined();
		expect(client.connectionState).toBe(ChatsSocketConnectionStatus.Connecting);

		ws.onopen?.();
		expect(client.connectionState).toBe(ChatsSocketConnectionStatus.Connected);
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
});
