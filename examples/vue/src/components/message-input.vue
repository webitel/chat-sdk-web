<template>
  <div class="input-area">
    <p
      v-if="error"
      class="send-error"
    >
      {{ error }}
    </p>
    <div class="input-row">
      <div class="attach-btns">
        <label
          class="attach-btn"
          title="Send image(s)"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              ry="2"
            />
            <circle
              cx="8.5"
              cy="8.5"
              r="1.5"
            />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <input
            type="file"
            accept="image/*"
            multiple
            :disabled="disabled"
            @change="onImageSelected"
          />
        </label>
        <label
          class="attach-btn"
          title="Send document(s)"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <input
            type="file"
            multiple
            :disabled="disabled"
            @change="onDocSelected"
          />
        </label>
      </div>

      <textarea
        ref="textareaEl"
        v-model="text"
        class="textarea"
        placeholder="Type a message… (Enter to send)"
        rows="1"
        :disabled="disabled"
        @keydown="onKeydown"
        @input="autoResize"
      />

      <button
        class="btn-send"
        type="button"
        :disabled="disabled || !canSend"
        @click="submitText"
      >
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
          <line
            x1="22"
            y1="2"
            x2="11"
            y2="13"
          />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script
  setup
  lang="ts"
>
import { MessageAttachmentType } from '@webitel/chat-web-sdk';
import { computed, nextTick, ref } from 'vue';

import type { ChatSendParams } from '../composables/use-active-chat';

const props = defineProps<{
	disabled?: boolean;
	error?: string | null;
}>();

const emit = defineEmits<{
	send: [
		params: ChatSendParams,
	];
}>();

const text = ref('');
const textareaEl = ref<HTMLTextAreaElement | null>(null);

const canSend = computed(() => text.value.trim().length > 0);

function autoResize() {
	const el = textareaEl.value;
	if (!el) return;
	el.style.height = 'auto';
	el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
}

function onKeydown(e: KeyboardEvent) {
	if (e.key === 'Enter' && !e.shiftKey) {
		e.preventDefault();
		submitText();
	}
}

function submitText() {
	const body = text.value.trim();
	if (!body || props.disabled) return;
	emit('send', {
		body,
	});
	text.value = '';
	nextTick(() => {
		const el = textareaEl.value;
		if (el) el.style.height = 'auto';
	});
}

function onImageSelected(e: Event) {
	const input = e.target as HTMLInputElement;
	const files = input.files
		? [
				...input.files,
			]
		: [];
	input.value = '';
	if (!files.length) return;
	emit('send', {
		attachments: {
			type: MessageAttachmentType.Images,
			files,
		},
	});
}

function onDocSelected(e: Event) {
	const input = e.target as HTMLInputElement;
	const files = input.files
		? [
				...input.files,
			]
		: [];
	input.value = '';
	if (!files.length) return;
	emit('send', {
		attachments: {
			type: MessageAttachmentType.Documents,
			files,
		},
	});
}
</script>

<style scoped>
.input-area {
  border-top: 1px solid #e5e7eb;
  background: #fff;
  padding: 10px 16px 12px;
  flex-shrink: 0;
}

.send-error {
  font-size: 12px;
  color: #b91c1c;
  margin-bottom: 8px;
  padding: 6px 10px;
  background: #fff1f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.attach-btns {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  padding-bottom: 2px;
}

.attach-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.attach-btn:hover {
  color: #1f7aff;
  background: #eff6ff;
}

.attach-btn input[type='file'] {
  display: none;
}

.textarea {
  flex: 1;
  min-width: 0;
  resize: none;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #111827;
  outline: none;
  background: #f9fafb;
  transition: border-color 0.15s, background 0.15s;
  overflow-y: hidden;
}

.textarea:focus {
  border-color: #1f7aff;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(31, 122, 255, 0.1);
}

.textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-send {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: #1f7aff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, opacity 0.15s;
  padding-bottom: 2px;
}

.btn-send:hover:not(:disabled) {
  background: #1668e0;
}

.btn-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
