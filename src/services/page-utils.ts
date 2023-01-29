export class PageUtils {
  public static readonly ITEMS_TO_LOAD_AT_ONCE = 25;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public static checkId(id: any): asserts id is string | undefined {
    const invalid = ['string', 'undefined'].indexOf(typeof id) === -1
      || Array.isArray(id);
    if (invalid) {
      throw new Error('Invalid id type.');
    }
  }

  public static numericEnumToArray(enumObject: any): number[] {
    return Object.keys(enumObject)
      .filter((val) => Number.isNaN(Number(val)))
      .map((key) => enumObject[key]);
  }
}
