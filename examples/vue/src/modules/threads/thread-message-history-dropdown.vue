<template>
  <details class="details" @toggle="onToggle">
    <summary class="summary">
      Message history
      <span v-if="messages.length" class="count">({{ messages.length }})</span>
    </summary>

    <div class="panel">
      <div v-if="loading" class="state">Loading…</div>
      <div v-else-if="loadError" class="state error">{{ loadError }}</div>
      <ul v-else-if="messages.length" class="msg-list">
        <li
          v-for="(m, i) in messages"
          :key="m.id || i"
          class="msg"
        >
          <div class="msg-meta">
            <span class="msg-time">{{ m.createdAt ? formatEpochMs(m.createdAt) : '—' }}</span>
            <span v-if="m.sender?.username" class="msg-from">{{ m.sender.username }}</span>
          </div>
          <div class="msg-body">{{ m.body || '—' }}</div>
          <div v-if="m.images && m.images.length" class="msg-attachments">
            <div class="label">Images</div>
            <div class="image-grid">
              <a
                v-for="(img, imageIdx) in m.images"
                :key="imageIdx"
                class="image-link"
                :href="img.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  class="image-preview"
                  :src="img.url"
                  :alt="img.fileId"
                >
                <span>{{ img.mime }}</span>
              </a>
            </div>
          </div>
          <div v-if="m.documents && m.documents.length" class="msg-attachments">
            <div class="label">Files</div>
            <ul class="file-list">
              <li
                v-for="(doc, docIdx) in m.documents"
                :key="docIdx"
              >
                <a
                  :href="doc.url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ doc.name }}
                </a>
                <span class="muted"> ({{ doc.size }} bytes, {{ doc.mime }})</span>
              </li>
            </ul>
          </div>
        </li>
      </ul>
      <div v-else class="state muted">No messages in history.</div>
    </div>
  </details>
</template>

<script setup lang="ts">
import type { IMessage, IThread } from '@webitel/chat-web-sdk';
import { ref } from 'vue';

const props = defineProps<{
	thread: IThread;
}>();

const messages = ref<IMessage[]>([]);
const loading = ref(false);
const loadError = ref<string | null>(null);
const hasLoaded = ref(false);

function formatEpochMs(value: string) {
	const n = Number(value);
	return new Date(n).toLocaleString();
}

async function loadHistory() {
	loading.value = true;
	loadError.value = null;
	try {
		const result = await props.thread.fetchMessageHistory({
			fields: [
				'documents',
				'images',
			],
		});
		messages.value = result.items;
		hasLoaded.value = true;
	} catch (err) {
		loadError.value = err instanceof Error ? err.message : String(err);
	} finally {
		loading.value = false;
	}
}

function onToggle(e: Event) {
	const el = e.target as HTMLDetailsElement;
	if (!el.open || hasLoaded.value || loading.value) return;
	void loadHistory();
}
</script>

<style scoped>
.details {
  margin-top: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
  overflow: hidden;
}

.summary {
  cursor: pointer;
  list-style: none;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  user-select: none;
}

.summary::-webkit-details-marker {
  display: none;
}

.summary::before {
  content: '▶ ';
  display: inline-block;
  transition: transform 0.15s ease;
  font-size: 10px;
  color: #6b7280;
}

.details[open] .summary::before {
  transform: rotate(90deg);
}

.count {
  font-weight: 500;
  color: #6b7280;
}

.panel {
  border-top: 1px solid #e5e7eb;
  padding: 10px 12px 12px;
  background: #fff;
}

.state {
  font-size: 13px;
  padding: 8px 0;
}

.state.error {
  color: #b91c1c;
}

.state.muted {
  color: #6b7280;
}

.msg-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 35vh;
  overflow-y: auto;
  min-height: 0;
}

.msg {
  padding: 10px 12px;
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  background: #fafafa;
  font-size: 13px;
}

.msg-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
  color: #6b7280;
  font-size: 12px;
}

.msg-from {
  font-weight: 600;
  color: #374151;
}

.msg-body {
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-attachments {
  margin-top: 8px;
}

.label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-link {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  max-width: 160px;
  text-decoration: none;
  color: #1f2937;
  font-size: 12px;
}

.image-preview {
  width: 100%;
  max-width: 160px;
  max-height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.file-list {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
}

.muted {
  color: #6b7280;
}
</style>
