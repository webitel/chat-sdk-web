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
            v-if="loading"
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
                    <label class="file-upload">
                        <span>Send document(s) + caption</span>
                        <input
                            type="file"
                            multiple
                            @change="onFileSelected($event, c, 'documents')"
                        >
                    </label>
                    <label class="file-upload">
                        <span>Send image(s) + caption</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            @change="onFileSelected($event, c, 'images')"
                        >
                    </label>
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
import {
	type IContact,
	MessageAttachmentType,
	useContactsService,
} from '@webitel/chat-web-sdk';
import { onMounted, ref } from 'vue';

import { serviceConfig } from '../../configs';

const contacts = ref<IContact[]>([]);
const loading = ref(false);

const { fetchContacts } = useContactsService(serviceConfig);

async function refresh() {
	loading.value = true;
	try {
		const res = await fetchContacts();
		contacts.value = res.items ?? [];
	} finally {
		loading.value = false;
	}
}

function openChat(_contact: IContact) {}

function promptCaption(kind: MessageAttachmentType, count: number) {
	return (
		window.prompt(`Caption for ${count} ${kind} (optional)`, '')?.trim() ||
		undefined
	);
}

async function sendMessage(contact: IContact) {
	const body = window
		.prompt('Message text', 'Hello from contacts demo')
		?.trim();
	if (!body) return;
	await contact.sendMessage({
		body,
	});
}

async function onFileSelected(
	e: Event,
	contact: IContact,
	kind: MessageAttachmentType,
) {
	const input = e.target as HTMLInputElement;
	const files = input.files
		? [
				...input.files,
			]
		: [];
	input.value = '';
	if (!files.length) return;
	await contact.sendMessage({
		attachments: {
			type: kind,
			files,
		},
		body: promptCaption(kind, files.length),
	});
}

function formatEpochMs(value?: string) {
	return value ? new Date(+value).toLocaleString() : '—';
}

onMounted(refresh);
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

.file-upload {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    font-size: 13px;
    color: #374151;
}

.file-upload input[type="file"] {
    max-width: 180px;
    font-size: 12px;
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