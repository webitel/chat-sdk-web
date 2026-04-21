<template>
  <aside class="sidebar">
    <div class="tabs">
      <button
        :class="['tab', { active: tab === 'threads' }]"
        type="button"
        @click="tab = 'threads'"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Threads
      </button>
      <button
        :class="['tab', { active: tab === 'contacts' }]"
        type="button"
        @click="tab = 'contacts'"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle
            cx="9"
            cy="7"
            r="4"
          />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Contacts
      </button>
    </div>

    <ThreadsPanel
      v-if="tab === 'threads'"
      :active-id="activeThreadId"
      @select="$emit('select-thread', $event)"
    />
    <ContactsPanel
      v-else
      :active-id="activeContactId"
      @select="$emit('select-contact', $event)"
    />
  </aside>
</template>

<script
  setup
  lang="ts"
>
import { computed, ref } from 'vue';
import type { IContact, IThread } from '@webitel/chat-web-sdk';
import type { ChatTarget } from '../composables/use-active-chat';
import ThreadsPanel from '../modules/threads/threads-panel.vue';
import ContactsPanel from '../modules/contacts/contacts-panel.vue';

const props = defineProps<{
	activeChat: ChatTarget | null;
}>();

defineEmits<{
	'select-thread': [
		thread: IThread,
	];
	'select-contact': [
		contact: IContact,
	];
}>();

const tab = ref<'threads' | 'contacts'>('threads');

const activeThreadId = computed(() =>
	props.activeChat?.kind === 'thread' ? props.activeChat.item.id : null,
);

const activeContactId = computed(() =>
	props.activeChat?.kind === 'contact'
		? (props.activeChat.item.sub ?? props.activeChat.item.username ?? null)
		: null,
);
</script>

<style scoped>
.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border: none;
  background: none;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s;
}

.tab:hover {
  color: #374151;
}

.tab.active {
  color: #1f7aff;
  border-bottom-color: #1f7aff;
}
</style>
