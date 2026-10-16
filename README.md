# `@webitel/chat-web-sdk`

> **Beta:** This SDK is in beta. APIs and behavior may change between releases; pin versions in production and review changelogs when upgrading.

## Socket

`createChatsSocketClient` keeps one WebSocket per user connected and delivers chat events. It reconnects by itself (1s → 30s backoff, no give-up — call `disconnect()` to stop), and `onReconnected` tells you when to fetch what you missed.

```ts
const socket = createChatsSocketClient({
	socketConfig: createSocketConfig({ baseUrl, accessToken: () => auth.token }),
	serviceConfig,
});
socket.onMessage(ChatsSocketMessage.ThreadMessage, (message) => { /* … */ });
socket.onReconnected(() => { /* re-fetch threads / open chats */ });
await socket.connect();
```

Full guide — options, connection states, reconnect and catch-up, tokens, browser offline/online, errors, upgrading from 0.0.19: **[docs/socket.md](https://github.com/webitel/chat-sdk-web/blob/main/docs/socket.md)**.

More examples: [examples/README.md](https://github.com/webitel/chat-sdk-web/blob/main/examples/README.md). Changes per release: [CHANGELOG.md](https://github.com/webitel/chat-sdk-web/blob/main/CHANGELOG.md).
