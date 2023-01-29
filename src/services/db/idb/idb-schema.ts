import { DBSchema } from 'idb';
import { Approach } from '../model/approach';
import { Card } from '../model/card';
import { Deck } from '../model/deck';
import { Review } from '../model/review';

export interface IdbSchema extends DBSchema {
    decks: {
        key: string;
        value: Deck;
        indexes: {
            byDescriptionAndDeckId: string;
        }
    };
    cards: {
        key: string;
        value: Card;
        indexes: {
            byDeckId: string;
            byDeckIdAndSideAAndCardId: string[];
        }
    };
    approaches: {
        key: string;
        value: Approach;
        indexes: {
            byDeckAndCardId: string[];
            byDeckIdAndNextDate: string[];
        }
    };
    reviews: {
        key: string;
        value: Review;
        indexes: {
            byDeckAndCardAndApproachId: string[];
        }
    };
}
