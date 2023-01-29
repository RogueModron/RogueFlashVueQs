<template>
  <q-form class="q-ma-md"
    @submit.prevent.stop="throttledSave"
    ref="refForm"
  >
    <div class="row justify-center">
      <div class="col-12 col-md-4">
        <q-input v-model="model.sideA"
          class="q-mb-md"
          :label="$t('dictionary.side') + ' A'"
          lazy-rules="ondemand"
          :loading="state.wait"
          maxlength="512"
          outlined
          rows="4"
          :rules="[requiredFieldValidation]"
          type="textarea"
        />
      </div>
    </div>
    <div class="row justify-center">
      <div class="col-12 col-md-4">
        <q-input v-model="model.sideB"
          class="q-mb-md"
          :label="$t('dictionary.side') + ' B'"
          lazy-rules="ondemand"
          :loading="state.wait"
          maxlength="512"
          outlined
          rows="4"
          :rules="[requiredFieldValidation]"
          type="textarea"
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
  </q-form>

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
import { extend, QForm, throttle } from 'quasar';
import { onMounted, reactive, ref, toRaw, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouteParams, useRoute } from 'vue-router';
import ToolbarTeleport from 'src/components/ToolbarTeleportComponent.vue';
import { Db } from 'src/services/db/db';
import { Card } from 'src/services/db/model/card';
import { Ioc } from 'src/services/ioc';
import { PageUtils } from 'src/services/page-utils';

const model = reactive(emptyCard());

const state = reactive({
  wait: false,
});

const db = Ioc.inject<Db>(Ioc.IOC_DB);

const i18n = useI18n();

const route = useRoute();

const throttledSave = throttle(savePage, 300);

const refForm = ref<QForm | null>(null);

function emptyCard(): Card {
  return {
    cardId: '',

    deckId: '',

    sideA: '',
    sideB: '',

    notes: '',
    tags: '',
  };
}

async function initModel(cardId = '', deckId = ''): Promise<void> {
  if (!cardId) {
    model.deckId = deckId;
    return;
  }

  const card = await db.readCard(cardId, deckId);
  if (!card) {
    throw new Error(`Card [${cardId}] not found.`);
  }
  extend(true, model, card);
}

async function saveModel(): Promise<void> {
  if (model.cardId) {
    model.cardId = await db.updateCard(toRaw(model));
  } else {
    model.cardId = await db.createCard(toRaw(model));
  }
}

function initPage(cardId = '', deckId = ''): void {
  state.wait = true;
  initModel(cardId, deckId).then(() => {
    state.wait = false;
  });
}

function requiredFieldValidation(value = ''): boolean | string {
  return (value && value.length > 0) || i18n.t('validations.requiredField');
}

function validatePage(): boolean | Promise<boolean> {
  if (refForm.value) {
    return refForm.value.validate();
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
  const { deckId, cardId } = params;
  PageUtils.checkId(deckId);
  PageUtils.checkId(cardId);
  initPage(cardId, deckId);
}

onMounted(() => {
  initWithRouteParams(route.params);
});

watch(() => route.params, (newParams) => {
  initWithRouteParams(newParams);
});
</script>
