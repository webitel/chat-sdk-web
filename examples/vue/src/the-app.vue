<template>
  <div class="app">
    <ConnectForm
      v-if="showConnectForm"
      :loading="isConnecting"
      :error="connectError"
      @connect="handleConnect"
    />
    <template v-else>
      <AppHeader
        :status="socketStatus"
        @disconnect="handleDisconnect"
      />
      <div class="layout">
        <ChatSidebar
          :active-chat="activeChat"
          @select-thread="selectThread"
          @select-contact="selectContact"
        />
        <ChatWindow
          :active-chat="activeChat"
          :messages="messages"
          :messages-loading="messagesLoading"
          :messages-error="messagesError"
          :send-error="sendError"
          :is-sending="isSending"
          @send="sendMessage"
        />
      </div>
      <MyMembershipEvents />
    </template>
  </div>
</template>

<script
  setup
  lang="ts"
>
import { ChatsSocketConnectionStatus } from '@webitel/chat-web-sdk';
import { computed, onBeforeUnmount, ref } from 'vue';

import AppHeader from './components/app-header.vue';
import ChatSidebar from './components/chat-sidebar.vue';
import ChatWindow from './components/chat-window.vue';
import ConnectForm from './components/connect-form.vue';
import MyMembershipEvents from './components/my-membership-events.vue';
import { useActiveChat } from './composables/use-active-chat';
import { useSocket } from './composables/use-socket';

const { socketStatus, connect, disconnect, onThreadMessage, onMemberLeft } =
	useSocket();
const {
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
	sendMessage,
} = useActiveChat();

const connectError = ref<string | null>(null);

const showConnectForm = computed(
	() => socketStatus.value !== ChatsSocketConnectionStatus.Connected,
);

const isConnecting = computed(
	() => socketStatus.value === ChatsSocketConnectionStatus.Connecting,
);

const stopMsgListener = onThreadMessage(appendSocketMessage);
const stopMemberLeftListener = onMemberLeft((payload) => {
	clearActiveThread(payload.threadId);
});

async function handleConnect(wsUrl: string, httpUrl: string, token: string) {
	connectError.value = null;
	try {
		await connect(wsUrl, httpUrl, token);
	} catch (err) {
		connectError.value = err instanceof Error ? err.message : String(err);
	}
}

async function handleDisconnect() {
	await disconnect();
}

onBeforeUnmount(() => {
	stopMsgListener();
	stopMemberLeftListener();
	disconnect();
});
</script>

<style scoped>
.app {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.layout {
  flex: 1;
  display: flex;
  min-height: 0;
}
</style>
