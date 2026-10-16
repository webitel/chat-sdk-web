import { describe, expect, it, vi } from 'vitest';

import { ChatsSocketConnectionStatus } from '../enums/ChatsSocketConnectionStatus.enum';
import {
	clientWithToken,
	flushPromises,
	latestSocket,
	setupSocketTestEnvironment,
} from './helpers/socketTestUtils';

setupSocketTestEnvironment();

describe('createChatsSocketClient', () => {
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
});
