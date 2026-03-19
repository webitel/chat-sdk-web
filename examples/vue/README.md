# Chat Web SDK - Vue example

This is a small, clean Vue 3 app that demonstrates how to connect to Webitel IM websocket events using this SDK:

- `createSocketConfig(...)`
- `createChatsSocketClient(...)`
- event subscription via `client.on(...)`

## Prerequisites

1. A running Webitel IM websocket endpoint you can connect to.

## Configure

Create `.env` based on `.env.example` and set at least `VITE_WS_BASE_URL`.

## Run

From `chat-web-sdk/examples/vue`:

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal. Use the UI to connect and inspect incoming socket events.
