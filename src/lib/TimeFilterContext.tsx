import { createContext, useContext, useState, ReactNode } from 'react';
import { TimePeriod, TIME_PERIOD_LABELS, TIME_PERIODS } from './timeFilter';

interface TimeFilterContextValue {
  period: TimePeriod;
  setPeriod: (p: TimePeriod) => void;
  periods: TimePeriod[];
  periodLabel: string;
  allPeriodLabels: Record<TimePeriod, string>;
}

const TimeFilterContext = createContext<TimeFilterContextValue | null>(null);

export function TimeFilterProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<TimePeriod>('month');

  return (
    <TimeFilterContext.Provider
      value={{
        period,
        setPeriod,
        periods: TIME_PERIODS,
        periodLabel: TIME_PERIOD_LABELS[period],
        allPeriodLabels: TIME_PERIOD_LABELS,
      }}
    >
      {children}
    </TimeFilterContext.Provider>
  );
}

export function useTimeFilter() {
  const ctx = useContext(TimeFilterContext);
  if (!ctx) throw new Error('useTimeFilter must be used within TimeFilterProvider');
  return ctx;
}
