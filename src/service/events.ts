import * as cdk from '@aws-cdk/core';

/** @internal */
export type PubSubHandler<T> = (scope: cdk.Construct, thing: T) => void;

/** @internal */
export class PubSub<T> {
  private handlers: PubSubHandler<T>[] = [];
  private lastTuple?: [cdk.Construct, T];

  constructor(private readonly oneShot: boolean = false) {
  }

  subscribe(handler: PubSubHandler<T>) {
    this.handlers.push(handler);

    if (this.lastTuple && this.oneShot) {
      handler(...this.lastTuple);
    }
  }

  publish(scope: cdk.Construct, event: T) {
    this.lastTuple = [scope, event];
    for (const handler of this.handlers) {
      handler(scope, event);
    }
  }
}

/** @internal */
export type FilterHandler<T> = (item: T) => T;

/** @internal */
export class Filter<T> {
  private filters: FilterHandler<T>[] = [];

  add(filter: FilterHandler<T>) {
    this.filters.push(filter);
  }

  filter(item: T): T {
    return this.filters.reduce((accum, filter) => {
      return filter(accum);
    }, item);
  }
}