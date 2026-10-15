# 1. Chats socket reconnects inside the SDK

Date: 2026-10-15

## Status

Accepted. Shipped in 0.0.20 ([WS-63](https://webitel.atlassian.net/browse/WS-63)).

## Context

`ChatsSocketClient.reconnect()` threw `Not implemented`, so every app rebuilt
reconnect on top of `onState(Disconnected | Error)` — agent-workspace-app did
(backoff 1s → 30s, `onReconnected` to catch up on missed messages). The app
version had gaps: no timeout on an attempt (a server that opens the socket but
never sends `connectedEvent` stalled retries forever) and a token read once.
The SDK is integrated by developers outside the team, so the behaviour belongs
in it, once.

## Decision

**Reconnect is on by default.** A dropped socket — or a first `connect()` that
failed — is connected again after `initialDelay` (1s), doubling up to
`maxDelay` (30s), reset once the server answers, with no give-up. Only
`disconnect()` stops it. `createChatsSocketClient({ reconnect: false })` turns
it off. Unusable delays fall back to the defaults; the first delay stays between
1ms and `maxDelay`, so a server failing fast is never retried in a hot loop.

**`onReconnected({ attempt })` is the catch-up signal.** It fires when the
server answers again after a drop, and after every answered `reconnect()`;
never for `connect()`. Once per attempt, even if the server repeats
`connectedEvent`. A separate method, not a new connection state, so
`connectionState === Connected` checks keep working.

**`connectTimeout` (10s) bounds every attempt**, including resolving an
`accessToken` getter. `0` / `Infinity` turn it off.

**One socket per attempt.** Every socket handler checks the socket is still the
current one; a dropped or replaced socket can never change state or schedule a
retry. A superseded `connect()` rejects with `socket connect superseded`.

**Bookkeeping first, notify last.** State subscribers may call back into the
client (an app's own retry loop does). The pending call is settled and the retry
scheduled or cancelled before any state is reported, so a subscriber's
`connect()` / `disconnect()` cancels a retry instead of racing it. That ordering
is also why there is no "stopped" flag: once `disconnect()` has cleared the
current socket and the retry timer, nothing is left that could reconnect.

**Subscriber exceptions are logged, not propagated.** A throwing `onState`,
`onMessage` or `onReconnected` subscriber is logged with `console.error` and
never breaks the attempt; `onReconnected` subscribers are isolated from each
other, since they drive the app's catch-up.

**The token is read on every attempt**, so a reconnect uses the current token.

**Opt-in `followBrowserNetwork`.** The TCP stack often notices a dead network
late. With `createChatsSocketClient({ followBrowserNetwork: true })` the
browser's `offline` event drops the socket the normal way (`browser went
offline`, retry scheduled) and `online` runs a pending retry at once with the
backoff reset. Listeners go on `window` from `connect()` / `reconnect()` until
`disconnect()`; without `window.addEventListener` (Node, SSR, workers, React
Native) the option has no effect. Off by default to keep global listeners out of
apps that did not ask for them.

## Consequences

- Breaking for apps that reconnect on their own: they should remove that code or
  pass `reconnect: false`. Apps that give up on a failed `connect()` should call
  `disconnect()`, or the client keeps retrying in the background.
- A client that is dropped without `disconnect()` keeps retrying; `disconnect()`
  is the only way to release it.
- Recovering by hand should use `reconnect()`, not `connect()`, so
  `onReconnected` still fires.
- Not covered: heartbeat-based dead-socket detection, a retry limit, an
  `off()` / unsubscribe API, network events in workers.
