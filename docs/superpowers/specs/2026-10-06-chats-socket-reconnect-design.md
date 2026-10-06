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
  connectTimeout?: number,   // default 10_000 ms; bounds every attempt, the first one too; 0 / Infinity = off
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
- `connectTimeout`: `0` or `Infinity` turns it off; NaN or a negative value
  falls back to 10s; values above 2^31 - 1 ms are capped. It includes resolving
  the token.
- A subscriber that throws (`onMessage`, `onState`, `onReconnected`) is logged
  with `console.error` and never breaks the attempt; `onReconnected` subscribers
  are isolated from each other.

### Non-goals

Heartbeat / ping-based dead-socket detection, browser `online` / `offline`
listeners, a retry limit, an `off()` / unsubscribe API.

## Internal behaviour

Private state: `ws`, `rejectAttempt` (the pending call's reject), `retryTimer`,
`retryDelay`, `connectTimer`, `attempt` (count for the current outage), options
with defaults.

**One socket per attempt.** Each attempt creates its own `WebSocket`. Every
handler first checks that its socket is still `this.ws` and returns otherwise.
Dropping a socket (timeout, `disconnect()`, or `connect()` / `reconnect()` over
a live one) clears `this.ws` before `close()`, so a dropped socket never changes
state or schedules a retry, and rejects the call still waiting on it.

**Bookkeeping first, notify last.** State subscribers may call back into the
client (an app's own retry loop does). Every state change is emitted after the
attempt's promise is settled and the retry is scheduled or cancelled, so a
subscriber's `connect()` / `disconnect()` sees a consistent client and cancels
a retry instead of racing it. `onReconnected` is emitted after the call
resolved, so a throwing subscriber cannot stall the attempt.

**Attempt** (`openSocket({ isRetry })`, used by `connect`, `reconnect` and the
retry timer):

1. Clear the pending retry timer, drop any existing socket, create the socket,
   start the `connectTimeout` timer, then set `Connecting`.
2. `onopen` → `Connected` (same timing as today) → if a subscriber dropped the
   socket, stop → resolve the token → if the socket became stale during the
   await, stop → send the auth frame. A getter that throws fails the attempt.
3. `connectedEvent` → clear the timeout, `retryDelay = initialDelay`,
   `attempt = 0`, resolve; then emit the message and, if `isRetry`, reconnected
   with `{ attempt }`.
4. Failure:
   - `onerror` → reject `failed to connect to socket`, `scheduleRetry()`, set
     `Error`;
   - `onclose`, timeout (`socket connect timed out`) and token getter failure go
     through `failAttempt`: drop the socket (rejecting the call), `scheduleRetry()`,
     set `Disconnected`.

**`scheduleRetry()`**: return if reconnect is disabled or a timer is already
pending (one retry per drop). Otherwise set a timer for `retryDelay` that
increments `attempt` and runs `openSocket({ isRetry: true })` with its rejection
swallowed (its own failure schedules the next retry); then
`retryDelay = min(retryDelay * 2, maxDelay)`.

Delays are normalised once: non-finite values and a `maxDelay` <= 0 fall back to
the defaults, `maxDelay` is capped at 2^31 - 1 ms, and `initialDelay` is kept
between 1 ms and `maxDelay` — no hot retry loop.

**Public methods**

- `connect()`: `openSocket({ isRetry: false })`.
- `reconnect()`: `attempt++`; `openSocket({ isRetry: true })`.
- `disconnect()`: clear the retry timer, reset `retryDelay` and `attempt`, drop
  the socket, set `Disconnected`. No `stopped` flag is needed: once `this.ws` is
  cleared and the timer is gone, nothing is left that could schedule a retry.

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
