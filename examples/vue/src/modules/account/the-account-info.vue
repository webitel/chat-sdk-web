<template>
  <div class="account">
    <div class="row">
      <h2>Account</h2>
      <button
        type="button"
        :disabled="loading"
        @click="load"
      >
        {{ loading ? '…' : 'Load' }}
      </button>
    </div>

    <p
      v-if="error"
      class="err"
    >
      {{ error }}
    </p>
    <pre
      v-else-if="account"
      class="out"
    >{{ json }}</pre>
  </div>
</template>

<script
  setup
  lang="ts"
>
import { computed, ref } from 'vue';
import { type AccountModel, useAccountService } from '@webitel/chat-web-sdk';

import { serviceConfig } from '../../configs';

const account = ref<AccountModel | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const { getAccount } = useAccountService(serviceConfig);

const json = computed(() =>
  account.value ? JSON.stringify(account.value, null, 2) : '',
);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    account.value = await getAccount();
  } catch (err) {
    account.value = null;
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.account {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

h2 {
  margin: 0;
  font-size: 18px;
}

button {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
}

.err {
  margin: 0;
  color: #b91c1c;
  font-size: 14px;
}

.out {
  margin: 0;
  padding: 10px;
  background: #0b1020;
  color: #e5e7eb;
  border-radius: 8px;
  font-size: 12px;
  overflow: auto;
  max-height: 36vh;
}
</style>
