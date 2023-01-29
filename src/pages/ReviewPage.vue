<template>
  <q-page class="row" :padding=true>
    <template v-if="model.approachId">
      <div class="col-12">
        <div class="row justify-center">
          <div class="col-12 col-md-4">
            <p>
              {{ model.sideA }}
            </p>
          </div>
        </div>
        <template v-if="state.reviewd">
          <div class="row justify-center">
            <div class="col-12 col-md-4">
              <q-separator class="q-my-md" />
              <p>
                {{ model.sideB }}
              </p>
            </div>
          </div>
          <div class="row justify-center">
            <div class="col-12 col-md-4">
              <q-separator class="q-my-md" />
              <p>
                {{ model.notes }}
              </p>
            </div>
          </div>
          <div>
            <q-page-sticky position="bottom" :offset="[0, 10]">
              <div class="col-12 col-md-4">
                <q-btn v-on:click="throttledInitPage()"
                  color="primary"
                  :disable="state.wait"
                  icon="done_outline"
                  :label="$t('dictionary.continue')"
                  unelevated
                />
              </div>
            </q-page-sticky>
          </div>
        </template>
        <template v-else>
          <q-page-sticky position="bottom" :offset="[0, 10]">
            <template v-for="value in PageUtils.numericEnumToArray(ReviewValue)" :key="value">
              <q-btn v-on:click="throttledReviewCard(value)"
                class="q-mx-md"
                color="primary"
                :disable="state.wait"
                :label="value"
                padding="xs lg"
                unelevated
              />
            </template>
          </q-page-sticky>
        </template>
      </div>

      <toolbar-teleport v-if="state.reviewd">
        <div>
          <q-btn v-on:click="throttledInitPage()"
            color="primary"
            :disable="state.wait"
            icon="done_outline"
            :label="$t('dictionary.continue')"
            unelevated
          />
        </div>
      </toolbar-teleport>
    </template>
    <template v-else>
      <div class="col-12">
        <p class="text-align-center">
          {{ $t('descriptions.noCardToReview') }}
        </p>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { extend, throttle } from 'quasar';
import { onMounted, reactive, watch } from 'vue';
import { RouteParams, useRoute } from 'vue-router';
import ToolbarTeleport from 'src/components/ToolbarTeleportComponent.vue';
import { Db } from 'src/services/db/db';
import { CardToReview } from 'src/services/db/views/card-to-review';
import { Ioc } from 'src/services/ioc';
import { PageUtils } from 'src/services/page-utils';
import { ReviewResult } from 'src/services/db/views/review-result';
import { ReviewValue } from 'src/services/planner/review-value';
import { Planner } from 'src/services/planner/planner';
import { PlannerResult } from 'src/services/planner/planner-result';

const model = reactive(emptyCardToReview());

const state = reactive({
  wait: false,

  parentId: '',
  reviewd: false,
});

const db = Ioc.inject<Db>(Ioc.IOC_DB);

const route = useRoute();

const throttledInitPage = throttle(initPage, 300);

const throttledReviewCard = throttle(reviewCard, 300);

function emptyCardToReview(): CardToReview {
  return {
    approachId: '',

    deckId: '',
    cardId: '',

    lastDate: null,

    sideA: '',
    sideB: '',

    notes: '',
    tags: '',
  };
}

async function initModel(): Promise<void> {
  if (!state.parentId) {
    return;
  }

  const cardToReview = await db.retrieveNextCardToReview(state.parentId);
  if (!cardToReview) {
    extend(true, model, emptyCardToReview());
    model.lastDate = null;

    return;
  }

  extend(true, model, cardToReview);
}

async function saveReviewResult(
  reviewValue: ReviewValue,
  plannerResult: PlannerResult,
): Promise<void> {
  if (!model.approachId) {
    return;
  }

  state.reviewd = true;

  const reviewResult: ReviewResult = {
    approachId: model.approachId,
    deckId: model.deckId,
    cardId: model.cardId,
    nextDate: plannerResult.nextDate,
    nextDays: plannerResult.nextDays,
    elapsedDays: plannerResult.elapsedDays,
    value: reviewValue,
  };
  await db.saveReviewResult(reviewResult);
  await db.postponeOtherReviews(reviewResult, 1);
}

function initPage(): void {
  state.reviewd = false;

  state.wait = true;
  initModel().finally(() => {
    state.wait = false;
  });
}

async function reviewCard(value: ReviewValue): Promise<void> {
  const date = new Date();
  const plannerResult = Planner.planNext(value, date, model.lastDate ?? undefined);

  await saveReviewResult(value, plannerResult);
}

function initWithRouteParams(params: RouteParams): void {
  const { deckId } = params;
  PageUtils.checkId(deckId);
  state.parentId = deckId;

  initPage();
}

onMounted(() => {
  initWithRouteParams(route.params);
});

watch(() => route.params, (newParams) => {
  initWithRouteParams(newParams);
});
</script>
