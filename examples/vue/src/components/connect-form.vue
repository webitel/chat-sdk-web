<template>
  <div class="screen">
    <div class="card">
      <div class="brand">
        <div class="brand-icon">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <h1 class="brand-title">Chat Web SDK</h1>
          <p class="brand-sub">Vue example</p>
        </div>
      </div>

      <div class="fields">
        <label class="field">
          <span class="label">WebSocket URL</span>
          <input
            v-model="wsUrl"
            type="url"
            placeholder="wss://your-gateway/ws"
            autocomplete="off"
            @keydown.enter="handleConnect"
          />
        </label>
        <label class="field">
          <span class="label">HTTP Base URL</span>
          <input
            v-model="httpUrl"
            type="url"
            placeholder="https://your-gateway"
            autocomplete="off"
            @keydown.enter="handleConnect"
          />
        </label>
        <label class="field">
          <span class="label">Access token</span>
          <input
            v-model="token"
            type="password"
            placeholder="Paste token"
            autocomplete="off"
            @keydown.enter="handleConnect"
          />
        </label>
      </div>

      <button
        class="btn-connect"
        type="button"
        :disabled="loading || !wsUrl.trim()"
        @click="handleConnect"
      >
        <span
          v-if="loading"
          class="spinner"
        />
        {{ loading ? 'Connecting…' : 'Connect' }}
      </button>

      <p
        v-if="error"
        class="error"
      >
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script
  setup
  lang="ts"
>
import { ref } from 'vue';
import {
	defaultAccessToken,
	defaultHttpBaseUrl,
	defaultWsBaseUrl,
} from '../configs';

const props = defineProps<{
	loading: boolean;
	error?: string | null;
}>();

const emit = defineEmits<{
	connect: [
		wsUrl: string,
		httpUrl: string,
		token: string,
	];
}>();

const wsUrl = ref(defaultWsBaseUrl);
const httpUrl = ref(defaultHttpBaseUrl);
const token = ref(defaultAccessToken);

function handleConnect() {
	if (props.loading || !wsUrl.value.trim()) return;
	emit('connect', wsUrl.value.trim(), httpUrl.value.trim(), token.value.trim());
}
</script>

<style scoped>
.screen {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 36px 32px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.brand-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #eff6ff;
  color: #1f7aff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.brand-sub {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.field input {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  outline: none;
  font-size: 14px;
  color: #111827;
  transition: border-color 0.15s;
}

.field input:focus {
  border-color: #1f7aff;
  box-shadow: 0 0 0 3px rgba(31, 122, 255, 0.12);
}

.btn-connect {
  width: 100%;
  padding: 11px 16px;
  border-radius: 10px;
  border: none;
  background: #1f7aff;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s, opacity 0.15s;
}

.btn-connect:hover:not(:disabled) {
  background: #1668e0;
}

.btn-connect:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff1f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 13px;
}
</style>
