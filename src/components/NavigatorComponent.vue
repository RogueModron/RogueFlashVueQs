<template>
  <q-list>
    <q-item :to="{ name: 'decks' }">
      <q-item-section>
        {{$t('dictionary.decks')}}
      </q-item-section>
    </q-item>
    <template v-if="state.deckId">
      <q-item :to="{ name: 'deck', params: { deckId: state.deckId } }">
        <q-item-section>
          {{$t('dictionary.deck')}}
        </q-item-section>
      </q-item>
      <q-item :to="{ name: 'cards', params: { deckId: state.deckId } }">
        <q-item-section>
          {{$t('dictionary.cards')}}
        </q-item-section>
      </q-item>
      <template v-if="state.cardPage">
        <q-item :to="{ name: 'card', params: { deckId: state.deckId, cardId: state.cardId } }">
          <q-item-section>
            {{$t('dictionary.card')}}
          </q-item-section>
        </q-item>
      </template>
      <q-item :to="{ name: 'review', params: { deckId: state.deckId } }">
        <q-item-section>
          {{$t('dictionary.review')}}
        </q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { RouteParams, useRoute } from 'vue-router';

const state = reactive({
  deckId: '',
  cardId: '',
  cardPage: false,
  reviewPage: false,
});

const route = useRoute();

function setStateWithRouteParams(params: RouteParams): void {
  state.deckId = '';
  state.cardId = '';
  state.cardPage = false;
  state.reviewPage = false;

  switch (route.name) {
    case 'deck':
    case 'cards':
    case 'review':
      if (typeof params.deckId === 'string') {
        state.deckId = params.deckId;
      }
      if (route.name === 'review') {
        state.reviewPage = true;
      }
      break;
    case 'card':
      if (typeof params.cardId === 'string' && typeof params.deckId === 'string') {
        state.deckId = params.deckId;
        state.cardId = params.cardId;
        state.cardPage = true;
      }
      break;
    default:
      //
  }
}

onMounted(() => {
  setStateWithRouteParams(route.params);
});

watch(() => route.params, (params) => {
  setStateWithRouteParams(params);
});
</script>
