export class PubSub<M> {
  /* eslint-disable-next-line no-spaced-func, func-call-spacing */
  private subscriptions = new Map<string, (message: M) => void>();

  public publish(message: M): void {
    const callbacks = [...this.subscriptions.values()];
    for (let i = 0, l = callbacks.length; i < l; i += 1) {
      callbacks[i](message);
    }
  }

  public subscribe(key: string, callback: (message: M) => void): void {
    this.subscriptions.set(key, callback);
  }

  public unsubscribe(key: string): void {
    this.subscriptions.delete(key);
  }
}
