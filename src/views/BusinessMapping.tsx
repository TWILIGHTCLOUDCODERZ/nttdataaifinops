import { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  Layers,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowRight,
  Receipt,
  Map as MapIcon,
  Download,
  Share2,
  Target,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useData } from '../lib/DataContext';
import { useTimeFilter } from '../lib/TimeFilterContext';
import { DonutChart, BarChart } from '../components/Charts';
import { Chargeback } from './Chargeback';

export function BusinessMapping() {
  const { period } = useTimeFilter();
  const {
    loading,
    businessUnits,
    applications,
    costAllocations,
    allocationRules,
    totalDirectCost,
    totalSharedCost,
    grandAllocationTotal,
    unallocatedAmount,
  } = useData();

  const [activeTab, setActiveTab] = useState<'mapping' | 'chargeback'>('mapping');
  const [selectedBU, setSelectedBU] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const allocByBU = useMemo(() => {
    const map = new Map<string, typeof costAllocations[0]>();
    costAllocations.forEach((a) => map.set(a.business_unit_id, a));
    return map;
  }, [costAllocations]);

  const buRows = useMemo(() => {
    return businessUnits.map((bu) => {
      const alloc = allocByBU.get(bu.id);
      return {
        ...bu,
        directCost: alloc?.direct_cost ?? 0,
        sharedCost: alloc?.shared_cost ?? 0,
        totalCost: alloc?.total_cost ?? 0,
        allocationPct: alloc?.allocation_percentage ?? 0,
        overheadItems: alloc?.overhead_items ?? [],
        riSavings: alloc?.ri_savings ?? 0,
        spSavings: alloc?.sp_savings ?? 0,
        variancePct: alloc?.variance_pct ?? 0,
        appCount: applications.filter((a) => a.business_unit_id === bu.id).length,
      };
    });
  }, [businessUnits, allocByBU, applications]);

  const totalBudget = useMemo(() => businessUnits.reduce((s, bu) => s + (bu.budget || 0), 0), [businessUnits]);
  const allocatedRate = useMemo(() => (totalBudget > 0 ? (grandAllocationTotal / totalBudget) * 100 : 0), [grandAllocationTotal, totalBudget]);

  const handleExportCSV = (type: 'bu_summary' | 'detailed' | 'overhead') => {
    setShowExportMenu(false);
    let csv = '';
    const headers = [];
    const rows: Record<string, string | number>[] = [];

    if (type === 'bu_summary') {
      csv = 'Business Unit,Code,Budget,Direct Cost,Shared Cost,Total Cost,RI Savings,SP Savings,Variance %,App Count\n';
      buRows.forEach((bu) => {
        csv += `${bu.name},${bu.code},${bu.budget || 0},${bu.directCost},${bu.sharedCost},${bu.totalCost},${bu.riSavings},${bu.spSavings},${bu.variancePct},${bu.appCount}\n`;
      });
    } else if (type === 'detailed') {
      csv = 'Business Unit,Item,Amount,Type\n';
      buRows.forEach((bu) => {
        csv += `${bu.name},Direct Cost,${bu.directCost},direct\n`;
        csv += `${bu.name},Shared Cost,${bu.sharedCost},shared\n`;
        bu.overheadItems.forEach((item) => {
          csv += `${bu.name},${item.item},${item.amount},overhead\n`;
        });
      });
    } else if (type === 'overhead') {
      csv = 'Allocation Rule,Type,Total Amount,Description\n';
      allocationRules.forEach((rule) => {
        csv += `${rule.rule_name},${rule.rule_type},${rule.total_amount},${rule.description || ''}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `finops_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-96 bg-navy-900/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (activeTab === 'chargeback') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-1 bg-navy-800/50 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('mapping')}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors text-navy-400 hover:text-navy-200"
          >
            <MapIcon className="w-4 h-4" />
            Business Mapping
          </button>
          <button
            onClick={() => setActiveTab('chargeback')}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors bg-navy-700 text-navy-100"
          >
            <Receipt className="w-4 h-4" />
            Chargeback
          </button>
        </div>
        <Chargeback />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-navy-800/50 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('mapping')}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors bg-navy-700 text-navy-100"
        >
          <MapIcon className="w-4 h-4" />
          Business Mapping
        </button>
        <button
          onClick={() => setActiveTab('chargeback')}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors text-navy-400 hover:text-navy-200"
        >
          <Receipt className="w-4 h-4" />
          Chargeback
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-navy-100">Business Mapping & Cost Allocation</h2>
          <p className="text-sm text-navy-500 mt-1">
            Direct costs, shared overhead, and allocation rules across business units
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn btn-primary"
          >
            <Download className="w-4 h-4" />
            Export CSV
            <ChevronDown className="w-3 h-3" />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-navy-800 border border-navy-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => handleExportCSV('bu_summary')}
                className="w-full px-4 py-3 text-sm text-left text-navy-200 hover:bg-navy-700 transition-colors flex items-center gap-3"
              >
                <Building2 className="w-4 h-4 text-primary-400" />
                BU Summary Report
              </button>
              <button
                onClick={() => handleExportCSV('detailed')}
                className="w-full px-4 py-3 text-sm text-left text-navy-200 hover:bg-navy-700 transition-colors flex items-center gap-3"
              >
                <Layers className="w-4 h-4 text-accent-400" />
                Detailed Breakdown
              </button>
              <button
                onClick={() => handleExportCSV('overhead')}
                className="w-full px-4 py-3 text-sm text-left text-navy-200 hover:bg-navy-700 transition-colors flex items-center gap-3"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                Overhead Rules Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Total Cloud Spend</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">
            ${grandAllocationTotal >= 1000000 ? (grandAllocationTotal / 1000000).toFixed(2) + 'M' : (grandAllocationTotal / 1000).toFixed(0) + 'K'}
          </div>
          <div className="text-sm text-navy-500 mt-2">${(totalDirectCost / 1000).toFixed(0)}K direct + ${(totalSharedCost / 1000).toFixed(0)}K shared</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <PieChart className="w-4 h-4" />
            <span className="text-sm">Shared Overhead</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">
            ${(totalSharedCost / 1000).toFixed(0)}K
          </div>
          <div className="text-sm text-navy-500 mt-2">{((totalSharedCost / grandAllocationTotal) * 100).toFixed(1)}% of total</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-sm">Budget Utilization</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">
            {allocatedRate.toFixed(1)}%
          </div>
          <div className="text-sm text-navy-500 mt-2">of ${(totalBudget / 1000000).toFixed(2)}M budget</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-navy-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Unallocated</span>
          </div>
          <div className="text-2xl font-bold text-navy-100">
            ${(unallocatedAmount / 1000).toFixed(0)}K
          </div>
          <div className="text-sm text-navy-500 mt-2">{allocationRules.length} active rules</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: BU Allocation Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="p-4 border-b border-navy-800/50 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-navy-100">Business Unit Cost Allocation</h3>
                <p className="text-xs text-navy-500 mt-1">Direct + shared costs by business unit</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-b border-navy-800/50 bg-navy-900/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Business Unit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Direct</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Shared</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">% of Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {buRows.sort((a, b) => b.totalCost - a.totalCost).map((bu) => (
                    <tr
                      key={bu.id}
                      className="table-row cursor-pointer"
                      onClick={() => setSelectedBU(selectedBU === bu.id ? null : bu.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-500/10 rounded-lg">
                            <Building2 className="w-4 h-4 text-primary-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-navy-100">{bu.name}</p>
                            <p className="text-xs text-navy-500">{bu.code} · {bu.appCount} apps</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-300 text-right">
                        ${bu.directCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-300 text-right">
                        ${bu.sharedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-sm text-navy-100 text-right font-medium">
                        ${bu.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-navy-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${bu.allocationPct}%` }}
                            />
                          </div>
                          <span className="text-sm text-navy-300">{bu.allocationPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${bu.variancePct > 0 ? 'text-coral-400' : 'text-emerald-400'}`}>
                          {bu.variancePct > 0 ? '+' : ''}{bu.variancePct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-navy-700 bg-navy-900/40">
                    <td className="px-4 py-3 text-sm font-bold text-navy-100">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-navy-100 text-right">
                      ${totalDirectCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-navy-100 text-right">
                      ${totalSharedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-navy-100 text-right">
                      ${grandAllocationTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-navy-100 text-right">100%</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Overhead Breakdown for Selected BU */}
          {selectedBU && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-navy-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-500/10 rounded-lg">
                    <Share2 className="w-4 h-4 text-accent-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-navy-100">
                      {buRows.find((bu) => bu.id === selectedBU)?.name} — Overhead Breakdown
                    </h3>
                    <p className="text-xs text-navy-500 mt-1">How shared costs are allocated to this BU</p>
                  </div>
                </div>
                <button onClick={() => setSelectedBU(null)} className="text-xs text-navy-500 hover:text-navy-300">
                  Close
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-navy-800/50 bg-navy-900/30">
                      <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Overhead Item</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">% of BU Shared</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Rule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buRows.find((bu) => bu.id === selectedBU)?.overheadItems.map((item, i) => {
                      const rule = allocationRules.find((r) => r.rule_name === item.item);
                      const buShared = buRows.find((bu) => bu.id === selectedBU)?.sharedCost || 1;
                      return (
                        <tr key={i} className="table-row">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-accent-400" />
                              <span className="text-sm text-navy-100">{item.item}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-navy-100 text-right font-medium">
                            ${item.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-navy-300 text-right">
                            {((item.amount / buShared) * 100).toFixed(1)}%
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge badge-info text-xs">
                              {rule?.rule_type || 'proportional'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Applications Table */}
          <div className="card">
            <div className="p-4 border-b border-navy-800/50">
              <h3 className="font-medium text-navy-100">Application Cost Mapping</h3>
              <p className="text-xs text-navy-500 mt-1">Workloads mapped to business units</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-800/50 bg-navy-900/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Application</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Environment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Team</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Business Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 12).map((app) => {
                    const bu = businessUnits.find((b) => b.id === app.business_unit_id);
                    return (
                      <tr key={app.id} className="table-row">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent-500/10 rounded-lg">
                              <Layers className="w-4 h-4 text-accent-400" />
                            </div>
                            <span className="text-sm text-navy-100">{app.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${
                            app.environment === 'production' ? 'badge-success' :
                            app.environment === 'staging' ? 'badge-warning' : 'badge-info'
                          }`}>
                            {app.environment}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-navy-300">{app.team || '—'}</td>
                        <td className="px-4 py-3 text-sm text-navy-300">{bu?.name || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Charts, Rules, Summary */}
        <div className="space-y-6">
          {/* Direct vs Shared Donut */}
          <div className="card p-5">
            <h3 className="font-medium text-navy-100 mb-4">Cost Composition</h3>
            <DonutChart
              data={[
                { name: 'Direct', value: totalDirectCost, color: '#0ea5e9' },
                { name: 'Shared', value: totalSharedCost, color: '#f59e0b' },
                ...(unallocatedAmount > 0 ? [{ name: 'Unallocated', value: unallocatedAmount, color: '#64748b' }] : []),
              ]}
              size={160}
              thickness={20}
              centerValue={`${((totalDirectCost / grandAllocationTotal) * 100).toFixed(0)}%`}
              centerLabel="Direct"
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-navy-300">
                  <span className="w-2 h-2 rounded-full bg-primary-500" />
                  Direct Costs
                </span>
                <span className="text-navy-100 font-medium">${(totalDirectCost / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-navy-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Shared Overhead
                </span>
                <span className="text-navy-100 font-medium">${(totalSharedCost / 1000).toFixed(0)}K</span>
              </div>
              {unallocatedAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-navy-300">
                    <span className="w-2 h-2 rounded-full bg-navy-500" />
                    Unallocated
                  </span>
                  <span className="text-navy-100 font-medium">${(unallocatedAmount / 1000).toFixed(0)}K</span>
                </div>
              )}
            </div>
          </div>

          {/* Allocation Rules */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-navy-100">Allocation Rules</h3>
              <span className="text-xs text-navy-500">{allocationRules.length} active</span>
            </div>
            <div className="space-y-3">
              {allocationRules.map((rule, i) => (
                <div
                  key={i}
                  className="p-3 bg-navy-800/30 rounded-lg hover:bg-navy-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-navy-200">{rule.rule_name}</span>
                    <span className="text-xs text-navy-500">${(rule.total_amount / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-navy-500">{rule.rule_type}</span>
                    <span className={`badge ${rule.is_active ? 'badge-success' : 'badge-warning'} text-xs`}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Allocation Summary */}
          <div className="card p-5">
            <h3 className="font-medium text-navy-100 mb-4">Allocation Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-navy-400">Direct Allocation</span>
                <span className="text-sm font-medium text-navy-100">${(totalDirectCost / 1000).toFixed(0)}K</span>
              </div>
              <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(totalDirectCost / grandAllocationTotal) * 100}%` }} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-navy-400">Shared Costs</span>
                <span className="text-sm font-medium text-navy-100">${(totalSharedCost / 1000).toFixed(0)}K</span>
              </div>
              <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(totalSharedCost / grandAllocationTotal) * 100}%` }} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-navy-400">Total Allocated</span>
                <span className="text-sm font-medium text-navy-100">${(grandAllocationTotal / 1000).toFixed(0)}K</span>
              </div>
              <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(grandAllocationTotal / (grandAllocationTotal + unallocatedAmount)) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
