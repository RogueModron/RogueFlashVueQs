export interface CardToReview {
    approachId: string;

    deckId: string;
    cardId: string;

    lastDate: Date | null;

    sideA: string;
    sideB: string;

    notes: string;
    tags: string;
}
