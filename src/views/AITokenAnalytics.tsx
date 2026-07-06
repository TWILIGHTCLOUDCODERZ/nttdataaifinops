import { useState, useMemo } from 'react';
import {
  Cpu,
  Zap,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Key,
  Activity,
  Ban,
  Settings,
  Bell,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  FileWarning,
  Lock,
  Globe,
  User,
  ChevronRight,
} from 'lucide-react';
import { useTimeFilter } from '../lib/TimeFilterContext';
import { useData } from '../lib/DataContext';
import { generateMockSeries, generateDailyLabels } from '../lib/timeFilter';
import { LineChart, BarChart, DonutChart, Sparkline } from '../components/Charts';

interface APIKey {
  id: string;
  name: string;
  provider: string;
  maskedKey: string;
  status: 'active' | 'throttled' | 'suspended';
  usage: number;
  cost: number;
  lastUsed: string;
  applications: string[];
  users: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityIncident {
  id: string;
  type: 'abnormal_usage' | 'unauthorized_access' | 'key_exposure' | 'rate_limit_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  apiKey: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved';
}

interface ThresholdConfig {
  tokenLimit: number;
  costLimit: number;
  action: 'alert' | 'throttle' | 'suspend';
  enabled: boolean;
}

export function AITokenAnalytics() {
  const { period } = useTimeFilter();
  const {
    aiModels,
    aiTotalTokens,
    aiTotalCost,
    aiTotalRequests,
    multiplier,
  } = useData();

  const [activeTab, setActiveTab] = useState<'usage' | 'security' | 'thresholds' | 'incidents'>('usage');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>([
    { tokenLimit: 50000000, costLimit: 5000, action: 'alert', enabled: true },
    { tokenLimit: 80000000, costLimit: 8000, action: 'throttle', enabled: true },
    { tokenLimit: 100000000, costLimit: 12000, action: 'suspend', enabled: true },
  ]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const periodLabels = useMemo(() => generateDailyLabels(period), [period]);

  // Models from DataContext + local trend sparklines
  const models = useMemo(() => {
    return aiModels.map((m, i) => ({
      ...m,
      trend: generateMockSeries(period, m.tokens / 1000000, 0.18, i + 2),
    }));
  }, [aiModels, period]);

  const topModel = useMemo(() => [...models].sort((a, b) => b.cost - a.cost)[0], [models]);

  const tokenTrendData = useMemo(() => {
    const series = generateMockSeries(period, aiTotalTokens / 1000000, 0.1, 5);
    return periodLabels.map((name, i) => ({ name, value: series[i] }));
  }, [period, periodLabels, aiTotalTokens]);

  const apiKeys: APIKey[] = useMemo(() => {
    return [
      {
        id: 'key_001',
        name: 'Production OpenAI Key',
        provider: 'OpenAI',
        maskedKey: 'sk-proj-aB8...Xk9m',
        status: 'active',
        usage: Math.round(45000000 * multiplier),
        cost: Math.round(8200 * multiplier),
        lastUsed: '2 minutes ago',
        applications: ['Customer Service Bot', 'Content Generator', 'Code Assistant'],
        users: 47,
        riskLevel: 'medium',
      },
      {
        id: 'key_002',
        name: 'Anthropic Claude API',
        provider: 'Anthropic',
        maskedKey: 'sk-ant-api03...Vp2q',
        status: 'active',
        usage: Math.round(28000000 * multiplier),
        cost: Math.round(5400 * multiplier),
        lastUsed: '5 minutes ago',
        applications: ['Document Analyzer', 'Research Assistant'],
        users: 23,
        riskLevel: 'low',
      },
      {
        id: 'key_003',
        name: 'Gemini Production Key',
        provider: 'Google',
        maskedKey: 'AIzaSy...fH3n',
        status: 'throttled',
        usage: Math.round(62000000 * multiplier),
        cost: Math.round(4100 * multiplier),
        lastUsed: '1 minute ago',
        applications: ['Vision API', 'Translation Service', 'Search Assistant', 'Chat Widget'],
        users: 89,
        riskLevel: 'high',
      },
      {
        id: 'key_004',
        name: 'Legacy GPT-3.5 Key',
        provider: 'OpenAI',
        maskedKey: 'sk-oldKey...Lm7r',
        status: 'active',
        usage: Math.round(15000000 * multiplier),
        cost: Math.round(750 * multiplier),
        lastUsed: '1 hour ago',
        applications: ['Legacy Chatbot', 'Email Formatter'],
        users: 12,
        riskLevel: 'critical',
      },
      {
        id: 'key_005',
        name: 'Mistral Dev Key',
        provider: 'Mistral',
        maskedKey: 'mst-xKj...Wp8t',
        status: 'suspended',
        usage: Math.round(8000000 * multiplier),
        cost: Math.round(1200 * multiplier),
        lastUsed: '3 hours ago',
        applications: ['Internal RAG System'],
        users: 5,
        riskLevel: 'critical',
      },
      {
        id: 'key_006',
        name: 'Llama Self-Hosted',
        provider: 'Meta',
        maskedKey: 'hf_llama...Qr4s',
        status: 'active',
        usage: Math.round(12000000 * multiplier),
        cost: Math.round(980 * multiplier),
        lastUsed: '15 minutes ago',
        applications: ['Data Pipeline', 'Log Analyzer'],
        users: 18,
        riskLevel: 'low',
      },
    ];
  }, [multiplier]);

  const incidents: SecurityIncident[] = useMemo(() => {
    return [
      {
        id: 'INC-2024-001',
        type: 'abnormal_usage',
        severity: 'high',
        description: 'Token usage spiked 340% above baseline on Legacy GPT-3.5 Key from 3 new IP addresses',
        apiKey: 'Legacy GPT-3.5 Key',
        timestamp: '2024-06-15 14:32 UTC',
        status: 'investigating',
      },
      {
        id: 'INC-2024-002',
        type: 'unauthorized_access',
        severity: 'critical',
        description: 'Mistral Dev Key accessed from unauthorized region (unknown IP in unlisted geography)',
        apiKey: 'Mistral Dev Key',
        timestamp: '2024-06-15 11:08 UTC',
        status: 'open',
      },
      {
        id: 'INC-2024-003',
        type: 'rate_limit_breach',
        severity: 'medium',
        description: 'Gemini Production Key exceeded 80% of rate limit threshold for 3 consecutive hours',
        apiKey: 'Gemini Production Key',
        timestamp: '2024-06-15 09:45 UTC',
        status: 'investigating',
      },
      {
        id: 'INC-2024-004',
        type: 'key_exposure',
        severity: 'critical',
        description: 'Potential API key exposure detected in public GitHub repository (auto-rotated)',
        apiKey: 'Legacy GPT-3.5 Key',
        timestamp: '2024-06-14 22:15 UTC',
        status: 'resolved',
      },
      {
        id: 'INC-2024-005',
        type: 'abnormal_usage',
        severity: 'low',
        description: 'Unusual off-hours activity detected on Anthropic Claude API (2AM-4AM pattern)',
        apiKey: 'Anthropic Claude API',
        timestamp: '2024-06-14 03:20 UTC',
        status: 'resolved',
      },
    ];
  }, []);

  const kpiCards = [
    {
      label: 'Total Token Consumption',
      value: `${(aiTotalTokens / 1000000).toFixed(1)}M`,
      sub: 'tokens this period',
      icon: Zap,
      color: 'primary',
      trend: '+12.4%',
      trendUp: true,
    },
    {
      label: 'Total AI Spend',
      value: `$${(aiTotalCost / 1000).toFixed(1)}K`,
      sub: 'across all models',
      icon: DollarSign,
      color: 'accent',
      trend: '+8.7%',
      trendUp: true,
    },
    {
      label: 'Highest Cost Model',
      value: topModel?.name || 'N/A',
      sub: `$${((topModel?.cost || 0) / 1000).toFixed(1)}K spent`,
      icon: Cpu,
      color: 'amber',
      trend: '+15.2%',
      trendUp: true,
    },
    {
      label: 'Active API Keys',
      value: `${apiKeys.filter((k) => k.status === 'active').length}/${apiKeys.length}`,
      sub: `${apiKeys.filter((k) => k.riskLevel === 'critical').length} critical risk`,
      icon: Key,
      color: 'coral',
      trend: '-2',
      trendUp: false,
    },
  ];

  const riskBadge = (level: string) => {
    const styles: Record<string, string> = {
      low: 'badge-success',
      medium: 'badge-warning',
      high: 'badge-danger',
      critical: 'badge-danger',
    };
    return <span className={`badge ${styles[level]}`}>{level}</span>;
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'badge-success',
      throttled: 'badge-warning',
      suspended: 'badge-danger',
    };
    return <span className={`badge ${styles[status]}`}>{status}</span>;
  };

  const incidentIcon = (type: string) => {
    switch (type) {
      case 'abnormal_usage': return <Activity className="w-4 h-4" />;
      case 'unauthorized_access': return <Lock className="w-4 h-4" />;
      case 'key_exposure': return <Key className="w-4 h-4" />;
      case 'rate_limit_breach': return <Zap className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const severityColor: Record<string, string> = {
    low: 'text-navy-400',
    medium: 'text-amber-400',
    high: 'text-coral-400',
    critical: 'text-coral-500',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-navy-100">AI Token Analytics & Security</h2>
          <p className="text-sm text-navy-500 mt-1">
            Monitor token consumption, costs, and API key security across all AI models
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                kpi.color === 'primary' ? 'bg-primary-500/10 text-primary-400' :
                kpi.color === 'accent' ? 'bg-accent-500/10 text-accent-400' :
                kpi.color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
                'bg-coral-500/10 text-coral-400'
              }`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className={`flex items-center gap-1 text-xs ${kpi.trendUp ? 'text-coral-400' : 'text-emerald-400'}`}>
                {kpi.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.trend}
              </span>
            </div>
            <div className="metric-value text-navy-100">{kpi.value}</div>
            <p className="metric-label">{kpi.label}</p>
            <p className="text-xs text-navy-600 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-navy-800/50 rounded-lg p-1 overflow-x-auto scrollbar-hide">
        {([
          { id: 'usage', label: 'Token Usage', icon: Zap },
          { id: 'security', label: 'API Key Security', icon: Shield },
          { id: 'thresholds', label: 'Thresholds & Controls', icon: Settings },
          { id: 'incidents', label: 'Security Incidents', icon: Bell },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'bg-navy-700 text-navy-100' : 'text-navy-400 hover:text-navy-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          {/* Token Trend Chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-navy-100">Token Consumption Trend</h3>
                <p className="text-xs text-navy-500 mt-1">Daily token usage across all AI models (in millions)</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-navy-100">{(aiTotalTokens / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-navy-500">total tokens</p>
              </div>
            </div>
            <LineChart data={tokenTrendData} height={220} gradient="token-trend" lineColor="#0ea5e9" />
          </div>

          {/* Model Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut: Cost by Model */}
            <div className="card p-5">
              <h3 className="font-medium text-navy-100 mb-4">Cost Distribution by Model</h3>
              <DonutChart
                data={aiModels.map((m) => ({ name: m.name, value: m.cost, color: m.color }))}
                size={180}
                thickness={22}
                centerValue={`$${(aiTotalCost / 1000).toFixed(1)}K`}
                centerLabel="Total"
              />
            </div>

            {/* Donut: Tokens by Model */}
            <div className="card p-5">
              <h3 className="font-medium text-navy-100 mb-4">Token Distribution by Model</h3>
              <DonutChart
                data={aiModels.map((m) => ({ name: m.name, value: m.tokens, color: m.color }))}
                size={180}
                thickness={22}
                centerValue={`${(aiTotalTokens / 1000000).toFixed(1)}M`}
                centerLabel="Tokens"
              />
            </div>

            {/* Top Models Bar */}
            <div className="card p-5">
              <h3 className="font-medium text-navy-100 mb-4">Top 5 by Cost</h3>
              <div className="space-y-3">
                {[...aiModels].sort((a, b) => b.cost - a.cost).slice(0, 5).map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-navy-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                        {m.name}
                      </span>
                      <span className="text-navy-100 font-medium">${(m.cost / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(m.cost / topModel.cost) * 100}%`, backgroundColor: m.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Model Detail Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-navy-800/50">
              <h3 className="font-medium text-navy-100">Model Consumption Details</h3>
              <p className="text-xs text-navy-500 mt-1">Per-model token usage, cost, and performance metrics</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-800/50 bg-navy-900/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Model</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Provider</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Tokens</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Requests</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Avg Latency</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-navy-500 uppercase">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => (
                    <tr
                      key={m.name}
                      className="table-row cursor-pointer"
                      onClick={() => setSelectedModel(selectedModel === m.name ? null : m.name)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${m.color}15` }}>
                            <Cpu className="w-4 h-4" style={{ color: m.color }} />
                          </div>
                          <span className="text-sm font-medium text-navy-100">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-300">{m.provider}</td>
                      <td className="px-4 py-3 text-sm text-navy-100 text-right font-medium">
                        {(m.tokens / 1000000).toFixed(1)}M
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-100 text-right font-medium">
                        ${(m.cost / 1000).toFixed(1)}K
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-300 text-right">
                        {(m.requests / 1000).toFixed(0)}K
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-300 text-right">{m.avgLatency}ms</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <Sparkline data={m.trend} width={80} height={28} color={m.color} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-2 text-navy-500 mb-2">
                <Key className="w-4 h-4" />
                <span className="text-sm">Total Keys</span>
              </div>
              <div className="text-2xl font-bold text-navy-100">{apiKeys.length}</div>
              <div className="text-sm text-navy-500 mt-2">Across {new Set(apiKeys.map((k) => k.provider)).size} providers</div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 text-navy-500 mb-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Active Keys</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">{apiKeys.filter((k) => k.status === 'active').length}</div>
              <div className="text-sm text-navy-500 mt-2">In use</div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 text-navy-500 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">At Risk</span>
              </div>
              <div className="text-2xl font-bold text-coral-400">
                {apiKeys.filter((k) => k.riskLevel === 'high' || k.riskLevel === 'critical').length}
              </div>
              <div className="text-sm text-navy-500 mt-2">High/Critical risk</div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 text-navy-500 mb-2">
                <Ban className="w-4 h-4" />
                <span className="text-sm">Suspended</span>
              </div>
              <div className="text-2xl font-bold text-coral-500">
                {apiKeys.filter((k) => k.status === 'suspended').length}
              </div>
              <div className="text-sm text-navy-500 mt-2">Auto-suspended</div>
            </div>
          </div>

          {/* API Key Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-navy-800/50">
              <h3 className="font-medium text-navy-100">API Key Security Analysis</h3>
              <p className="text-xs text-navy-500 mt-1">Detailed security audit of all AI API keys</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-800/50 bg-navy-900/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Key Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">API Key</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Risk</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Usage</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Applications</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Users</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Last Used</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="table-row">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            key.riskLevel === 'critical' ? 'bg-coral-500/10 text-coral-400' :
                            key.riskLevel === 'high' ? 'bg-coral-500/10 text-coral-400' :
                            key.riskLevel === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            <Key className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-navy-100">{key.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-navy-400 font-mono">
                            {showKeys[key.id] ? key.maskedKey.replace('...', 'XXXXXXXXXX') : key.maskedKey}
                          </code>
                          <button
                            onClick={() => setShowKeys({ ...showKeys, [key.id]: !showKeys[key.id] })}
                            className="text-navy-500 hover:text-navy-300"
                          >
                            {showKeys[key.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">{statusBadge(key.status)}</td>
                      <td className="px-4 py-3">{riskBadge(key.riskLevel)}</td>
                      <td className="px-4 py-3 text-sm text-navy-100 text-right font-medium">
                        {(key.usage / 1000000).toFixed(1)}M
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-100 text-right font-medium">
                        ${(key.cost / 1000).toFixed(1)}K
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {key.applications.map((app, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-navy-800/50 rounded text-navy-400">
                              {app}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-300 text-right">{key.users}</td>
                      <td className="px-4 py-3 text-xs text-navy-500">{key.lastUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Usage Anomaly Detection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-medium text-navy-100 mb-4">Usage Anomaly Detection</h3>
              <div className="space-y-3">
                {apiKeys.filter((k) => k.riskLevel === 'high' || k.riskLevel === 'critical').map((key) => (
                  <div key={key.id} className="p-3 bg-navy-800/30 rounded-lg border-l-2 border-coral-500/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-navy-100">{key.name}</span>
                      {riskBadge(key.riskLevel)}
                    </div>
                    <p className="text-xs text-navy-400">
                      {key.riskLevel === 'critical'
                        ? `Usage pattern indicates potential unauthorized access. ${key.applications.length} apps, ${key.users} users consuming this key.`
                        : `Unusual consumption pattern detected. Consider rotating key or restricting access.`}
                    </p>
                  </div>
                ))}
                {apiKeys.filter((k) => k.riskLevel === 'high' || k.riskLevel === 'critical').length === 0 && (
                  <div className="text-center text-navy-500 py-4">No anomalies detected</div>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-medium text-navy-100 mb-4">Usage Trends by Key</h3>
              <div className="space-y-3">
                {apiKeys.slice(0, 5).map((key, i) => (
                  <div key={key.id} className="flex items-center justify-between">
                    <span className="text-sm text-navy-300 w-32 truncate">{key.name}</span>
                    <Sparkline
                      data={generateMockSeries(period, key.usage / 1000000, 0.2, i + 10)}
                      width={120}
                      height={30}
                      color={key.riskLevel === 'critical' ? '#f43f5e' : key.riskLevel === 'high' ? '#fb7185' : '#0ea5e9'}
                    />
                    <span className="text-sm text-navy-100 font-medium w-16 text-right">
                      ${(key.cost / 1000).toFixed(1)}K
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thresholds Tab */}
      {activeTab === 'thresholds' && (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-navy-100">Token & Cost Thresholds</h3>
                <p className="text-xs text-navy-500 mt-1">Configure automatic actions when usage limits are exceeded</p>
              </div>
              <button className="btn btn-primary">
                <Settings className="w-4 h-4" />
                Add Threshold
              </button>
            </div>

            <div className="space-y-4">
              {thresholds.map((threshold, i) => (
                <div key={i} className="p-4 bg-navy-800/30 rounded-lg border border-navy-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        threshold.action === 'alert' ? 'bg-amber-500/10 text-amber-400' :
                        threshold.action === 'throttle' ? 'bg-primary-500/10 text-primary-400' :
                        'bg-coral-500/10 text-coral-400'
                      }`}>
                        {threshold.action === 'alert' ? <Bell className="w-4 h-4" /> :
                         threshold.action === 'throttle' ? <Activity className="w-4 h-4" /> :
                         <Ban className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-navy-100 capitalize">{threshold.action} Rule</span>
                        <p className="text-xs text-navy-500">
                          {threshold.action === 'alert' ? 'Send notification when threshold is reached' :
                           threshold.action === 'throttle' ? 'Reduce API rate when threshold is reached' :
                           'Suspend API access when threshold is reached'}
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={threshold.enabled}
                        onChange={(e) => {
                          const updated = [...thresholds];
                          updated[i] = { ...threshold, enabled: e.target.checked };
                          setThresholds(updated);
                        }}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-navy-700 peer-focus:ring-2 peer-focus:ring-primary-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-navy-100 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-navy-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-navy-500 mb-1 block">Token Limit (tokens)</label>
                      <input
                        type="number"
                        value={threshold.tokenLimit}
                        onChange={(e) => {
                          const updated = [...thresholds];
                          updated[i] = { ...threshold, tokenLimit: parseInt(e.target.value) || 0 };
                          setThresholds(updated);
                        }}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-navy-500 mb-1 block">Cost Limit ($)</label>
                      <input
                        type="number"
                        value={threshold.costLimit}
                        onChange={(e) => {
                          const updated = [...thresholds];
                          updated[i] = { ...threshold, costLimit: parseInt(e.target.value) || 0 };
                          setThresholds(updated);
                        }}
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Usage vs Thresholds */}
          <div className="card p-5">
            <h3 className="font-medium text-navy-100 mb-4">Current Usage vs. Thresholds</h3>
            <div className="space-y-4">
              {thresholds.filter((t) => t.enabled).map((threshold, i) => {
                const tokenUsage = (aiTotalTokens / threshold.tokenLimit) * 100;
                const costUsage = (aiTotalCost / threshold.costLimit) * 100;
                const maxUsage = Math.max(tokenUsage, costUsage);
                const isExceeded = maxUsage >= 100;

                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-navy-300 capitalize">{threshold.action} Threshold</span>
                      <span className={`font-medium ${isExceeded ? 'text-coral-400' : 'text-navy-100'}`}>
                        {maxUsage.toFixed(0)}% {isExceeded && '(EXCEEDED)'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-xs text-navy-500 mb-1">
                          <span>Tokens: {(aiTotalTokens / 1000000).toFixed(1)}M / {(threshold.tokenLimit / 1000000).toFixed(0)}M</span>
                        </div>
                        <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${tokenUsage > 100 ? 'bg-coral-500' : tokenUsage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(tokenUsage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-navy-500 mb-1">
                          <span>Cost: ${(aiTotalCost / 1000).toFixed(1)}K / ${(threshold.costLimit / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${costUsage > 100 ? 'bg-coral-500' : costUsage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(costUsage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Incidents Tab */}
      {activeTab === 'incidents' && (
        <div className="space-y-6">
          {/* Incident Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-2 text-navy-500 mb-2">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Total Incidents</span>
              </div>
              <div className="text-2xl font-bold text-navy-100">{incidents.length}</div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 text-navy-500 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Open</span>
              </div>
              <div className="text-2xl font-bold text-coral-400">
                {incidents.filter((i) => i.status === 'open').length}
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 text-navy-500 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Investigating</span>
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {incidents.filter((i) => i.status === 'investigating').length}
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 text-navy-500 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Resolved</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {incidents.filter((i) => i.status === 'resolved').length}
              </div>
            </div>
          </div>

          {/* Incident List */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-navy-800/50">
              <h3 className="font-medium text-navy-100">Security Incidents & Alerts</h3>
              <p className="text-xs text-navy-500 mt-1">Auto-generated incidents from anomaly detection and security analysis</p>
            </div>
            <div className="divide-y divide-navy-800/50">
              {incidents.map((incident) => (
                <div key={incident.id} className="p-4 hover:bg-navy-800/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      incident.severity === 'critical' ? 'bg-coral-500/10 text-coral-400' :
                      incident.severity === 'high' ? 'bg-coral-500/10 text-coral-400' :
                      incident.severity === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-navy-700/50 text-navy-400'
                    }`}>
                      {incidentIcon(incident.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-navy-100">{incident.id}</span>
                        <span className={`text-xs uppercase font-medium ${severityColor[incident.severity]}`}>
                          {incident.severity}
                        </span>
                        <span className={`badge ${
                          incident.status === 'open' ? 'badge-danger' :
                          incident.status === 'investigating' ? 'badge-warning' :
                          'badge-success'
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                      <p className="text-sm text-navy-300">{incident.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-navy-500">
                        <span className="flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          {incident.apiKey}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {incident.timestamp}
                        </span>
                      </div>
                    </div>
                    <button className="btn btn-secondary text-xs">
                      <ChevronRight className="w-3 h-3" />
                      Investigate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
