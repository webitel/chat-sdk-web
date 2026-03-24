<template>
  <div class="container">
    <header>
      <h1>Chat Web SDK - Vue example</h1>
      <p class="sub">
        Minimal demo that connects via WebSocket and shows received events.
      </p>
    </header>

    <section class="card">
      <div class="grid">
        <label class="field">
          <span>WebSocket URL</span>
          <input v-model="wsBaseUrl" placeholder="wss://your-gateway/ws" />
        </label>

        <label class="field">
          <span>Access token (optional)</span>
          <input v-model="accessToken" type="password" placeholder="Paste token if your backend needs it" />
        </label>
      </div>

      <div class="actions">
        <button class="primary" type="button" :disabled="status === 'connecting'" @click="connect">
          Connect
        </button>
        <button type="button" :disabled="status === 'idle'" @click="disconnect">
          Disconnect
        </button>
        <button type="button" @click="clearLogs">
          Clear logs
        </button>
      </div>

      <div class="status">
        <span class="status-dot" :data-status="status" />
        <span>
          Status: <strong>{{ statusLabel }}</strong>
        </span>
      </div>
    </section>

    <section class="card">
      <h2>Socket events</h2>
      <div v-if="logs.length === 0" class="empty">
        No events yet. Click <strong>Connect</strong> and watch incoming messages.
      </div>

      <ul v-else class="logs">
        <li v-for="item in logs" :key="item.id" class="log">
          <div class="log-head">
            <span class="pill">{{ item.event }}</span>
            <span class="time">{{ new Date(item.at).toLocaleTimeString() }}</span>
          </div>
          <pre class="payload">{{ safeStringify(item.payload) }}</pre>
        </li>
      </ul>
    </section>

    <section class="card">
      <TheAccountInfo />
    </section>

    <section class="card">
      <TheContactsList />
    </section>

    <section class="card">
      <TheThreadsList />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { createSocketConfig } from '../../../src/modules/configs';
import {
	ChatsSocketMessage,
	createChatsSocketClient,
} from '../../../src/modules/socket';
import TheAccountInfo from './modules/account/the-account-info.vue';
import TheContactsList from './modules/contacts/the-contacts-list.vue';
import TheThreadsList from './modules/threads/the-threads-list.vue';

type ConnectionStatus =
	| 'idle'
	| 'connecting'
	| 'connected'
	| 'disconnected'
	| 'error';

type LogItem = {
	id: string;
	at: number;
	event: ChatsSocketMessage | 'client_error' | 'client_info';
	payload: unknown;
};

const defaultBaseUrl = import.meta.env.VITE_WS_BASE_URL ?? '';
const defaultAccessToken = import.meta.env.VITE_WS_ACCESS_TOKEN ?? '';

const wsBaseUrl = ref<string>(defaultBaseUrl);
const accessToken = ref<string>(defaultAccessToken);

const status = ref<ConnectionStatus>('idle');
const logs = ref<LogItem[]>([]);

let client: ReturnType<typeof createChatsSocketClient> | null = null;

function newId() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const c: any = typeof crypto !== 'undefined' ? crypto : undefined;
	return c?.randomUUID
		? c.randomUUID()
		: `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeStringify(value: unknown) {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

function addLog(event: LogItem['event'], payload: unknown) {
	logs.value = [
		...logs.value,
		{
			id: newId(),
			at: Date.now(),
			event,
			payload,
		},
	];
}

function attachEventHandlers(
	nextClient: ReturnType<typeof createChatsSocketClient>,
) {
	nextClient.on(ChatsSocketMessage.Connected, (data: unknown) => {
		status.value = 'connected';
		addLog(ChatsSocketMessage.Connected, data);
	});

	nextClient.on(ChatsSocketMessage.Disconnected, (data: unknown) => {
		status.value = 'disconnected';
		addLog(ChatsSocketMessage.Disconnected, data);
	});

	nextClient.on(ChatsSocketMessage.Error, (data: unknown) => {
		status.value = 'error';
		addLog(ChatsSocketMessage.Error, data);
	});

	nextClient.on(ChatsSocketMessage.ThreadCreated, (data: unknown) => {
		addLog(ChatsSocketMessage.ThreadCreated, data);
	});

	nextClient.on(ChatsSocketMessage.ThreadMessage, (data: unknown) => {
		addLog(ChatsSocketMessage.ThreadMessage, data);
	});
}

const statusLabel = computed(() => {
	switch (status.value) {
		case 'idle':
			return 'Idle';
		case 'connecting':
			return 'Connecting...';
		case 'connected':
			return 'Connected';
		case 'disconnected':
			return 'Disconnected';
		case 'error':
			return 'Error';
		default:
			return status.value;
	}
});

async function connect() {
	if (!wsBaseUrl.value.trim()) {
		status.value = 'error';
		addLog('client_error', 'Missing `VITE_WS_BASE_URL` / `wsBaseUrl`.');
		return;
	}

	// Detach old client listeners by discarding it (we recreate a new client every time).
	try {
		await client?.disconnect();
	} catch {
		// ignore disconnect errors
	}

	client = createChatsSocketClient(
		createSocketConfig({
			baseUrl: wsBaseUrl.value.trim(),
			// Note: current SDK socket client does not attach this token to the WS handshake.
			// If your backend expects auth, include it in the URL (query/header handled by your gateway).
			accessToken: accessToken.value.trim(),
		}),
	);

	attachEventHandlers(client);
	status.value = 'connecting';

	try {
		await client.connect();
		addLog('client_info', {
			action: 'connect() called',
		});
	} catch (err) {
		status.value = 'error';
		addLog('client_error', err);
	}
}

async function disconnect() {
	try {
		await client?.disconnect();
	} finally {
		status.value = 'disconnected';
		addLog('client_info', {
			action: 'disconnect() called',
		});
	}
}

function clearLogs() {
	logs.value = [];
}

onBeforeUnmount(() => {
	client?.disconnect();
});
</script>

<style scoped>
.container {
  max-width: 980px;
  margin: 24px auto;
  padding: 0 16px;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
}

header h1 {
  font-size: 22px;
  margin: 0;
}

.sub {
  margin-top: 8px;
  color: #444;
}

.card {
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 760px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}

.field input {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  outline: none;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
  flex-wrap: wrap;
}

button {
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid #dedede;
  background: #f7f7f7;
  cursor: pointer;
  font-size: 14px;
}

button.primary {
  background: #1f7aff;
  border-color: #1f7aff;
  color: #fff;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #222;
  font-size: 14px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #999;
  display: inline-block;
}

.status-dot[data-status='connected'] {
  background: #0bbf5b;
}
.status-dot[data-status='connecting'] {
  background: #f59e0b;
}
.status-dot[data-status='error'] {
  background: #ef4444;
}
.status-dot[data-status='disconnected'] {
  background: #94a3b8;
}

.logs {
  list-style: none;
  padding: 0;
  margin: 0;
}

.log {
  border-top: 1px solid #eee;
  padding-top: 12px;
  margin-top: 12px;
}

.log:first-child {
  border-top: none;
  padding-top: 0;
}

.log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.pill {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  font-size: 12px;
}

.time {
  color: #6b7280;
  font-size: 12px;
}

.payload {
  margin: 0;
  padding: 12px;
  background: #0b1020;
  color: #e5e7eb;
  border-radius: 12px;
  overflow: auto;
  max-height: 320px;
  font-size: 12px;
}

.empty {
  color: #666;
}
</style>
