export interface Review {
    reviewId: string;

    deckId: string;
    cardId: string;
    approachId: string;

    value: number;
    dateTime: Date;
}
