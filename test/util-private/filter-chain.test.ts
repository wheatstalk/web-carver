import { FilterChain } from '../../src/util-private/filter-chain';

test('all added filters are applied to the input', () => {
  // GIVEN
  const filter = new FilterChain<number>();
  const addOne = (number: number) => number + 1;
  const addTwo = (number: number) => number + 2;
  filter.add(addOne);
  filter.add(addTwo);

  // WHEN
  const result = filter.filter(15);

  // THEN
  expect(result).toEqual(18);
});