<template>
  <q-layout view="hHh lpr fFf">

    <q-header class="bg-primary text-white">
      <template v-if="isElectron">
        <q-bar class="q-electron-drag">
          <q-icon name="map" class="q-electron-drag--exception" />
            <div>RogueFlash</div>

            <q-space />

            <q-btn dense flat icon="minimize" @click="minimize" />
            <q-btn dense flat icon="crop_square" @click="toggleMaximize" />
            <q-btn dense flat icon="close" @click="closeApp" />
        </q-bar>
      </template>

      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="gt-xs">
          RogueFlash
        </q-toolbar-title>

        <toolbar-teleport-destination></toolbar-teleport-destination>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen"
      bordered
      overlay
      persistent
      side="left"
      show-if-above
      :width="150"
    >
      <navigator-component></navigator-component>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive :include="['DecksPage', 'CardsPage']">
          <component :is="Component"></component>
        </keep-alive>
      </router-view>
    </q-page-container>

  </q-layout>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import NavigatorComponent from 'src/components/NavigatorComponent.vue';
import ToolbarTeleportDestination from 'src/components/ToolbarTeleportDestinationComponent.vue';

export default defineComponent({
  components: {
    NavigatorComponent,
    ToolbarTeleportDestination,
  },

  setup() {
    const isElectron = process.env.MODE === 'electron';

    const leftDrawerOpen = ref(false);

    function minimize() {
      if (isElectron) {
        (window as any).RogueFlashWindowApi.minimize();
      }
    }

    function toggleMaximize() {
      if (isElectron) {
        (window as any).RogueFlashWindowApi.toggleMaximize();
      }
    }

    function closeApp() {
      if (isElectron) {
        (window as any).RogueFlashWindowApi.close();
      }
    }

    return {
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },

      isElectron,

      minimize,
      toggleMaximize,
      closeApp,
    };
  },
});
</script>
