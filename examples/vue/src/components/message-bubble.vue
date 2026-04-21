<template>
  <div class="bubble">
    <div class="meta">
      <span class="sender">{{ senderName }}</span>
      <span class="time">{{ formattedTime }}</span>
    </div>
    <div
      v-if="message.body"
      class="body"
    >{{ message.body }}</div>
    <div
      v-if="message.images && message.images.length"
      class="attachments"
    >
      <div class="attach-label">Images</div>
      <div class="image-grid">
        <a
          v-for="(img, i) in message.images"
          :key="i"
          class="image-wrap"
          :href="img.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            class="image"
            :src="img.url"
            :alt="img.mime || 'image'"
            loading="lazy"
          />
        </a>
      </div>
    </div>
    <div
      v-if="message.documents && message.documents.length"
      class="attachments"
    >
      <div class="attach-label">Files</div>
      <ul class="file-list">
        <li
          v-for="(doc, i) in message.documents"
          :key="i"
        >
          <a
            :href="doc.url"
            target="_blank"
            rel="noopener noreferrer"
            class="file-link"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {{ doc.name || 'Unnamed file' }}
          </a>
          <span
            v-if="doc.size"
            class="file-size"
          >{{ formatSize(doc.size) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script
  setup
  lang="ts"
>
import type { IMessage } from '@webitel/chat-web-sdk';
import { computed } from 'vue';

const props = defineProps<{
	message: IMessage;
}>();

const senderName = computed(
	() => props.message.sender?.contact?.username || 'Unknown',
);

const formattedTime = computed(() => {
	const raw = props.message.createdAt;
	if (!raw) return '';
	const date = new Date(Number(raw));
	return date.toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
	});
});

function formatSize(bytes: number | string) {
	const n = Number(bytes);
	if (n < 1024) return `${n} B`;
	if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / 1048576).toFixed(1)} MB`;
}
</script>

<style scoped>
.bubble {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  max-width: 80%;
  word-break: break-word;
}

.meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.sender {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.time {
  font-size: 11px;
  color: #9ca3af;
}

.body {
  font-size: 14px;
  color: #111827;
  line-height: 1.5;
  white-space: pre-wrap;
}

.attachments {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attach-label {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.image-wrap {
  display: block;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.image {
  display: block;
  width: auto;
  height: auto;
  max-width: 200px;
  max-height: 160px;
  object-fit: cover;
}

.file-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-list li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #1f7aff;
  text-decoration: none;
}

.file-link:hover {
  text-decoration: underline;
}

.file-size {
  font-size: 11px;
  color: #9ca3af;
}
</style>
