import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Activity,
  Target,
  ArrowDown,
  ArrowUp,
  Layers,
  Zap,
} from 'lucide-react';
import { useData } from '../lib/DataContext';
import { LineChart, BarChart, DonutChart, GaugeChart, ForecastChart } from '../components/Charts';
import { useTimeFilter } from '../lib/TimeFilterContext';
import { generateMockSeries, generateDailyLabels } from '../lib/timeFilter';

type ForecastPeriod = '30d' | '90d' | '12m';

export function Analytics() {
  const { period } = useTimeFilter();
  const {
    loading,
    totalCloudSpend,
    forecastedSpend,
    savingsAchieved,
    commitmentCoverage,
    budgetVariance,
    monthOverMonthGrowth,
    businessUnits,
  } = useData();

  const [forecastPeriod, setForecastPeriod] = useState<ForecastPeriod>('90d');
  const [activeMetric, setActiveMetric] = useState<'cost_per_customer' | 'cost_per_transaction' | 'cost_per_api' | 'cost_per_app'>('cost_per_transaction');

  const periodLabels = useMemo(() => generateDailyLabels(period), [period]);
  const periodTrendData = useMemo(() => {
    const series = generateMockSeries(period, totalCloudSpend / (periodLabels.length || 7), 0.08, 4);
    return periodLabels.map((name, i) => ({ name, value: series[i] }));
  }, [period, periodLabels, totalCloudSpend]);

  const forecastData = useMemo(() => {
    const base = totalCloudSpend;
    const periods: Record<ForecastPeriod, number> = {
      '30d': 1,
      '90d': 3,
      '12m': 12,
    };
    const count = periods[forecastPeriod];
    const now = new Date();
    const forecast = Array.from({ length: count }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      const value = base * (1 + (i + 1) * 0.03);
      return {
        name: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        value,
        isForecast: true,
      };
    });
    const history = periodTrendData.slice(-4).map((d) => ({ ...d, isForecast: false }));
    return [...history, ...forecast];
  }, [periodTrendData, forecastPeriod, totalCloudSpend]);

  const totalForecast = useMemo(() => forecastData.filter((d) => d.isForecast).reduce((sum, d) => sum + d.value, 0), [forecastData]);

  const unitMetrics = useMemo(() => {
    return businessUnits.map((bu, i) => ({
      name: bu.name,
      code: bu.code,
      costPerCustomer: ((Math.sin(i * 2.1) * 20 + 35) * (totalCloudSpend / 342000)).toFixed(2),
      costPerTransaction: ((Math.cos(i * 1.7) * 0.3 + 0.25) * (totalCloudSpend / 342000)).toFixed(3),
      costPerApi: ((Math.sin(i * 3.2) * 0.008 + 0.005) * (totalCloudSpend / 342000)).toFixed(5),
      costPerApp: ((Math.cos(i * 2.8) * 3000 + 4000) * (totalCloudSpend / 342000)).toFixed(0),
      trend: Math.sin(i * 1.5) > 0 ? 'down' : 'up',
      trendValue: (Math.abs(Math.sin(i * 2.3)) * 15).toFixed(1),
    }));
  }, [businessUnits, totalCloudSpend]);

  const benchmarkData = useMemo(() => [
    { metric: 'Cloud Cost Efficiency', value: Math.round((savingsAchieved / totalCloudSpend) * 100), benchmark: 85, trend: 'up' },
    { metric: 'Spot/RI Coverage', value: Math.round(commitmentCoverage), benchmark: 75, trend: 'up' },
    { metric: 'Cost Allocation Rate', value: Math.round(92 + (totalCloudSpend / 342000) * 0.5), benchmark: 90, trend: 'neutral' },
    { metric: 'Idle Resource Ratio', value: Math.round(Math.abs(budgetVariance)), benchmark: 10, trend: 'down' },
  ], [savingsAchieved, totalCloudSpend, commitmentCoverage, budgetVariance]);

  const kpiMetrics = useMemo(() => [
    {
      label: 'Total Forecasted Spend',
      value: `$${(totalForecast / 1000000).toFixed(2)}M`,
      period: forecastPeriod === '30d' ? 'Next 30 days' : forecastPeriod === '90d' ? 'Next 90 days' : 'Next 12 months',
      trend: { value: monthOverMonthGrowth, direction: 'up' as const },
      icon: Target,
      color: 'primary',
    },
    {
      label: 'Avg Cost per Customer',
      value: `$${((totalCloudSpend / 10000) * 0.8).toFixed(2)}`,
      period: 'Monthly average',
      trend: { value: -5.2, direction: 'down' as const },
      icon: Layers,
      color: 'accent',
    },
    {
      label: 'Infrastructure ROI',
      value: `${Math.round(180 + (savingsAchieved / 10000))}%`,
      period: 'Current quarter',
      trend: { value: 12, direction: 'up' as const },
      icon: Zap,
      color: 'emerald',
    },
    {
      label: 'FinOps Score',
      value: `${Math.round(70 + commitmentCoverage * 0.15)}/100`,
      period: 'Overall maturity',
      trend: { value: 3, direction: 'up' as const },
      icon: BarChart3,
      color: 'amber',
    },
  ], [totalForecast, forecastPeriod, monthOverMonthGrowth, totalCloudSpend, savingsAchieved, commitmentCoverage]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-96 bg-navy-900/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-navy-100">FinOps Analytics</h2>
          <p className="text-sm text-navy-500 mt-1">
            Cost trends, forecasting, and performance benchmarks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-navy-800/50 rounded-lg p-1">
            {(['30d', '90d', '12m'] as ForecastPeriod[]).map((fp) => (
              <button
                key={fp}
                onClick={() => setForecastPeriod(fp)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  forecastPeriod === fp ? 'bg-navy-700 text-navy-100' : 'text-navy-400'
                }`}
              >
                {fp === '30d' ? '30 Days' : fp === '90d' ? '90 Days' : '12 Months'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpiMetrics.map((kpi, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div
                className={`p-2 rounded-lg ${
                  kpi.color === 'primary'
                    ? 'bg-primary-500/10 text-primary-400'
                    : kpi.color === 'accent'
                    ? 'bg-accent-500/10 text-accent-400'
                    : kpi.color === 'emerald'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                <kpi.icon className="w-5 h-5" />
              </div>
              <span
                className={`flex items-center gap-1 text-xs ${
                  kpi.trend.direction === 'up'
                    ? 'text-coral-400'
                    : kpi.trend.direction === 'down'
                    ? 'text-emerald-400'
                    : 'text-navy-400'
                }`}
              >
                {kpi.trend.direction === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {Math.abs(kpi.trend.value)}%
              </span>
            </div>
            <div className="metric-value text-navy-100">{kpi.value}</div>
            <p className="metric-label">{kpi.label}</p>
            <p className="text-xs text-navy-600 mt-1">{kpi.period}</p>
          </div>
        ))}
      </div>

      {/* Forecast Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-navy-100">Spend Forecast</h3>
            <p className="text-xs text-navy-500 mt-1">Historical data with AI-powered predictions</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-2 text-navy-400">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              Historical
            </span>
            <span className="flex items-center gap-2 text-navy-400">
              <span className="w-3 h-3 rounded-full bg-teal-500 opacity-60" />
              Forecast
            </span>
          </div>
        </div>
        <div className="h-72 relative">
          <ForecastChart data={forecastData} height={280} />
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unit Economics */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-navy-800/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-navy-100">Unit Economics</h3>
                <p className="text-xs text-navy-500 mt-1">Cost efficiency per business unit</p>
              </div>
              <div className="flex items-center gap-1 bg-navy-800/50 rounded-lg p-1">
                {[
                  { id: 'cost_per_transaction' as const, label: 'Tx' },
                  { id: 'cost_per_customer' as const, label: 'Cust' },
                  { id: 'cost_per_api' as const, label: 'API' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMetric(m.id)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      activeMetric === m.id ? 'bg-navy-700 text-navy-100' : 'text-navy-500'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-800/50 bg-navy-900/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Business Unit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Value</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Trend</th>
                </tr>
              </thead>
              <tbody>
                {unitMetrics.slice(0, 6).map((unit, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm font-medium text-navy-100">{unit.name}</span>
                        <span className="text-xs text-navy-500 ml-2">({unit.code})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-navy-100">
                        ${unit[activeMetric]}
                      </span>
                      <span className="text-xs text-navy-500 ml-1">
                        {activeMetric === 'cost_per_transaction' ? '/tx' : activeMetric === 'cost_per_customer' ? '/cust' : '/call'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`flex items-center justify-end gap-1 ${
                        unit.trend === 'down' ? 'text-emerald-400' : 'text-coral-400'
                      }`}>
                        {unit.trend === 'down' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                        {unit.trendValue}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benchmarking */}
        <div className="card p-5">
          <h3 className="font-medium text-navy-100 mb-4">Performance Benchmarking</h3>
          <div className="space-y-4">
            {benchmarkData.map((item, i) => {
              const diff = item.value - item.benchmark;
              const status = diff >= 0 ? 'success' : 'warning';

              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-300">{item.metric}</span>
                    <span className={`font-medium ${status === 'success' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {item.value}%
                    </span>
                  </div>
                  <div className="relative h-2 bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(item.value, 100)}%` }}
                    />
                    <div
                      className={`absolute top-0 bottom-0 w-0.5 ${
                        status === 'success' ? 'bg-emerald-300' : 'bg-amber-300'
                      }`}
                      style={{ left: `${item.benchmark}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-navy-500">
                    <span>0%</span>
                    <span className="text-navy-400">Target: {item.benchmark}%</span>
                    <span>100%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Variance Analysis */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-navy-100">Budget Variance Analysis</h3>
          <span className={`badge ${budgetVariance < 0 ? 'badge-warning' : 'badge-success'}`}>
            {budgetVariance.toFixed(1)}% {budgetVariance < 0 ? 'Under Budget' : 'Over Budget'}
          </span>
        </div>
        <BarChart
          data={businessUnits.map((bu, i) => {
            const budget = (bu.budget || 100000) * (totalCloudSpend / 342000);
            const actual = budget * (0.85 + Math.sin(i * 2.1) * 0.15);
            return {
              name: bu.code || bu.name.substring(0, 10),
              value: actual,
              color: actual > budget ? '#ef4444' : '#10b981',
            };
          })}
          height={150}
          showValues={false}
        />
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4">
          {businessUnits.slice(0, 5).map((bu, i) => {
            const budget = (bu.budget || 100000) * (totalCloudSpend / 342000);
            const actual = budget * (0.85 + Math.sin(i * 2.1) * 0.15);
            const budgetUsage = Math.min((actual / budget) * 100, 100);
            return (
              <div key={i} className="text-center">
                <p className="text-lg font-bold text-navy-100">{budgetUsage.toFixed(0)}%</p>
                <p className="text-xs text-navy-500 truncate">{bu.code}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
