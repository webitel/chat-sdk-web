<template>
  <div
    v-if="events.length"
    class="dock"
  >
    <button
      class="header"
      type="button"
      @click="collapsed = !collapsed"
    >
      <span class="title">My membership events</span>
      <span class="count">{{ events.length }}</span>
      <svg
        class="chevron"
        :class="{ open: !collapsed }"
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
      <button
        class="clear"
        type="button"
        title="Clear"
        @click.stop="clear"
      >×</button>
    </button>
    <ul
      v-if="!collapsed"
      class="list"
    >
      <li
        v-for="evt in events"
        :key="evt.id"
        class="event"
        :class="evt.kind"
      >
        <span class="badge">{{ evt.kind === 'added' ? '+ added to thread' : '− left thread' }}</span>
        <div class="body">
          <span class="line">
            <span class="lbl">thread</span>
            <span class="val">{{ evt.threadId }}</span>
          </span>
          <span class="line">
            <span class="lbl">member</span>
            <span class="val">{{ evt.memberId }}</span>
          </span>
          <span
            v-if="evt.role !== undefined"
            class="line"
          >
            <span class="lbl">role</span>
            <span class="val">{{ evt.role }}</span>
          </span>
          <span class="ts">{{ formatTime(evt.at) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script
  setup
  lang="ts"
>
import { onBeforeUnmount, ref } from 'vue';
import { useSocket } from '../composables/use-socket';

type EventEntry = {
	id: string;
	kind: 'added' | 'left';
	threadId: string;
	memberId: string;
	role?: number;
	at: number;
};

const { onMemberAdded, onMemberLeft } = useSocket();

const events = ref<EventEntry[]>([]);
const collapsed = ref(false);
let seq = 0;

const stopAdded = onMemberAdded((payload) => {
	seq += 1;
	const entry: EventEntry = {
		id: `a-${seq}`,
		kind: 'added',
		threadId: payload.threadId,
		memberId: payload.metadata.newMemberId,
		role: payload.metadata.newMemberRole,
		at: Date.now(),
	};
	events.value = [
		entry,
		...events.value,
	].slice(0, 20);
});

const stopLeft = onMemberLeft((payload) => {
	seq += 1;
	const entry: EventEntry = {
		id: `l-${seq}`,
		kind: 'left',
		threadId: payload.threadId,
		memberId: payload.metadata.removedMemberId,
		at: Date.now(),
	};
	events.value = [
		entry,
		...events.value,
	].slice(0, 20);
});

function clear() {
	events.value = [];
}

function formatTime(ts: number) {
	return new Date(ts).toLocaleTimeString();
}

onBeforeUnmount(() => {
	stopAdded();
	stopLeft();
});
</script>

<style scoped>
.dock {
  position: fixed;
  right: 16px;
  bottom: 16px;
  width: 320px;
  max-width: calc(100vw - 32px);
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 24px -8px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  z-index: 50;
  font-size: 12px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: #f9fafb;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  text-align: left;
}

.title {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  flex: 1;
}

.count {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 999px;
  background: #1f7aff;
  color: #fff;
}

.chevron {
  color: #6b7280;
  transition: transform 0.2s;
}

.chevron.open {
  transform: rotate(180deg);
}

.clear {
  background: none;
  border: none;
  font-size: 16px;
  line-height: 1;
  color: #9ca3af;
  cursor: pointer;
  padding: 0 4px;
}

.clear:hover {
  color: #b91c1c;
}

.list {
  list-style: none;
  margin: 0;
  padding: 8px;
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.event {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
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
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
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

.body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.line {
  display: flex;
  gap: 6px;
  font-size: 11px;
}

.lbl {
  color: #9ca3af;
  flex-shrink: 0;
  min-width: 48px;
}

.val {
  color: #111827;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  word-break: break-all;
}

.ts {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 2px;
}
</style>
