<template>
  <div>
    <q-input v-model="text"
      autofocus
      :label="$t('descriptions.textFilter')"
      :loading="props.disable"
      maxlength="64"
      outlined
      @keydown.enter="throttledFilter()"
    >
      <template v-slot:append>
        <q-btn v-on:click="throttledFilter()"
          aria-label="$t('dictionary.filter')"
          :disable="props.disable"
          flat
          icon="search"
          round
        />
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { throttle } from 'quasar';
import { ref } from 'vue';

const text = ref('');

const props = defineProps({
  disable: Boolean,
});

// eslint-disable-next-line
const emit = defineEmits<{
  (event: string, text: string): void
}>();

const throttledFilter = throttle(filter, 300);

function filter(): void {
  emit('filter', text.value);
}
</script>
