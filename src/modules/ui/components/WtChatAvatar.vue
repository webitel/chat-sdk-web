<template>
	<div class="wt-chat-avatar" :style="avatarStyle">
		<img
			v-if="src"
			class="wt-chat-avatar__image"
			:src="src"
			:alt="name || 'Avatar'"
		/>
		<span v-else>{{ initials }}</span>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface WtChatAvatarProps {
	name?: string;
	src?: string;
	size?: number | string;
}

const props = withDefaults(defineProps<WtChatAvatarProps>(), {
	name: '',
	src: '',
	size: 40,
});

const initials = computed(
	() =>
		props.name
			.trim()
			.split(/\s+/)
			.map((chunk) => chunk[0] ?? '')
			.slice(0, 2)
			.join('')
			.toUpperCase() || '?',
);

const avatarStyle = computed(() => {
	const sizeValue = Number(props.size) || 40;
	return {
		width: `${sizeValue}px`,
		height: `${sizeValue}px`,
		fontSize: `${Math.max(12, Math.floor(sizeValue * 0.36))}px`,
	};
});
</script>

<style scoped>
:host {
	display: inline-block;
}

.wt-chat-avatar {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	overflow: hidden;
	font-family: Inter, system-ui, -apple-system, sans-serif;
	background: #e8ecf9;
	color: #3f51b5;
	font-weight: 600;
	user-select: none;
}

.wt-chat-avatar__image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
</style>
