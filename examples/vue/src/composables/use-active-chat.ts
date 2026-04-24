import {
	createThreadsService,
	type IContact,
	type IMessage,
	type IThread,
} from '@webitel/chat-web-sdk';
import { ref, shallowRef } from 'vue';

import { useSocket } from './use-socket';

export type ChatSendParams = Parameters<IThread['sendMessage']>[0];

export type ChatTarget =
	| {
			kind: 'thread';
			item: IThread;
	  }
	| {
			kind: 'contact';
			item: IContact;
	  };

const activeChat = shallowRef<ChatTarget | null>(null);
const messages = ref<IMessage[]>([]);
const messagesLoading = ref(false);
const messagesError = ref<string | null>(null);
const sendError = ref<string | null>(null);
const isSending = ref(false);

export function useActiveChat() {
	const { serviceConfig } = useSocket();

	async function selectThread(thread: IThread) {
		activeChat.value = {
			kind: 'thread',
			item: thread,
		};
		messages.value = [];
		messagesError.value = null;
		sendError.value = null;

		try {
			const { fetchThread } = createThreadsService(serviceConfig.value);
			const full = await fetchThread(thread.id);
			activeChat.value = {
				kind: 'thread',
				item: full,
			};
			await loadHistory(full);
		} catch {
			await loadHistory(thread);
		}
	}

	function selectContact(contact: IContact) {
		activeChat.value = {
			kind: 'contact',
			item: contact,
		};
		messages.value = [];
		messagesError.value = null;
		sendError.value = null;
	}

	async function loadHistory(thread: IThread) {
		messagesLoading.value = true;
		try {
			const result = await thread.fetchMessageHistory({});
			messages.value = result.items ?? [];
		} catch (err) {
			messagesError.value = err instanceof Error ? err.message : String(err);
		} finally {
			messagesLoading.value = false;
		}
	}

	function appendSocketMessage(msg: IMessage) {
		const chat = activeChat.value;
		if (!chat) return;
		if (chat.kind === 'thread' && msg.threadId && msg.threadId !== chat.item.id)
			return;
		messages.value = [
			...messages.value,
			msg,
		];
	}

	async function sendMessage(params: ChatSendParams) {
		const chat = activeChat.value;
		if (!chat) return;
		sendError.value = null;
		isSending.value = true;
		try {
			await chat.item.sendMessage(params);
		} catch (err) {
			sendError.value = err instanceof Error ? err.message : String(err);
		} finally {
			isSending.value = false;
		}
	}

	return {
		activeChat,
		messages,
		messagesLoading,
		messagesError,
		sendError,
		isSending,
		selectThread,
		selectContact,
		appendSocketMessage,
		sendMessage,
	};
}
