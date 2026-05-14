import { ref, shallowRef } from 'vue';
import {
	ChatsSocketConnectionStatus,
	ChatsSocketMessage,
	createChatsSocketClient,
} from '@webitel/chat-web-sdk';
import type { IMessage, IThread } from '@webitel/chat-web-sdk';
import { makeServiceConfig, makeSocketConfig } from '../configs';

type SocketClient = ReturnType<typeof createChatsSocketClient>;

export type MemberAddedPayload = {
	threadId: string;
	contactId: string;
	metadata: {
		threadId: string;
		newMemberContactId: string;
		newMemberId: string;
		newMemberRole: number;
	};
};

export type MemberLeftPayload = {
	threadId: string;
	contactId: string;
	metadata: {
		threadId: string;
		removedMemberContactId: string;
		removedMemberId: string;
	};
};

const client = shallowRef<SocketClient | null>(null);
const socketStatus = ref<ChatsSocketConnectionStatus>(
	ChatsSocketConnectionStatus.Idle,
);
const currentServiceConfig = shallowRef(makeServiceConfig('', ''));

const messageHandlers = new Set<(msg: IMessage) => void>();
const threadCreatedHandlers = new Set<(thread: IThread) => void>();
const memberAddedHandlers = new Set<(payload: MemberAddedPayload) => void>();
const memberLeftHandlers = new Set<(payload: MemberLeftPayload) => void>();

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

		c.onMessage(ChatsSocketMessage.ThreadMessage, (data) => {
			messageHandlers.forEach((h) => h(data as IMessage));
		});

		c.onMessage(ChatsSocketMessage.ThreadCreated, (data) => {
			threadCreatedHandlers.forEach((h) => h(data as IThread));
		});

		c.onMessage(ChatsSocketMessage.MemberAdded, (data) => {
			memberAddedHandlers.forEach((h) => h(data as MemberAddedPayload));
		});

		c.onMessage(ChatsSocketMessage.MemberLeft, (data) => {
			memberLeftHandlers.forEach((h) => h(data as MemberLeftPayload));
		});
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
		});
		attachHandlers(c);
		client.value = c;

		await c.connect();
	}

	async function disconnect(): Promise<void> {
		try {
			await client.value?.disconnect();
		} catch {}
		client.value = null;
	}

	function onThreadMessage(cb: (msg: IMessage) => void): () => void {
		messageHandlers.add(cb);
		return () => messageHandlers.delete(cb);
	}

	function onThreadCreated(cb: (thread: IThread) => void): () => void {
		threadCreatedHandlers.add(cb);
		return () => threadCreatedHandlers.delete(cb);
	}

	function onMemberAdded(
		cb: (payload: MemberAddedPayload) => void,
	): () => void {
		memberAddedHandlers.add(cb);
		return () => memberAddedHandlers.delete(cb);
	}

	function onMemberLeft(cb: (payload: MemberLeftPayload) => void): () => void {
		memberLeftHandlers.add(cb);
		return () => memberLeftHandlers.delete(cb);
	}

	return {
		socketStatus,
		serviceConfig: currentServiceConfig,
		connect,
		disconnect,
		onThreadMessage,
		onThreadCreated,
		onMemberAdded,
		onMemberLeft,
	};
}
