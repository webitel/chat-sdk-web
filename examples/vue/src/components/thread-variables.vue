<template>
  <div class="vars">
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
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
      <span>Variables{{ varCount ? ` (${varCount})` : '' }}</span>
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
      <div
        v-if="fetchError"
        class="state error"
      >
        {{ fetchError }}
      </div>
      <div
        v-else-if="fetching"
        class="state muted"
      >
        Loading…
      </div>

      <template v-else>
        <ul
          v-if="varEntries.length"
          class="list"
        >
          <li
            v-for="[key, entry] in varEntries"
            :key="key"
            class="var-row"
          >
            <div class="var-info">
              <span class="var-key">{{ key }}</span>
              <span class="var-value">{{ formatValue(entry.value) }}</span>
            </div>
            <button
              class="btn-remove"
              type="button"
              :disabled="flushing === key"
              :title="`Remove ${key}`"
              @click="handleFlush(key)"
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
          No variables
        </p>
      </template>

      <div class="add-form">
        <div class="form-row">
          <input
            v-model="form.key"
            class="form-input key-input"
            placeholder="Key"
            @keyup.enter="handleSet"
          />
          <input
            v-model="form.value"
            class="form-input value-input"
            placeholder="Value (JSON or text)"
            @keyup.enter="handleSet"
          />
          <button
            class="btn-set"
            type="button"
            :disabled="!form.key.trim() || setting"
            @click="handleSet"
          >
            {{ setting ? '…' : 'Set' }}
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
import type { IThread, ThreadVariablesModel } from '@webitel/chat-web-sdk';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
	thread: IThread;
}>();

const expanded = ref(false);
const fetching = ref(false);
const fetchError = ref<string | null>(null);
const setting = ref(false);
const flushing = ref<string | null>(null);
const opError = ref<string | null>(null);

const localVars = ref<ThreadVariablesModel['variables']>({});

const form = ref({
	key: '',
	value: '',
});

const varEntries = computed(() => Object.entries(localVars.value ?? {}));

const varCount = computed(() => varEntries.value.length);

function formatValue(value: Record<string, unknown> | undefined) {
	if (value === undefined || value === null) return '—';
	const str = JSON.stringify(value);
	return str.length > 60 ? `${str.slice(0, 60)}…` : str;
}

function parseValue(raw: string): Record<string, unknown> {
	const trimmed = raw.trim();
	if (!trimmed) return {};
	try {
		const parsed = JSON.parse(trimmed);
		if (
			parsed !== null &&
			typeof parsed === 'object' &&
			!Array.isArray(parsed)
		) {
			return parsed as Record<string, unknown>;
		}
	} catch {
		// not valid JSON object — wrap as plain string value
	}
	return {
		value: raw,
	};
}

async function fetchVars() {
	fetching.value = true;
	fetchError.value = null;
	try {
		const res = await props.thread.locateVariables();
		localVars.value = res.variables ?? {};
	} catch (err) {
		fetchError.value = err instanceof Error ? err.message : String(err);
	} finally {
		fetching.value = false;
	}
}

async function handleSet() {
	const key = form.value.key.trim();
	if (!key || setting.value) return;
	opError.value = null;
	setting.value = true;
	try {
		const res = await props.thread.setVariables({
			variables: [
				{
					key,
					value: parseValue(form.value.value),
				},
			],
		});
		localVars.value = res.variables ?? {};
		form.value = {
			key: '',
			value: '',
		};
	} catch (err) {
		opError.value = err instanceof Error ? err.message : String(err);
	} finally {
		setting.value = false;
	}
}

async function handleFlush(key: string) {
	if (flushing.value) return;
	opError.value = null;
	flushing.value = key;
	try {
		const res = await props.thread.flushVariables({
			keys: [
				key,
			],
		});
		localVars.value = res.variables ?? {};
	} catch (err) {
		opError.value = err instanceof Error ? err.message : String(err);
	} finally {
		flushing.value = null;
	}
}

watch(expanded, (open) => {
	if (open && !Object.keys(localVars.value ?? {}).length && !fetching.value) {
		fetchVars();
	}
});

watch(
	() => props.thread.id,
	() => {
		localVars.value = {};
		fetchError.value = null;
		opError.value = null;
		if (expanded.value) fetchVars();
	},
);
</script>

<style scoped>
.vars {
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
  cursor: pointer;
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

.state {
  font-size: 12px;
  padding: 6px 0 10px;
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
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.var-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 6px;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
}

.var-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.var-key {
  font-size: 11px;
  font-weight: 600;
  color: #1d4ed8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.var-value {
  font-size: 11px;
  color: #374151;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-remove {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid transparent;
  background: none;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
  cursor: pointer;
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
  padding: 6px 0 10px;
}

.add-form {
  border-top: 1px solid #f3f4f6;
  padding-top: 10px;
}

.form-row {
  display: flex;
  gap: 6px;
}

.form-input {
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

.key-input {
  width: 100px;
  flex-shrink: 0;
}

.value-input {
  flex: 1;
  min-width: 0;
}

.btn-set {
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  background: #1f7aff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.15s, opacity 0.15s;
  cursor: pointer;
}

.btn-set:hover:not(:disabled) {
  background: #1668e0;
}

.btn-set:disabled {
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
