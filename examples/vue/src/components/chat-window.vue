<template>
  <main class="window">
    <div
      v-if="!activeChat"
      class="empty-state"
    >
      <div class="empty-icon">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p class="empty-title">Select a conversation</p>
      <p class="empty-sub">Choose a thread or contact from the sidebar to start chatting</p>
    </div>

    <template v-else>
      <div class="chat-header">
        <div class="chat-avatar">{{ chatInitials }}</div>
        <div class="chat-info">
          <span class="chat-name">{{ chatTitle }}</span>
          <span
            v-if="chatKind"
            class="chat-badge"
          >{{ chatKind }}</span>
        </div>
      </div>

      <ThreadMembers
        v-if="activeThread"
        :thread="activeThread"
      />
      <ThreadVariables
        v-if="activeThread"
        :thread="activeThread"
      />

      <div
        ref="messagesEl"
        class="messages"
      >
        <div
          v-if="messagesLoading"
          class="msg-state"
        >
          <span class="spinner" />
          Loading messages…
        </div>
        <div
          v-else-if="messagesError"
          class="msg-state error"
        >
          {{ messagesError }}
        </div>
        <div
          v-else-if="messages.length === 0"
          class="msg-state muted"
        >
          No messages yet. Send the first one!
        </div>
        <template v-else>
          <MessageBubble
            v-for="msg in messages"
            :key="msg.id"
            :message="msg"
          />
        </template>
      </div>

      <MessageInput
        :disabled="isSending"
        :error="sendError"
        @send="$emit('send', $event)"
      />
    </template>
  </main>
</template>

<script
  setup
  lang="ts"
>
import { computed, nextTick, ref, watch } from 'vue';

import type { IMessage, IThread } from '@webitel/chat-web-sdk';
import type {
	ChatSendParams,
	ChatTarget,
} from '../composables/use-active-chat';
import MessageBubble from './message-bubble.vue';
import MessageInput from './message-input.vue';
import ThreadMembers from './thread-members.vue';
import ThreadVariables from './thread-variables.vue';

const props = defineProps<{
	activeChat: ChatTarget | null;
	messages: IMessage[];
	messagesLoading: boolean;
	messagesError: string | null;
	sendError: string | null;
	isSending: boolean;
}>();

defineEmits<{
	send: [
		params: ChatSendParams,
	];
}>();

const messagesEl = ref<HTMLElement | null>(null);

const activeThread = computed<IThread | null>(() =>
	props.activeChat?.kind === 'thread' ? props.activeChat.item : null,
);

const chatTitle = computed(() => {
	if (!props.activeChat) return '';
	if (props.activeChat.kind === 'thread') {
		return props.activeChat.item.subject || 'Untitled thread';
	}
	return (
		props.activeChat.item.name ||
		props.activeChat.item.username ||
		'Unknown contact'
	);
});

const chatKind = computed(() => {
	if (!props.activeChat) return '';
	if (props.activeChat.kind === 'thread') {
		return props.activeChat.item.type ?? '';
	}
	return props.activeChat.item.type ?? '';
});

const chatInitials = computed(() => {
	return chatTitle.value
		.split(/\s+/)
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase() ?? '')
		.join('');
});

function scrollToBottom() {
	const el = messagesEl.value;
	if (!el) return;
	el.scrollTop = el.scrollHeight;
}

watch(
	() => props.messages.length,
	() => nextTick(scrollToBottom),
);

watch(
	() => props.messagesLoading,
	(loading) => {
		if (!loading) nextTick(scrollToBottom);
	},
);
</script>

<style scoped>
.window {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: #f9fafb;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #eff6ff;
  color: #93c5fd;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.empty-sub {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  max-width: 280px;
  line-height: 1.5;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.chat-name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  color: #1d4ed8;
  white-space: nowrap;
  flex-shrink: 0;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.msg-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  font-size: 13px;
  color: #9ca3af;
}

.msg-state.error {
  color: #b91c1c;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top-color: #9ca3af;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
