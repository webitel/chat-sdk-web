<template>
	<div class="wt-chat-message" :class="{ 'wt-chat-message--outgoing': outgoing }">
		<div class="wt-chat-message__bubble">
			<div class="wt-chat-message__meta">
				<span v-if="sender">{{ sender }}</span>
				<span v-if="time">{{ time }}</span>
			</div>
			<p class="wt-chat-message__text">
				<slot>{{ text }}</slot>
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		text?: string;
		sender?: string;
		time?: string;
		outgoing?: boolean;
	}>(),
	{
		text: '',
		sender: '',
		time: '',
		outgoing: false,
	},
);
</script>

<style scoped>
:host {
	display: block;
	font-family: Inter, system-ui, -apple-system, sans-serif;
}

.wt-chat-message {
	display: flex;
	margin: 8px 0;
}

.wt-chat-message--outgoing {
	justify-content: flex-end;
}

.wt-chat-message__bubble {
	max-width: min(420px, 80%);
	padding: 10px 12px;
	border-radius: 12px;
	background: #f4f6fb;
	color: #1f2937;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.wt-chat-message--outgoing .wt-chat-message__bubble {
	background: #3f51b5;
	color: #fff;
}

.wt-chat-message__meta {
	display: flex;
	gap: 8px;
	margin-bottom: 4px;
	font-size: 12px;
	opacity: 0.8;
}

.wt-chat-message__text {
	margin: 0;
	font-size: 14px;
	line-height: 1.4;
	white-space: pre-wrap;
	word-break: break-word;
}
</style>
