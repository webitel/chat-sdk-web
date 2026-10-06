# Chats Socket Reconnect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `ChatsSocketClient` reconnects a dropped socket by itself (backoff 1s → ×2 → 30s), reports it through `onReconnected`, supports an immediate `reconnect()`, times out silent attempts, and authenticates with the current token from an `accessToken` getter.

**Architecture:** One `WebSocket` per attempt, owned through `this.ws`; every socket handler ignores events once its socket is no longer `this.ws`. All failure paths go through `failAttempt()` → `scheduleRetry()`. Retry policy, connect timeout and the reconnected emitter live inside the client; options are passed to `createChatsSocketClient`.

**Tech Stack:** TypeScript 5.9 (strict), mitt, vitest 3 with fake timers, Biome 2.

**Spec:** `docs/superpowers/specs/2026-10-06-chats-socket-reconnect-design.md`

## Global Constraints

- Node: run every npm/npx/git command with `export PATH="$HOME/.nvm/versions/node/v24.14.1/bin:$PATH"` (husky runs lint-staged on commit).
- async/await only — no `.then()` / `.catch()` chains in source. No one-letter variable names (tests included).
- Commits: Conventional Commits; body ends with `[WS-63](https://webitel.atlassian.net/browse/WS-63)` on its own line, then a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never amend, never push, never publish.
- Defaults (verbatim from spec): `connectTimeout` 10_000 ms; `reconnect.initialDelay` 1_000 ms; `reconnect.maxDelay` 30_000 ms; reconnect enabled by default, disabled by `reconnect: false`.
- Error messages (tests match them exactly): `failed to connect to socket`, `socket disconnected`, `socket connect superseded`, `socket connect timed out`.
- `ChatsSocketConnectionStatus` gets no new values. `onMessage` / `onState` / `onReconnected` return `void`. `disconnect()` stays `async` (examples `await` it).
- Code style: match `ChatsSocketClient.ts` — tabs, braces on every `if`, short comments only where the why is not obvious.
- Run tests with `npx vitest run src/modules/socket src/modules/configs`. Vitest fails the run on unhandled rejections — in tests, attach `expect(promise).rejects` **before** triggering the failure.

## Review Focus

1. An `onReconnected` subscriber that throws must not stall the attempt: `connect()`/`reconnect()` still resolves and the connect timeout is cleared, so the answered socket is not dropped 10s later. → Task 4 (resolves), Task 5 (socket kept).
2. `disconnect()` while an async token getter is still pending must not send the auth frame on the dropped socket. → Task 2.
3. `disconnect()` while the first `connect()` is pending must reject that call, not leave it hanging. → Task 1.
4. `reconnect()` after a deliberate `disconnect()` must turn automatic retries back on. → Task 4.
5. With `reconnect: false`, a timed-out attempt must reject and not retry. → Task 5.

---

### Task 1: One socket per attempt

Refactor so each attempt owns its socket, replaced sockets are closed and ignored, and the pending `connect()` is rejected when its socket is dropped. Introduces the options type used by later tasks.

**Files:**
- Create: `src/modules/socket/types/ChatsSocketClientOptions.types.ts`
- Modify: `src/modules/socket/classes/ChatsSocketClient.ts`
- Test: `src/modules/socket/__tests__/ChatsSocketClient.test.ts`

**Interfaces:**
- Produces: `ChatsSocketClientOptions` type (`{ socketConfig: SocketConfig; serviceConfig: ServiceConfig }` for now); private methods `openSocket()`, `dropSocket(error: Error)`, `failAttempt(error: Error)`, `rejectPendingAttempt(error: Error)`, `markAnswered()`, `handleMessage(event: MessageEvent, resolve: () => void)`; field `rejectAttempt`. Test helpers `flushPromises`, `latestSocket`, `answer`, `drop`, `connectedClient`.

- [ ] **Step 1: Add test helpers and failing tests**

In `src/modules/socket/__tests__/ChatsSocketClient.test.ts`, change the imports at the top to:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createServiceConfig, createSocketConfig } from '../../configs';
import { createChatsSocketClient } from '../classes/ChatsSocketClient';
import { ChatsSocketConnectionStatus } from '../enums/ChatsSocketConnectionStatus.enum';
import { ChatsSocketMessage } from '../enums/ChatsSocketMessage.enum';
import type { ChatsSocketClientOptions } from '../types/ChatsSocketClientOptions.types';
```

Directly below `connectedEventWireJson()`, add:

```ts
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
```

Append inside `describe('createChatsSocketClient', ...)`, after the last `it`:

```ts
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
			oldSocket.onmessage?.({
				data: connectedEventWireJson(),
			});
			oldSocket.onclose?.();

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/modules/socket/__tests__/ChatsSocketClient.test.ts`
Expected: FAIL — `ChatsSocketClientOptions.types` import cannot be resolved (whole file fails to load).

- [ ] **Step 3: Create the options type**

`src/modules/socket/types/ChatsSocketClientOptions.types.ts`:

```ts
import type { ServiceConfig, SocketConfig } from '../../configs';

