import {
  afterEach, beforeEach, describe, expect, it,
} from '@jest/globals';
import { Idb } from '../../../src/services/db/idb/idb';
import { Card } from '../../../src/services/db/model/card';
import { Deck } from '../../../src/services/db/model/deck';
import { ReviewResult } from '../../../src/services/db/views/review-result';
import { ReviewValue } from '../../../src/services/planner/review-value';

// Tests were slow, added --maxWorkers=1 in quasar.testing.json:
//  https://stackoverflow.com/questions/45087018/jest-simple-tests-are-slow

// Testing indexedDB without mocks requires fake-indexeddb:
//  https://stackoverflow.com/a/71702555

// Testing crypto without mocks:
//  https://stackoverflow.com/a/52612372
/*
const crypto = require('crypto');

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});
*/

// See:
//  https://github.com/DefinitelyTyped/DefinitelyTyped/issues/41179

function expectToBeDefined<T>(arg: T): asserts arg is NonNullable<T> {
  expect(arg).toBeDefined();
}

describe('Idb', () => {
  let db: Idb;

  function getDeckInstance(n = ''): Deck {
    return {
      deckId: '',
      description: `Description ${n}`,
      notes: `Notes ${n}`,
      tags: `Tags ${n}`,
    };
  }

  function getCardInstance(deckId: string, n = ''): Card {
    return {
      cardId: '',
      deckId,
      notes: `Notes ${n}`,
      sideA: `SideA ${n}`,
      sideB: `SideB ${n}`,
      tags: `Tags ${n}`,
    };
  }

  beforeEach(async () => {
    db = new Idb('rogue-flash-test-db');
    await db.init();
  });

  afterEach(async () => {
    db.destroy();
  });

  it('Should get db info.', () => {
    const info = db.getDbInfo();
    expect(info).toBeDefined();
  });

  it('Should execute CRUD operations.', async () => {
    // Create decks.
    const deck1Id = await db.createDeck(getDeckInstance('1'));
    expect(deck1Id).not.toEqual('');

    const deck2Id = await db.createDeck(getDeckInstance('2'));
    expect(deck2Id).not.toEqual('');

    expect(deck1Id).not.toEqual(deck2Id);

    // Read decks.
    const deck1 = await db.readDeck(deck1Id);
    expectToBeDefined(deck1);
    expect(deck1Id).toEqual(deck1.deckId);
    expect(deck1.notes).toContain('1');

    const deck2 = await db.readDeck(deck2Id);
    expectToBeDefined(deck2);
    expect(deck2Id).toEqual(deck2.deckId);
    expect(deck2.notes).toContain('2');

    // Update decks.
    deck1.notes = '';
    const updatedDeck1Id = await db.updateDeck(deck1);
    const updatedDeck1 = await db.readDeck(deck1Id);
    expectToBeDefined(updatedDeck1);
    expect(updatedDeck1Id).toEqual(deck1Id);
    expect(updatedDeck1Id).toEqual(updatedDeck1.deckId);
    expect(updatedDeck1.notes).toEqual('');

    const untouchedDeck2 = await db.readDeck(deck2Id);
    expectToBeDefined(untouchedDeck2);
    expect(untouchedDeck2.notes).not.toEqual('');

    // Create cards.
    const deck1Card1Id = await db.createCard(getCardInstance(deck1Id, '1_1'));
    expect(deck1Card1Id).not.toEqual('');

    const deck1Card2Id = await db.createCard(getCardInstance(deck1Id, '1_2'));
    expect(deck1Card2Id).not.toEqual('');

    expect(deck1Card1Id).not.toEqual(deck1Card2Id);

    const deck2Card1Id = await db.createCard(getCardInstance(deck2Id, '2_1'));
    expect(deck2Card1Id).not.toEqual('');

    const deck2Card2Id = await db.createCard(getCardInstance(deck2Id, '2_2'));
    expect(deck2Card2Id).not.toEqual('');

    expect(deck2Card1Id).not.toEqual(deck2Card2Id);

    // Read cards.
    const deck1Card1 = await db.readCard(deck1Card1Id);
    expectToBeDefined(deck1Card1);
    expect(deck1Card1Id).toEqual(deck1Card1.cardId);
    expect(deck1Card1.notes).toContain('1_1');

    const deck2Card1 = await db.readCard(deck2Card1Id);
    expectToBeDefined(deck2Card1);
    expect(deck2Card1Id).toEqual(deck2Card1.cardId);
    expect(deck2Card1.notes).toContain('2_1');

    // Update cards.
    deck1Card1.notes = '';
    const updatedDeck1Card1Id = await db.updateCard(deck1Card1);
    const updatedDeck1Card1 = await db.readCard(deck1Card1Id);
    expectToBeDefined(updatedDeck1Card1);
    expect(updatedDeck1Card1Id).toEqual(deck1Card1Id);
    expect(updatedDeck1Card1Id).toEqual(updatedDeck1Card1.cardId);
    expect(updatedDeck1Card1.notes).toEqual('');

    const untouchedDeck1Card2 = await db.readCard(deck1Card2Id);
    expectToBeDefined(untouchedDeck1Card2);
    expect(untouchedDeck1Card2.notes).not.toEqual('');

    // Delete cards.
    await db.deleteCard(deck1Card2Id);
    await db.deleteCard(deck2Card2Id);

    const deletedCard1 = await db.readCard(deck1Card2Id);
    expect(deletedCard1).toBeUndefined();

    const existingCard1 = await db.readCard(deck1Card1Id);
    expect(existingCard1).toBeDefined();

    const deletedCard2 = await db.readCard(deck2Card2Id);
    expect(deletedCard2).toBeUndefined();

    const existingCard2 = await db.readCard(deck2Card1Id);
    expect(existingCard2).toBeDefined();

    // Delete decks.
    await db.deleteDeck(deck2Id);

    const existingDeck1 = await db.readDeck(deck1Id);
    expect(existingDeck1).toBeDefined();

    const existingDeck1Card1 = await db.readCard(deck1Card1Id);
    expect(existingDeck1Card1).toBeDefined();

    const deletedDeck2 = await db.readDeck(deck2Id);
    expect(deletedDeck2).toBeUndefined();

    const deletedDeck2Card1 = await db.readCard(deck2Card1Id);
    expect(deletedDeck2Card1).toBeUndefined();
  });

  it('Should search decks.', async () => {
    const deck1 = getDeckInstance('1');
    const deck2 = getDeckInstance('2');
    const deck3 = getDeckInstance('3');
    const deck4 = getDeckInstance('4 = 2 + 2');

    const deck1Id = await db.createDeck(deck1);
    const deck2Id = await db.createDeck(deck2);
    const deck3Id = await db.createDeck(deck3);
    const deck4Id = await db.createDeck(deck4);

    let decks = await db.searchDecks();
    expectToBeDefined(decks);
    expect(decks.length).toBe(4);
    expect(decks[0]?.deckId).toBe(deck1Id);
    expect(decks[3]?.deckId).toBe(deck4Id);

    decks = await db.searchDecks('', 1, 2);
    expectToBeDefined(decks);
    expect(decks.length).toBe(2);
    expect(decks[0]?.deckId).toBe(deck2Id);
    expect(decks[1]?.deckId).toBe(deck3Id);

    decks = await db.searchDecks('2');
    expectToBeDefined(decks);
    expect(decks.length).toBe(2);
    expect(decks[0]?.deckId).toBe(deck2Id);
    expect(decks[1]?.deckId).toBe(deck4Id);

    decks = await db.searchDecks('2', 1, 1);
    expectToBeDefined(decks);
    expect(decks.length).toBe(1);
    expect(decks[0]?.deckId).toBe(deck4Id);
  });

  it('Should search cards.', async () => {
    const deck1Id = await db.createDeck(getDeckInstance('1'));

    const deck1Card1 = getCardInstance(deck1Id, '1_1');
    const deck1Card2 = getCardInstance(deck1Id, '1_2');
    const deck1Card3 = getCardInstance(deck1Id, '1_3');
    const deck1Card4 = getCardInstance(deck1Id, '1_4 = 2 + 2');

    const deck1Card1Id = await db.createCard(deck1Card1);
    const deck1Card2Id = await db.createCard(deck1Card2);
    const deck1Card3Id = await db.createCard(deck1Card3);
    const deck1Card4Id = await db.createCard(deck1Card4);

    const deck2Id = await db.createDeck(getDeckInstance('2'));
    await db.createCard(getCardInstance(deck2Id, '2_1'));

    let cards = await db.searchCards(deck1Id);
    expectToBeDefined(cards);
    expect(cards.length).toBe(4);
    expect(cards[0]?.cardId).toBe(deck1Card1Id);
    expect(cards[3]?.cardId).toBe(deck1Card4Id);

    cards = await db.searchCards(deck1Id, '', 1, 2);
    expectToBeDefined(cards);
    expect(cards.length).toBe(2);
    expect(cards[0]?.cardId).toBe(deck1Card2Id);
    expect(cards[1]?.cardId).toBe(deck1Card3Id);

    cards = await db.searchCards(deck1Id, '2');
    expectToBeDefined(cards);
    expect(cards.length).toBe(2);
    expect(cards[0]?.cardId).toBe(deck1Card2Id);
    expect(cards[1]?.cardId).toBe(deck1Card4Id);

    cards = await db.searchCards(deck1Id, '2', 1, 1);
    expectToBeDefined(cards);
    expect(cards.length).toBe(1);
    expect(cards[0]?.cardId).toBe(deck1Card4Id);
  });

  it('Should review a card.', async () => {
    const deckId = await db.createDeck(getDeckInstance('x'));
    await db.createCard(getCardInstance(deckId, 'x_x'));

    const cardToReview = await db.retrieveNextCardToReview(deckId);
    expectToBeDefined(cardToReview);

    const nextDateForReviewResult = new Date();
    nextDateForReviewResult.setDate(nextDateForReviewResult.getDate() + 1);

    const reviewResult: ReviewResult = {
      approachId: cardToReview.approachId,
      deckId: cardToReview.deckId,
      cardId: cardToReview.cardId,
      nextDate: nextDateForReviewResult,
      nextDays: 1,
      elapsedDays: 0,
      value: ReviewValue.VALUE_0,
    };
    await db.saveReviewResult(reviewResult);
    await db.postponeOtherReviews(reviewResult, 1);

    const anotherCardToReview = await db.retrieveNextCardToReview(deckId);
    expect(anotherCardToReview).toBeUndefined();
  });
});
