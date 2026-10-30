import {
	createThreadsService,
	type IContact,
	type IMessage,
	type IThread,
	type SocketMessageDeletedEventPayload,
	type SocketMessageEditedEventPayload,
	type SocketMessageReactionAggregate,
	type SocketMessageReactionEventPayload,
	type SocketTypingEventPayload,
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
/** live reaction bars by message id; history does not carry them */
const reactions = ref<Record<string, SocketMessageReactionAggregate[]>>({});
/** who is typing in the active thread, by member id */
const typing = ref<Record<string, string>>({});
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
/** edit `version` applied per message id */
const editVersions = new Map<string, number>();

function resetLiveState() {
	reactions.value = {};
	typing.value = {};
	typingTimers.forEach(clearTimeout);
	typingTimers.clear();
	editVersions.clear();
}

/** the event belongs to the open thread */
function isActiveThread(threadId: string) {
	const chat = activeChat.value;
	return chat?.kind === 'thread' && chat.item.id === threadId;
}

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
		resetLiveState();

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
		resetLiveState();
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

	function clearActiveThread(threadId: string) {
		const chat = activeChat.value;
		if (!chat || chat.kind !== 'thread' || chat.item.id !== threadId) return;
		activeChat.value = null;
		messages.value = [];
		messagesError.value = null;
		sendError.value = null;
		resetLiveState();
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

	function applyMessageEdited(edit: SocketMessageEditedEventPayload) {
		if (!isActiveThread(edit.threadId)) return;
		// edits can arrive out of order: keep the newest
		if ((edit.version ?? 0) < (editVersions.get(edit.id) ?? 0)) return;
		editVersions.set(edit.id, edit.version ?? 0);
		const msg = messages.value.find(({ id }) => id === edit.id);
		if (!msg) return;
		msg.body = edit.body;
		msg.editedAt = String(edit.editedAt);
	}

	function applyMessageDeleted(deleted: SocketMessageDeletedEventPayload) {
		if (!isActiveThread(deleted.threadId)) return;
		messages.value = messages.value.filter(({ id }) => id !== deleted.id);
	}

	function applyReaction(change: SocketMessageReactionEventPayload) {
		if (!isActiveThread(change.threadId)) return;
		// the event is the whole bar: replace, do not merge
		reactions.value = {
			...reactions.value,
			[change.messageId]: change.reactions,
		};
	}

	function applyTyping({
		threadId,
		from,
		timeoutMs,
	}: SocketTypingEventPayload) {
		if (!isActiveThread(threadId) || !from) return;
		typing.value = {
			...typing.value,
			[from.id]: from.contact?.name || from.contact?.username || 'Someone',
		};
		clearTimeout(typingTimers.get(from.id));
		typingTimers.set(
			from.id,
			setTimeout(() => {
				const { [from.id]: _, ...rest } = typing.value;
				typing.value = rest;
				typingTimers.delete(from.id);
			}, timeoutMs),
		);
	}

	/** live events were dropped: re-read the open thread */
	async function resync() {
		const chat = activeChat.value;
		if (chat?.kind !== 'thread') return;
		await loadHistory(chat.item);
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
		clearActiveThread,
		appendSocketMessage,
		reactions,
		typing,
		applyMessageEdited,
		applyMessageDeleted,
		applyReaction,
		applyTyping,
		resync,
		sendMessage,
	};
}
