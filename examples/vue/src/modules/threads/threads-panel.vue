<template>
  <div class="panel">
    <div class="panel-header">
      <span class="count">{{ threads.length ? `${threads.length} thread${threads.length !== 1 ? 's' : ''}` : '' }}</span>
      <button
        class="btn-refresh"
        type="button"
        :disabled="loading"
        @click="refresh"
      >
        <svg
          v-if="loading"
          class="spin"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <svg
          v-else
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M23 4v6h-6M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </button>
    </div>

    <div
      v-if="error"
      class="state error"
    >
      {{ error }}
    </div>
    <div
      v-else-if="loading && threads.length === 0"
      class="state muted"
    >
      Loading…
    </div>
    <div
      v-else-if="threads.length === 0"
      class="state muted"
    >
      No threads found
    </div>

    <ul
      v-else
      class="list"
    >
      <li
        v-for="t in threads"
        :key="t.id"
        :class="['item', { active: activeId === t.id }]"
        @click="$emit('select', t)"
      >
        <div class="item-main">
          <span class="item-name">{{ t.subject || 'Untitled thread' }}</span>
          <span
            v-if="t.type"
            class="badge"
          >{{ t.type }}</span>
        </div>
        <div class="item-meta">
          <span class="item-time">{{ formatTime(t.updatedAt) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script
  setup
  lang="ts"
>
import { ref } from 'vue';
import { type IThread, useThreadsService } from '@webitel/chat-web-sdk';
import { useSocket } from '../../composables/use-socket';

const props = defineProps<{
	activeId?: string | null;
}>();

defineEmits<{
	select: [
		thread: IThread,
	];
}>();

const { serviceConfig } = useSocket();

const threads = ref<IThread[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

function formatTime(value?: string) {
	if (!value) return '';
	const ms = Number(value);
	const date = new Date(ms);
	const now = new Date();
	if (date.toDateString() === now.toDateString()) {
		return date.toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		});
	}
	return date.toLocaleDateString([], {
		month: 'short',
		day: 'numeric',
	});
}

async function refresh() {
	loading.value = true;
	error.value = null;
	try {
		const { fetchThreads } = useThreadsService(serviceConfig.value);
		const res = await fetchThreads({
			size: 50,
		});
		threads.value = res.items ?? [];
	} catch (err) {
		error.value = err instanceof Error ? err.message : String(err);
	} finally {
		loading.value = false;
	}
}

refresh();
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.count {
  font-size: 12px;
  color: #9ca3af;
}

.btn-refresh {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.btn-refresh:hover:not(:disabled) {
  background: #eff6ff;
  color: #1f7aff;
  border-color: #bfdbfe;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state {
  padding: 20px 14px;
  font-size: 13px;
  text-align: center;
}

.state.error {
  color: #b91c1c;
}

.state.muted {
  color: #9ca3af;
}

.list {
  list-style: none;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 11px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.1s;
}

.item:hover {
  background: #f9fafb;
}

.item.active {
  background: #eff6ff;
  border-left: 3px solid #1f7aff;
  padding-left: 11px;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.item-name {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.badge {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 999px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  color: #1d4ed8;
  white-space: nowrap;
  flex-shrink: 0;
}

.item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-time {
  font-size: 11px;
  color: #9ca3af;
}
</style>
