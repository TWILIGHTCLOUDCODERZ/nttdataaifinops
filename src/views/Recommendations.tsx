import { useEffect, useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowDown,
  Zap,
  Trash2,
  DollarSign,
  Timer,
  Shield,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Recommendation, Resource, CloudProvider } from '../types';
import { BarChart } from '../components/Charts';
import { JiraIntegrationModal } from '../components/JiraIntegrationModal';

export function Recommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'rightsizing' | 'idle' | 'commitments' | 'spot'>('all');
  const [jiraModalOpen, setJiraModalOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: recData } = await supabase
        .from('recommendations')
        .select('*')
        .order('potential_savings', { ascending: false });

      if (recData) setRecommendations(recData);

      const { data: resourceData } = await supabase
        .from('resources')
        .select('*');

      if (resourceData) setResources(resourceData);

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

  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (activeTab !== 'all') {
      const typeMap: Record<string, string> = {
        rightsizing: 'rightsizing',
        idle: 'idle_cleanup',
        commitments: 'ri_purchase',
        spot: 'spot_instance',
      };
      filtered = filtered.filter((r) => r.recommendation_type === typeMap[activeTab]);
    }

    return filtered;
  }, [recommendations, statusFilter, activeTab]);

  const metrics = useMemo(() => {
    const totalSavings = recommendations
      .filter((r) => r.status === 'open')
      .reduce((sum, r) => sum + (r.potential_savings || 0), 0);

    const openCount = recommendations.filter((r) => r.status === 'open').length;
    const resolvedCount = recommendations.filter((r) => r.status === 'resolved').length;

    const byType: Record<string, { savings: number; count: number }> = {};
    recommendations.filter((r) => r.status === 'open').forEach((r) => {
      if (!byType[r.recommendation_type]) {
        byType[r.recommendation_type] = { savings: 0, count: 0 };
      }
      byType[r.recommendation_type].savings += r.potential_savings || 0;
      byType[r.recommendation_type].count += 1;
    });

    return { totalSavings, openCount, resolvedCount, byType };
  }, [recommendations]);

  const getResource = (id: string) => resources.find((r) => r.id === id);
  const getProvider = (id: string) => providers.find((p) => p.id === id);

  const getRecIcon = (type: string) => {
    switch (type) {
      case 'rightsizing': return TrendingUp;
      case 'idle_cleanup': return Trash2;
      case 'ri_purchase': return Timer;
      case 'spot_instance': return Zap;
      case 'storage_optimization': return Target;
      default: return Sparkles;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      rightsizing: 'Instance Rightsizing',
      idle_cleanup: 'Idle Resource Cleanup',
      ri_purchase: 'Reserved Instance Purchase',
      spot_instance: 'Spot Instance Opportunity',
      storage_optimization: 'Storage Optimization',
    };
    return labels[type] || type;
  };

  const handleViewDetails = (rec: Recommendation) => {
    setSelectedRecommendation(rec);
    setJiraModalOpen(true);
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisComplete(false);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setAnalyzing(false);
    setAnalysisComplete(true);
    setTimeout(() => setAnalysisComplete(false), 3000);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-96 bg-navy-900/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  const tabItems = [
    { id: 'all', label: 'All', count: recommendations.length },
    { id: 'rightsizing', label: 'Rightsizing', count: recommendations.filter((r) => r.recommendation_type === 'rightsizing').length },
    { id: 'idle', label: 'Idle Resources', count: recommendations.filter((r) => r.recommendation_type === 'idle_cleanup').length },
    { id: 'commitments', label: 'Commitments', count: recommendations.filter((r) => r.recommendation_type === 'ri_purchase').length },
    { id: 'spot', label: 'Spot', count: recommendations.filter((r) => r.recommendation_type === 'spot_instance').length },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-navy-100">AI Cost Optimization Engine</h2>
          <p className="text-sm text-navy-500 mt-1">
            AI-powered recommendations to reduce cloud spending
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input py-1.5 px-3 text-sm"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <button
            className="btn btn-primary"
            onClick={handleRunAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {analysisComplete && (
        <div className="mb-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-400 font-medium text-sm">Analysis Complete</p>
            <p className="text-navy-400 text-xs mt-0.5">
              Scanned {recommendations.length} resources and identified {recommendations.filter(r => r.status === 'new').length} new optimization opportunities.
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card card-hover">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-navy-500">Total Potential Savings</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ${(metrics.totalSavings / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-navy-500 mt-2">Monthly savings available</div>
        </div>

        <div className="stat-card card-hover">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-navy-500">Open Recommendations</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">{metrics.openCount}</div>
          <div className="text-xs text-navy-500 mt-2">Awaiting action</div>
        </div>

        <div className="stat-card card-hover">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-navy-500">Resolved This Month</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">{metrics.resolvedCount}</div>
          <div className="text-xs text-navy-500 mt-2">$125K saved</div>
        </div>

        <div className="stat-card card-hover">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-navy-500">Avg. Confidence Score</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">87%</div>
          <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '87%' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'bg-navy-800/50 text-navy-400 hover:bg-navy-800 hover:text-navy-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {filteredRecommendations.length === 0 ? (
              <div className="card p-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-navy-100 font-medium">No recommendations found</p>
                <p className="text-sm text-navy-500 mt-1">
                  All caught up! Check back later for new optimization opportunities.
                </p>
              </div>
            ) : (
              filteredRecommendations.slice(0, 12).map((rec) => {
                const resource = getResource(rec.resource_id);
                const provider = resource ? getProvider(resource.provider_id) : null;
                const Icon = getRecIcon(rec.recommendation_type);

                return (
                  <div key={rec.id} className="card p-4 card-hover cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div
                        className="p-3 rounded-lg shrink-0"
                        style={{ backgroundColor: getRecTypeColor(rec.recommendation_type) + '20' }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: getRecTypeColor(rec.recommendation_type) }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-navy-100">{rec.title}</h4>
                            <p className="text-sm text-navy-400 mt-1">
                              {getTypeLabel(rec.recommendation_type)} • {resource?.resource_name || 'Resource'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-bold text-emerald-400">
                              ${rec.potential_savings?.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                            </div>
                            {rec.confidence_score && (
                              <div className="text-xs text-navy-500 mt-1">
                                {rec.confidence_score.toFixed(0)}% confidence
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-navy-500 mt-2">{rec.description}</p>

                        <div className="flex items-center gap-4 mt-3">
                          <span
                            className={`badge ${
                              rec.status === 'open'
                                ? 'badge-info'
                                : rec.status === 'in_progress'
                                ? 'badge-warning'
                                : rec.status === 'resolved'
                                ? 'badge-success'
                                : 'badge-danger'
                            }`}
                          >
                            {rec.status}
                          </span>

                          {provider && (
                            <span className="text-xs text-navy-500">
                              {provider.display_name}
                            </span>
                          )}

                          {rec.risk_score !== null && rec.risk_score !== undefined && rec.risk_score > 20 && (
                            <span className="flex items-center gap-1 text-xs text-amber-400">
                              <AlertTriangle className="w-3 h-3" />
                              Medium Risk
                            </span>
                          )}

                          <button
                            onClick={() => handleViewDetails(rec)}
                            className="ml-auto btn btn-secondary text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            View Details
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Savings by Type */}
          <div className="card p-5">
            <h3 className="font-medium text-navy-100 mb-4">Savings by Category</h3>
            <BarChart
              data={Object.entries(metrics.byType).map(([type, data]) => ({
                name: getTypeLabel(type),
                value: data.savings,
                color: getRecTypeColor(type),
              }))}
              height={150}
              horizontal
              showValues
            />
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <h3 className="font-medium text-navy-100 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn btn-secondary justify-start">
                <ArrowDown className="w-4 h-4 text-emerald-400" />
                Apply Top 5 Recommendations
              </button>
              <button className="w-full btn btn-secondary justify-start">
                <Sparkles className="w-4 h-4 text-primary-400" />
                Schedule Auto-Apply
              </button>
              <button className="w-full btn btn-secondary justify-start">
                <Shield className="w-4 h-4 text-amber-400" />
                Set Risk Threshold
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Jira Integration Modal */}
      <JiraIntegrationModal
        isOpen={jiraModalOpen}
        onClose={() => setJiraModalOpen(false)}
        recommendationTitle={selectedRecommendation?.title || ''}
        recommendationDescription={selectedRecommendation?.description || ''}
      />
    </div>
  );
}

function getRecTypeColor(type: string): string {
  const colors: Record<string, string> = {
    rightsizing: '#0ea5e9',
    idle_cleanup: '#ef4444',
    ri_purchase: '#8b5cf6',
    spot_instance: '#14b8a6',
    storage_optimization: '#f59e0b',
  };
  return colors[type] || '#64748b';
}
