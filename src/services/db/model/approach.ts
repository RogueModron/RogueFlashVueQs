export interface Approach {
    approachId: string;

    deckId: string;
    cardId: string;

    startWithA: boolean;

    lastDate: Date | null;
    lastDays: number;
    nextDate: Date | null;
    nextDays: number;
}
