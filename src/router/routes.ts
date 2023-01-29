import { RouteRecordRaw } from 'vue-router';
import MainLayout from 'src/layouts/MainLayout.vue';
import CardPage from 'src/pages/CardPage.vue';
import CardsPage from 'src/pages/CardsPage.vue';
import DeckPage from 'src/pages/DeckPage.vue';
import DecksPage from 'src/pages/DecksPage.vue';
import ReviewPage from 'src/pages/ReviewPage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/decks',
    component: MainLayout,
    children: [
      {
        path: 'decks',
        name: 'decks',
        component: DecksPage,
      },
      {
        path: 'decks/deck/:deckId?',
        name: 'deck',
        component: DeckPage,
      },
      {
        path: 'decks/deck/:deckId/cards',
        name: 'cards',
        component: CardsPage,
      },
      {
        path: 'decks/deck/:deckId/cards/card/:cardId?',
        name: 'card',
        component: CardPage,
      },
      {
        path: 'decks/deck/:deckId/review',
        name: 'review',
        component: ReviewPage,
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    redirect: '/decks',
  },
];

export default routes;
