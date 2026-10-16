import type { AddressInfo } from 'node:net';
import { WebSocketServer } from 'ws';

/** What the IM delivery service sends once a socket is authenticated. */
const connectedEventWireJson = JSON.stringify({
	payload: {
		connected_event: {
			ok: true,
			connection_id: 'fake-connection',
			server_version: 'fake',
		},
	},
});

/**
 * A real WebSocket server speaking just enough of the chats protocol: it reads
 * the auth frame, rejects tokens it does not accept (close 4001) and answers
 * the others with `connectedEvent` — unless told to stay silent.
 */
export async function startFakeChatsServer() {
	let server: WebSocketServer | null = null;
	let port = 0;
	let answers = true;
	let acceptsToken: (token: string) => boolean = () => true;
	let connections = 0;
	const receivedTokens: string[] = [];

	const listen = () =>
		new Promise<WebSocketServer>((resolve) => {
			const listening = new WebSocketServer(
				{
					host: '127.0.0.1',
					port,
				},
				() => {
					resolve(listening);
				},
			);
			listening.on('connection', (socket) => {
				connections += 1;
				socket.on('message', (data) => {
					const token = JSON.parse(String(data))['x-webitel-access'];
					receivedTokens.push(token);
					if (!acceptsToken(token)) {
						socket.close(4001, 'invalid token');
						return;
					}
					if (answers) {
						socket.send(connectedEventWireJson);
					}
				});
			});
			server = listening;
		});

	// port 0 picks a free port; restarts reuse it
	port = ((await listen()).address() as AddressInfo).port;

	return {
		url: `ws://127.0.0.1:${port}/ws`,
		receivedTokens,
		get connections() {
			return connections;
		},
		setAnswers(value: boolean) {
			answers = value;
		},
		setAcceptsToken(accepts: (token: string) => boolean) {
			acceptsToken = accepts;
		},
		/** Closes every client socket the way a server shutting down politely does. */
		closeClientsCleanly() {
			for (const client of server?.clients ?? []) {
				client.close(1001, 'going away');
			}
		},
		/** Goes away hard: open sockets are terminated, new ones are refused. */
		async stop() {
			const stopping = server;
			server = null;
			if (!stopping) {
				return;
			}
			for (const client of stopping.clients) {
				client.terminate();
			}
			await new Promise<void>((resolve) => {
				stopping.close(() => {
					resolve();
				});
			});
		},
		/** Comes back on the same port. */
		async start() {
			await listen();
		},
	};
}

export type FakeChatsServer = Awaited<ReturnType<typeof startFakeChatsServer>>;
