<template>
  <teleport v-if="state.mounted"
    to=".toolbar-teleport-destination"
  >
    <slot></slot>
  </teleport>
</template>

<script setup="ts">
import { onMounted, reactive } from 'vue';

const state = reactive({
  mounted: false,
});

onMounted(() => {
  state.mounted = true;
});
</script>
