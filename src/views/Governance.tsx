import { useEffect, useState, useMemo } from 'react';
import {
  Shield,
  AlertTriangle,
  Bell,
  CheckCircle,
  XCircle,
  Settings,
  FileText,
  Users,
  DollarSign,
  Clock,
  Tag,
  TrendingUp,
  Lock,
  Send,
  Plus,
  MoreVertical
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BudgetPolicy, CostAnomaly, CloudProvider } from '../types';
import { DonutChart } from '../components/Charts';

export function Governance() {
  const [policies, setPolicies] = useState<BudgetPolicy[]>([]);
  const [anomalies, setAnomalies] = useState<CostAnomaly[]>([]);
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'policies' | 'alerts' | 'anomalies' | 'compliance'>('policies');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: policyData } = await supabase
        .from('budget_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (policyData) setPolicies(policyData);

      const { data: anomalyData } = await supabase
        .from('cost_anomalies')
        .select('*')
        .order('detected_at', { ascending: false });

      if (anomalyData) setAnomalies(anomalyData);

      const { data: providerData } = await supabase
        .from('cloud_providers')
        .select('*');

      if (providerData) setProviders(providerData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const activePolicies = policies.filter((p) => p.is_active).length;
    const newAnomalies = anomalies.filter((a) => a.status === 'new').length;
    const highSeverity = anomalies.filter((a) => a.severity === 'high').length;
    const totalImpact = anomalies.reduce((sum, a) => sum + (a.cost_impact || 0), 0);

    return { activePolicies, newAnomalies, highSeverity, totalImpact };
  }, [policies, anomalies]);

  const getProvider = (id: string) => providers.find((p) => p.id === id);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-96 bg-navy-900/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  const complianceScores = [
    { category: 'Tagging Compliance', score: 85 },
    { category: 'Budget Controls', score: 92 },
    { category: 'Naming Standards', score: 78 },
    { category: 'Security Policies', score: 95 },
    { category: 'Cost Allocation', score: 88 },
  ];

  const alertChannels = [
    { name: 'Email', icon: Send, configured: true, destinations: ['finops@nttdata.com', 'cloud@nttdata.com'] },
    { name: 'Slack', icon: Bell, configured: true, destinations: ['#cloud-costs', '#finops-alerts'] },
    { name: 'Microsoft Teams', icon: Users, configured: false, destinations: [] },
    { name: 'Webhook', icon: Send, configured: true, destinations: ['https://webhook.site/finops'] },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-navy-100">Governance Center</h2>
          <p className="text-sm text-navy-500 mt-1">
            Policies, budget controls, anomaly detection, and compliance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" />
            New Policy
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Active Policies</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">{metrics.activePolicies}</div>
          <div className="text-xs text-navy-500 mt-2">Budget guardrails</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">New Anomalies</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{metrics.newAnomalies}</div>
          <div className="flex items-center gap-1 mt-2">
            <span className="badge badge-danger">{metrics.highSeverity} High</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <Tag className="w-4 h-4" />
            <span className="text-sm">Tagging Compliance</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">85%</div>
          <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Anomaly Impact</span>
          </div>
          <div className="text-2xl font-bold text-coral-400">
            ${(metrics.totalImpact / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-navy-500 mt-2">Potential cost impact</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: 'policies', label: 'Budget Policies', icon: FileText, count: policies.length },
          { id: 'alerts', label: 'Alert Channels', icon: Bell, count: alertChannels.filter((a) => a.configured).length },
          { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle, count: anomalies.length },
          { id: 'compliance', label: 'Compliance', icon: CheckCircle, count: complianceScores.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'bg-navy-800/50 text-navy-400 hover:bg-navy-800 hover:text-navy-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="bg-navy-900/50 px-1.5 rounded-full text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-navy-800/50">
                <h3 className="font-medium text-navy-100">Budget Policies</h3>
                <p className="text-xs text-navy-500 mt-1">Active budget controls and thresholds</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-navy-800/50 bg-navy-900/30">
                      <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Policy</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Scope</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Budget</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-navy-500 uppercase">Alerts</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-navy-500 uppercase">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((policy) => (
                      <tr key={policy.id} className="table-row">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-500/10 rounded-lg">
                              <Shield className="w-4 h-4 text-primary-400" />
                            </div>
                            <span className="text-sm font-medium text-navy-100">{policy.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-navy-400">{policy.scope}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-navy-100">
                            ${policy.budget_amount?.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {[50, 75, 90, 100].map((threshold) => {
                              const isActive = threshold <= 90
                                ? policy[`alert_threshold_${threshold}` as keyof BudgetPolicy] as boolean
                                : policy.alert_threshold_100;
                              return (
                                <span
                                  key={threshold}
                                  className={`w-5 h-5 rounded text-xs flex items-center justify-center ${
                                    isActive
                                      ? threshold <= 50
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : threshold <= 75
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : threshold <= 90
                                        ? 'bg-coral-500/20 text-coral-400'
                                        : 'bg-coral-600/20 text-coral-500'
                                      : 'bg-navy-800 text-navy-600'
                                  }`}
                                >
                                  {threshold}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`badge ${policy.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {policy.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1.5 hover:bg-navy-800 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-navy-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Budget Overview */}
            <div className="card p-5">
              <h3 className="font-medium text-navy-100 mb-4">Budget Health</h3>
              {(() => {
                const totalBudget = policies.reduce((s, p) => s + (p.budget_amount || 0), 0);
                const spent = Math.round(totalBudget * 0.78);
                const remaining = totalBudget - spent;
                const donutData = [
                  { name: 'Spent', value: spent, color: '#10b981' },
                  { name: 'Remaining', value: remaining, color: '#1e3a5f' },
                ];
                return (
                  <>
                    <div className="flex justify-center mb-4">
                      <DonutChart
                        data={donutData}
                        size={160}
                        thickness={22}
                        showLegend={false}
                        showHoverTooltip
                        centerValue="78%"
                        centerLabel="utilized"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="text-navy-400">Spent</span>
                        </div>
                        <span className="font-medium text-coral-400">
                          ${spent.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-navy-700 border border-navy-600 flex-shrink-0" />
                          <span className="text-navy-400">Remaining</span>
                        </div>
                        <span className="font-medium text-emerald-400">
                          ${remaining.toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-navy-800/50 pt-3 flex items-center justify-between text-sm">
                        <span className="text-navy-400">Total Budget</span>
                        <span className="font-medium text-navy-100">
                          ${totalBudget.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-navy-800/50">
            <h3 className="font-medium text-navy-100">Alert Channels</h3>
            <p className="text-xs text-navy-500 mt-1">Configure where governance alerts are sent</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {alertChannels.map((channel, i) => (
              <div key={i} className={`p-4 rounded-lg border ${channel.configured ? 'bg-navy-800/30 border-navy-700' : 'bg-navy-900/50 border-navy-800 border-dashed'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${channel.configured ? 'bg-emerald-500/10' : 'bg-navy-800'}`}>
                      <channel.icon className={`w-5 h-5 ${channel.configured ? 'text-emerald-400' : 'text-navy-500'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-navy-100">{channel.name}</h4>
                      <p className="text-xs text-navy-500">{channel.destinations.length} destination(s)</p>
                    </div>
                  </div>
                  <span className={`badge ${channel.configured ? 'badge-success' : 'badge-info'}`}>
                    {channel.configured ? 'Active' : 'Not Configured'}
                  </span>
                </div>
                {channel.destinations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {channel.destinations.slice(0, 3).map((dest, j) => (
                      <span key={j} className="text-xs bg-navy-800/50 px-2 py-1 rounded text-navy-400">
                        {dest}
                      </span>
                    ))}
                    {channel.destinations.length > 3 && (
                      <span className="text-xs bg-navy-800/50 px-2 py-1 rounded text-navy-500">
                        +{channel.destinations.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'anomalies' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-navy-800/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-navy-100">Cost Anomalies</h3>
                <p className="text-xs text-navy-500 mt-1">AI-detected unusual spending patterns</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-danger">{anomalies.filter((a) => a.status === 'new').length} New</span>
                <span className="badge badge-warning">{anomalies.filter((a) => a.severity === 'high').length} High</span>
              </div>
            </div>
          </div>
          <div className="divide-y divide-navy-800/50">
            {anomalies.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-navy-100 font-medium">No anomalies detected</p>
                <p className="text-sm text-navy-500 mt-1">Your spending patterns look normal</p>
              </div>
            ) : (
              anomalies.map((anomaly) => {
                const provider = getProvider(anomaly.provider_id);
                return (
                  <div key={anomaly.id} className="p-4 hover:bg-navy-800/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          anomaly.severity === 'high'
                            ? 'bg-coral-500/10'
                            : anomaly.severity === 'medium'
                            ? 'bg-amber-500/10'
                            : 'bg-primary-500/10'
                        }`}
                      >
                        <AlertTriangle
                          className={`w-5 h-5 ${
                            anomaly.severity === 'high'
                              ? 'text-coral-400'
                              : anomaly.severity === 'medium'
                              ? 'text-amber-400'
                              : 'text-primary-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-navy-100">{anomaly.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-navy-500">
                              <span className="flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: provider?.color || '#64748b' }}
                                />
                                {provider?.display_name || 'Unknown Provider'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(anomaly.detected_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-lg font-bold ${
                              anomaly.cost_impact && anomaly.cost_impact > 0 ? 'text-coral-400' : 'text-emerald-400'
                            }`}>
                              {anomaly.cost_impact && anomaly.cost_impact > 0 ? '+' : ''}
                              ${(anomaly.cost_impact || 0).toLocaleString()}
                            </p>
                            <span className={`badge ${
                              anomaly.severity === 'high' ? 'badge-danger' :
                              anomaly.severity === 'medium' ? 'badge-warning' : 'badge-info'
                            }`}>
                              {anomaly.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-medium text-navy-100 mb-4">Compliance by Category</h3>
            <div className="space-y-4">
              {complianceScores.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-300">{item.category}</span>
                    <span className={`font-medium ${
                      item.score >= 90 ? 'text-emerald-400' :
                      item.score >= 70 ? 'text-amber-400' : 'text-coral-400'
                    }`}>
                      {item.score}%
                    </span>
                  </div>
                  <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.score >= 90 ? 'bg-emerald-500' :
                        item.score >= 70 ? 'bg-amber-500' : 'bg-coral-500'
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-medium text-navy-100 mb-4">Governance Actions</h3>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Policy Applied
                </div>
                <p className="text-xs text-navy-400 mt-1">
                  Enforced max instance type: t3.large for dev environments
                </p>
                <p className="text-xs text-navy-600 mt-2">2 hours ago</p>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Budget Alert
                </div>
                <p className="text-xs text-navy-400 mt-1">
                  Enterprise Solutions reached 90% of monthly budget
                </p>
                <p className="text-xs text-navy-600 mt-2">5 hours ago</p>
              </div>

              <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-primary-400 text-sm font-medium">
                  <Tag className="w-4 h-4" />
                  Tag Policy Update
                </div>
                <p className="text-xs text-navy-400 mt-1">
                  Auto-applied cost-center tags to 12 resources
                </p>
                <p className="text-xs text-navy-600 mt-2">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
