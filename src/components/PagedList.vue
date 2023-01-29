<template>
  <div>
    <q-scroll-area :class="props.scrollAreaClass">
      <slot></slot>
    </q-scroll-area>
    <q-page-sticky position="bottom" :offset="[0, 7]">
      <q-btn v-on:click="throttledGoToPrevious()"
        aria-label="$t('dictionary.previous')"
        color="amber"
        text-color="black"
        :disable="props.disable || props.disablePrevious"
        icon="arrow_left"
        round
      />
      <span class="q-mx-xl"></span>
      <q-btn v-on:click="throttledGoToNext()"
        aria-label="$t('dictionary.next')"
        color="amber"
        text-color="black"
        :disable="props.disable || props.disableNext"
        icon="arrow_right"
        round
      />
    </q-page-sticky>
  </div>
</template>

<script setup lang="ts">
import { throttle } from 'quasar';

const props = defineProps({
  disable: Boolean,
  disableNext: Boolean,
  disablePrevious: Boolean,
  scrollAreaClass: String,
});

// eslint-disable-next-line
const emit = defineEmits<{
  (event: string): void
}>();

const throttledGoToNext = throttle(goToNext, 300);
const throttledGoToPrevious = throttle(goToPrevious, 300);

function goToNext(): void {
  emit('goToNext');
}

function goToPrevious(): void {
  emit('goToPrevious');
}
</script>
