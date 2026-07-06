export type TimePeriod = '7d' | 'month' | 'quarter' | 'year';

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  '7d': 'Last 7 Days',
  month: 'This Month',
  quarter: 'Quarter',
  year: 'Current Year',
};

export const TIME_PERIODS: TimePeriod[] = ['7d', 'month', 'quarter', 'year'];

export function getPeriodDateRange(period: TimePeriod): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case '7d':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setDate(1);
      break;
    case 'quarter': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start.setMonth(qMonth, 1);
      break;
    }
    case 'year':
      start.setMonth(0, 1);
      break;
  }

  return { start, end: now };
}

export function getPeriodMultiplier(period: TimePeriod): number {
  switch (period) {
    case '7d':
      return 0.4386; // ~$150K when month base = $342K
    case 'month':
      return 1; // $342K base
    case 'quarter':
      return 2.485; // ~$850K
    case 'year':
      return 8.333; // ~$2.85M (hard cap)
  }
}

export function getPeriodDayCount(period: TimePeriod): number {
  switch (period) {
    case '7d':
      return 7;
    case 'month':
      return 30;
    case 'quarter':
      return 90;
    case 'year':
      return 365;
  }
}

export function formatPeriodDate(period: TimePeriod): string {
  const { start, end } = getPeriodDateRange(period);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(start)} - ${fmt(end)}`;
}

export function generateDailyLabels(period: TimePeriod): string[] {
  const count = Math.min(getPeriodDayCount(period), period === 'year' ? 12 : period === 'quarter' ? 13 : 7);
  const labels: string[] = [];
  const now = new Date();

  if (period === 'year') {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
    }
  } else if (period === 'quarter') {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
  } else {
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
  }

  return labels;
}

export function generateMockSeries(
  period: TimePeriod,
  baseValue: number,
  variance: number = 0.15,
  seed: number = 1
): number[] {
  const labels = generateDailyLabels(period);
  const multiplier = getPeriodMultiplier(period);
  const count = labels.length;

  return Array.from({ length: count }, (_, i) => {
    const trend = 1 + (i / count) * 0.1;
    const wave = Math.sin((i + seed) * 0.8) * variance;
    const noise = (pseudoRandom(seed + i) - 0.5) * variance;
    return Math.max(0, baseValue * multiplier * trend * (1 + wave + noise));
  });
}

export function generateMockValue(
  period: TimePeriod,
  baseValue: number,
  seed: number = 1
): number {
  const multiplier = getPeriodMultiplier(period);
  const variance = 1 + (pseudoRandom(seed) - 0.5) * 0.2;
  return Math.max(0, baseValue * multiplier * variance);
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
