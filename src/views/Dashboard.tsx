import { useEffect } from 'react';
import {
  DollarSign,
  Target,
  PiggyBank,
  Shield,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Cloud,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useData } from '../lib/DataContext';
import { DonutChart, BarChart, Sparkline } from '../components/Charts';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const {
    loading,
    totalCloudSpend,
    totalCloudSpendFormatted,
    forecastedSpend,
    savingsAchieved,
    commitmentCoverage,
    monthOverMonthGrowth,
    providers,
    costsByProvider,
    costsByCategory,
    dailyCosts,
    anomalies,
  } = useData();

  // Fallback to pre-calculated data if Supabase is still loading
  useEffect(() => {
    // DataContext handles all fetching; this effect just ensures smooth loading
  }, []);

  const kpiCards = [
    {
      label: 'Total Cloud Spend',
      value: totalCloudSpendFormatted,
      change: monthOverMonthGrowth,
      icon: DollarSign,
      color: 'primary' as const,
    },
    {
      label: 'Forecasted Spend',
      value: `$${(forecastedSpend / 1000000).toFixed(2)}M`,
      change: 2.1,
      icon: Target,
      color: 'accent' as const,
    },
    {
      label: 'Savings Achieved',
      value: `$${(savingsAchieved / 1000).toFixed(0)}K`,
      change: 12.3,
      icon: PiggyBank,
      color: 'emerald' as const,
    },
    {
      label: 'Commitment Coverage',
      value: `${commitmentCoverage.toFixed(0)}%`,
      change: 5.2,
      icon: Shield,
      color: 'amber' as const,
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-4 h-32 skeleton rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 h-80 skeleton rounded-xl" />
          <div className="card p-6 h-80 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-navy-100">Cloud FinOps Dashboard</h2>
          <p className="text-sm text-navy-500 mt-1">
            Real-time cost monitoring and optimization insights
          </p>
        </div>

      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="stat-card card-hover cursor-pointer" onClick={() => onNavigate('cost-explorer')}>
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${getColorClasses(kpi.color)}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className={`flex items-center gap-1 text-xs ${
                kpi.change > 0 ? 'text-coral-400' : 'text-emerald-400'
              }`}>
                {kpi.change > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(kpi.change).toFixed(1)}%
              </span>
            </div>
            <div className="metric-value text-navy-100">{kpi.value}</div>
            <p className="metric-label">{kpi.label}</p>
            {kpi.sparkline && (
              <div className="mt-3">
                <Sparkline data={kpi.sparkline} width={160} height={32} color="#0ea5e9" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cost by Provider - Full Width */}
      <div className="card p-6 card-hover">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium text-navy-100">Cost by Provider</h3>
            <p className="text-xs text-navy-500 mt-1">Cloud spend distribution across all providers</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-navy-100">{totalCloudSpendFormatted}</p>
            <p className="text-xs text-navy-500">total spend</p>
          </div>
        </div>
        <div className="flex items-center gap-12">
          <DonutChart
            data={costsByProvider}
            size={220}
            thickness={28}
            showLegend
            showHoverTooltip
            centerValue={totalCloudSpendFormatted}
            centerLabel="total spend"
          />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {costsByProvider.map((provider, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-navy-800/30 rounded-lg hover:bg-navy-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: provider.color }} />
                  <span className="text-sm text-navy-300">{provider.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-navy-100">
                    ${provider.value >= 1000000
                      ? `${(provider.value / 1000000).toFixed(2)}M`
                      : provider.value >= 1000
                        ? `${(provider.value / 1000).toFixed(0)}K`
                        : provider.value.toFixed(0)}
                  </span>
                  <span className="text-xs text-navy-500 bg-navy-700/50 px-2 py-0.5 rounded">
                    {((provider.value / costsByProvider.reduce((s, p) => s + p.value, 0)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost by Category & Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost by Category */}
        <div className="card p-5 lg:col-span-2 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-navy-100">Cost by Category</h3>
              <p className="text-xs text-navy-500 mt-1">Top cloud spend categories</p>
            </div>
          </div>
          <BarChart data={costsByCategory} height={200} showValues />
        </div>

        {/* Anomalies */}
        <div className="card p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-navy-100">Anomalies</h3>
              <p className="text-xs text-navy-500 mt-1">Recent cost anomalies</p>
            </div>
            <span className="badge badge-danger">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {anomalies.length} Active
            </span>
          </div>
          <div className="space-y-3">
            {anomalies.slice(0, 4).map((anomaly) => (
              <div
                key={anomaly.id}
                className="flex items-start gap-3 p-3 bg-navy-800/30 rounded-lg border border-navy-700/50 hover:border-navy-600 transition-colors cursor-pointer"
                onClick={() => onNavigate('cost-explorer')}
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  anomaly.severity === 'critical' ? 'bg-coral-500/10 text-coral-400' :
                  anomaly.severity === 'high' ? 'bg-coral-500/10 text-coral-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-100 truncate">{anomaly.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-navy-500">{anomaly.anomaly_type}</span>
                    <span className="text-xs text-navy-600">|</span>
                    <span className="text-xs text-coral-400">
                      ${anomaly.cost_impact?.toLocaleString() ?? 0}
                    </span>
                  </div>
                </div>
                <span className={`text-xs flex-shrink-0 ${
                  anomaly.status === 'open' ? 'text-coral-400' : 'text-emerald-400'
                }`}>
                  {anomaly.status === 'open' ? 'Open' : 'Resolved'}
                </span>
              </div>
            ))}
            {anomalies.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-navy-400">No anomalies detected</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Provider Status */}
        <div className="card p-5 card-hover">
          <h3 className="font-medium text-navy-100 mb-4">Cloud Provider Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="p-4 bg-navy-800/30 rounded-lg border border-navy-700/50 hover:border-navy-600 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm text-navy-300">{provider.display_name}</span>
                </div>
                <div className="text-lg font-semibold text-navy-100">
                  {costsByProvider.find((p) => p.name === provider.display_name)?.value
                    ? `$${(costsByProvider.find((p) => p.name === provider.display_name)?.value! / 1000).toFixed(0)}K`
                    : '—'}
                </div>
                <div className="text-xs text-navy-500 mt-1">Active</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

