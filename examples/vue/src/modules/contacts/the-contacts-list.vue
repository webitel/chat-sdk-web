<template>
    <div class="contacts">
        <div class="header">
            <h2>Contacts</h2>
            <button
                type="button"
                class="btn"
                :disabled="loading"
                @click="refresh"
            >
                {{ loading ? 'Loading...' : 'Refresh' }}
            </button>
        </div>

        <div
            v-if="error"
            class="error"
        >{{ error }}</div>
        <div
            v-else-if="loading"
            class="empty"
        >Loading contacts...</div>
        <div
            v-else-if="contacts.length === 0"
            class="empty"
        >No contacts found.</div>

        <ul
            v-else
            class="list"
        >
            <li
                v-for="(c, idx) in contacts"
                :key="c.username || c.subject || c.issId || c.name || idx"
                class="item"
            >
                <div class="item-top">
                    <strong class="name">{{ c.name || 'Unnamed contact' }}</strong>
                    <span
                        v-if="c.isBot"
                        class="badge"
                    >Bot</span>
                    <span
                        v-if="c.type"
                        class="badge ghost"
                    >{{ c.type }}</span>
                </div>

                <div class="item-actions">
                    <button
                        type="button"
                        class="btn small"
                        @click="openChat(c)"
                    >
                        Open chat
                    </button>
                    <button
                        type="button"
                        class="btn small"
                        @click="sendMessage(c)"
                    >
                        Send message
                    </button>
                </div>

                <div class="row">
                    <span class="k">Username</span>
                    <span class="v">{{ c.username || '—' }}</span>
                </div>
                <div class="row">
                    <span class="k">Subject</span>
                    <span class="v">{{ c.subject || '—' }}</span>
                </div>
                <div class="row">
                    <span class="k">Issuer ID</span>
                    <span class="v">{{ c.issId || '—' }}</span>
                </div>
                <div class="row">
                    <span class="k">App ID</span>
                    <span class="v">{{ c.appId || '—' }}</span>
                </div>

                <div class="timestamps">
                    <div class="row">
                        <span class="k">Created</span>
                        <span class="v">{{ formatEpochMs(c.createdAt) }}</span>
                    </div>
                    <div class="row">
                        <span class="k">Updated</span>
                        <span class="v">{{ formatEpochMs(c.updatedAt) }}</span>
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
import { onMounted, ref } from 'vue';
import { useContactsService, type IContact } from '@webitel/chat-web-sdk';

import { serviceConfig } from '../../configs';

const contacts = ref<IContact[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const { fetchContacts } = useContactsService(serviceConfig);

async function refresh() {
    loading.value = true;
    error.value = null;
    try {
        const res = await fetchContacts();
        contacts.value = (res.items ?? []) as IContact[];
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
    refresh();
});
</script>

<style scoped>
.contacts {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.btn {
    padding: 9px 12px;
    border-radius: 10px;
    border: 1px solid #dedede;
    background: #f7f7f7;
    cursor: pointer;
    font-size: 14px;
}

.btn.small {
    padding: 7px 10px;
    font-size: 13px;
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

.item-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
    flex-wrap: wrap;
}

.badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: #dcfce7;
    border: 1px solid #bbf7d0;
    color: #166534;
    font-size: 12px;
}

.badge.ghost {
    background: #eff6ff;
    border-color: #dbeafe;
    color: #1d4ed8;
}

.timestamps {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 14px;
    margin-top: 12px;
    color: #374151;
    font-size: 13px;
}

.k {
    color: #6b7280;
    font-size: 12px;
    width: 90px;
}

.v {
    font-size: 13px;
}

.row {
    display: flex;
    gap: 8px;
    align-items: baseline;
}
</style>