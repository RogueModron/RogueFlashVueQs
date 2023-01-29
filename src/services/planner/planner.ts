import { ReviewValue } from './review-value';
import { PlannerResult } from './planner-result';

export class Planner {
  static readonly MILLS_IN_A_DAY = 24 * 60 * 60 * 1000;

  static readonly ELAPSED_DAYS_MAX = 365 * 100;

  static readonly ELAPSED_DAYS_MIN = 0;

  /* eslint-disable key-spacing */
  private static readonly VALUES = new Map<
    number,
    {
      daysBase: number;
      daysMultiplier: number;
    }
  >([
    [ReviewValue.VALUE_0, { daysBase:  0.00, daysMultiplier: 0.00 }],
    [ReviewValue.VALUE_1, { daysBase:  1.00, daysMultiplier: 1.10 }],
    [ReviewValue.VALUE_2, { daysBase:  3.00, daysMultiplier: 1.10 }],
    [ReviewValue.VALUE_3, { daysBase:  7.00, daysMultiplier: 1.20 }],
    [ReviewValue.VALUE_4, { daysBase: 12.00, daysMultiplier: 1.30 }],
  ]);
  /* eslint-enable key-spacing */

  static planNext(value: ReviewValue, valueDate: Date, previousDate?: Date): PlannerResult {
    const elapsedDays = Planner.calculateElapsedDays(valueDate, previousDate);
    const nextDays = Planner.calculateNextDays(value, elapsedDays);
    const nextDate = Planner.calculateNextDate(valueDate, nextDays);

    return {
      nextDate,
      nextDays,
      elapsedDays,
    };
  }

  private static calculateElapsedDays(valueDate: Date, previousDate?: Date): number {
    if (!previousDate) {
      return 0;
    }

    const timeDiff = valueDate.getTime() - previousDate.getTime();
    return Math.round(timeDiff / Planner.MILLS_IN_A_DAY);
  }

  private static calculateNextDate(valueDate: Date, nextDays: number): Date {
    return new Date(valueDate.getTime() + (nextDays * Planner.MILLS_IN_A_DAY));
  }

  private static calculateNextDays(value: ReviewValue, elapsedDays: number): number {
    if (value === ReviewValue.VALUE_0) {
      return 0;
    }

    if (elapsedDays < Planner.ELAPSED_DAYS_MIN || Planner.ELAPSED_DAYS_MAX < elapsedDays) {
      throw new Error(`Elapsed days out of range: ${elapsedDays}.`);
    }

    const valueParameters = Planner.VALUES.get(value);
    if (!valueParameters) {
      throw new Error(`Parameters not found for value: ${value}.`);
    }

    const nextDays = Math.floor(
      elapsedDays * valueParameters.daysMultiplier + valueParameters.daysBase,
    );
    return Math.round(nextDays);
  }
}
