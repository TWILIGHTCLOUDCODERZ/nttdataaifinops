import { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Server,
  DollarSign,
  Activity,
  Cpu,
  MapPin,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  TrendingUp,
  Boxes
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { KubernetesCluster, KubernetesCost, CloudProvider } from '../types';
import { LineChart, BarChart, DonutChart } from '../components/Charts';

export function Kubernetes() {
  const [clusters, setClusters] = useState<KubernetesCluster[]>([]);
  const [k8sCosts, setK8sCosts] = useState<KubernetesCost[]>([]);
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: clusterData } = await supabase
        .from('kubernetes_clusters')
        .select('*');

      if (clusterData) {
        setClusters(clusterData);
        if (clusterData.length > 0) setSelectedCluster(clusterData[0].id);
      }

      const { data: costData } = await supabase
        .from('kubernetes_costs')
        .select('*')
        .order('cost_date', { ascending: false });

      if (costData) setK8sCosts(costData);

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

  const clusterMetrics = useMemo(() => {
    if (!selectedCluster || clusters.length === 0) {
      const totalCost = clusters.reduce((sum, c) => sum + (c.monthly_cost || 0), 0);
      const totalClusters = clusters.length;
      return {
        totalCost,
        totalClusters,
        avgCostPerCluster: totalClusters > 0 ? totalCost / totalClusters : 0,
        selectedClusterName: 'All Clusters',
      };
    }

    const cluster = clusters.find((c) => c.id === selectedCluster);
    const clusterCosts = k8sCosts.filter((c) => c.cluster_id === selectedCluster);
    const totalClusterCost = clusterCosts.reduce((sum, c) => sum + c.daily_cost, 0);

    return {
      totalCost: cluster?.monthly_cost || totalClusterCost,
      totalClusters: clusters.length,
      avgCostPerCluster: (cluster?.monthly_cost || totalClusterCost),
      selectedClusterName: cluster?.name || 'All Clusters',
    };
  }, [clusters, k8sCosts, selectedCluster]);

  const namespaceCosts = useMemo(() => {
    const filtered = selectedCluster
      ? k8sCosts.filter((c) => c.cluster_id === selectedCluster)
      : k8sCosts;

    const nsMap = new Map<string, number>();
    filtered.forEach((c) => {
      nsMap.set(c.namespace, (nsMap.get(c.namespace) || 0) + c.daily_cost);
    });

    return Array.from(nsMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        color: getNamespaceColor(name),
      }))
      .sort((a, b) => b.value - a.value);
  }, [k8sCosts, selectedCluster]);

  const dailyTrend = useMemo(() => {
    const filtered = selectedCluster
      ? k8sCosts.filter((c) => c.cluster_id === selectedCluster)
      : k8sCosts;

    const dailyMap = new Map<string, number>();
    filtered.forEach((c) => {
      dailyMap.set(c.cost_date, (dailyMap.get(c.cost_date) || 0) + c.daily_cost);
    });

    return Array.from(dailyMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-14)
      .map(([date, value]) => ({
        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value,
      }));
  }, [k8sCosts, selectedCluster]);

  const getProvider = (id: string) => providers.find((p) => p.id === id);
  const getClusterType = (cluster: KubernetesCluster) => {
    const provider = getProvider(cluster.provider_id);
    switch (provider?.name) {
      case 'aws': return 'EKS';
      case 'azure': return 'AKS';
      case 'gcp': return 'GKE';
      default: return cluster.cluster_type || 'Kubernetes';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-96 bg-navy-900/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  const efficiencyMetrics = [
    { label: 'CPU Efficiency', value: 78, trend: 5 },
    { label: 'Memory Efficiency', value: 82, trend: -2 },
    { label: 'Pod Density', value: 65, trend: 8 },
    { label: 'Resource Waste', value: 12, trend: -15 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-navy-100">Kubernetes Cost Management</h2>
          <p className="text-sm text-navy-500 mt-1">
            Monitor and optimize Kubernetes costs across EKS, AKS, GKE, and OpenShift
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCluster || ''}
            onChange={(e) => setSelectedCluster(e.target.value || null)}
            className="input py-1.5 px-3 text-sm"
          >
            <option value="">All Clusters</option>
            {clusters.map((cluster) => (
              <option key={cluster.id} value={cluster.id}>
                {cluster.name}
              </option>
            ))}
          </select>

          <button className="btn btn-primary">
            <Activity className="w-4 h-4" />
            Optimize
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Total Kubernetes Spend</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">
            ${(clusterMetrics.totalCost / 1000).toFixed(1)}K
          </div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4 text-coral-400" />
            <span className="text-sm text-coral-400">+12.3% MoM</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <Server className="w-4 h-4" />
            <span className="text-sm">Clusters</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">{clusters.length}</div>
          <div className="text-sm text-navy-500 mt-2">{clusters.filter((c) => c.monthly_cost && c.monthly_cost > 10000).length} Production</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <Boxes className="w-4 h-4" />
            <span className="text-sm">Namespaces</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">{namespaceCosts.length}</div>
          <div className="text-sm text-navy-500 mt-2">Active namespaces</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <Cpu className="w-4 h-4" />
            <span className="text-sm">Efficiency Score</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">78%</div>
          <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '78%' }} />
          </div>
        </div>
      </div>

      {/* Cluster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {clusters.map((cluster) => {
          const provider = getProvider(cluster.provider_id);
          const isActive = selectedCluster === cluster.id;

          return (
            <div
              key={cluster.id}
              onClick={() => setSelectedCluster(isActive ? null : cluster.id)}
              className={`card p-4 cursor-pointer transition-all ${
                isActive ? 'ring-2 ring-primary-500 bg-primary-500/5' : 'card-hover'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: provider?.color + '20' || '#33415520' }}
                >
                  <Container
                    className="w-5 h-5"
                    style={{ color: provider?.color || '#64748b' }}
                  />
                </div>
                <span className="badge badge-info">{getClusterType(cluster)}</span>
              </div>
              <h4 className="font-medium text-navy-100 text-sm">{cluster.name}</h4>
              <div className="flex items-center gap-2 mt-2 text-xs text-navy-500">
                <MapPin className="w-3 h-3" />
                {cluster.region}
              </div>
              <div className="mt-3 pt-3 border-t border-navy-800/50">
                <span className="text-lg font-bold text-navy-100">
                  ${(cluster.monthly_cost ? cluster.monthly_cost / 1000 : 0).toFixed(1)}K
                </span>
                <span className="text-xs text-navy-500 ml-1">/month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Namespace Distribution */}
        <div className="card p-5">
          <h3 className="font-medium text-navy-100 mb-4">Cost by Namespace</h3>
          <DonutChart
            data={namespaceCosts.slice(0, 6)}
            size={160}
            thickness={20}
            centerValue={(namespaceCosts.reduce((s, n) => s + n.value, 0) / 1000).toFixed(1)}
            centerLabel="K Total"
          />
        </div>

        {/* Daily Trend */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-navy-100">Daily Cost Trend</h3>
            <div className="text-sm text-navy-500">{clusterMetrics.selectedClusterName}</div>
          </div>
          <LineChart
            data={dailyTrend}
            height={180}
            gradient="k8s-trend"
            lineColor="#8b5cf6"
          />
        </div>
      </div>

      {/* Namespace Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-navy-800/50">
          <h3 className="font-medium text-navy-100">Namespace Cost Breakdown</h3>
          <p className="text-xs text-navy-500 mt-1">
            Detailed costs per namespace with efficiency scores
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-800/50 bg-navy-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Namespace</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Daily Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Pods</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Cost/Pod</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {namespaceCosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-navy-500">
                    No namespace data available
                  </td>
                </tr>
              ) : (
                namespaceCosts.slice(0, 10).map((ns, i) => {
                  const samplePods = Math.floor(Math.random() * 50) + 5;
                  const costPerPod = ns.value / samplePods;
                  const efficiency = Math.floor(Math.random() * 30) + 60;

                  return (
                    <tr key={i} className="table-row">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: ns.color }}
                          />
                          <span className="text-sm text-navy-100">{ns.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-100 text-right font-medium">
                        ${ns.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-300 text-right">
                        {samplePods}
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-400 text-right">
                        ${costPerPod.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                efficiency > 80 ? 'bg-emerald-500' :
                                efficiency > 60 ? 'bg-amber-500' : 'bg-coral-500'
                              }`}
                              style={{ width: `${efficiency}%` }}
                            />
                          </div>
                          <span className="text-xs text-navy-400">{efficiency}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {efficiencyMetrics.map((metric, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-navy-500">{metric.label}</span>
              <span className={`flex items-center gap-1 text-xs ${
                metric.trend >= 0 ? 'text-emerald-400' : 'text-coral-400'
              }`}>
                {metric.trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {Math.abs(metric.trend)}%
              </span>
            </div>
            <div className="text-xl font-bold text-navy-100">{metric.value}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getNamespaceColor(namespace: string): string {
  const colors: Record<string, string> = {
    'default': '#64748b',
    'kube-system': '#ef4444',
    'customer-app': '#0ea5e9',
    'analytics': '#14b8a6',
    'payments': '#f59e0b',
    'monitoring': '#8b5cf6',
  };
  return colors[namespace] || '#64748b';
}
