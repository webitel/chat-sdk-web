<template>
  <div class="threads">
    <div class="header">
      <h2>Threads</h2>
      <button type="button" class="btn" :disabled="loading" @click="refresh">
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-else-if="loading" class="empty">Loading threads...</div>
    <div v-else-if="threads.length === 0" class="empty">No threads found.</div>

    <ul v-else class="list">
      <li
        v-for="(t, idx) in threads"
        :key="t.id || idx"
        class="item"
      >
        <div class="item-top">
          <strong class="title">{{ t.subject || 'Untitled thread' }}</strong>
          <span v-if="t.kind" class="badge">{{ t.kind }}</span>
        </div>

        <div class="row">
          <span class="k">Thread ID</span>
          <span class="v">{{ t.id || '—' }}</span>
        </div>

        <div class="timestamps">
          <div class="row">
            <span class="k">Created</span>
            <span class="v">{{ formatEpochMs(t.createdAt) }}</span>
          </div>
          <div class="row">
            <span class="k">Updated</span>
            <span class="v">{{ formatEpochMs(t.updatedAt) }}</span>
          </div>
        </div>

        <ThreadMessageHistoryDropdown :thread="t" />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useThreadsService, type IThread } from '@webitel/chat-web-sdk';

import { serviceConfig } from '../../configs';
import ThreadMessageHistoryDropdown from './thread-message-history-dropdown.vue';

const threads = ref<IThread[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const { fetchThreads } = useThreadsService(serviceConfig);

async function refresh() {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetchThreads();
    threads.value = res.threads ?? [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    loading.value = false;
  }
}

function formatEpochMs(value?: string) {
  if (!value) return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Date(n).toLocaleString();
}

onMounted(() => {
  void refresh();
});
</script>

<style scoped>
.threads {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

h2 {
  margin: 0;
  font-size: 18px;
}

.btn {
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid #dedede;
  background: #f7f7f7;
  cursor: pointer;
  font-size: 14px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  padding: 12px;
  border: 1px solid #fecaca;
  background: #fff1f2;
  border-radius: 12px;
  color: #b91c1c;
  font-size: 14px;
}

.empty {
  padding: 14px;
  color: #666;
  background: #fafafa;
  border: 1px dashed #e6e6e6;
  border-radius: 12px;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 35vh;
  overflow-y: auto;
  min-height: 0;
}

.item {
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  padding: 14px;
  background: #fff;
}

.item-top {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.title {
  font-size: 15px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
}

.row {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.k {
  color: #6b7280;
  font-size: 12px;
  width: 90px;
}

.v {
  font-size: 13px;
}

.timestamps {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
  margin-top: 12px;
  color: #374151;
  font-size: 13px;
}
</style>
