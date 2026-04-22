<template>
  <div class="members">
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
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle
          cx="9"
          cy="7"
          r="4"
        />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      <span>{{ localMembers.length }} member{{ localMembers.length !== 1 ? 's' : '' }}</span>
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
      <ul
        v-if="localMembers.length"
        class="list"
      >
        <li
          v-for="m in localMembers"
          :key="memberKey(m)"
          class="member"
        >
          <div class="avatar">{{ memberInitials(m) }}</div>
          <div class="info">
            <span class="name">{{ memberDisplayName(m) }}</span>
            <span
              v-if="m.role"
              class="role"
            >{{ formatRole(String(m.role)) }}</span>
          </div>
          <button
            class="btn-remove"
            type="button"
            :disabled="removing === memberKey(m)"
            :title="`Remove ${memberDisplayName(m)}`"
            @click="handleRemove(m)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            >
              <line
                x1="18"
                y1="6"
                x2="6"
                y2="18"
              />
              <line
                x1="6"
                y1="6"
                x2="18"
                y2="18"
              />
            </svg>
          </button>
        </li>
      </ul>
      <p
        v-else
        class="empty"
      >
        No members yet
      </p>

      <div class="add-form">
        <div class="form-row">
          <select
            v-model="form.contactSub"
            class="form-select contact-select"
          >
            <option value="">{{ contactsLoading ? 'Loading contacts…' : 'Select contact' }}</option>
            <option
              v-for="c in contacts"
              :key="c.sub || c.username"
              :value="c.sub"
            >{{ c.name || c.username || c.sub }}</option>
          </select>
          <select
            v-model="form.role"
            class="form-select"
          >
            <option value="">Role (optional)</option>
            <option :value="ThreadMemberRole.RoleMember">Member</option>
            <option :value="ThreadMemberRole.RoleAdmin">Admin</option>
            <option :value="ThreadMemberRole.RoleOwner">Owner</option>
            <option :value="ThreadMemberRole.RoleSupervisor">Supervisor</option>
          </select>
          <button
            class="btn-add"
            type="button"
            :disabled="!form.contactSub || adding"
            @click="handleAdd"
          >
            {{ adding ? '…' : 'Add' }}
          </button>
        </div>
        <p
          v-if="opError"
          class="op-error"
        >
          {{ opError }}
        </p>
      </div>
    </div>
  </div>
</template>

<script
  setup
  lang="ts"
>
import {
	type IContact,
	type IThread,
	type ThreadMemberModel,
	ThreadMemberRole,
	useContactsService,
} from '@webitel/chat-web-sdk';
import { ref, watch } from 'vue';
import { useSocket } from '../composables/use-socket';

const props = defineProps<{
	thread: IThread;
}>();

const { serviceConfig } = useSocket();

const expanded = ref(false);
const localMembers = ref<ThreadMemberModel[]>([
	...(props.thread.members ?? []),
]);
const adding = ref(false);
const removing = ref<string | null>(null);
const opError = ref<string | null>(null);
const form = ref({
	contactSub: '',
	role: '',
});

const contacts = ref<IContact[]>([]);
const contactsLoading = ref(false);
const contactsLoaded = ref(false);

async function loadContacts() {
	if (contactsLoaded.value || contactsLoading.value) return;
	contactsLoading.value = true;
	try {
		const { fetchContacts } = useContactsService(serviceConfig.value);
		const res = await fetchContacts();
		contacts.value = res.items ?? [];
		contactsLoaded.value = true;
	} catch {
		// non-critical
	} finally {
		contactsLoading.value = false;
	}
}

watch(expanded, (open) => {
	if (open) loadContacts();
});

watch(
	() => props.thread,
	(t) => {
		localMembers.value = [
			...(t.members ?? []),
		];
	},
);

function memberKey(m: ThreadMemberModel) {
	return m.id ?? m.contact?.sub ?? '';
}

function memberDisplayName(m: ThreadMemberModel) {
	return (
		m.contact?.name || m.contact?.username || m.contact?.sub || 'Unknown member'
	);
}

function memberInitials(m: ThreadMemberModel) {
	return memberDisplayName(m)
		.split(/\s+/)
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase() ?? '')
		.join('');
}

function formatRole(role: string) {
	return role
		.replace(/^ROLE_/, '')
		.toLowerCase()
		.replace(/^\w/, (c) => c.toUpperCase());
}

async function handleAdd() {
	const sub = form.value.contactSub;
	if (!sub || adding.value) return;
	const contact = contacts.value.find((c) => c.sub === sub) ?? {
		sub,
	};
	opError.value = null;
	adding.value = true;
	try {
		const res = await props.thread.addMember({
			contact,
			role:
				(form.value.role as ThreadMemberRole) ||
				ThreadMemberRole.RoleUnspecified,
		});
		if (res.member) {
			localMembers.value = [
				...localMembers.value,
				res.member,
			];
		}
		form.value = {
			contactSub: '',
			role: '',
		};
	} catch (err) {
		opError.value = err instanceof Error ? err.message : String(err);
	} finally {
		adding.value = false;
	}
}

async function handleRemove(member: ThreadMemberModel) {
	const key = memberKey(member);
	if (!key || removing.value) return;
	opError.value = null;
	removing.value = key;
	try {
		await props.thread.removeMember({
			id: member.id,
		});
		localMembers.value = localMembers.value.filter((m) => memberKey(m) !== key);
	} catch (err) {
		opError.value = err instanceof Error ? err.message : String(err);
	} finally {
		removing.value = null;
	}
}
</script>

<style scoped>
.members {
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
  max-height: 260px;
  overflow-y: auto;
}

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.member {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 999px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  color: #1d4ed8;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-remove {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: none;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}

.btn-remove:hover:not(:disabled) {
  color: #b91c1c;
  background: #fff1f2;
  border-color: #fecaca;
}

.btn-remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.empty {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  padding: 8px 0 12px;
}

.add-form {
  border-top: 1px solid #f3f4f6;
  padding-top: 10px;
}

.form-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.form-input {
  flex: 1;
  min-width: 100px;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 12px;
  color: #111827;
  outline: none;
  background: #f9fafb;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: #1f7aff;
  background: #fff;
}

.form-select {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 12px;
  color: #111827;
  background: #f9fafb;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
}

.form-select:focus {
  border-color: #1f7aff;
}

.contact-select {
  flex: 1;
  min-width: 0;
}

.btn-add {
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  background: #1f7aff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.15s, opacity 0.15s;
}

.btn-add:hover:not(:disabled) {
  background: #1668e0;
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.op-error {
  font-size: 12px;
  color: #b91c1c;
  margin-top: 6px;
  padding: 5px 8px;
  background: #fff1f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}
</style>
