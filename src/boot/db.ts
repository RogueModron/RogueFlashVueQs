import { boot } from 'quasar/wrappers';
import { Db } from 'src/services/db/db';
import { Idb } from 'src/services/db/idb/idb';
import { Ioc } from 'src/services/ioc';

export default boot(async ({ app }) => {
  const db: Db = new Idb();
  await db.init();

  app.provide(Ioc.IOC_DB, db);
});