export type ChatsSocketClientOptions = {
	socketConfig: SocketConfig;
	serviceConfig: ServiceConfig;
};
```

- [ ] **Step 4: Rewrite the client around one socket per attempt**

In `src/modules/socket/classes/ChatsSocketClient.ts`:

Add the import (keep import order: types after enums, alphabetical):

```ts
import type { ChatsSocketClientOptions } from '../types/ChatsSocketClientOptions.types';
```

Add a field below `private ws: WebSocket | null = null;`:

```ts
	/** rejects the `connect()` call still waiting for `connectedEvent` */
	private rejectAttempt: ((error: Error) => void) | null = null;
```

Replace the constructor signature with:

```ts
	constructor({ socketConfig, serviceConfig }: ChatsSocketClientOptions) {
		this.socketConfig = socketConfig;
		this.serviceConfig = serviceConfig;
	}
```

Replace the whole `connect()` method with `connect()` plus the new private methods:

```ts
	async connect(): Promise<void> {
		return this.openSocket();
	}

	/**
	 * Every attempt gets its own socket. Handlers of a socket that is no longer
	 * `this.ws` return early, so a replaced socket never changes state.
	 */
	private openSocket(): Promise<void> {
		this.dropSocket(new Error('socket connect superseded'));

		return new Promise((resolve, reject) => {
			this.rejectAttempt = reject;
			this.setConnectionState(ChatsSocketConnectionStatus.Connecting);

			const socket = new WebSocket(
				new URL(this.socketConfig.baseUrl).toString(),
			);
			this.ws = socket;

			socket.onopen = () => {
				if (socket !== this.ws) {
					return;
				}
				this.setConnectionState(ChatsSocketConnectionStatus.Connected);
				socket.send(
					JSON.stringify({
						'x-webitel-access': this.socketConfig.accessToken,
					}),
				);
			};
			socket.onerror = () => {
				if (socket !== this.ws) {
					return;
				}
				this.setConnectionState(ChatsSocketConnectionStatus.Error);
				this.rejectPendingAttempt(new Error('failed to connect to socket'));
			};
			socket.onclose = () => {
				if (socket !== this.ws) {
					return;
				}
				this.failAttempt(new Error('socket disconnected'));
			};
			socket.onmessage = (event) => {
				if (socket !== this.ws) {
					return;
				}
				this.handleMessage(event, resolve);
			};
		});
	}

	private handleMessage(event: MessageEvent, resolve: () => void): void {
		try {
			const eventData = applyTransform(JSON.parse(event.data), [
				snakeToCamel(),
			]) as {
				payload: EventPayload;
			};

			const { eventName, eventPayload } = processSocketEventPayload(
				eventData.payload,
				{
					serviceConfig: this.serviceConfig,
				},
			);

			if (eventName === ChatsSocketMessage.Connected) {
				this.markAnswered();
				resolve();
			}

			this.emitter.emit(eventName, eventPayload);
		} catch (err) {
			this.emitter.emit(ChatsSocketMessage.Error, {
				code: -1,
				message:
					'SDK failed to parse incoming socket event. Check "details.cause" for the original error.',
				details: {
					cause: err instanceof Error ? err.message : String(err),
				},
			});
		}
	}

	/** The server answered the attempt with `connectedEvent`. */
	private markAnswered(): void {
		this.rejectAttempt = null;
	}

	/** Forgets the current socket and fails the attempt still waiting on it. */
	private dropSocket(error: Error): void {
		this.rejectPendingAttempt(error);
		const socket = this.ws;
		if (!socket) {
			return;
		}
		// cleared before close(): the socket's own close event must read as stale
		this.ws = null;
		socket.close();
	}

	private failAttempt(error: Error): void {
		this.dropSocket(error);
		this.setConnectionState(ChatsSocketConnectionStatus.Disconnected);
	}

	private rejectPendingAttempt(error: Error): void {
		this.rejectAttempt?.(error);
		this.rejectAttempt = null;
	}
```

Replace `disconnect()` with:

```ts
	async disconnect(): Promise<void> {
		this.dropSocket(new Error('socket disconnected'));
		this.setConnectionState(ChatsSocketConnectionStatus.Disconnected);
	}
