<template>
  <div class="panel">
    <div class="panel-header">
      <span class="count">{{ contacts.length ? `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}` : '' }}</span>
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

    <div class="search-bar">
      <svg
        class="search-icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle
          cx="11"
          cy="11"
          r="8"
        />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        v-model="searchQuery"
        class="search-input"
        type="search"
        placeholder="Search contacts…"
        :disabled="loading && contacts.length === 0"
      >
      <button
        v-if="searchQuery"
        class="btn-clear"
        type="button"
        aria-label="Clear search"
        @click="clearSearch"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
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
      v-else-if="loading && contacts.length === 0"
      class="state muted"
    >
      Loading…
    </div>
    <div
      v-else-if="contacts.length === 0"
      class="state muted"
    >
      {{ searchQuery.trim() ? 'No contacts match your search' : 'No contacts found' }}
    </div>

    <ul
      v-else
      class="list"
    >
      <li
        v-for="c in contacts"
        :key="c.sub || c.username || c.name"
        :class="['item', { active: activeId === (c.sub || c.username) }]"
        @click="$emit('select', c)"
      >
        <div class="item-main">
          <div class="avatar">{{ nameInitials(c.name || c.username || '') }}</div>
          <div class="item-body">
            <div class="item-name-row">
              <span class="item-name">{{ c.name || c.username || 'Unknown contact' }}</span>
              <span
                v-if="c.isBot"
                class="badge bot"
              >Bot</span>
              <span
                v-if="c.type"
                class="badge"
              >{{ c.type }}</span>
            </div>
            <span
              v-if="c.username"
              class="item-sub"
            >{{ c.username }}</span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script
  setup
  lang="ts"
>
import { onBeforeUnmount, ref, watch } from 'vue';
import { type IContact, createContactsService } from '@webitel/chat-web-sdk';
import { useSocket } from '../../composables/use-socket';

const props = defineProps<{
	activeId?: string | null;
}>();

defineEmits<{
	select: [
		contact: IContact,
	];
}>();

const { serviceConfig } = useSocket();

const contacts = ref<IContact[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');

let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

function nameInitials(name: string) {
	return name
		.split(/\s+/)
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase() ?? '')
		.join('');
}

async function refresh() {
	loading.value = true;
	error.value = null;
	try {
		const { fetchContacts } = createContactsService(serviceConfig.value);
		const q = searchQuery.value.trim();
		const res = await fetchContacts({
			size: 100,
			...(q
				? {
						q,
					}
				: {}),
		});
		contacts.value = res.items ?? [];
	} catch (err) {
		error.value = err instanceof Error ? err.message : String(err);
	} finally {
		loading.value = false;
	}
}

function clearSearch() {
	searchQuery.value = '';
}

watch(searchQuery, () => {
	clearTimeout(searchDebounceTimer);
	searchDebounceTimer = setTimeout(() => {
		refresh();
	}, 300);
});

onBeforeUnmount(() => {
	clearTimeout(searchDebounceTimer);
});

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

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.search-icon {
  color: #9ca3af;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 13px;
  color: #111827;
  outline: none;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

.btn-clear {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}

.btn-clear:hover {
  color: #6b7280;
  background: #f3f4f6;
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
  padding: 10px 14px;
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
  gap: 10px;
  min-width: 0;
  width: 100%;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.item-name-row {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.item-name {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-sub {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.badge.bot {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}
</style>
