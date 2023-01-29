import { deleteDB, IDBPDatabase, IDBPIndex, openDB } from 'idb';
import { uid } from 'quasar';
import { Db } from '../db';
import { Approach } from '../model/approach';
import { Card } from '../model/card';
import { Deck } from '../model/deck';
import { Review } from '../model/review';
import { CardToReview } from '../views/card-to-review';
import { ReviewResult } from '../views/review-result';
import { IdbInfo } from './idb-info';
import { IdbSchema } from './idb-schema';

export class Idb implements Db {
  private db?: IDBPDatabase<IdbSchema>;

  private dbName = 'rogue-flash-db-vueqs';

  constructor(dbName?: string) {
    if (typeof dbName === 'string') {
      this.dbName = dbName;
    }
  }

  private static checkDb(db?: IDBPDatabase<IdbSchema>): asserts db is IDBPDatabase<IdbSchema> {
    if (!db) {
      throw new Error('Db is not initialized.');
    }
  }

  private static createId(): string {
    // return crypto.randomUUID();
    return uid();
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private static async deleteWithCursor(
    index: IDBPIndex<any, any, any, any, 'readwrite'>,
    query?: string | IDBKeyRange,
  ): Promise<void> {
    let cursor = await index.openCursor(query);
    /* eslint-disable no-await-in-loop */
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    /* eslint-enable no-await-in-loop */
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  private static filter<T>(
    items: T[],
    offset = 0,
    limit = 0,
    query: (item: T) => boolean = () => true,
  ): T[] {
    const filtered: T[] = [];
    for (let i = 0, l = items.length; i < l; i += 1) {
      const item = items[i];
      if (query(item)) {
        if (offset > 0) {
          offset -= 1;
        } else {
          filtered.push(item);
          if (limit > 0 && filtered.length === limit) {
            break;
          }
        }
      }
    }
    return filtered;
  }

  public getDbInfo(): IdbInfo {
    Idb.checkDb(this.db);
    return {
      name: this.db.name,
      version: this.db.version,
    };
  }

  /* Interface. */

  public async destroy(): Promise<void> {
    Idb.checkDb(this.db);
    this.db.close();
    return deleteDB(this.dbName);
  }

  public async init(): Promise<void> {
    this.db = await openDB<IdbSchema>(this.dbName, 1, {
      upgrade(db) {
        const decks = db.createObjectStore('decks', {
          keyPath: 'deckId',
        });
        decks.createIndex('byDescriptionAndDeckId', [
          'description',
          'deckId',
        ]);

        const cards = db.createObjectStore('cards', {
          keyPath: 'cardId',
        });
        cards.createIndex('byDeckId', 'deckId');
        cards.createIndex('byDeckIdAndSideAAndCardId', [
          'deckId',
          'sideA',
          'cardId',
        ]);

        const approaches = db.createObjectStore('approaches', {
          keyPath: 'approachId',
        });
        approaches.createIndex('byDeckAndCardId', [
          'deckId',
          'cardId',
        ]);
        approaches.createIndex('byDeckIdAndNextDate', [
          'deckId',
          'nextDate',
        ]);

        const reviews = db.createObjectStore('reviews', {
          keyPath: 'reviewId',
        });
        reviews.createIndex('byDeckAndCardAndApproachId', [
          'deckId',
          'cardId',
          'approachId',
        ]);
      },
    });
  }

  public async createDeck(deck: Deck): Promise<string> {
    Idb.checkDb(this.db);
    deck.deckId = Idb.createId();
    return this.db.add('decks', deck);
  }

  public async createCard(card: Card): Promise<string> {
    Idb.checkDb(this.db);
    card.cardId = Idb.createId();

    const approachA: Approach = {
      approachId: Idb.createId(),
      cardId: card.cardId,
      deckId: card.deckId,
      startWithA: true,
      lastDate: null,
      lastDays: 0,
      nextDate: new Date(),
      nextDays: 0,
    };

    const approachB: Approach = {
      approachId: Idb.createId(),
      cardId: card.cardId,
      deckId: card.deckId,
      startWithA: false,
      lastDate: null,
      lastDays: 0,
      nextDate: new Date(),
      nextDays: 0,
    };

    const transaction = this.db.transaction(['cards', 'approaches'], 'readwrite');
    const cardId = await transaction.objectStore('cards').add(card);
    await transaction.objectStore('approaches').add(approachA);
    await transaction.objectStore('approaches').add(approachB);
    transaction.commit();

    return cardId;
  }

  public async readDeck(deckId: string): Promise<Deck | undefined> {
    Idb.checkDb(this.db);
    return this.db.get('decks', deckId);
  }

  public async readCard(cardId: string, deckId: string | null = null): Promise<Card | undefined> {
    Idb.checkDb(this.db);

    const card = await this.db.get('cards', cardId);

    if (deckId === null || card?.deckId === deckId) {
      return card;
    }

    return undefined;
  }

  public async updateDeck(deck: Deck): Promise<string> {
    Idb.checkDb(this.db);
    return this.db.put('decks', deck);
  }

  public async updateCard(card: Card): Promise<string> {
    Idb.checkDb(this.db);
    return this.db.put('cards', card);
  }

  public async deleteDeck(deckId: string): Promise<void> {
    Idb.checkDb(this.db);

    const deck = await this.readDeck(deckId);
    if (!deck) {
      return;
    }

    const transaction = this.db.transaction(
      [
        'decks',
        'cards',
        'approaches',
        'reviews',
      ],
      'readwrite',
    );

    const reviewsIndex = transaction.objectStore('reviews').index('byDeckAndCardAndApproachId');
    await Idb.deleteWithCursor(
      reviewsIndex,
      IDBKeyRange.bound([deckId], [deckId, []]),
    );

    const approachesIndex = transaction.objectStore('approaches').index('byDeckAndCardId');
    await Idb.deleteWithCursor(
      approachesIndex,
      IDBKeyRange.bound([deckId], [deckId, []]),
    );

    const cardsIndex = transaction.objectStore('cards').index('byDeckId');
    await Idb.deleteWithCursor(cardsIndex, deckId);

    await transaction.objectStore('decks').delete(deckId);

    transaction.commit();
  }

  public async deleteCard(cardId: string, deckId: string | null = null): Promise<void> {
    Idb.checkDb(this.db);

    const card = await this.readCard(cardId, deckId);
    if (!card) {
      return;
    }

    if (deckId === null) {
      deckId = card.deckId;
    }

    const transaction = this.db.transaction(
      [
        'cards',
        'approaches',
        'reviews',
      ],
      'readwrite',
    );

    const reviewsIndex = transaction.objectStore('reviews').index('byDeckAndCardAndApproachId');
    await Idb.deleteWithCursor(
      reviewsIndex,
      IDBKeyRange.bound([deckId, cardId], [deckId, cardId, []]),
    );

    const approachesIndex = transaction.objectStore('approaches').index('byDeckAndCardId');
    await Idb.deleteWithCursor(
      approachesIndex,
      IDBKeyRange.bound([deckId, cardId], [deckId, cardId, []]),
    );

    await transaction.objectStore('cards').delete(cardId);

    transaction.commit();
  }

  public async searchDecks(
    text = '',
    offset = 0,
    limit = 0,
  ): Promise<Deck[]> {
    Idb.checkDb(this.db);

    const transaction = this.db.transaction('decks');

    const index = transaction.objectStore('decks').index('byDescriptionAndDeckId');
    const items = await index.getAll();

    transaction.commit();

    const lowerCaseText = text.toLocaleLowerCase();

    // eslint-disable-next-line operator-linebreak
    const textQuery =
      (item: Deck) => item.description.toLocaleLowerCase().indexOf(lowerCaseText) >= 0
      || item.notes.toLocaleLowerCase().indexOf(lowerCaseText) >= 0
      || item.tags.toLocaleLowerCase().indexOf(lowerCaseText) >= 0;

    return Idb.filter(
      items,
      offset,
      limit,
      textQuery,
    );
  }

  public async searchCards(
    deckId: string,
    text = '',
    offset = 0,
    limit = 0,
  ): Promise<Card[]> {
    Idb.checkDb(this.db);

    const transaction = this.db.transaction('cards');

    const index = transaction.objectStore('cards').index('byDeckIdAndSideAAndCardId');
    const items = await index.getAll(IDBKeyRange.bound([deckId], [deckId, []]));

    transaction.commit();

    const lowerCaseText = text.toLocaleLowerCase();

    // eslint-disable-next-line operator-linebreak
    const textQuery =
      (item: Card) => item.sideA.toLocaleLowerCase().indexOf(lowerCaseText) >= 0
      || item.sideB.toLocaleLowerCase().indexOf(lowerCaseText) >= 0
      || item.notes.toLocaleLowerCase().indexOf(lowerCaseText) >= 0
      || item.tags.toLocaleLowerCase().indexOf(lowerCaseText) >= 0;

    return Idb.filter(
      items,
      offset,
      limit,
      textQuery,
    );
  }

  public async retrieveNextCardToReview(deckId: string): Promise<CardToReview | undefined> {
    Idb.checkDb(this.db);

    const transaction = this.db.transaction('approaches');

    const index = transaction.objectStore('approaches').index('byDeckIdAndNextDate');
    const approach = await index.get(IDBKeyRange.bound([deckId], [deckId, []]));

    transaction.commit();

    if (approach && (approach.nextDate === null || approach.nextDate < (new Date()))) {
      const card = await this.readCard(approach.cardId, approach.deckId);
      if (card) {
        return {
          approachId: approach.approachId,
          deckId: approach.deckId,
          cardId: approach.cardId,
          lastDate: approach.lastDate,
          sideA: approach.startWithA ? card.sideA : card.sideB,
          sideB: approach.startWithA ? card.sideB : card.sideA,
          notes: card.notes,
          tags: card.tags,
        };
      }

      throw new Error(`Card not found [${approach.cardId}].`);
    }

    return undefined;
  }

  public async saveReviewResult(reviewResult: ReviewResult): Promise<void> {
    Idb.checkDb(this.db);

    const approach = await this.db.get('approaches', reviewResult.approachId);

    const approachIsValid = approach
      && (approach.deckId !== null && approach.deckId === reviewResult.deckId)
      && (approach.cardId !== null && approach.cardId === reviewResult.cardId);
    if (!approachIsValid) {
      throw new Error('Error while saving review result.');
    }

    approach.lastDate = new Date();
    approach.lastDays = reviewResult.elapsedDays;
    approach.nextDate = reviewResult.nextDate;
    approach.nextDays = reviewResult.nextDays;

    const review: Review = {
      reviewId: Idb.createId(),
      approachId: approach.approachId,
      cardId: approach.cardId,
      deckId: approach.deckId,
      value: reviewResult.value,
      dateTime: approach.lastDate,
    };

    const transaction = this.db.transaction(['approaches', 'reviews'], 'readwrite');

    transaction.objectStore('approaches').put(approach);
    transaction.objectStore('reviews').add(review);

    transaction.commit();
  }

  public async postponeOtherReviews(reviewResult: ReviewResult, hours: number): Promise<void> {
    Idb.checkDb(this.db);

    const transactionForRead = this.db.transaction('approaches');

    const index = transactionForRead.objectStore('approaches').index('byDeckAndCardId');
    const otherApproaches = await index.getAll(
      IDBKeyRange.bound(
        [reviewResult.deckId, reviewResult.cardId],
        [reviewResult.deckId, reviewResult.cardId],
      ),
    );

    transactionForRead.commit();

    let indexOfReviewedApproach = -1;
    for (let i = 0, l = otherApproaches.length; i < l; i += 1) {
      const otherApproach = otherApproaches[i];
      if (otherApproach.approachId === reviewResult.approachId) {
        indexOfReviewedApproach = i;
      } else {
        otherApproach.nextDate = new Date();
        otherApproach.nextDate.setHours(otherApproach.nextDate.getHours() + hours);
      }
    }
    if (indexOfReviewedApproach >= 0) {
      otherApproaches.splice(indexOfReviewedApproach, 1);
    }

    const transactionForWrite = this.db.transaction('approaches', 'readwrite');

    const operations: Promise<string>[] = [];
    for (let i = 0, l = otherApproaches.length; i < l; i += 1) {
      operations.push(transactionForWrite.objectStore('approaches').put(otherApproaches[i]));
    }
    await Promise.allSettled(operations);

    transactionForWrite.commit();
  }
}
