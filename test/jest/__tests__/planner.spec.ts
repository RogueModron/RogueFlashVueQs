import {
  describe, expect, it,
} from '@jest/globals';
import { Planner } from '../../../src/services/planner/planner';
import { ReviewValue } from '../../../src/services/planner/review-value';

describe('Planner', () => {
  function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * Planner.MILLS_IN_A_DAY);
  }

  it('Should plan.', () => {
    const d1 = new Date();

    let result = Planner.planNext(ReviewValue.VALUE_1, d1);
    expect(result.nextDays).toEqual(1);
    expect(result.nextDate).toEqual(addDays(d1, 1));

    result = Planner.planNext(ReviewValue.VALUE_4, d1);
    expect(result.nextDays).toEqual(12);
    expect(result.nextDate).toEqual(addDays(d1, 12));

    result = Planner.planNext(ReviewValue.VALUE_2, d1, addDays(d1, -122));
    expect(result.nextDays).toEqual(137);
    expect(result.nextDate).toEqual(addDays(d1, 137));

    result = Planner.planNext(ReviewValue.VALUE_0, d1);
    expect(result.nextDays).toEqual(0);
    expect(result.nextDate).toEqual(d1);
  });

  it('Should throw an error.', () => {
    const d1 = new Date();

    let d2 = addDays(d1, -(Planner.ELAPSED_DAYS_MIN - 1));
    expect(() => Planner.planNext(ReviewValue.VALUE_1, d1, d2)).toThrow();

    d2 = addDays(d1, (Planner.ELAPSED_DAYS_MAX + 1));
    expect(() => Planner.planNext(ReviewValue.VALUE_1, d1, d2)).toThrow();
  });
});
