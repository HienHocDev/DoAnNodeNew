import { getBudgetComparison, getBudgetStatus } from './index';

describe('Budget analysis helpers', () => {
  test.each([
    [69.9, 'An toàn'],
    [70, 'Cần chú ý'],
    [89.9, 'Cần chú ý'],
    [90, 'Sắp hết ngân sách'],
    [100, 'Sắp hết ngân sách'],
    [116.7, 'Vượt ngân sách']
  ])('maps %s percent to the correct status', (percentage, expected) => {
    expect(getBudgetStatus(percentage).label).toBe(expected);
  });

  test('calculates a 40 percent increase without division errors', () => {
    const comparison = getBudgetComparison(350000, 250000);
    expect(comparison.direction).toBe('up');
    expect(comparison.label).toContain('100.000đ');
    expect(comparison.label).toContain('40%');
  });

  test('handles zero previous spending', () => {
    expect(getBudgetComparison(350000, 0).label).toBe('Mới phát sinh');
    expect(getBudgetComparison(0, 0).label).toBe('Không thay đổi');
  });
});
