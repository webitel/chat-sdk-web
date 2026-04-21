<template>
  <header class="header">
    <div class="left">
      <div class="logo">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <span class="title">Chat Demo</span>
      <div class="status">
        <span
          class="dot"
          :data-status="status"
        />
        <span class="status-label">{{ statusLabel }}</span>
      </div>
    </div>

    <div class="right">
      <AccountBadge />
      <button
        class="btn-disconnect"
        type="button"
        @click="$emit('disconnect')"
      >
        Disconnect
      </button>
    </div>
  </header>
</template>

<script
  setup
  lang="ts"
>
import { computed } from 'vue';
import { ChatsSocketConnectionStatus } from '@webitel/chat-web-sdk';
import AccountBadge from '../modules/account/account-badge.vue';

const props = defineProps<{
	status: ChatsSocketConnectionStatus;
}>();

defineEmits<{
	disconnect: [];
}>();

const statusLabel = computed(() => {
	switch (props.status) {
		case ChatsSocketConnectionStatus.Connected:
			return 'Connected';
		case ChatsSocketConnectionStatus.Connecting:
			return 'Connecting…';
		case ChatsSocketConnectionStatus.Disconnected:
			return 'Disconnected';
		case ChatsSocketConnectionStatus.Error:
			return 'Error';
		default:
			return 'Idle';
	}
});
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 52px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  gap: 16px;
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eff6ff;
  color: #1f7aff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
  flex-shrink: 0;
}

.dot[data-status='connected'] {
  background: #10b981;
}

.dot[data-status='connecting'] {
  background: #f59e0b;
  animation: pulse 1s ease-in-out infinite;
}

.dot[data-status='error'] {
  background: #ef4444;
}

.dot[data-status='disconnected'] {
  background: #9ca3af;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
}

.right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.btn-disconnect {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.btn-disconnect:hover {
  background: #fff1f2;
  border-color: #fecaca;
  color: #b91c1c;
}
</style>