```

Replace the factory at the bottom with:

```ts
export function createChatsSocketClient(
	options: ChatsSocketClientOptions,
): ChatsSocketClient {
	return new ChatsSocketClient(options);
}
```

The `biome-ignore lint/style/noNonNullAssertion` comment goes away with the old `onopen`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/modules/socket src/modules/configs`
Expected: PASS — all old tests plus the 4 new `socket ownership` tests.

- [ ] **Step 6: Typecheck + lint**

Run: `npx vue-tsc --noEmit && npx biome ci ./src`
Expected: exit 0 (the one pre-existing Biome warning is fine; no new ones).

- [ ] **Step 7: Commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.14.1/bin:$PATH"
git add src/modules/socket
git commit -F - <<'EOF'
refactor(socket): give each connect attempt its own socket

connect() used to overwrite this.ws without closing the old socket,
which would leak a socket once anything retries on the same client.
Now a replaced socket is closed, its events are ignored, and the
connect() still waiting on it is rejected.

[WS-63](https://webitel.atlassian.net/browse/WS-63)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 2: Authenticate with the current token

`Config.accessToken` is already typed `string | (() => string) | (() => Promise<string>)`, but the socket sends it raw (a getter serializes to nothing). Resolve it on every `onopen`.

**Files:**
- Modify: `src/modules/socket/classes/ChatsSocketClient.ts`
- Test: `src/modules/socket/__tests__/ChatsSocketClient.test.ts`, `src/modules/configs/__tests__/SocketConfig.class.test.ts`

**Interfaces:**
- Consumes: `openSocket()`, `failAttempt(error)`, helpers from Task 1.
- Produces: private `authenticate(socket: WebSocket): Promise<void>`, private `resolveAccessToken(): Promise<string>`; test helper `clientWithToken(accessToken)`.

- [ ] **Step 1: Write the failing tests**

In `ChatsSocketClient.test.ts`, change the configs import to:

```ts
import {
	createServiceConfig,
	createSocketConfig,
	type SocketConfigInputSchema,
} from '../../configs';
```

Below `connectedClient()`, add:

```ts
const clientWithToken = (accessToken: SocketConfigInputSchema['accessToken']) =>
	createChatsSocketClient({
		...clientConfigs(),
		socketConfig: createSocketConfig({
			baseUrl: 'ws://example.test/ws',
			accessToken,
		}),
	});
```

In the first existing test (`moves to Connected when the socket opens...`), the auth frame is now sent after the token resolves. Change:

```ts
		ws.onopen?.();
		expect(client.connectionState).toBe(ChatsSocketConnectionStatus.Connected);
		expect(ws.send).toHaveBeenCalledWith(
```

to:

```ts
		ws.onopen?.();
		expect(client.connectionState).toBe(ChatsSocketConnectionStatus.Connected);
		await flushPromises();
		expect(ws.send).toHaveBeenCalledWith(
```

Append inside `describe('createChatsSocketClient', ...)`:

```ts
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
```

In `src/modules/configs/__tests__/SocketConfig.class.test.ts`, add inside the `describe`:

```ts
	it('keeps an accessToken getter as-is, to be called on every connect', () => {
		const getter = () => 'fresh-token';
		const cfg = createSocketConfig({
			baseUrl: 'wss://ws.example/stream',
			accessToken: getter,
		});

		expect(cfg.accessToken).toBe(getter);
	});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/modules/socket src/modules/configs`
Expected: FAIL — the getter tests receive `{}` (function dropped by `JSON.stringify`); "fails the attempt when the getter throws" never rejects. The SocketConfig test and the updated first test pass.

- [ ] **Step 3: Resolve the token in `onopen`**

In `openSocket()`, replace the `socket.onopen` handler with:

```ts
			socket.onopen = () => {
				void this.authenticate(socket);
			};
```

Add these private methods below `openSocket()`:

```ts
	private async authenticate(socket: WebSocket): Promise<void> {
		if (socket !== this.ws) {
			return;
		}
		this.setConnectionState(ChatsSocketConnectionStatus.Connected);

		let accessToken: string;
		try {
			accessToken = await this.resolveAccessToken();
		} catch (err) {
			if (socket === this.ws) {
				this.failAttempt(err instanceof Error ? err : new Error(String(err)));
			}
			return;
		}
		// the socket may have been replaced or dropped while the token resolved
		if (socket !== this.ws) {
			return;
		}
		socket.send(
			JSON.stringify({
				'x-webitel-access': accessToken,
			}),
		);
	}

	/** Read on every attempt, so a reconnect authenticates with the current token. */
	private async resolveAccessToken(): Promise<string> {
		const { accessToken } = this.socketConfig;
		return typeof accessToken === 'function' ? await accessToken() : accessToken;
	}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/modules/socket src/modules/configs`
Expected: PASS.

- [ ] **Step 5: Typecheck + lint**

Run: `npx vue-tsc --noEmit && npx biome ci ./src`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.14.1/bin:$PATH"
git add src/modules/socket src/modules/configs
git commit -F - <<'EOF'
fix(socket): authenticate with the token an accessToken getter returns

SocketConfig already accepted a getter, but the socket sent it as-is,
and JSON.stringify drops functions, so the server got no token. The
token is now resolved on every open, which a reconnect relies on to
use the current token.

[WS-63](https://webitel.atlassian.net/browse/WS-63)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 3: Automatic retry with backoff

**Files:**
- Modify: `src/modules/socket/types/ChatsSocketClientOptions.types.ts`
- Modify: `src/modules/socket/classes/ChatsSocketClient.ts`
- Test: `src/modules/socket/__tests__/ChatsSocketClient.test.ts`

**Interfaces:**
- Consumes: `openSocket()`, `failAttempt()`, `markAnswered()`, `dropSocket()`, helpers incl. `clientWithToken` (Task 2).
- Produces: option `reconnect?: false | { initialDelay?: number; maxDelay?: number }`; private fields `retryPolicy`, `retryTimer`, `retryDelay`, `stopped`; private methods `scheduleRetry()`, `retry(): Promise<void>`, `clearRetryTimer()`, `resetRetryDelay()`.

- [ ] **Step 1: Write the failing tests**

Append inside `describe('createChatsSocketClient', ...)`:

```ts
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
				1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000,
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/modules/socket/__tests__/ChatsSocketClient.test.ts`
Expected: FAIL — retry tests see 1 socket where 2+ are expected; `reconnect` option is a type error only for `vue-tsc` (vitest does not typecheck). `does not retry...` tests pass already.

- [ ] **Step 3: Add the option**

Replace `src/modules/socket/types/ChatsSocketClientOptions.types.ts` with:

```ts
import type { ServiceConfig, SocketConfig } from '../../configs';

export type ChatsSocketClientOptions = {
	socketConfig: SocketConfig;
	serviceConfig: ServiceConfig;
	/**
	 * A dropped socket is connected again after `initialDelay` (default 1s),
	 * doubling up to `maxDelay` (default 30s) while attempts fail. `false` turns
	 * this off.
	 */
	reconnect?:
		| false
		| {
				initialDelay?: number;
				maxDelay?: number;
		  };
};
```

(Let Biome format the union; run `npx biome check --write src/modules/socket` if `biome ci` complains.)

- [ ] **Step 4: Implement retry**

In `ChatsSocketClient.ts`, below the imports, add:

```ts
const DEFAULT_INITIAL_RETRY_DELAY = 1_000;
const DEFAULT_MAX_RETRY_DELAY = 30_000;
```

Add fields below `rejectAttempt`:

```ts
	private retryPolicy: {
		initialDelay: number;
		maxDelay: number;
	} | null;
	private retryTimer: ReturnType<typeof setTimeout> | null = null;
	private retryDelay: number;
	/** set by disconnect(): a socket closed on purpose is not retried */
	private stopped = false;
```

Replace the constructor with:

```ts
	constructor({
		socketConfig,
		serviceConfig,
		reconnect = {},
	}: ChatsSocketClientOptions) {
		this.socketConfig = socketConfig;
		this.serviceConfig = serviceConfig;
		this.retryPolicy =
			reconnect === false
				? null
				: {
						initialDelay: reconnect.initialDelay ?? DEFAULT_INITIAL_RETRY_DELAY,
						maxDelay: reconnect.maxDelay ?? DEFAULT_MAX_RETRY_DELAY,
					};
		this.retryDelay =
			this.retryPolicy?.initialDelay ?? DEFAULT_INITIAL_RETRY_DELAY;
	}
```

Replace `connect()` with:

```ts
	async connect(): Promise<void> {
		this.stopped = false;
		return this.openSocket();
	}
```

In `openSocket()`, make the first line clear a pending retry:

```ts
	private openSocket(): Promise<void> {
		this.clearRetryTimer();
		this.dropSocket(new Error('socket connect superseded'));
```

In `openSocket()`'s `socket.onerror`, schedule a retry after rejecting:

```ts
			socket.onerror = () => {
				if (socket !== this.ws) {
					return;
				}
				this.setConnectionState(ChatsSocketConnectionStatus.Error);
				this.rejectPendingAttempt(new Error('failed to connect to socket'));
				this.scheduleRetry();
			};
```

Replace `markAnswered()` and `failAttempt()` with:

```ts
	/** The server answered the attempt with `connectedEvent`. */
	private markAnswered(): void {
		this.rejectAttempt = null;
		this.resetRetryDelay();
	}
```

```ts
	private failAttempt(error: Error): void {
		this.dropSocket(error);
		this.setConnectionState(ChatsSocketConnectionStatus.Disconnected);
		this.scheduleRetry();
	}
```

Add below `rejectPendingAttempt()`:

```ts
	/** One retry per drop: a drop reports both `error` and `disconnected`. */
	private scheduleRetry(): void {
		if (this.stopped || !this.retryPolicy || this.retryTimer) {
			return;
		}
		this.retryTimer = setTimeout(() => {
			this.retryTimer = null;
			void this.retry();
		}, this.retryDelay);
		this.retryDelay = Math.min(this.retryDelay * 2, this.retryPolicy.maxDelay);
	}

	private async retry(): Promise<void> {
		try {
			await this.openSocket();
		} catch {
			// a failed attempt schedules the next one itself
		}
	}

	private clearRetryTimer(): void {
		if (this.retryTimer) {
			clearTimeout(this.retryTimer);
		}
		this.retryTimer = null;
	}

	private resetRetryDelay(): void {
		this.retryDelay =
			this.retryPolicy?.initialDelay ?? DEFAULT_INITIAL_RETRY_DELAY;
	}
```

Replace `disconnect()` with:

```ts
	async disconnect(): Promise<void> {
		// set before the socket is told: `disconnected` is reported synchronously
		// and must not read as a drop worth retrying
		this.stopped = true;
		this.clearRetryTimer();
		this.resetRetryDelay();
		this.dropSocket(new Error('socket disconnected'));
		this.setConnectionState(ChatsSocketConnectionStatus.Disconnected);
	}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/modules/socket src/modules/configs`
Expected: PASS.

- [ ] **Step 6: Typecheck + lint**

Run: `npx vue-tsc --noEmit && npx biome ci ./src`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.14.1/bin:$PATH"
git add src/modules/socket
git commit -F - <<'EOF'
feat(socket): reconnect a dropped chats socket automatically

The client connects again after 1s, doubling up to 30s while attempts
fail, and starts over once the server answers. A drop reports both
error and disconnected but gets one retry; disconnect() stops retries
until the next connect(). On by default, `reconnect: false` turns it
off, and the delays are configurable.

[WS-63](https://webitel.atlassian.net/browse/WS-63)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: `onReconnected` and a real `reconnect()`

**Files:**
- Modify: `src/modules/socket/types/ChatsSocketConnectionState.types.ts`
- Modify: `src/modules/socket/classes/ChatsSocketClient.ts`
- Test: `src/modules/socket/__tests__/ChatsSocketClient.test.ts`

**Interfaces:**
- Consumes: Task 3 retry machinery (`retry()`, `scheduleRetry()`, `markAnswered()`, `stopped`).
- Produces: `ChatsSocketReconnectedPayload = { attempt: number }`, `IChatsSocketClientReconnectedSubscriber`; public `onReconnected(callback)`, `reconnect()`; `openSocket({ isRetry }: { isRetry: boolean })`; `handleMessage(event, { isRetry, resolve })`; field `attempt`.

- [ ] **Step 1: Write the failing tests**

Delete the existing test `it('reconnect is not implemented', ...)`.

Append inside `describe('createChatsSocketClient', ...)`:

```ts
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
			const client = await connectedClient();
			client.onReconnected(() => {
				throw new Error('subscriber failed');
			});

			const reconnecting = client.reconnect();
			await answer(latestSocket());

			await expect(reconnecting).resolves.toBeUndefined();
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});
	});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/modules/socket/__tests__/ChatsSocketClient.test.ts`
Expected: FAIL — `client.onReconnected is not a function`; `reconnect()` rejects `Not implemented`.

- [ ] **Step 3: Add the payload types**

Append to `src/modules/socket/types/ChatsSocketConnectionState.types.ts`:

```ts
/** Emitted when a dropped socket is answered by the server again. */
export type ChatsSocketReconnectedPayload = {
	/** connect attempts this outage took, including the answered one */
	attempt: number;
};

export type IChatsSocketClientReconnectedSubscriber = (
	payload: ChatsSocketReconnectedPayload,
) => unknown;
```

- [ ] **Step 4: Implement**

In `ChatsSocketClient.ts`, extend the state types import:

```ts
import type {
	ChatsSocketConnectionStatePayloadMap,
	ChatsSocketReconnectedPayload,
	IChatsSocketClientReconnectedSubscriber,
	IChatsSocketClientStateSubscriber,
} from '../types/ChatsSocketConnectionState.types';
```

In `IChatsSocketClient`, replace `reconnect: () => Promise<void>; // todo` with `reconnect: () => Promise<void>;` and add after `onState`:

```ts
	onReconnected: (callback: IChatsSocketClientReconnectedSubscriber) => void;
```

Add next to the other emitters:

```ts
	private reconnectedEmitter = mitt<{
		reconnected: ChatsSocketReconnectedPayload;
	}>();
```

Add a field below `stopped`:

```ts
	/** attempts made for the current outage */
	private attempt = 0;
```

Replace `connect()`, and the stub `reconnect()`, with:

```ts
	async connect(): Promise<void> {
		this.stopped = false;
		return this.openSocket({
			isRetry: false,
		});
	}

	/** Connects again right away, without waiting for a pending retry. */
	async reconnect(): Promise<void> {
		this.stopped = false;
		this.attempt += 1;
		return this.openSocket({
			isRetry: true,
		});
	}
```

Change the `openSocket` signature and its `onmessage` handler:

```ts
	private openSocket({ isRetry }: { isRetry: boolean }): Promise<void> {
```

```ts
			socket.onmessage = (event) => {
				if (socket !== this.ws) {
					return;
				}
				this.handleMessage(event, {
					isRetry,
					resolve,
				});
			};
```

Replace `handleMessage()` with:

```ts
	private handleMessage(
		event: MessageEvent,
		{
			isRetry,
			resolve,
		}: {
			isRetry: boolean;
			resolve: () => void;
		},
	): void {
		try {
			const eventData = applyTransform(JSON.parse(event.data), [
				snakeToCamel(),
			]) as {
				payload: EventPayload;
			};

			const { eventName, eventPayload } = processSocketEventPayload(
				eventData.payload,
				{
					serviceConfig: this.serviceConfig,
				},
			);

			const answered = eventName === ChatsSocketMessage.Connected;
			const attempt = this.attempt;
			if (answered) {
				this.markAnswered();
				resolve();
			}

			this.emitter.emit(eventName, eventPayload);

			// last: a throwing subscriber must not keep the attempt from settling
			if (answered && isRetry) {
				this.reconnectedEmitter.emit('reconnected', {
					attempt,
				});
			}
		} catch (err) {
			this.emitter.emit(ChatsSocketMessage.Error, {
				code: -1,
				message:
					'SDK failed to parse incoming socket event. Check "details.cause" for the original error.',
				details: {
					cause: err instanceof Error ? err.message : String(err),
				},
			});
		}
	}
```

Replace `markAnswered()` with:

```ts
	/** The server answered the attempt with `connectedEvent`. */
	private markAnswered(): void {
		this.rejectAttempt = null;
		this.resetRetryDelay();
		this.attempt = 0;
	}
```

Replace the timer callback in `scheduleRetry()` and `retry()` with:

```ts
		this.retryTimer = setTimeout(() => {
			this.retryTimer = null;
			this.attempt += 1;
			void this.retry();
		}, this.retryDelay);
```

```ts
	private async retry(): Promise<void> {
		try {
			await this.openSocket({
				isRetry: true,
			});
		} catch {
			// a failed attempt schedules the next one itself
		}
	}
```

In `disconnect()`, add `this.attempt = 0;` after `this.resetRetryDelay();`.

Add the public method after `onState()`:

```ts
	/**
	 * Called each time the server answers again after the socket dropped (or
	 * after `reconnect()`), never on the first `connect()`. Anything sent while
	 * the socket was down was not pushed — this is the moment to catch up.
	 */
	onReconnected(callback: IChatsSocketClientReconnectedSubscriber): void {
		this.reconnectedEmitter.on('reconnected', callback);
	}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/modules/socket src/modules/configs`
Expected: PASS.

- [ ] **Step 6: Typecheck + lint**

Run: `npx vue-tsc --noEmit && npx biome ci ./src`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.14.1/bin:$PATH"
git add src/modules/socket
git commit -F - <<'EOF'
feat(socket): add onReconnected and implement reconnect()

onReconnected fires each time the server answers again after a drop
(with the number of attempts the outage took) and never on the first
connect, so consumers know when to fetch what was missed. reconnect()
now connects again right away instead of throwing.

[WS-63](https://webitel.atlassian.net/browse/WS-63)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 5: Connect timeout

A server that opens the socket but never sends `connectedEvent` used to stall forever. Each attempt now fails after `connectTimeout`.

**Files:**
- Modify: `src/modules/socket/types/ChatsSocketClientOptions.types.ts`
- Modify: `src/modules/socket/classes/ChatsSocketClient.ts`
- Test: `src/modules/socket/__tests__/ChatsSocketClient.test.ts`

**Interfaces:**
- Consumes: `openSocket({ isRetry })`, `failAttempt()`, `dropSocket()`, `markAnswered()`, `onReconnected()`.
- Produces: option `connectTimeout?: number`; private fields `connectTimeout`, `connectTimer`; private `clearConnectTimer()`.

- [ ] **Step 1: Write the failing tests**

Append inside `describe('createChatsSocketClient', ...)`:

```ts
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

			await vi.advanceTimersByTimeAsync(500);

			await outcome;
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

		it('keeps a reconnected socket when an onReconnected subscriber throws', async () => {
			const client = await connectedClient();
			client.onReconnected(() => {
				throw new Error('subscriber failed');
			});
			drop(latestSocket());
			await vi.advanceTimersByTimeAsync(1_000);
			await answer(latestSocket());

			await vi.advanceTimersByTimeAsync(60_000);

			expect(MockWebSocket.instances).toHaveLength(2);
			expect(client.connectionState).toBe(
				ChatsSocketConnectionStatus.Connected,
			);
		});
	});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/modules/socket/__tests__/ChatsSocketClient.test.ts`
Expected: FAIL — the timeout tests never reject (vitest reports test timeout or `toHaveLength` mismatch). `leaves an answered socket alone` and `keeps a reconnected socket...` pass already.

- [ ] **Step 3: Add the option**

In `ChatsSocketClientOptions.types.ts`, add above `reconnect`:

```ts
	/** An attempt the server has not answered within this many ms fails (default 10s). */
	connectTimeout?: number;
```

- [ ] **Step 4: Implement**

In `ChatsSocketClient.ts`, add next to the retry constants:

```ts
const DEFAULT_CONNECT_TIMEOUT = 10_000;
```

Add fields below `rejectAttempt`:

```ts
	private connectTimeout: number;
	private connectTimer: ReturnType<typeof setTimeout> | null = null;
```

In the constructor, add `connectTimeout = DEFAULT_CONNECT_TIMEOUT,` to the destructured options (before `reconnect = {}`) and `this.connectTimeout = connectTimeout;` after `this.serviceConfig = serviceConfig;`.

In `openSocket()`, right after `this.ws = socket;`, start the timer:

```ts
			// a server that opens the socket but never answers would stall retries
			this.connectTimer = setTimeout(() => {
				this.failAttempt(new Error('socket connect timed out'));
			}, this.connectTimeout);
```

Replace `markAnswered()` with:

```ts
	/** The server answered the attempt with `connectedEvent`. */
	private markAnswered(): void {
		this.clearConnectTimer();
		this.rejectAttempt = null;
		this.resetRetryDelay();
		this.attempt = 0;
	}
```

Make `dropSocket()` clear the timer first:

```ts
	private dropSocket(error: Error): void {
		this.clearConnectTimer();
		this.rejectPendingAttempt(error);
```

Add below `clearRetryTimer()`:

```ts
	private clearConnectTimer(): void {
		if (this.connectTimer) {
			clearTimeout(this.connectTimer);
		}
		this.connectTimer = null;
	}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/modules/socket src/modules/configs`
Expected: PASS — every test in the file, including Tasks 1–4.

- [ ] **Step 6: Typecheck + lint**

Run: `npx vue-tsc --noEmit && npx biome ci ./src`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.14.1/bin:$PATH"
git add src/modules/socket
git commit -F - <<'EOF'
feat(socket): time out a connect attempt the server never answers

A server that opened the socket but never sent connectedEvent left the
attempt pending forever, so no retry was ever scheduled. Each attempt
now fails after connectTimeout (default 10s) and the next retry runs.

[WS-63](https://webitel.atlassian.net/browse/WS-63)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 6: Exports, docs, release 0.0.20

**Files:**
- Modify: `src/modules/socket/index.ts`, `src/index.ts`
- Modify: `examples/README.md`
- Modify: `CHANGELOG.md`, `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: `ChatsSocketClientOptions` (Task 1/3/5), `ChatsSocketReconnectedPayload` (Task 4).
- Produces: root exports `type ChatsSocketClientOptions`, `type ChatsSocketReconnectedPayload`.

- [ ] **Step 1: Export the types**

`src/modules/socket/index.ts` — add imports:

```ts
import type { ChatsSocketClientOptions } from './types/ChatsSocketClientOptions.types';
import type { ChatsSocketReconnectedPayload } from './types/ChatsSocketConnectionState.types';
```

and add to the export list (keep it alphabetical):

```ts
	type ChatsSocketClientOptions,
	type ChatsSocketReconnectedPayload,
```

`src/index.ts` — in the `./modules/socket` export block, add after `ChatsSocketConnectionStatus,`:

```ts
	type ChatsSocketClientOptions,
	ChatsSocketConnectionStatus,
	ChatsSocketMessage, // enum for socket message types
	type ChatsSocketReconnectedPayload,
```

(i.e. insert `type ChatsSocketClientOptions,` before `ChatsSocketConnectionStatus,` and `type ChatsSocketReconnectedPayload,` after `ChatsSocketMessage`; let `npx biome check --write src` fix ordering if `biome ci` flags it.)

- [ ] **Step 2: Document reconnect in the examples README**

In `examples/README.md`, after the configs code block (the one ending with `export const socketConfig = createChatsSocketClient({ ... });` and its closing fence), add:

````md
## socket reconnect

A dropped socket is connected again automatically: after 1s, doubling up to 30s while attempts fail, until the server answers. An attempt the server does not answer within 10s fails and is retried. `disconnect()` stops retrying until the next `connect()`.

```js
const socketClient = createChatsSocketClient({
    socketConfig,
    serviceConfig,
    connectTimeout: 10_000, // optional
    reconnect: { initialDelay: 1_000, maxDelay: 30_000 }, // optional; `false` turns it off
});

// anything sent while the socket was down was not pushed: fetch it again
socketClient.onReconnected(({ attempt }) => {
    refetchThreads();
});

await socketClient.reconnect(); // connect again right away
```

Pass `accessToken` as a getter so a reconnect uses the current token.
````

- [ ] **Step 3: Changelog**

In `CHANGELOG.md`, insert above `## [0.0.19] - 2026-05-20` (use the actual release date if it is not 2026-10-06):

```md
## [0.0.20] - 2026-10-06

### Breaking changes

- CHANGED the chats socket now reconnects by itself after a drop (on by default). If your app reconnects on `ChatsSocketConnectionStatus.Disconnected` / `Error`, remove that loop or pass `reconnect: false` to `createChatsSocketClient`

### New features

- ADDED automatic reconnect in `ChatsSocketClient`: retry after 1s, doubling up to 30s, reset once the server answers, no give-up; stops after `disconnect()` until the next `connect()` / `reconnect()`
- ADDED `createChatsSocketClient({ reconnect })` — `false`, or `{ initialDelay, maxDelay }` to tune the backoff
- ADDED `createChatsSocketClient({ connectTimeout })` — an attempt the server has not answered with `connectedEvent` within it (default 10s) fails and is retried
- ADDED `ChatsSocketClient.onReconnected(callback)` — fires with `{ attempt }` each time the server answers again after a drop, never on the first connect
- ADDED `ChatsSocketClient.reconnect()` — connects again right away (used to throw `Not implemented`)
- ADDED `ChatsSocketClientOptions` / `ChatsSocketReconnectedPayload` types — re-exported from the package root

### Fixes

- FIX socket now honours an `accessToken` getter (sync or async), resolved on every connect — a getter used to be sent as an empty value
- FIX calling `connect()` again closes the previous socket instead of leaking it; the superseded `connect()` rejects
```

- [ ] **Step 4: Bump the version**

Change `"version": "0.0.19"` to `"version": "0.0.20"` in `package.json` (line 3) and in `package-lock.json` (lines 3 and 9 — the root package entries only; check with `grep -n '"version": "0.0.19"' package-lock.json` that exactly those two lines match).

- [ ] **Step 5: Full verification**

Run: `npm run code-check:ci && npx vue-tsc --noEmit && npx vite build`
Expected: Biome no errors, all tests pass, typecheck exit 0, build emits `dist/` with `ChatsSocketClientOptions` and `ChatsSocketReconnectedPayload` in `dist/index.d.ts` (`grep -c "ChatsSocketReconnectedPayload\|ChatsSocketClientOptions" dist/index.d.ts` > 0). `dist/` is gitignored — do not commit it.

- [ ] **Step 6: Commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.14.1/bin:$PATH"
git add src/index.ts src/modules/socket/index.ts examples/README.md CHANGELOG.md package.json package-lock.json
git commit -F - <<'EOF'
chore(release): bump version to 0.0.20 and update changelog

Exports the new socket option and payload types, documents reconnect
for integrators, and flags default-on reconnect as a breaking change
for apps that run their own retry loop.

[WS-63](https://webitel.atlassian.net/browse/WS-63)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

- [ ] **Step 7: Stop**

Do not push, open a PR, or `npm publish`. Report to the user and ask how to proceed (push/PR/publish, then the agent-workspace-app follow-up described in the spec).
