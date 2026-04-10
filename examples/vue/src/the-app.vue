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
          <input
            v-model="wsBaseUrl"
            placeholder="wss://your-gateway/ws"
          />
        </label>

        <label class="field">
          <span>Access token (optional)</span>
          <input
            v-model="accessToken"
            type="password"
            placeholder="Paste token if your backend needs it"
          />
        </label>
      </div>

      <div class="actions">
        <button
          class="primary"
          type="button"
          :disabled="status === 'connecting'"
          @click="connect"
        >
          Connect
        </button>
        <button
          type="button"
          :disabled="status === 'idle'"
          @click="disconnect"
        >
          Disconnect
        </button>
        <button
          type="button"
          @click="clearLogs"
        >
          Clear logs
        </button>
      </div>

      <div class="status-stack">
        <div class="status">
          <span
            class="status-dot"
            :data-status="status"
          />
          <span>
            App status (backend events): <strong>{{ statusLabel }}</strong>
          </span>
        </div>

        <div class="status status-sdk">
          <span
            class="status-dot"
            :data-socket-state="socketState"
          />
          <span>
            SDK <code>connectionState</code>:
            <strong>{{ socketStateLabel }}</strong>
          </span>
        </div>

        <div
          v-if="socketStateTransitions.length > 0"
          class="socket-transitions"
        >
          <div class="socket-transitions-title">
            Recent SDK state transitions
          </div>
          <ul class="socket-transitions-list">
            <li
              v-for="row in socketTransitionsView"
              :key="row.id"
            >
              <span class="socket-transitions-time">{{ row.time }}</span>
              <span class="socket-transitions-arrow">
                <code>{{ row.previous }}</code>
                →
                <code>{{ row.state }}</code>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="card">
      <h2>Socket events</h2>
      <div
        v-if="logs.length === 0"
        class="empty"
      >
        No events yet. Click <strong>Connect</strong> and watch incoming messages.
      </div>

      <ul
        v-else
        class="logs"
      >
        <li
          v-for="item in logs"
          :key="item.id"
          class="log"
        >
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

<script
  setup
  lang="ts"
>
import { computed, onBeforeUnmount, ref } from 'vue';
import { serviceConfig, socketConfig } from './configs';
import {
	ChatsSocketConnectionStatus,
	ChatsSocketMessage,
	createChatsSocketClient,
} from '@webitel/chat-web-sdk';
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

/** Tracks the SDK transport state (`connectionState` / `onState`), not backend message events. */
const socketState = ref<ChatsSocketConnectionStatus>(
	ChatsSocketConnectionStatus.Idle,
);

type SocketStateTransitionRow = {
	id: string;
	at: number;
	state: ChatsSocketConnectionStatus;
	previous: ChatsSocketConnectionStatus;
};

const socketStateTransitions = ref<SocketStateTransitionRow[]>([]);

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

function attachSocketStateHandlers(
	nextClient: ReturnType<typeof createChatsSocketClient>,
) {
	(
		Object.values(ChatsSocketConnectionStatus) as ChatsSocketConnectionStatus[]
	).forEach((state) => {
		nextClient.onState(state, ({ previous }) => {
			socketState.value = state;
			socketStateTransitions.value = [
				...socketStateTransitions.value.slice(-24),
				{
					id: newId(),
					at: Date.now(),
					state,
					previous,
				},
			];
		});
	});
}

function attachEventHandlers(
	nextClient: ReturnType<typeof createChatsSocketClient>,
) {
	nextClient.onMessage(ChatsSocketMessage.Connected, (data: unknown) => {
		status.value = 'connected';
		addLog(ChatsSocketMessage.Connected, data);
	});

	nextClient.onMessage(ChatsSocketMessage.Disconnected, (data: unknown) => {
		status.value = 'disconnected';
		addLog(ChatsSocketMessage.Disconnected, data);
	});

	nextClient.onMessage(ChatsSocketMessage.Error, (data: unknown) => {
		status.value = 'error';
		addLog(ChatsSocketMessage.Error, data);
	});

	nextClient.onMessage(ChatsSocketMessage.ThreadCreated, (data: unknown) => {
		addLog(ChatsSocketMessage.ThreadCreated, data);
	});

	nextClient.onMessage(ChatsSocketMessage.ThreadMessage, (data: unknown) => {
		addLog(ChatsSocketMessage.ThreadMessage, data);
	});
}

const socketStateLabel = computed(() => {
	const s = socketState.value;
	return s.charAt(0).toUpperCase() + s.slice(1);
});

const socketTransitionsView = computed(() =>
	[
		...socketStateTransitions.value,
	]
		.slice(-8)
		.reverse()
		.map((row) => ({
			id: row.id,
			time: new Date(row.at).toLocaleTimeString(),
			previous: row.previous,
			state: row.state,
		})),
);

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
	// Detach old client listeners by discarding it (we recreate a new client every time).
	try {
		await client?.disconnect();
	} catch {
		// ignore disconnect errors
	}

	client = createChatsSocketClient({
		socketConfig,
		serviceConfig,
	});

	attachSocketStateHandlers(client);
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
	socketStateTransitions.value = [];
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

.status-stack {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #222;
  font-size: 14px;
}

.status-sdk code {
  font-size: 12px;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 6px;
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

.status-dot[data-socket-state='idle'] {
  background: #9ca3af;
}

.status-dot[data-socket-state='connecting'] {
  background: #f59e0b;
}

.status-dot[data-socket-state='connected'] {
  background: #0bbf5b;
}

.status-dot[data-socket-state='disconnected'] {
  background: #94a3b8;
}

.status-dot[data-socket-state='error'] {
  background: #ef4444;
}

.socket-transitions {
  margin-top: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  font-size: 12px;
}

.socket-transitions-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.socket-transitions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.socket-transitions-list li {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 4px 0;
  border-top: 1px solid #e5e7eb;
}

.socket-transitions-list li:first-child {
  border-top: none;
  padding-top: 0;
}

.socket-transitions-time {
  color: #6b7280;
  min-width: 7.5rem;
}

.socket-transitions-arrow code {
  font-size: 11px;
  background: #fff;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
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
