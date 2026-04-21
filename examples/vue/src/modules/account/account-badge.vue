<template>
  <div
    v-if="account"
    class="badge"
    :title="displayName"
  >
    <div class="avatar">{{ initials }}</div>
    <span class="name">{{ displayName }}</span>
  </div>
</template>

<script
  setup
  lang="ts"
>
import { type AccountModel, useAccountService } from '@webitel/chat-web-sdk';
import { computed, onMounted, ref } from 'vue';

import { useSocket } from '../../composables/use-socket';

const { serviceConfig } = useSocket();
const account = ref<AccountModel | null>(null);

const displayName = computed(
	() =>
		account.value?.contact?.name ||
		account.value?.contact?.username ||
		account.value?.name ||
		'Account',
);

const initials = computed(() => {
	return displayName.value
		.split(/\s+/)
		.slice(0, 2)
		.map((w: string) => w[0]?.toUpperCase() ?? '')
		.join('');
});

onMounted(async () => {
	try {
		const { getAccount } = useAccountService(serviceConfig.value);
		account.value = await getAccount();
	} catch {}
});
</script>

<style scoped>
.badge {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}
</style>
