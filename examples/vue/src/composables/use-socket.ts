import { ref, shallowRef } from 'vue';
import {
	ChatsSocketConnectionStatus,
	ChatsSocketMessage,
	createChatsSocketClient,
} from '@webitel/chat-web-sdk';
import type {
	IMessage,
	IThread,
	SocketMemberAddedEventPayload,
	SocketMemberLeftEventPayload,
	SocketMessageDeletedEventPayload,
	SocketMessageEditedEventPayload,
	SocketMessageReactionEventPayload,
	SocketResyncEventPayload,
	SocketTypingEventPayload,
	SocketVariablesEventPayload,
} from '@webitel/chat-web-sdk';
import { makeServiceConfig, makeSocketConfig } from '../configs';

type SocketClient = ReturnType<typeof createChatsSocketClient>;

const client = shallowRef<SocketClient | null>(null);
const socketStatus = ref<ChatsSocketConnectionStatus>(
	ChatsSocketConnectionStatus.Idle,
);
const currentServiceConfig = shallowRef(makeServiceConfig('', ''));

/** Payload per socket event, as the SDK emits it (its `onMessage` hands out `unknown`). */
export type SocketEventPayloads = {
	[ChatsSocketMessage.ThreadMessage]: IMessage;
	[ChatsSocketMessage.ThreadCreated]: IThread;
	[ChatsSocketMessage.MemberAdded]: SocketMemberAddedEventPayload;
	[ChatsSocketMessage.MemberLeft]: SocketMemberLeftEventPayload;
	[ChatsSocketMessage.Resync]: SocketResyncEventPayload;
	[ChatsSocketMessage.MessageEdited]: SocketMessageEditedEventPayload;
	[ChatsSocketMessage.MessageDeleted]: SocketMessageDeletedEventPayload;
	[ChatsSocketMessage.MessageReaction]: SocketMessageReactionEventPayload;
	[ChatsSocketMessage.Typing]: SocketTypingEventPayload;
	[ChatsSocketMessage.VariableSet]: SocketVariablesEventPayload;
	[ChatsSocketMessage.VariableFlush]: SocketVariablesEventPayload;
};

type SocketEventName = keyof SocketEventPayloads;

const socketEventNames: Record<SocketEventName, true> = {
	[ChatsSocketMessage.ThreadMessage]: true,
	[ChatsSocketMessage.ThreadCreated]: true,
	[ChatsSocketMessage.MemberAdded]: true,
	[ChatsSocketMessage.MemberLeft]: true,
	[ChatsSocketMessage.Resync]: true,
	[ChatsSocketMessage.MessageEdited]: true,
	[ChatsSocketMessage.MessageDeleted]: true,
	[ChatsSocketMessage.MessageReaction]: true,
	[ChatsSocketMessage.Typing]: true,
	[ChatsSocketMessage.VariableSet]: true,
	[ChatsSocketMessage.VariableFlush]: true,
};

// survive reconnecting with another client: handlers live here, not on the client
const handlers = new Map<SocketEventName, Set<(data: never) => void>>();

export function useSocket() {
	function attachHandlers(c: SocketClient) {
		(
			Object.values(
				ChatsSocketConnectionStatus,
			) as ChatsSocketConnectionStatus[]
		).forEach((state) => {
			c.onState(state, () => {
				socketStatus.value = state;
			});
		});

		for (const event of Object.keys(socketEventNames) as SocketEventName[]) {
			c.onMessage(event, (data) => {
				handlers.get(event)?.forEach((h) => h(data as never));
			});
		}
	}

	async function connect(
		wsUrl: string,
		httpUrl: string,
		token: string,
	): Promise<void> {
		try {
			await client.value?.disconnect();
		} catch {}

		const sc = makeServiceConfig(httpUrl, token);
		const wc = makeSocketConfig(wsUrl, token);
		currentServiceConfig.value = sc;

		const c = createChatsSocketClient({
			socketConfig: wc,
			serviceConfig: sc,
			// demo: react to DevTools / OS offline right away (TCP alone often lags)
			followBrowserNetwork: true,
		});
		attachHandlers(c);
		client.value = c;

		try {
			await c.connect();
		} catch (err) {
			// the form shows the error and the user retries: stop the background retries
			await c.disconnect();
			client.value = null;
			throw err;
		}
	}

	async function disconnect(): Promise<void> {
		try {
			await client.value?.disconnect();
		} catch {}
		client.value = null;
	}

	function onSocketEvent<Event extends SocketEventName>(
		event: Event,
		cb: (payload: SocketEventPayloads[Event]) => void,
	): () => void {
		const set = handlers.get(event) ?? new Set();
		handlers.set(event, set);
		set.add(cb);
		return () => set.delete(cb);
	}

	const onThreadMessage = (cb: (msg: IMessage) => void) =>
		onSocketEvent(ChatsSocketMessage.ThreadMessage, cb);

	const onThreadCreated = (cb: (thread: IThread) => void) =>
		onSocketEvent(ChatsSocketMessage.ThreadCreated, cb);

	const onMemberAdded = (
		cb: (payload: SocketMemberAddedEventPayload) => void,
	) => onSocketEvent(ChatsSocketMessage.MemberAdded, cb);

	const onMemberLeft = (cb: (payload: SocketMemberLeftEventPayload) => void) =>
		onSocketEvent(ChatsSocketMessage.MemberLeft, cb);

	return {
		socketStatus,
		serviceConfig: currentServiceConfig,
		connect,
		disconnect,
		onThreadMessage,
		onThreadCreated,
		onMemberAdded,
		onMemberLeft,
		onSocketEvent,
	};
}
