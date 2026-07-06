import { useEffect, useState, useMemo } from 'react';
import {
  Cloud,
  Server,
  MapPin,
  ChevronDown,
  ArrowUpDown,
  Download,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useData } from '../lib/DataContext';
import { CloudCost, CloudProvider } from '../types';
import { BarChart, DonutChart } from '../components/Charts';
import { exportToCsv } from '../lib/csvExport';

type GroupByType = 'provider' | 'service' | 'region' | 'account';

export function CostExplorer() {
  const { costScaleFactor } = useData();
  const [costs, setCosts] = useState<CloudCost[]>([]);
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupByType>('provider');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'cost'>('cost');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchCostData();
  }, []);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      const { data: providerData } = await supabase.from('cloud_providers').select('*');
      if (providerData) setProviders(providerData);

      const { data: costData } = await supabase
        .from('cloud_costs')
        .select('*')
        .order('cost_date', { ascending: false })
        .limit(500);
      if (costData) setCosts(costData);
    } catch (error) {
      console.error('Error fetching cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCosts = useMemo(() => {
    if (selectedProvider === 'all') return costs;
    return costs.filter((c) => c.provider_id === selectedProvider);
  }, [costs, selectedProvider]);

  const aggregatedData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; provider_id?: string }>();
    filteredCosts.forEach((cost) => {
      let key: string;
      switch (groupBy) {
        case 'provider': key = cost.provider_id; break;
        case 'service': key = cost.service_name || 'unknown'; break;
        case 'region': key = cost.region || 'unknown'; break;
        case 'account': key = cost.account_name || cost.account_id; break;
        default: key = cost.service_name || 'unknown';
      }
      map.set(key, {
        name: key,
        value: (map.get(key)?.value || 0) + cost.daily_cost * costScaleFactor,
        provider_id: cost.provider_id,
      });
    });
    return Array.from(map.values()).sort((a, b) => {
      if (sortBy === 'name') return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      return sortOrder === 'asc' ? a.value - b.value : b.value - a.value;
    });
  }, [filteredCosts, groupBy, sortBy, sortOrder]);

  const totalSpend = useMemo(
    () => filteredCosts.reduce((sum, c) => sum + c.daily_cost * costScaleFactor, 0),
    [filteredCosts, costScaleFactor]
  );

  const colorPalette = ['#0ea5e9', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4'];

  const colorMap = useMemo(() => {
    const colors: Record<string, string> = {};
    providers.forEach((p, i) => { colors[p.id] = p.color || colorPalette[i % colorPalette.length]; });
    return colors;
  }, [providers]);

  const getProviderName = (id: string) => providers.find((p) => p.id === id)?.display_name || id;
  const getProviderColor = (id: string) => colorMap[id] || '#64748b';

  const fmtCurrency = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(2)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}K` : `$${v.toFixed(0)}`;

  const totalSpendFormatted = fmtCurrency(totalSpend);

  const donutData = aggregatedData.slice(0, 6).map((item, i) => ({
    name: groupBy === 'provider' && item.provider_id ? getProviderName(item.provider_id) : item.name,
    value: item.value,
    color: groupBy === 'provider' && item.provider_id
      ? getProviderColor(item.provider_id)
      : colorPalette[i % colorPalette.length],
  }));

  const kpiCards = [
    {
      label: 'Total Spend',
      value: totalSpendFormatted,
      change: 8.3,
      icon: DollarSign,
      color: 'primary' as const,
      sub: 'filtered selection',
    },
    {
      label: 'Providers',
      value: String(new Set(filteredCosts.map((c) => c.provider_id)).size),
      change: 0,
      icon: Cloud,
      color: 'accent' as const,
      sub: 'active clouds',
    },
    {
      label: 'Services',
      value: String(new Set(filteredCosts.map((c) => c.service_name).filter(Boolean)).size),
      change: 0,
      icon: Layers,
      color: 'emerald' as const,
      sub: 'unique services',
    },
    {
      label: 'Regions',
      value: String(new Set(filteredCosts.map((c) => c.region).filter(Boolean)).size),
      change: 0,
      icon: MapPin,
      color: 'amber' as const,
      sub: 'data centers',
    },
  ];

  const getColorClasses = (color: string) => {
    const map: Record<string, string> = {
      primary: 'bg-primary-500/10 text-primary-400',
      accent: 'bg-accent-500/10 text-accent-400',
      emerald: 'bg-emerald-500/10 text-emerald-400',
      amber: 'bg-amber-500/10 text-amber-400',
    };
    return map[color] || map.primary;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card p-4 h-32 skeleton rounded-xl" />)}
        </div>
        <div className="card p-6 h-80 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-navy-100">Multi-Cloud Cost Analysis</h2>
          <p className="text-sm text-navy-500 mt-1">
            Analyze costs across AWS, Azure, GCP, OCI, Alibaba Cloud, and Kubernetes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="input pl-10 pr-8 appearance-none cursor-pointer"
            >
              <option value="all">All Providers</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
              ))}
            </select>
            <Cloud className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500 pointer-events-none" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByType)}
              className="input pl-10 pr-8 appearance-none cursor-pointer"
            >
              <option value="provider">By Provider</option>
              <option value="service">By Service</option>
              <option value="region">By Region</option>
              <option value="account">By Account</option>
            </select>
            <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500 pointer-events-none" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500 pointer-events-none" />
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => {
              const rows = aggregatedData.map((item) => ({
                Name: item.name,
                Cost_USD: item.value.toFixed(2),
                Percent_of_Total: ((item.value / totalSpend) * 100).toFixed(2) + '%',
                Provider: item.provider_id ? getProviderName(item.provider_id) : 'Multi',
              }));
              exportToCsv(`cost-explorer-${groupBy}-${new Date().toISOString().slice(0, 10)}`, rows);
            }}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="stat-card card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${getColorClasses(kpi.color)}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              {kpi.change !== 0 && (
                <span className={`flex items-center gap-1 text-xs ${kpi.change > 0 ? 'text-coral-400' : 'text-emerald-400'}`}>
                  {kpi.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(kpi.change).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="metric-value text-navy-100">{kpi.value}</div>
            <p className="metric-label">{kpi.label}</p>
            <p className="text-xs text-navy-600 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Cost Distribution — full width, mirrors Dashboard "Cost by Provider" */}
      <div className="card p-6 card-hover">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium text-navy-100">Cost Distribution</h3>
            <p className="text-xs text-navy-500 mt-1">
              Spend breakdown by {groupBy}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-navy-100">{totalSpendFormatted}</p>
            <p className="text-xs text-navy-500">total spend</p>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <DonutChart
            data={donutData}
            size={220}
            thickness={28}
            showLegend
            showHoverTooltip
            centerValue={totalSpendFormatted}
            centerLabel="total spend"
          />

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {donutData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-navy-800/30 rounded-lg hover:bg-navy-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-navy-300 truncate max-w-[120px]">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-medium text-navy-100">{fmtCurrency(item.value)}</span>
                  <span className="text-xs text-navy-500 bg-navy-700/50 px-2 py-0.5 rounded">
                    {((item.value / totalSpend) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card p-5 card-hover">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-navy-100">Top Cost Drivers</h3>
            <p className="text-xs text-navy-500 mt-1">Top 10 by {groupBy}</p>
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary text-xs py-1 px-2"
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>
        <BarChart
          data={aggregatedData.slice(0, 10).map((item, i) => ({
            name: item.name.length > 14 ? item.name.substring(0, 14) + '..' : item.name,
            value: item.value,
            color: groupBy === 'provider' && item.provider_id
              ? getProviderColor(item.provider_id)
              : colorPalette[i % colorPalette.length],
          }))}
          height={200}
          showValues
        />
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-navy-800/50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-navy-100">Detailed Breakdown</h3>
            <span className="text-xs text-navy-500">{filteredCosts.length} records</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-800/50 bg-navy-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase tracking-wider">Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase tracking-wider">% of Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">Provider</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-navy-500">No data available</td>
                </tr>
              ) : (
                aggregatedData.slice(0, 15).map((item, index) => (
                  <tr key={index} className="table-row">
                    <td className="px-4 py-3 text-sm text-navy-200">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-navy-100 text-right font-medium">
                      ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-400 text-right">
                      {((item.value / totalSpend) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.provider_id ? getProviderColor(item.provider_id) : '#64748b' }}
                        />
                        <span className="text-navy-400">
                          {item.provider_id ? getProviderName(item.provider_id) : 'Multi'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
