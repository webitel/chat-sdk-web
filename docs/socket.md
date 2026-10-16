# Chats socket

Real-time chat events (new messages, new threads, membership changes) arrive
over one WebSocket per user. `createChatsSocketClient` opens it, keeps it
connected, and hands you typed events.

- [Quick start](#quick-start)
- [Options](#options)
- [Connection states](#connection-states)
- [Reconnecting](#reconnecting)
- [Catching up after a reconnect](#catching-up-after-a-reconnect)
- [Access tokens](#access-tokens)
- [Browser offline / online](#browser-offline--online)
- [Errors](#errors)
- [Upgrading from 0.0.19](#upgrading-from-0019)
- [FAQ](#faq)

## Quick start

```ts
import {
	ChatsSocketMessage,
	createChatsSocketClient,
	createServiceConfig,
	createSocketConfig,
	type IMessage,
} from '@webitel/chat-web-sdk';

const serviceConfig = createServiceConfig({
	baseUrl: 'https://your-host/api',
	accessToken: () => auth.token,
});

const socket = createChatsSocketClient({
	socketConfig: createSocketConfig({
		baseUrl: 'wss://your-host/chat/ws',
		accessToken: () => auth.token, // read again on every (re)connect
	}),
	serviceConfig,
});

socket.onMessage(ChatsSocketMessage.ThreadMessage, (data) => {
	const message = data as IMessage;
	// render it
});

socket.onReconnected(() => {
	// the socket was down: fetch what you missed (see below)
});

await socket.connect();

// when the user logs out / the page no longer needs chats:
await socket.disconnect();
```

`connect()` resolves once the server has accepted the connection (its
`connectedEvent`), not merely when the socket opens.

## Options

Everything besides the two configs is optional.

| Option | Default | What it does |
|---|---|---|
| `socketConfig` | — | `createSocketConfig({ baseUrl, accessToken })`. `accessToken` is a string, a getter, or an async getter. |
| `serviceConfig` | — | `createServiceConfig(...)`; used to turn socket payloads into SDK entities (`IMessage`, `IThread`). |
| `reconnect` | on | `false` turns automatic reconnect off. `{ initialDelay, maxDelay }` tunes the backoff (ms). A delay that is not a positive number falls back to its default. |
| `reconnect.initialDelay` | `1000` | Wait before the first retry after a drop. |
| `reconnect.maxDelay` | `30000` | The wait doubles per failed attempt, up to this. |
| `connectTimeout` | `10000` | An attempt the server has not accepted within this many ms fails (and is retried). Includes resolving the token getter. `0` or `Infinity` turns it off. |
| `followBrowserNetwork` | `false` | React to the browser's `offline` / `online` events right away. See [below](#browser-offline--online). |

## Connection states

`socket.connectionState` holds the current state; `onState(state, callback)`
is called when the client enters it, with `{ previous }`.

| State | Meaning |
|---|---|
| `idle` | Created, never connected. |
| `connecting` | A socket is being opened. |
| `connected` | The socket is open. (`connect()` still waits for the server to accept it.) |
| `error` | The socket reported an error; `disconnected` usually follows. |
| `disconnected` | No socket. A retry may be pending — check whether you called `disconnect()`. |

```ts
import { ChatsSocketConnectionStatus } from '@webitel/chat-web-sdk';

for (const state of Object.values(ChatsSocketConnectionStatus)) {
	socket.onState(state, () => {
		statusBadge.value = state;
	});
}
```

A drop typically reads `connected → error → disconnected → connecting →
connected`.

## Reconnecting

Reconnect is **on by default**. After a drop — or a first `connect()` that
failed — the client connects again after 1s, then 2s, 4s… up to 30s, until the
server accepts it. The delay starts over once it does. It never gives up on its
own.

- **`disconnect()` is the only way to stop it.** Call it on logout, unmount, or
  when your app gives up on a failed `connect()` — otherwise the client keeps
  retrying in the background.
- **`reconnect()`** connects again right away, cancelling a pending retry. Use it
  for a "Reconnect now" button, or after you know the network is back.
- `connect()` while a socket is open or connecting replaces it; the earlier
  `connect()` call rejects with `socket connect superseded`.
- `reconnect: false` turns automatic retries off; `reconnect()` still works and
  a failed call just rejects.

```ts
retryButton.onclick = () => {
	void socket.reconnect();
};
```

## Catching up after a reconnect

While the socket was down, nothing was pushed to you. `onReconnected` fires
each time the server accepts the socket again after a drop, and after every
accepted `reconnect()` — never for `connect()`. That is the moment to re-fetch:

```ts
socket.onReconnected(({ attempt }) => {
	// `attempt`: how many tries the outage took
	threadsList.refresh();
	for (const chat of openChats) {
		chat.loadNewestMessages();
	}
});
```

- It fires once per outage, even if the server repeats its `connectedEvent`.
- If a subscriber throws, the error is logged (`console.error`) and the other
  subscribers still run.
- Recover by hand with `reconnect()`, not `connect()`, so this still fires.

## Access tokens

Pass the token as a getter so a reconnect after a token refresh uses the
current one:

```ts
createSocketConfig({
	baseUrl,
	accessToken: async () => (await auth.refreshIfExpired()).token,
});
```

The getter runs on every connect attempt and counts against `connectTimeout`.
If it throws or rejects, the attempt fails with that error and is retried.

## Browser offline / online

TCP often notices a dead network only after a long delay, so a dropped Wi-Fi can
look `connected` for a while. With `followBrowserNetwork: true`:

- the browser's `offline` event drops the socket right away (a pending
  `connect()` / `reconnect()` rejects with `browser went offline`) and a retry is
  scheduled;
- `online` runs that retry immediately, with the backoff started over.

Listeners are added on `connect()` / `reconnect()` and removed on
`disconnect()`. Where there is no browser `window` (Node, SSR, workers, React
Native) the option has no effect.

## Errors

`connect()` and `reconnect()` reject with an `Error`:

| Message | Cause |
|---|---|
| `failed to connect to socket` | The socket reported an error (server down, network, TLS…). |
| `socket disconnected` | The socket closed before the server accepted it, or you called `disconnect()`. |
| `socket connect timed out` | No `connectedEvent` within `connectTimeout`. |
| `socket connect superseded` | Another `connect()` / `reconnect()` replaced this attempt. |
| `browser went offline` | `followBrowserNetwork` saw the browser go offline. |
| *(your getter's error)* | The `accessToken` getter threw or rejected. |

With reconnect on, a rejected call is not the end: the client keeps retrying.
Server-side errors arrive as `ChatsSocketMessage.Error` messages;
subscriber exceptions are logged, not reported there.

## Upgrading from 0.0.19

- **Remove your own reconnect loop.** If you reconnected on
  `ChatsSocketConnectionStatus.Disconnected` / `Error`, delete that code — the
  client does it now — or pass `reconnect: false` to keep yours.
- **Call `disconnect()` when giving up** on a failed `connect()` (login form,
  "server unavailable" screen); it keeps retrying otherwise.
- **Silent servers now time out**: `connect()` rejects after 10s instead of
  hanging. Raise `connectTimeout` for slow networks, or pass `0`.
- **A second `connect()` rejects the first** with `socket connect superseded`
  (it used to leak a socket). Handle the rejection if you call it twice.
- **Token getters work now** (they were sent as an empty value before).
- See the [CHANGELOG](../CHANGELOG.md) for the full list.

## FAQ

**React StrictMode / double effects call `connect()` twice.**
The second call replaces the first socket; the first promise rejects with
`socket connect superseded`. Catch it, or connect outside the effect.

**Does it work in Node or SSR?**
Yes — it uses the global `WebSocket` (Node 22+ has one). `followBrowserNetwork`
does nothing there.

**How do I know a retry is pending?**
`connectionState` is `disconnected` (or `connecting`) and you have not called
`disconnect()`. Show "Reconnecting…" in that case.

**Why does `onReconnected` not fire after my `connect()`?**
`connect()` is "start fresh". Use `reconnect()` to recover a dropped socket by
hand.
