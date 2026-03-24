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

## using Chats Services

HTTP Endpoints related to one entity are named **Services**. 

```js
// your-app/.../contacts-list-component.js
import { useThreadsService, type IThread } from '@webitel/chat-web-sdk';

import { serviceConfig } from '../../configs'; // note! config is required!

const threads: IThread[] = [];

const { fetchThreads } = useThreadsService(serviceConfig);

const { items, next } = await fetchThreads();
threads.push(...items);
```

### using socket client

Not currently implemented

```js
// todo
```

### List of available Services

1. Account (`useAccountService`) — current user / auth payload
2. Contacts (`useContactsService`)
3. Threads (aka Dialogs) (`useThreadsService`)
4. Messages (`useMessagesService`)

```js
import { useAccountService } from '@webitel/chat-web-sdk';
import { serviceConfig } from './configs';

const { getAccount } = useAccountService(serviceConfig);
const account = await getAccount();
```

## Vue example

See [examples/vue](./vue/README.md) for a runnable app (WebSocket events plus HTTP: contacts, threads, and account).

## all pkg exports

Lists all pkg exported types and functions. 
In case you do know what you want to find but don't know if this is exported and how it is named.

* [src/index.ts](https://github.com/webitel/chat-sdk-web/blob/main/src/index.ts)
