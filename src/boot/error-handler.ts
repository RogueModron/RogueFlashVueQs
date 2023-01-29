import { Notify } from 'quasar';
import { boot } from 'quasar/wrappers';

export default boot(({ app }) => {
  // https://stackoverflow.com/questions/52071212/how-to-implement-global-error-handling-in-vue

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function notifyError(object: any): void {
    Notify.create({
      type: 'negative',
      message: `${object}`,
      progress: true,
    });
  }

  app.config.errorHandler = (err) => {
    notifyError(err);
  };

  window.onerror = (message) => {
    notifyError(message);
  };

  window.addEventListener('unhandledrejection', (event) => {
    notifyError(event.reason);
  });
});
