import { Card } from './model/card';
import { Deck } from './model/deck';
import { CardToReview } from './views/card-to-review';
import { ReviewResult } from './views/review-result';

export interface Db {
    destroy: () => Promise<void>;
    init: () => Promise<void>;

    createDeck: (deck: Deck) => Promise<string>;
    createCard: (card: Card) => Promise<string>;

    readDeck: (deckId: string) => Promise<Deck | undefined>;
    readCard: (cardId: string, deckId: string | null) => Promise<Card | undefined>;

    updateDeck: (deck: Deck) => Promise<string>;
    updateCard: (card: Card) => Promise<string>;

    deleteDeck: (deckId: string) => Promise<void>;
    deleteCard: (cardId: string, deckId: string | null) => Promise<void>;

    searchDecks: (
        text: string,
        offset: number,
        limit: number,
    ) => Promise<Deck[]>;

    searchCards: (
        deckId: string,
        text: string,
        offset: number,
        limit: number,
    ) => Promise<Card[]>;

    retrieveNextCardToReview: (deckId: string) => Promise<CardToReview | undefined>;

    saveReviewResult: (reviewResult: ReviewResult) => Promise<void>;

    postponeOtherReviews: (reviewResult: ReviewResult, hours: number) => Promise<void>;
}
