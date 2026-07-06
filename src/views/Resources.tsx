import { useEffect, useState, useMemo } from 'react';
import {
  Server,
  Database,
  HardDrive,
  Network,
  Container,
  Search,
  Filter,
  MoreVertical,
  Cpu,
  Activity,
  DollarSign,
  MapPin,
  CircleDot,
  Tag,
  Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { exportToCsv } from '../lib/csvExport';
import { Resource, CloudProvider, Application } from '../types';
import { BarChart, DonutChart, GaugeChart, Sparkline } from '../components/Charts';

export function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: resourceData } = await supabase
        .from('resources')
        .select('*');

      if (resourceData) setResources(resourceData);

      const { data: providerData } = await supabase
        .from('cloud_providers')
        .select('*');

      if (providerData) setProviders(providerData);

      const { data: appData } = await supabase
        .from('applications')
        .select('*');

      if (appData) setApplications(appData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      if (searchQuery && !resource.resource_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !resource.resource_id?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (typeFilter !== 'all' && resource.resource_type !== typeFilter) return false;
      if (statusFilter !== 'all' && resource.status !== statusFilter) return false;
      if (providerFilter !== 'all' && resource.provider_id !== providerFilter) return false;
      return true;
    });
  }, [resources, searchQuery, typeFilter, statusFilter, providerFilter]);

  const getProvider = (id: string) => providers.find((p) => p.id === id);
  const getApplication = (id: string) => applications.find((a) => a.id === id);

  const resourceMetrics = useMemo(() => {
    const totalCost = filteredResources.reduce((sum, r) => sum + (r.monthly_cost || 0), 0);
    const runningCount = filteredResources.filter((r) => r.status === 'running').length;
    const avgUtilization = filteredResources.length > 0
      ? filteredResources.filter((r) => r.utilization_percent !== null)
          .reduce((sum, r) => sum + (r.utilization_percent || 0), 0) / filteredResources.length
      : 0;

    const typeDistribution: Record<string, number> = {};
    filteredResources.forEach((r) => {
      const type = r.resource_type || 'unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    const byType = Object.entries(typeDistribution).map(([type, count]) => ({
      name: type,
      value: count,
      color: getTypeColor(type),
    }));

    const byStatus = {
      running: filteredResources.filter((r) => r.status === 'running').length,
      stopped: filteredResources.filter((r) => r.status === 'stopped').length,
      terminated: filteredResources.filter((r) => r.status === 'terminated').length,
    };

    // Cost by provider for donut chart
    const costByProvider: Record<string, number> = {};
    filteredResources.forEach((r) => {
      const providerId = r.provider_id || 'unknown';
      costByProvider[providerId] = (costByProvider[providerId] || 0) + (r.monthly_cost || 0);
    });

    const colorPalette = ['#0ea5e9', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4'];
    const byCost = Object.entries(costByProvider)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([providerId, cost], i) => {
        const provider = providers.find((p) => p.id === providerId);
        return {
          name: provider?.display_name || providerId,
          value: cost,
          color: provider?.color || colorPalette[i % colorPalette.length],
        };
      });

    // Unique counts for KPI cards
    const uniqueProviders = new Set(filteredResources.map((r) => r.provider_id)).size;
    const uniqueServices = new Set(filteredResources.map((r) => r.resource_type).filter(Boolean)).size;
    const uniqueRegions = new Set(filteredResources.map((r) => r.region).filter(Boolean)).size;

    return { totalCost, runningCount, avgUtilization, byType, byStatus, byCost, uniqueProviders, uniqueServices, uniqueRegions };
  }, [filteredResources, providers]);

  const getResourceIcon = (type: string | null) => {
    switch (type) {
      case 'vm': return Server;
      case 'database': return Database;
      case 'storage': return HardDrive;
      case 'container': return Container;
      case 'serverless': return Network;
      default: return CircleDot;
    }
  };

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
          <h2 className="text-xl font-semibold text-navy-100">Resource Inventory</h2>
          <p className="text-sm text-navy-500 mt-1">
            Monitor resources across all cloud environments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="btn btn-secondary"
            onClick={() => {
              const rows = filteredResources.map((r) => ({
                Resource_Name: r.resource_name || r.resource_id,
                Resource_ID: r.resource_id,
                Type: r.resource_type || 'unknown',
                Provider: getProvider(r.provider_id)?.display_name || r.provider_id,
                Region: r.region || '',
                Status: r.status || '',
                Monthly_Cost_USD: r.monthly_cost?.toFixed(2) || '0',
                Utilization_Percent: r.utilization_percent?.toFixed(1) || '0',
                Application: getApplication(r.application_id || '')?.name || '',
              }));
              exportToCsv(`resources-${new Date().toISOString().slice(0, 10)}`, rows);
            }}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="btn btn-primary">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="input py-1.5 px-3 text-sm"
            >
              <option value="all">All Providers</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input py-1.5 px-3 text-sm"
            >
              <option value="all">All Types</option>
              <option value="vm">VMs</option>
              <option value="database">Databases</option>
              <option value="storage">Storage</option>
              <option value="container">Containers</option>
              <option value="serverless">Serverless</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input py-1.5 px-3 text-sm"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <Server className="w-4 h-4" />
            <span className="text-sm">Total Resources</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">{filteredResources.length}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="badge badge-success">{resourceMetrics.runningCount} Running</span>
            <span className="badge badge-warning">{resourceMetrics.byStatus.stopped} Stopped</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Monthly Cost</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">
            ${(resourceMetrics.totalCost / 1000).toFixed(0)}K
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-coral-400">+8.3% MoM</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm">Avg Utilization</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">
            {resourceMetrics.avgUtilization.toFixed(0)}%
          </div>
          <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${resourceMetrics.avgUtilization}%` }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <Cpu className="w-4 h-4" />
            <span className="text-sm">Resource Types</span>
          </div>
          <BarChart
            data={resourceMetrics.byType}
            height={60}
            showValues={false}
          />
        </div>
      </div>

      {/* Summary Tiles by Provider */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card card-hover">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <Server className="w-4 h-4" />
            <span className="text-sm">Unique Providers</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">{resourceMetrics.uniqueProviders}</div>
          <p className="text-xs text-navy-600 mt-1">active clouds</p>
        </div>
        <div className="stat-card card-hover">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <Tag className="w-4 h-4" />
            <span className="text-sm">Unique Services</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">{resourceMetrics.uniqueServices}</div>
          <p className="text-xs text-navy-600 mt-1">service types</p>
        </div>
        <div className="stat-card card-hover">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Unique Regions</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">{resourceMetrics.uniqueRegions}</div>
          <p className="text-xs text-navy-600 mt-1">data centers</p>
        </div>
        <div className="stat-card card-hover">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Avg Cost/Resource</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">
            ${filteredResources.length > 0 ? (resourceMetrics.totalCost / filteredResources.length).toFixed(0) : '0'}
          </div>
          <p className="text-xs text-navy-600 mt-1">per month</p>
        </div>
      </div>

      {/* Cost Distribution by Provider */}
      <div className="card p-6 card-hover">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium text-navy-100">Cost Distribution by Provider</h3>
            <p className="text-xs text-navy-500 mt-1">
              Monthly cost breakdown across cloud providers
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-navy-100">
              ${resourceMetrics.totalCost >= 1000
                ? `${(resourceMetrics.totalCost / 1000).toFixed(0)}K`
                : resourceMetrics.totalCost.toFixed(0)}
            </p>
            <p className="text-xs text-navy-500">total monthly cost</p>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <DonutChart
            data={resourceMetrics.byCost}
            size={220}
            thickness={28}
            showLegend={false}
            showHoverTooltip
            centerValue={resourceMetrics.totalCost >= 1000
              ? `$${(resourceMetrics.totalCost / 1000).toFixed(0)}K`
              : `$${resourceMetrics.totalCost.toFixed(0)}`}
            centerLabel="monthly cost"
          />

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {resourceMetrics.byCost.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-navy-800/30 rounded-lg hover:bg-navy-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-navy-300 truncate max-w-[120px]">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-medium text-navy-100">
                    ${item.value >= 1000 ? `${(item.value / 1000).toFixed(0)}K` : item.value.toFixed(0)}
                  </span>
                  <span className="text-xs text-navy-500 bg-navy-700/50 px-2 py-0.5 rounded">
                    {resourceMetrics.totalCost > 0
                      ? ((item.value / resourceMetrics.totalCost) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-navy-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-medium text-navy-100">Resource List</h3>
              <span className="text-xs text-navy-500">
                {filteredResources.length} of {resources.length} resources
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-800/50 bg-navy-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase tracking-wider">
                  Monthly Cost
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-navy-500">
                    No resources found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredResources.slice(0, 15).map((resource) => {
                  const provider = getProvider(resource.provider_id);
                  const Icon = getResourceIcon(resource.resource_type);

                  return (
                    <tr key={resource.id} className="table-row">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: provider?.color + '20' || '#334155' }}
                          >
                            <Icon
                              className="w-4 h-4"
                              style={{ color: provider?.color || '#94a3b8' }}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-navy-100">
                              {resource.resource_name || resource.resource_id}
                            </p>
                            <p className="text-xs text-navy-500">{resource.resource_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-navy-300 capitalize">
                          {resource.resource_type || 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: provider?.color || '#64748b' }}
                          />
                          <span className="text-sm text-navy-300">
                            {provider?.display_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-navy-400">
                          <MapPin className="w-3 h-3" />
                          {resource.region || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`badge ${
                            resource.status === 'running'
                              ? 'badge-success'
                              : resource.status === 'stopped'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {resource.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-navy-100">
                          ${resource.monthly_cost?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (resource.utilization_percent || 0) > 70 ? 'bg-emerald-500' :
                                (resource.utilization_percent || 0) > 40 ? 'bg-amber-500' : 'bg-coral-500'
                              }`}
                              style={{ width: `${Math.min(resource.utilization_percent || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-navy-400">
                            {resource.utilization_percent?.toFixed(0) || '0'}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-1.5 hover:bg-navy-800 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-navy-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'vm': return '#0ea5e9';
    case 'database': return '#14b8a6';
    case 'storage': return '#f59e0b';
    case 'container': return '#8b5cf6';
    case 'serverless': return '#ef4444';
    default: return '#64748b';
  }
}
