/** @internal */
export type FilterHandler<T> = (item: T) => T;

/** @internal */
export class Filter<T> {
  private filters: FilterHandler<T>[] = [];

  add(filter: FilterHandler<T>) {
    this.filters.push(filter);
  }

  filter(item: T): T {
    return this.filters.reduce((accumulator, filter) => {
      return filter(accumulator);
    }, item);
  }
}