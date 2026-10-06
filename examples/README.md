# `@webitel/chat-web-sdk` code snippets and examples


[[toc]]

## Initialize configs

Configs are required to initialize / use [Services](#using-chats-services) and [socket client](#using-socket-client)

>[!TIP]
> `accessToken` can be passed not only as string, but as getter or async getter!

```js
// your-app/.../configs.js

import { createServiceConfig, createChatsSocketClient } from '@webitel/chat-web-sdk';

export const serviceConfig = createServiceConfig({
    baseUrl: '/example/api',
    accessToken: 'zxc...', // or async () => await requestUserToken()
});

export const socketConfig = createChatsSocketClient({
    baseUrl: '/example/ws',
    accessToken: 'zxc...',
});
```

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

## using Chats Services

HTTP Endpoints related to one entity are named **Services**. 

```js
// your-app/.../contacts-list-component.js
import { createThreadsService, type IThread } from '@webitel/chat-web-sdk';

import { serviceConfig } from '../../configs'; // note! config is required!

const threads: IThread[] = [];

const { fetchThreads } = createThreadsService(serviceConfig);

const { items, next } = await fetchThreads();
threads.push(...items);
```

### using socket client

Not currently implemented

```js
// todo
```

### List of available Services

1. Account (`createAccountService`) — current user / auth payload
2. Contacts (`createContactsService`)
3. Threads (aka Dialogs) (`createThreadsService`)
4. Messages (`createMessagesService`)

```js
import { createAccountService } from '@webitel/chat-web-sdk';
import { serviceConfig } from './configs';

const { getAccount } = createAccountService(serviceConfig);
const account = await getAccount();
```

## Vue example

See [examples/vue](./vue/README.md) for a runnable app (WebSocket events plus HTTP: contacts, threads, and account).

## all pkg exports

Lists all pkg exported types and functions. 
In case you do know what you want to find but don't know if this is exported and how it is named.

* [src/index.ts](https://github.com/webitel/chat-sdk-web/blob/main/src/index.ts)
