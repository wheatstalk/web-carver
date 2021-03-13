/** @internal */
export type PubSubHandler<T> = (thing: T) => void;

/** @internal */
export interface IPubSub<T> {
  subscribe(handler: PubSubHandler<T>): void;
  publish(event: T): void;
}

/** @internal */
export abstract class PubSub<T> implements IPubSub<T> {
  /**
   * Create a PubSub that publishes an event to all handlers.
   */
  static basicPubSub<U>(): PubSub<U> {
    return new PubSubBase<U>();
  }

  /**
   * Create a PubSub that records and replays all events for new subscribers.
   */
  static replayingPubSub<U>(): PubSub<U> {
    return new ReplayingPubSub<U>();
  }

  abstract subscribe(handler: PubSubHandler<T>): void;
  abstract publish(event: T): void;
}

class PubSubBase<T> extends PubSub<T> {
  private handlers = new Array<PubSubHandler<T>>();

  subscribe(handler: PubSubHandler<T>) {
    this.handlers.push(handler);
  }

  publish(event: T) {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}

class ReplayingPubSub<T> extends PubSubBase<T> {
  private eventRecord = new Array<T>();

  subscribe(handler: PubSubHandler<T>) {
    super.subscribe(handler);
    for (const event of this.eventRecord) {
      handler(event);
    }
  }

  publish(event: T) {
    super.publish(event);
    this.eventRecord.push(event);
  }
}
