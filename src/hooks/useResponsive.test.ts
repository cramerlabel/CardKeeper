import {
  EXPANDED_MIN_WIDTH,
  MEDIUM_MIN_WIDTH,
  getMaxContentWidth,
  getScaleFactor,
  getSizeClass,
} from './useResponsive';

describe('getSizeClass', () => {
  it('is compact below 600dp', () => {
    expect(getSizeClass(320)).toBe('compact');
    expect(getSizeClass(MEDIUM_MIN_WIDTH - 1)).toBe('compact');
  });

  it('is medium from 600dp through 840dp', () => {
    expect(getSizeClass(MEDIUM_MIN_WIDTH)).toBe('medium');
    expect(getSizeClass(720)).toBe('medium');
    expect(getSizeClass(EXPANDED_MIN_WIDTH)).toBe('medium');
  });

  it('is expanded above 840dp', () => {
    expect(getSizeClass(EXPANDED_MIN_WIDTH + 1)).toBe('expanded');
    expect(getSizeClass(1280)).toBe('expanded');
  });
});

describe('getScaleFactor', () => {
  it('is 1 at the 360dp base width', () => {
    expect(getScaleFactor(360)).toBe(1);
  });

  it('clamps to the min and max', () => {
    expect(getScaleFactor(100)).toBe(0.85);
    expect(getScaleFactor(2000)).toBe(1.5);
  });
});

describe('getMaxContentWidth', () => {
  it('grows with the size class', () => {
    expect(getMaxContentWidth('compact')).toBeLessThan(getMaxContentWidth('medium'));
    expect(getMaxContentWidth('medium')).toBeLessThan(getMaxContentWidth('expanded'));
  });
});
