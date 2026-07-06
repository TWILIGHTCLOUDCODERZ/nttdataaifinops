import { useEffect, useState, useMemo } from 'react';
import {
  FileCheck,
  Calendar,
  DollarSign,
  Percent,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Download,
  ChevronDown,
  BarChart3,
  Layers,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Commitment, CloudProvider } from '../types';
import { BarChart, DonutChart, LineChart } from '../components/Charts';
import { exportToCsv } from '../lib/csvExport';

interface UtilizationHistory {
  commitment_id: string;
  period_month: string;
  utilized_amount: number;
  monthly_commitment: number;
  utilization_pct: number;
}

const TYPE_COLORS: Record<string, string> = {
  'Reserved Instance': '#0ea5e9',
  'Savings Plan': '#14b8a6',
  'CUD': '#f59e0b',
};

const TYPE_ABBR: Record<string, string> = {
  'Reserved Instance': 'RI',
  'Savings Plan': 'SP',
  'CUD': 'CUD',
};

function formatK(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function Commitments() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [history, setHistory] = useState<UtilizationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'expiring' | 'all'>('active');
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [{ data: commitmentData }, { data: providerData }, { data: historyData }] =
        await Promise.all([
          supabase.from('commitments').select('*').order('end_date', { ascending: true }),
          supabase.from('cloud_providers').select('*'),
          supabase
            .from('commitment_utilization_history')
            .select('*')
            .order('period_month', { ascending: true }),
        ]);

      if (commitmentData) setCommitments(commitmentData);
      if (providerData) setProviders(providerData);
      if (historyData) setHistory(historyData);
    } catch (err) {
      console.error('Error fetching commitments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProvider = (id: string) => providers.find((p) => p.id === id);

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const filteredCommitments = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return commitments.filter((c) => c.status === 'active');
      case 'expiring':
        return commitments.filter((c) => {
          if (!c.end_date) return false;
          const d = new Date(c.end_date);
          return d <= thirtyDaysFromNow && d >= now;
        });
      default:
        return commitments;
    }
  }, [commitments, activeTab]);

  const metrics = useMemo(() => {
    const active = commitments.filter((c) => c.status === 'active');
    const totalCommitment = active.reduce((s, c) => s + (c.monthly_commitment || 0), 0);
    const totalUtilized = active.reduce((s, c) => s + (c.utilized_amount || 0), 0);
    const avgUtilization = totalCommitment > 0 ? (totalUtilized / totalCommitment) * 100 : 0;
    const avgCoverage =
      active.reduce((s, c) => s + (c.coverage_percent || 0), 0) / (active.length || 1);
    const expiringCount = commitments.filter((c) => {
      if (!c.end_date) return false;
      const d = new Date(c.end_date);
      return d <= thirtyDaysFromNow;
    }).length;

    // Per-type breakdown for RI/SP/CUD comparison
    const byType: Record<
      string,
      { count: number; monthly: number; utilized: number; coverage: number[]; savings: number }
    > = {};
    active.forEach((c) => {
      const t = c.commitment_type;
      if (!byType[t]) byType[t] = { count: 0, monthly: 0, utilized: 0, coverage: [], savings: 0 };
      byType[t].count++;
      byType[t].monthly += c.monthly_commitment || 0;
      byType[t].utilized += c.utilized_amount || 0;
      byType[t].coverage.push(c.coverage_percent || 0);
      // Estimate savings: ~30% of committed amount at full utilization
      byType[t].savings += (c.monthly_commitment || 0) * 0.3 * ((c.utilized_amount || 0) / Math.max(c.monthly_commitment || 1, 1));
    });

    const byProvider: Record<string, { monthly: number; utilized: number }> = {};
    active.forEach((c) => {
      if (!byProvider[c.provider_id]) byProvider[c.provider_id] = { monthly: 0, utilized: 0 };
      byProvider[c.provider_id].monthly += c.monthly_commitment || 0;
      byProvider[c.provider_id].utilized += c.utilized_amount || 0;
    });

    return { totalCommitment, totalUtilized, avgUtilization, avgCoverage, expiringCount, byType, byProvider };
  }, [commitments]);

  // Aggregate history across all commitments into a monthly utilization% trend
  const overallTrendData = useMemo(() => {
    const monthly: Record<string, { utilized: number; commitment: number }> = {};
    history.forEach((h) => {
      const month = h.period_month.slice(0, 7); // YYYY-MM
      if (!monthly[month]) monthly[month] = { utilized: 0, commitment: 0 };
      monthly[month].utilized += Number(h.utilized_amount);
      monthly[month].commitment += Number(h.monthly_commitment);
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        name: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        value: data.commitment > 0 ? (data.utilized / data.commitment) * 100 : 0,
      }));
  }, [history]);

  // Per-commitment trend for the selected commitment detail view
  const selectedTrendData = useMemo(() => {
    if (!selectedCommitmentId) return [];
    return history
      .filter((h) => h.commitment_id === selectedCommitmentId)
      .map((h) => ({
        name: new Date(h.period_month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        value: Number(h.utilization_pct),
      }));
  }, [history, selectedCommitmentId]);

  // Per-type trend data for comparison chart
  const typeTrendData = useMemo(() => {
    const types = ['Reserved Instance', 'Savings Plan', 'CUD'];
    // Group history by month + type
    const map: Record<string, Record<string, { utilized: number; commitment: number }>> = {};
    const commitmentTypeMap: Record<string, string> = {};
    commitments.forEach((c) => { commitmentTypeMap[c.id] = c.commitment_type; });

    history.forEach((h) => {
      const month = h.period_month.slice(0, 7);
      const type = commitmentTypeMap[h.commitment_id];
      if (!type) return;
      if (!map[month]) map[month] = {};
      if (!map[month][type]) map[month][type] = { utilized: 0, commitment: 0 };
      map[month][type].utilized += Number(h.utilized_amount);
      map[month][type].commitment += Number(h.monthly_commitment);
    });

    const months = Object.keys(map).sort();
    return types.map((type) => ({
      type,
      color: TYPE_COLORS[type] || '#64748b',
      data: months.map((month) => ({
        name: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        value: map[month]?.[type]
          ? (map[month][type].utilized / Math.max(map[month][type].commitment, 1)) * 100
          : 0,
      })),
    }));
  }, [history, commitments]);

  const providerChartData = Object.entries(metrics.byProvider).map(([id, data]) => {
    const p = getProvider(id);
    return { name: p?.display_name || id, value: data.monthly, color: p?.color || '#64748b' };
  });

  const typeChartData = Object.entries(metrics.byType).map(([type, data]) => ({
    name: type,
    value: data.monthly,
    color: TYPE_COLORS[type] || '#64748b',
  }));

  const handleExport = (mode: 'summary' | 'detail' | 'history') => {
    setShowExportMenu(false);
    const date = new Date().toISOString().slice(0, 10);

    if (mode === 'summary') {
      const rows = filteredCommitments.map((c) => {
        const p = getProvider(c.provider_id);
        const util = c.monthly_commitment && c.utilized_amount
          ? ((c.utilized_amount / c.monthly_commitment) * 100).toFixed(1) + '%'
          : '0%';
        return {
          Name: c.name,
          Type: c.commitment_type,
          Provider: p?.display_name || c.provider_id,
          Monthly_Commitment_USD: c.monthly_commitment?.toFixed(2) || '0',
          Utilized_USD: c.utilized_amount?.toFixed(2) || '0',
          Utilization: util,
          Coverage_Percent: c.coverage_percent?.toFixed(1) + '%' || '0%',
          Start_Date: c.start_date || '',
          End_Date: c.end_date || '',
          Status: c.status || '',
        };
      });
      exportToCsv(`commitments-summary-${date}`, rows);
    } else if (mode === 'detail') {
      const rows = Object.entries(metrics.byType).map(([type, data]) => ({
        Type: type,
        Count: data.count,
        Total_Monthly_USD: data.monthly.toFixed(2),
        Total_Utilized_USD: data.utilized.toFixed(2),
        Avg_Utilization: data.monthly > 0 ? ((data.utilized / data.monthly) * 100).toFixed(1) + '%' : '0%',
        Avg_Coverage: data.coverage.length
          ? (data.coverage.reduce((a, b) => a + b, 0) / data.coverage.length).toFixed(1) + '%'
          : '0%',
        Est_Monthly_Savings_USD: data.savings.toFixed(2),
      }));
      exportToCsv(`commitments-by-type-${date}`, rows);
    } else {
      const commitmentNameMap: Record<string, string> = {};
      commitments.forEach((c) => { commitmentNameMap[c.id] = c.name; });
      const rows = history.map((h) => ({
        Commitment: commitmentNameMap[h.commitment_id] || h.commitment_id,
        Period_Month: h.period_month,
        Monthly_Commitment_USD: Number(h.monthly_commitment).toFixed(2),
        Utilized_USD: Number(h.utilized_amount).toFixed(2),
        Utilization_Pct: Number(h.utilization_pct).toFixed(1) + '%',
      }));
      exportToCsv(`commitments-history-${date}`, rows);
    }
  };

  const daysUntilExpiry = (endDate: string) => {
    const d = Math.ceil((new Date(endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return d;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-navy-900/50 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-56 bg-navy-900/50 rounded-xl animate-pulse" />)}
        </div>
        <div className="h-80 bg-navy-900/50 rounded-xl animate-pulse" />
        <div className="h-96 bg-navy-900/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-navy-100">Commitment Management</h2>
          <p className="text-sm text-navy-500 mt-1">
            Reserved Instances, Savings Plans, and Committed Use Discounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              className="btn btn-secondary"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="w-4 h-4" />
              Export CSV
              <ChevronDown className="w-3 h-3" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-navy-800 border border-navy-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => handleExport('summary')}
                  className="w-full px-4 py-3 text-sm text-left text-navy-200 hover:bg-navy-700 transition-colors flex items-center gap-3"
                >
                  <FileCheck className="w-4 h-4 text-primary-400" />
                  Commitment Summary
                </button>
                <button
                  onClick={() => handleExport('detail')}
                  className="w-full px-4 py-3 text-sm text-left text-navy-200 hover:bg-navy-700 transition-colors flex items-center gap-3"
                >
                  <BarChart3 className="w-4 h-4 text-teal-400" />
                  RI / SP / CUD Breakdown
                </button>
                <button
                  onClick={() => handleExport('history')}
                  className="w-full px-4 py-3 text-sm text-left text-navy-200 hover:bg-navy-700 transition-colors flex items-center gap-3"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  Utilization History
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Total Active Commitments</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">{formatK(metrics.totalCommitment)}</div>
          <div className="text-xs text-navy-500 mt-2">Monthly committed value</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <Percent className="w-4 h-4" />
            <span className="text-sm">Overall Utilization</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">{metrics.avgUtilization.toFixed(1)}%</div>
          <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.avgUtilization > 90 ? 'bg-emerald-500' :
                metrics.avgUtilization > 75 ? 'bg-amber-500' : 'bg-coral-500'
              }`}
              style={{ width: `${Math.min(metrics.avgUtilization, 100)}%` }}
            />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <FileCheck className="w-4 h-4" />
            <span className="text-sm">Coverage Rate</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">{metrics.avgCoverage.toFixed(1)}%</div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400">
              {overallTrendData.length >= 2
                ? `${(overallTrendData[overallTrendData.length - 1].value - overallTrendData[overallTrendData.length - 2].value).toFixed(1)}% MoM`
                : 'Stable'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Expiring Soon</span>
          </div>
          <div className={`text-2xl font-bold ${metrics.expiringCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {metrics.expiringCount}
          </div>
          <div className="text-xs text-navy-500 mt-2">Within 30 days</div>
        </div>
      </div>

      {/* Overall Utilization Trend */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-navy-100">Overall Utilization Trend</h3>
            <p className="text-xs text-navy-500 mt-0.5">
              Aggregate utilization % across all active commitments — last 12 months
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-navy-400">
            {overallTrendData.length > 0 && (
              <>
                <span className="text-navy-500">Latest:</span>
                <span
                  className={`font-semibold ${
                    overallTrendData[overallTrendData.length - 1].value > 90 ? 'text-emerald-400' :
                    overallTrendData[overallTrendData.length - 1].value > 75 ? 'text-amber-400' : 'text-coral-400'
                  }`}
                >
                  {overallTrendData[overallTrendData.length - 1].value.toFixed(1)}%
                </span>
              </>
            )}
          </div>
        </div>
        <LineChart
          data={overallTrendData}
          height={200}
          gradient="commitment-trend"
          lineColor="#0ea5e9"
        />
        {/* Threshold markers as legend */}
        <div className="flex items-center gap-6 mt-3 justify-end">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-3 h-0.5 bg-emerald-500 rounded" /> &gt;90% optimal
          </span>
          <span className="flex items-center gap-1.5 text-xs text-amber-400">
            <span className="w-3 h-0.5 bg-amber-500 rounded" /> 75–90% acceptable
          </span>
          <span className="flex items-center gap-1.5 text-xs text-coral-400">
            <span className="w-3 h-0.5 bg-coral-500 rounded" /> &lt;75% underutilized
          </span>
        </div>
      </div>

      {/* RI / SP / CUD Comparison */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-medium text-navy-100">RI vs SP vs CUD Comparison</h3>
            <p className="text-xs text-navy-500 mt-0.5">Side-by-side performance of each commitment type</p>
          </div>
        </div>

        {/* Comparison cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {['Reserved Instance', 'Savings Plan', 'CUD'].map((type) => {
            const data = metrics.byType[type];
            if (!data) return (
              <div key={type} className="rounded-xl border border-navy-800/60 p-4 opacity-40">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{ background: (TYPE_COLORS[type] || '#64748b') + '20', color: TYPE_COLORS[type] }}
                  >
                    {TYPE_ABBR[type] || type}
                  </span>
                  <span className="text-sm text-navy-400">{type}</span>
                </div>
                <p className="text-xs text-navy-600">No active commitments</p>
              </div>
            );

            const utilPct = data.monthly > 0 ? (data.utilized / data.monthly) * 100 : 0;
            const avgCov =
              data.coverage.length
                ? data.coverage.reduce((a, b) => a + b, 0) / data.coverage.length
                : 0;
            const color = TYPE_COLORS[type] || '#64748b';

            return (
              <div
                key={type}
                className="rounded-xl border p-4 transition-all duration-200"
                style={{ borderColor: color + '40', background: color + '08' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{ background: color + '25', color }}
                    >
                      {TYPE_ABBR[type] || type}
                    </span>
                    <span className="text-sm font-medium text-navy-200">{type}</span>
                  </div>
                  <span className="text-xs text-navy-500">{data.count} active</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-navy-500 mb-1">
                      <span>Committed</span>
                      <span className="font-medium text-navy-200">{formatK(data.monthly)}/mo</span>
                    </div>
                    <div className="flex justify-between text-xs text-navy-500 mb-1">
                      <span>Utilized</span>
                      <span className="font-medium text-navy-200">{formatK(data.utilized)}/mo</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-navy-500">Utilization</span>
                      <span
                        className="font-semibold"
                        style={{ color: utilPct > 90 ? '#10b981' : utilPct > 75 ? '#f59e0b' : '#f87171' }}
                      >
                        {utilPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(utilPct, 100)}%`,
                          backgroundColor: utilPct > 90 ? '#10b981' : utilPct > 75 ? '#f59e0b' : '#f87171',
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-navy-500">Avg Coverage</span>
                    <span className="font-medium text-navy-200">{avgCov.toFixed(1)}%</span>
                  </div>

                  <div className="pt-2 border-t border-navy-800/60">
                    <div className="flex justify-between text-xs">
                      <span className="text-navy-500">Est. Monthly Savings</span>
                      <span className="font-semibold text-emerald-400">{formatK(data.savings)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Per-type utilization trend lines side by side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {typeTrendData.map((series) => (
            <div key={series.type} className="bg-navy-900/40 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: series.color }} />
                <span className="text-xs text-navy-400">{series.type} — 12-Month Trend</span>
              </div>
              {series.data.some((d) => d.value > 0) ? (
                <LineChart data={series.data} height={100} lineColor={series.color} showGrid={false} />
              ) : (
                <div className="h-[100px] flex items-center justify-center text-xs text-navy-600">
                  No history data
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-navy-800/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(
                [
                  { id: 'active', label: 'Active', count: commitments.filter((c) => c.status === 'active').length },
                  {
                    id: 'expiring', label: 'Expiring Soon', count: commitments.filter((c) => {
                      if (!c.end_date) return false;
                      const d = new Date(c.end_date);
                      return d <= thirtyDaysFromNow && d >= now;
                    }).length,
                  },
                  { id: 'all', label: 'All', count: commitments.length },
                ] as { id: typeof activeTab; label: string; count: number }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-navy-800/50 text-navy-400 hover:bg-navy-800 hover:text-navy-200'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs opacity-75">({tab.count})</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {/* Provider + Type summary donuts */}
              <div className="flex items-center gap-1.5 text-xs text-navy-500">
                {typeChartData.map((t) => (
                  <span key={t.name} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: t.color }} />
                    {TYPE_ABBR[t.name] || t.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-800/50 bg-navy-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Commitment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Provider</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Monthly</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Utilized</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Utilization</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Coverage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommitments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-navy-500">
                    No commitments found
                  </td>
                </tr>
              ) : (
                filteredCommitments.map((c) => {
                  const provider = getProvider(c.provider_id);
                  const util =
                    c.monthly_commitment && c.utilized_amount
                      ? (c.utilized_amount / c.monthly_commitment) * 100
                      : 0;
                  const color = TYPE_COLORS[c.commitment_type] || '#64748b';
                  const days = c.end_date ? daysUntilExpiry(c.end_date) : null;
                  const isSelected = selectedCommitmentId === c.id;

                  return (
                    <>
                      <tr
                        key={c.id}
                        className={`table-row cursor-pointer ${isSelected ? 'bg-navy-800/40' : ''}`}
                        onClick={() => setSelectedCommitmentId(isSelected ? null : c.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ backgroundColor: color + '20', color }}
                            >
                              {TYPE_ABBR[c.commitment_type] || 'CO'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-navy-100">{c.name}</p>
                              <p className="text-xs text-navy-500">{c.commitment_type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: provider?.color || '#64748b' }} />
                            <span className="text-sm text-navy-300">{provider?.display_name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-navy-100">
                          {formatK(c.monthly_commitment || 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-navy-400">
                          {formatK(c.utilized_amount || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="flex-1 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(util, 100)}%`,
                                  backgroundColor: util > 90 ? '#10b981' : util > 75 ? '#f59e0b' : '#f87171',
                                }}
                              />
                            </div>
                            <span
                              className="text-xs font-medium w-10 text-right"
                              style={{ color: util > 90 ? '#10b981' : util > 75 ? '#f59e0b' : '#f87171' }}
                            >
                              {util.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-navy-300">
                          {c.coverage_percent?.toFixed(1) ?? '—'}%
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="w-3 h-3 text-navy-500" />
                            {c.end_date ? (
                              <span className={days !== null && days <= 30 ? 'text-amber-400' : 'text-navy-400'}>
                                {new Date(c.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {days !== null && days <= 90 && (
                                  <span className="ml-1 text-xs text-amber-500">({days}d)</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-navy-600">N/A</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`badge ${
                              c.status === 'active' ? 'badge-success' :
                              c.status === 'expiring' ? 'badge-warning' : 'badge-info'
                            }`}
                          >
                            {c.status || 'unknown'}
                          </span>
                        </td>
                      </tr>

                      {/* Inline utilization trend drawer */}
                      {isSelected && selectedTrendData.length > 0 && (
                        <tr key={`${c.id}-trend`} className="bg-navy-900/30">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="flex items-start gap-6">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Zap className="w-3.5 h-3.5 text-primary-400" />
                                  <span className="text-xs font-medium text-navy-300">
                                    {c.name} — Utilization Trend (12 months)
                                  </span>
                                </div>
                                <LineChart
                                  data={selectedTrendData}
                                  height={120}
                                  lineColor={color}
                                  gradient={`trend-${c.id}`}
                                />
                              </div>
                              <div className="w-48 space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-navy-500">Peak utilization</span>
                                  <span className="text-navy-200 font-medium">
                                    {Math.max(...selectedTrendData.map((d) => d.value)).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-navy-500">Min utilization</span>
                                  <span className="text-navy-200 font-medium">
                                    {Math.min(...selectedTrendData.map((d) => d.value)).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-navy-500">Avg utilization</span>
                                  <span className="text-navy-200 font-medium">
                                    {(selectedTrendData.reduce((s, d) => s + d.value, 0) / selectedTrendData.length).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-navy-500">MoM change</span>
                                  {selectedTrendData.length >= 2 ? (
                                    <span className={
                                      selectedTrendData[selectedTrendData.length - 1].value >=
                                      selectedTrendData[selectedTrendData.length - 2].value
                                        ? 'text-emerald-400 font-medium'
                                        : 'text-coral-400 font-medium'
                                    }>
                                      {selectedTrendData[selectedTrendData.length - 1].value >=
                                       selectedTrendData[selectedTrendData.length - 2].value ? '+' : ''}
                                      {(
                                        selectedTrendData[selectedTrendData.length - 1].value -
                                        selectedTrendData[selectedTrendData.length - 2].value
                                      ).toFixed(1)}%
                                    </span>
                                  ) : <span className="text-navy-600">—</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Charts row below table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border-t border-navy-800/50">
          <div>
            <h4 className="text-xs font-medium text-navy-400 mb-3">By Provider</h4>
            {providerChartData.length > 0 ? (
              <DonutChart
                data={providerChartData}
                size={160}
                thickness={20}
                centerValue={formatK(metrics.totalCommitment).replace('$', '')}
                centerLabel="Total/mo"
              />
            ) : (
              <div className="text-center text-navy-500 py-6 text-sm">No data</div>
            )}
          </div>
          <div>
            <h4 className="text-xs font-medium text-navy-400 mb-3">By Type</h4>
            {typeChartData.length > 0 ? (
              <>
                <BarChart data={typeChartData} height={130} showValues={false} />
                <div className="flex flex-wrap gap-3 mt-2">
                  {typeChartData.map((t) => (
                    <div key={t.name} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: t.color }} />
                      <span className="text-xs text-navy-400">{formatK(t.value)} {TYPE_ABBR[t.name] || t.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-navy-500 py-6 text-sm">No data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
