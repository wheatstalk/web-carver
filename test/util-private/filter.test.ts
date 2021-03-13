import { Filter } from '../../src/util-private/filter';

test('all added filters are applied to the input', () => {
  // GIVEN
  const filter = new Filter<number>();
  const addOne = (number: number) => number + 1;
  filter.add(addOne);
  filter.add(addOne);

  // WHEN
  const result = filter.filter(15);

  // THEN
  expect(result).toEqual(17);
});