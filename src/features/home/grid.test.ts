import { chunk, getGridColumns } from './grid';

describe('getGridColumns', () => {
  it('follows the size-class column ranges', () => {
    expect([getGridColumns('compact', false), getGridColumns('compact', true)]).toEqual([1, 2]);
    expect([getGridColumns('medium', false), getGridColumns('medium', true)]).toEqual([2, 3]);
    expect([getGridColumns('expanded', false), getGridColumns('expanded', true)]).toEqual([3, 4]);
  });
});

describe('getGridColumns with limited width', () => {
  it('drops columns that would make cards narrower than the minimum', () => {
    expect(getGridColumns('expanded', true, 860)).toBe(3);
    expect(getGridColumns('compact', true, 400)).toBe(1);
    expect(getGridColumns('expanded', true, 1000)).toBe(4);
    expect(getGridColumns('compact', false, 100)).toBe(1);
  });
});

describe('chunk', () => {
  it('splits into rows with a short last row', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });
});
