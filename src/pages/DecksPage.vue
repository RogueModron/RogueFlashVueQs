<template>
  <q-page class="row" :padding=true>
    <div class="col-12">
      <div class="row justify-center">
        <div class="col-12 col-md-4">
          <text-filter @filter="filterItems($event)"
            :disable="state.wait"
          ></text-filter>
        </div>
      </div>
      <div class="row justify-center q-mt-md">
        <div class="col-12 col-md-4">
          <paged-list
            @goToNext="loadNextItems()"
            @goToPrevious="loadPreviousItems()"
            :disable="state.wait"
            :disable-next="!state.moreToLoad"
            :disable-previous="state.lastOffset === 0"
            scroll-area-class="scroll-area-height"
          >
            <template v-if="model.items.length > 0">
              <template v-for="(item, index) in model.items" :key="item.deckId">
                <div class="row">
                  <div class="col-9 col-sm-10">
                    <div class="ellipsis">{{item.description}}</div>
                    <template v-if="item.notes">
                      <div class="gt-sm ellipsis-2-lines">{{item.notes}}</div>
                    </template>
                  </div>
                  <div class="col-3 col-sm-2 text-align-center">
                    <q-btn v-on:click="goToReview(item)"
                      aria-label="$t('dictionary.review')"
                      color="primary"
                      :disable="state.wait"
                      icon="thumb_up"
                      round
                    />
                  </div>
                  <div class="gt-sm col-12">
                    <q-btn v-on:click="openItem(item)"
                      class="list-button q-ml-md"
                      color="secondary"
                      :disable="state.wait"
                      icon="edit"
                      :label="$t('dictionary.open')"
                      size="sm"
                      unelevated
                    />
                    <q-btn v-on:click="confirmDeleteItem(item, index)"
                      class="list-button q-ml-md"
                      color="secondary"
                      :disable="state.wait"
                      icon="remove"
                      :label="$t('dictionary.delete')"
                      size="sm"
                      unelevated
                    />
                  </div>
                  <div class="col-12">
                    <q-separator class="q-my-sm" />
                  </div>
                </div>
              </template>
            </template>
            <template v-else>
              <p class="text-align-center">{{$t('descriptions.noItems')}}</p>
            </template>
          </paged-list>
        </div>
      </div>
    </div>
  </q-page>

  <toolbar-teleport v-if="state.active">
    <div>
      <q-btn v-on:click="openItem()"
        color="primary"
        :disable="state.wait"
        icon="add"
        :label="$t('dictionary.new')"
        unelevated
      />
    </div>
  </toolbar-teleport>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { onActivated, onDeactivated, onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import PagedList from 'src/components/PagedList.vue';
import TextFilter from 'src/components/TextFilterComponent.vue';
import ToolbarTeleport from 'src/components/ToolbarTeleportComponent.vue';
import { Db } from 'src/services/db/db';
import { Deck } from 'src/services/db/model/deck';
import { Ioc } from 'src/services/ioc';
import { PageUtils } from 'src/services/page-utils';

const model = reactive<{ items: Deck[] }>({ items: [] });

const state = reactive({
  active: false,
  wait: false,

  lastFilter: '',
  lastOffset: 0,
  moreToLoad: false,
});

const db = Ioc.inject<Db>(Ioc.IOC_DB);

const quasar = useQuasar();

const i18n = useI18n();

const router = useRouter();

function filterItems(text = ''): void {
  model.items = [];

  state.lastFilter = text;
  state.lastOffset = 0;
  state.moreToLoad = false;

  loadItems();
}

function loadNextItems(): void {
  state.lastOffset += PageUtils.ITEMS_TO_LOAD_AT_ONCE;

  loadItems();
}

function loadPreviousItems(): void {
  state.lastOffset -= PageUtils.ITEMS_TO_LOAD_AT_ONCE;

  loadItems();
}

function refreshItems(): void {
  loadItems();
}

function loadItems(): void {
  state.wait = true;

  db.searchDecks(
    state.lastFilter,
    state.lastOffset,
    PageUtils.ITEMS_TO_LOAD_AT_ONCE + 1,
  ).then((items) => {
    state.moreToLoad = (items.length > PageUtils.ITEMS_TO_LOAD_AT_ONCE);

    model.items = items;
    if (model.items.length > PageUtils.ITEMS_TO_LOAD_AT_ONCE) {
      model.items.pop();
    }
  }).finally(() => {
    state.wait = false;
  });
}

function goToReview(item: Deck | null = null): void {
  if (!item?.deckId) {
    return;
  }

  router.push({
    name: 'review',
    params: {
      deckId: item ? item.deckId : '',
    },
  });
}

function openItem(item: Deck | null = null): void {
  router.push({
    name: 'deck',
    params: {
      deckId: item ? item.deckId : '',
    },
  });
}

function confirmDeleteItem(item: Deck, index: number) {
  quasar.dialog({
    title: i18n.t('dictionary.delete'),
    message: i18n.t('dialogs.deleteDeck'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    state.wait = true;

    db.deleteDeck(item.deckId).then(() => {
      refreshItems();
    }).finally(() => {
      state.wait = false;
    });
  });
}

onMounted(() => {
  filterItems();
});

onActivated(() => {
  refreshItems();

  state.active = true;
});

onDeactivated(() => {
  state.active = false;
});
</script>
