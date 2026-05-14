<template>
  <div class="member-events">
    <button
      class="toggle"
      type="button"
      @click="expanded = !expanded"
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
        <path d="M22 2 11 13" />
        <path d="m22 2-7 20-4-9-9-4 20-7z" />
      </svg>
      <span>Member events ({{ events.length }})</span>
      <svg
        class="chevron"
        :class="{ open: expanded }"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <div
      v-if="expanded"
      class="panel"
    >
      <p
        v-if="!events.length"
        class="empty"
      >
        No member events yet for this thread.
      </p>
      <ul
        v-else
        class="list"
      >
        <li
          v-for="evt in events"
          :key="evt.id"
          class="event"
          :class="evt.kind"
        >
          <span class="badge">{{ evt.kind === 'added' ? '+ added' : '− left' }}</span>
          <div class="event-body">
            <span class="member-id">member: {{ evt.memberId }}</span>
            <span class="contact-id">contact: {{ evt.contactId }}</span>
            <span
              v-if="evt.role !== undefined"
              class="role"
            >role: {{ evt.role }}</span>
            <span class="ts">{{ formatTime(evt.at) }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script
  setup
  lang="ts"
>
import type { IThread } from '@webitel/chat-web-sdk';
import { onBeforeUnmount, ref, watch } from 'vue';
import { useSocket } from '../composables/use-socket';

type EventEntry = {
	id: string;
	kind: 'added' | 'left';
	memberId: string;
	contactId: string;
	role?: number;
	at: number;
};

const props = defineProps<{
	thread: IThread;
}>();

const { onMemberAdded, onMemberLeft } = useSocket();

const expanded = ref(false);
const events = ref<EventEntry[]>([]);

let stopAdded: (() => void) | null = null;
let stopLeft: (() => void) | null = null;
let seq = 0;

function subscribe(threadId: string | undefined) {
	stopAdded?.();
	stopLeft?.();
	events.value = [];
	if (!threadId) return;

	stopAdded = onMemberAdded((payload) => {
		if (payload.threadId !== threadId) return;
		seq += 1;
		events.value = [
			{
				id: `a-${seq}-${payload.metadata.newMemberId}`,
				kind: 'added',
				memberId: payload.metadata.newMemberId,
				contactId: payload.metadata.newMemberContactId,
				role: payload.metadata.newMemberRole,
				at: Date.now(),
			},
			...events.value,
		];
	});

	stopLeft = onMemberLeft((payload) => {
		if (payload.threadId !== threadId) return;
		seq += 1;
		events.value = [
			{
				id: `l-${seq}-${payload.metadata.removedMemberId}`,
				kind: 'left',
				memberId: payload.metadata.removedMemberId,
				contactId: payload.metadata.removedMemberContactId,
				at: Date.now(),
			},
			...events.value,
		];
	});
}

watch(
	() => props.thread.id,
	(id) => subscribe(id),
	{
		immediate: true,
	},
);

onBeforeUnmount(() => {
	stopAdded?.();
	stopLeft?.();
});

function formatTime(ts: number) {
	const d = new Date(ts);
	return d.toLocaleTimeString();
}
</script>

<style scoped>
.member-events {
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: #f9fafb;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-align: left;
  transition: background 0.1s, color 0.1s;
}

.toggle:hover {
  background: #f3f4f6;
  color: #374151;
}

.chevron {
  margin-left: auto;
  transition: transform 0.2s;
}

.chevron.open {
  transform: rotate(180deg);
}

.panel {
  background: #fff;
  border-top: 1px solid #f3f4f6;
  padding: 10px 20px 14px;
  max-height: 240px;
  overflow-y: auto;
}

.empty {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  padding: 6px 0;
}

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.event {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
}

.event.added {
  background: #f0fdf4;
  border-color: #dcfce7;
}

.event.left {
  background: #fff1f2;
  border-color: #fecaca;
}

.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #374151;
  white-space: nowrap;
  flex-shrink: 0;
}

.event.added .badge {
  color: #15803d;
  border-color: #bbf7d0;
}

.event.left .badge {
  color: #b91c1c;
  border-color: #fecaca;
}

.event-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #374151;
  min-width: 0;
  word-break: break-all;
}

.member-id,
.contact-id,
.role {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.ts {
  font-size: 11px;
  color: #9ca3af;
}
</style>
