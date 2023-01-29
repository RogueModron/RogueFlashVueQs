import { boot } from 'quasar/wrappers';
import { createI18n } from 'vue-i18n';

import messages from 'src/i18n';

export default boot(({ app }) => {
  // Added globalInjection and legacy in order to obtaing resource key $t inside components, see:
  //  https://vue-i18n.intlify.dev/guide/advanced/composition.html#implicit-with-injected-properties-and-functions

  const i18n = createI18n({
    globalInjection: true,
    legacy: false,
    locale: 'en-US',
    messages,
  });

  app.use(i18n);
});
