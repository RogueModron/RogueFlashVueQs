<template>
  <div class="q-ma-md">
    <div class="row justify-center">
      <div class="col-12 col-md-4">
        <q-input v-model="model.description"
          class="q-mb-md"
          autofocus
          :label="$t('dictionary.description')"
          lazy-rules="ondemand"
          :loading="state.wait"
          maxlength="128"
          outlined
          ref="refDescription"
          :rules="[requiredFieldValidation]"
        />
      </div>
    </div>
    <div class="row justify-center">
      <div class="col-12 col-md-4">
        <q-input v-model="model.notes"
          class="q-mb-md"
          :label="$t('dictionary.notes')"
          :loading="state.wait"
          maxlength="512"
          outlined
          rows="4"
          type="textarea"
        />
      </div>
    </div>
    <div class="row justify-center">
      <div class="col-12 col-md-4">
        <q-input v-model="model.tags"
          :label="$t('dictionary.tags')"
          :loading="state.wait"
          maxlength="128"
          outlined
        />
      </div>
    </div>
  </div>

  <toolbar-teleport>
    <div>
      <q-btn v-on:click="throttledSave()"
        color="primary"
        :disable="state.wait"
        icon="done_outline"
        :label="$t('dictionary.save')"
        unelevated
      />
    </div>
  </toolbar-teleport>
</template>

<script setup lang="ts">
import { extend, QInput, throttle } from 'quasar';
import { onMounted, reactive, ref, toRaw, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouteParams, useRoute } from 'vue-router';
import ToolbarTeleport from 'src/components/ToolbarTeleportComponent.vue';
import { Db } from 'src/services/db/db';
import { Deck } from 'src/services/db/model/deck';
import { Ioc } from 'src/services/ioc';
import { PageUtils } from 'src/services/page-utils';

const model = reactive(emptyDeck());

const state = reactive({
  wait: false,
});

const db = Ioc.inject<Db>(Ioc.IOC_DB);

const i18n = useI18n();

const route = useRoute();

const throttledSave = throttle(savePage, 300);

const refDescription = ref<QInput | null>(null);

function emptyDeck(): Deck {
  return {
    deckId: '',

    description: '',
    notes: '',
    tags: '',
  };
}

async function initModel(deckId = ''): Promise<void> {
  if (!deckId) {
    return;
  }

  const deck = await db.readDeck(deckId);
  if (!deck) {
    throw new Error(`Deck [${deckId}] not found.`);
  }
  extend(true, model, deck);
}

async function saveModel(): Promise<void> {
  if (model.deckId) {
    model.deckId = await db.updateDeck(toRaw(model));
  } else {
    model.deckId = await db.createDeck(toRaw(model));
  }
}

function initPage(deckId = ''): void {
  state.wait = true;
  initModel(deckId).then(() => {
    state.wait = false;
  });
}

function requiredFieldValidation(value = ''): boolean | string {
  return (value && value.length > 0) || i18n.t('validations.requiredField');
}

function validatePage(): boolean | Promise<boolean> {
  if (refDescription.value) {
    return refDescription.value.validate();
  }

  return true;
}

async function savePage(): Promise<void> {
  const validationResult = await validatePage();
  if (!validationResult) {
    return;
  }

  state.wait = true;
  saveModel().finally(() => {
    state.wait = false;
  });
}

function initWithRouteParams(params: RouteParams): void {
  const { deckId } = params;
  PageUtils.checkId(deckId);
  initPage(deckId);
}

onMounted(() => {
  initWithRouteParams(route.params);
});

watch(() => route.params, (newParams) => {
  initWithRouteParams(newParams);
});
</script>
