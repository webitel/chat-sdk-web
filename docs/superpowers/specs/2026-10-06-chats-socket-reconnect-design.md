# Chats socket reconnect — design

Date: 2026-10-06
Issue: [WS-63](https://webitel.atlassian.net/browse/WS-63)
Target version: `@webitel/chat-web-sdk` 0.0.20

## Goal

Move automatic reconnect of the chats socket from `agent-workspace-app`
(`src/features/chats/composables/useChatsSocket.ts`, PRs #159/#160) into
`ChatsSocketClient`, so every integrator gets it, and close two gaps the app
version has:

- no timeout on an attempt — a server that opens the socket but never sends
  `connectedEvent` stalls retries forever;
- the access token is read once — a reconnect reuses a stale token.

`reconnect()` stops throwing `Not implemented` and performs a real immediate
reconnect.

## Findings that shape the design

- `Config.accessToken` is already typed `string | (() => string) | (() => Promise<string>)`
  for both configs, but `ChatsSocketClient` sends it raw:
  `JSON.stringify({ 'x-webitel-access': fn })` drops the function, so a getter
  currently authenticates with nothing. Supporting a getter is a bug fix, not a
  config API change.
- The `Connected` state is entered on `onopen`, before the server answers with
  `connectedEvent`; `connect()` resolves only on `connectedEvent`. "Answered"
  therefore means `connectedEvent`, not the `Connected` state.
- `setConnectionState` emits only on change; one drop emits `error` then
  `disconnected`.
- `disconnect()` sets `Disconnected` synchronously.
- Calling `connect()` on a client that already has a socket overwrites `this.ws`
  without closing it. Integrators who wrote their own retry loop around
  `Disconnected` (the only option while `reconnect()` threw) would race the new
  built-in retry.

## Public API (additive)

```ts
createChatsSocketClient({
  socketConfig,              // accessToken: string | () => string | () => Promise<string>
  serviceConfig,
  connectTimeout?: number,   // default 10_000 ms; bounds every attempt, the first one too
  reconnect?: false | {      // default: enabled with the defaults below
    initialDelay?: number,   // default 1_000 ms
    maxDelay?: number,       // default 30_000 ms
  },
});

interface IChatsSocketClient {
  connect(): Promise<void>;
  disconnect(): void;
  reconnect(): Promise<void>;
  onMessage(event, callback): void;
  onState(state, callback): void;
  onReconnected(callback: (payload: ChatsSocketReconnectedPayload) => unknown): void;
}

type ChatsSocketReconnectedPayload = {
  /** connect attempts this outage took, including the answered one */
  attempt: number;
};
```

- New root exports: `ChatsSocketReconnectedPayload`, `ChatsSocketClientOptions`
  (the factory argument type).
- `onReconnected` returns `void`, like `onMessage` / `onState`.
- `ChatsSocketConnectionStatus` is unchanged — no new values. A drop still reads
  `connected → error → disconnected → connecting → connected`.

### Semantics

- Automatic reconnect is **on by default**; `reconnect: false` disables it.
- Retry delay: `initialDelay`, doubling per failed attempt, capped at `maxDelay`;
  reset to `initialDelay` after an answered attempt. No give-up.
- Exactly one retry is scheduled per drop, although both `error` and
  `disconnected` fire.
- No retry after a deliberate `disconnect()` until the next `connect()` or
  `reconnect()`.
- `onReconnected` fires when a retry's or `reconnect()`'s `connectedEvent`
  arrives; never after the first `connect()`. A failed first `connect()` that
  later succeeds through a retry does fire it.
- `connect()` keeps its contract (resolves on `connectedEvent`, rejects on
  failure); on failure the background retry still runs.
- `reconnect()` reconnects immediately (no delay), cancelling any pending retry;
  resolves on `connectedEvent`, rejects on failure (background retry continues).
- The access token is resolved on every attempt (sync or async getter, or the
  string). A getter that throws fails the attempt like a drop.

### Non-goals

Heartbeat / ping-based dead-socket detection, browser `online` / `offline`
listeners, a retry limit, an `off()` / unsubscribe API.

## Internal behaviour

Private state: `ws`, `retryTimer`, `retryDelay`, `attempt` (count for the
current outage), `stopped` (set by `disconnect()`), options with defaults.

**One socket per attempt.** Each attempt creates its own `WebSocket`. Every
handler first checks that its socket is still `this.ws` and returns otherwise.
Replacing a socket (timeout, or `connect()` / `reconnect()` over a live one)
detaches its handlers before `close()`, so a replaced socket never changes state
or schedules a retry.

**Attempt** (`openSocket({ isRetry })`, used by `connect`, `reconnect` and the
retry timer):

1. Clear the pending retry timer, drop any existing socket, set `Connecting`,
   create the socket, start the `connectTimeout` timer.
2. `onopen` → `Connected` (same timing as today) → resolve the token → if the
   socket became stale during the await, stop → send the auth frame. A getter
   that throws fails the attempt.
3. `connectedEvent` → clear the timeout, `retryDelay = initialDelay`; if
   `isRetry`, emit reconnected with `{ attempt }`; `attempt = 0`; resolve.
4. Failure — every path goes through one `handleSocketLost` routine:
   - `onerror` → `Error`; `onclose` → `Disconnected` (as today);
   - timeout → reject `socket connect timed out`, detach and close the socket,
     set `Disconnected`;
   - token getter failure → reject with its error, detach and close, set
     `Disconnected`;
   - then reject the attempt's promise (no-op if settled) and `scheduleRetry()`.

**`scheduleRetry()`**: return if `stopped`, if reconnect is disabled, or if a
timer is already pending. Otherwise set a timer for `retryDelay` that increments
`attempt` and runs `openSocket({ isRetry: true })` with its rejection swallowed
(its own failure schedules the next retry); then
`retryDelay = min(retryDelay * 2, maxDelay)`.

**Public methods**

- `connect()`: `stopped = false`; `openSocket({ isRetry: false })`.
- `reconnect()`: `stopped = false`; `attempt++`; `openSocket({ isRetry: true })`.
- `disconnect()`: `stopped = true` **first** (the `Disconnected` state is
  emitted synchronously and must not read as a drop), clear the timer, reset
  `retryDelay` and `attempt`, detach and close the socket, set `Disconnected`.

An integrator's own retry loop calling `connect()` cancels the pending built-in
retry and replaces the socket cleanly: no leaked sockets.

## Testing

Test-first in `src/modules/socket/__tests__/ChatsSocketClient.test.ts`, with the
existing `MockWebSocket` and fake timers. The `reconnect is not implemented`
test is replaced. Cases:

- backoff: retries at 1s, 2s, 4s… capped at 30s; reset after an answered attempt
- one drop reporting `error` and `disconnected` → one attempt
- no retry after `disconnect()`; `connect()` after `disconnect()` resumes retries
- failed first `connect()` rejects and is retried
- `onReconnected` fires after an answered retry with `{ attempt }`, never on the
  first connect
- `reconnect()`: immediate, cancels a pending retry, fires `onReconnected`
- `reconnect: false` → no retries; custom `initialDelay` / `maxDelay` honoured
- timeout: open-but-silent server → rejects `socket connect timed out` → retry
  scheduled; an answer within the timeout clears it
- token: sync getter, async getter, token rotated between attempts; a throwing
  getter fails the attempt and is retried
- stale sockets: events from a replaced socket are ignored; `connect()` over a
  live socket closes the old one

Verification before done: `npm run code-check:ci` and `npx vue-tsc --noEmit`.

## Release

- `package.json` → `0.0.20`.
- `CHANGELOG.md` entry in the existing style: **New features** (automatic
  reconnect, `reconnect()`, `onReconnected`, `connectTimeout`, options and type
  exports), **Fixes** (socket honours an `accessToken` getter), **Breaking
  changes** (reconnect on by default — integrators with their own retry loop
  should remove it or pass `reconnect: false`).
- Not published without the user's go-ahead.

## Follow-up in agent-workspace-app (separate change)

After 0.0.20 is available, and only with the user's go-ahead to bump/link:
`useChatsSocket.ts` drops its timer and backoff, passes a token getter, and
forwards `client.onReconnected` to its own `reconnectHandlers`. The
`onReconnected` API used by `store/chats.ts` stays the same. The backoff tests
are deleted (covered in the SDK); the fan-out and forwarding tests stay. The
target branch depends on whether #159 / #160 have merged by then.
