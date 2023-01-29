import { ReviewValue } from 'src/services/planner/review-value';

export interface ReviewResult {
    approachId: string;

    deckId: string;
    cardId: string;

    nextDate: Date;
    nextDays: number;
    elapsedDays: number;

    value: ReviewValue;
}
