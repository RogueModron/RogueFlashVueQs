import { inject, InjectionKey } from 'vue';
import { Db } from './db/db';

export class Ioc {
  public static IOC_DB: InjectionKey<Db> = Symbol('Db');

  // See:
  //  https://logaretm.com/blog/type-safe-provide-inject/
  //  https://stackoverflow.com/questions/65716936/vue-3-inject-with-typescript

  public static inject<T>(key: InjectionKey<T>, fallback?: T): T {
    const resolved = inject(key, fallback);
    if (!resolved) {
      throw new Error(`Could not resolve ${key.description}.`);
    }
    return resolved;
  }
}
