import { useState, useMemo } from 'react';
import {
  Building2,
  DollarSign,
  Download,
  FileText,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Layers,
  ChevronRight,
  ChevronDown,
  Target,
  Share2,
  Info,
} from 'lucide-react';
import { useData } from '../lib/DataContext';
import { DonutChart, BarChart } from '../components/Charts';
import type { OverheadItem } from '../types';

export function Chargeback() {
  const {
    costAllocations,
    allocationRules,
    businessUnits,
    totalDirectCost,
    totalSharedCost,
    grandAllocationTotal,
    grandRISavings,
    grandSPSavings,
  } = useData();

  const [selectedBU, setSelectedBU] = useState<string | 'all'>('all');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReportBU, setSelectedReportBU] = useState<string | 'all'>('all');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedOverheadBU, setSelectedOverheadBU] = useState<string | null>(null);

  const filteredAllocations = selectedBU === 'all'
    ? costAllocations
    : costAllocations.filter((a) => a.business_unit_id === selectedBU);

  const buMap = useMemo(() => {
    const map = new Map<string, typeof businessUnits[0]>();
    businessUnits.forEach((b) => map.set(b.id, b));
    return map;
  }, [businessUnits]);

  // BU-aware aggregates: when a specific BU is selected, all KPIs and charts
  // must reflect only that BU's allocations. When "all" is selected, fall back
  // to the precomputed global totals from DataContext.
  const buMetrics = useMemo(() => {
    if (selectedBU === 'all') {
      return {
        totalChargeback: grandAllocationTotal,
        directCost: totalDirectCost,
        sharedCost: totalSharedCost,
        riSavings: grandRISavings,
        spSavings: grandSPSavings,
        buCount: costAllocations.length,
      };
    }
    const direct = filteredAllocations.reduce((s, a) => s + a.direct_cost, 0);
    const shared = filteredAllocations.reduce((s, a) => s + a.shared_cost, 0);
    const total = filteredAllocations.reduce((s, a) => s + a.total_cost, 0);
    const ri = filteredAllocations.reduce((s, a) => s + a.ri_savings, 0);
    const sp = filteredAllocations.reduce((s, a) => s + a.sp_savings, 0);
    return {
      totalChargeback: total,
      directCost: direct,
      sharedCost: shared,
      riSavings: ri,
      spSavings: sp,
      buCount: filteredAllocations.length,
    };
  }, [selectedBU, filteredAllocations, costAllocations, grandAllocationTotal, totalDirectCost, totalSharedCost, grandRISavings, grandSPSavings]);

  const allocRows = useMemo(() => {
    return costAllocations.map((alloc) => {
      const bu = buMap.get(alloc.business_unit_id);
      return {
        ...alloc,
        buName: bu?.name || 'Unknown',
        buCode: bu?.code || '—',
        budget: bu?.budget || 1,
      };
    });
  }, [costAllocations, buMap]);

  const kpiCards = [
    {
      label: 'Total Chargeback',
      value:
        selectedBU === 'all'
          ? `${(buMetrics.totalChargeback / 1000000).toFixed(2)}M`
          : `${(buMetrics.totalChargeback / 1000).toFixed(0)}K`,
      sub:
        selectedBU === 'all'
          ? `${buMetrics.buCount} business units`
          : buMap.get(selectedBU)?.name || 'Selected BU',
      icon: DollarSign,
      color: 'primary' as const,
      trend: '+5.2%',
      trendUp: true,
    },
    {
      label: 'Actual Cost',
      value:
        selectedBU === 'all'
          ? `${(buMetrics.directCost / 1000000).toFixed(2)}M`
          : `${(buMetrics.directCost / 1000).toFixed(0)}K`,
      sub: 'Direct resource costs',
      icon: BarChart3,
      color: 'accent' as const,
      trend: '+3.8%',
      trendUp: true,
    },
    {
      label: 'Allocated Shared Cost',
      value: `${(buMetrics.sharedCost / 1000).toFixed(0)}K`,
      sub: `${buMetrics.totalChargeback > 0 ? ((buMetrics.sharedCost / buMetrics.totalChargeback) * 100).toFixed(0) : 0}% of total`,
      icon: Layers,
      color: 'amber' as const,
      trend: '+2.1%',
      trendUp: true,
    },
    {
      label: 'RI + SP Savings',
      value: `${((buMetrics.riSavings + buMetrics.spSavings) / 1000).toFixed(0)}K`,
      sub: `${buMetrics.buCount > 0 ? ((buMetrics.riSavings + buMetrics.spSavings) / buMetrics.buCount / 1000).toFixed(0) : 0}K avg`,
      icon: Target,
      color: 'emerald' as const,
      trend: '+12.4%',
      trendUp: true,
    },
  ];

  const handleExportCSV = (type: 'chargeback' | 'overhead' | 'rules') => {
    setShowExportMenu(false);
    let csv = '';

    if (type === 'chargeback') {
      csv = 'Business Unit,Period,Direct Cost,Shared Cost,Total Cost,RI Savings,SP Savings,Net Cost,Variance %\n';
      allocRows.forEach((row) => {
        const net = row.total_cost - row.ri_savings - row.sp_savings;
        csv += `${row.buName},${row.period_start} to ${row.period_end},${row.direct_cost},${row.shared_cost},${row.total_cost},${row.ri_savings},${row.sp_savings},${net},${row.variance_pct}\n`;
      });
    } else if (type === 'overhead') {
      csv = 'Business Unit,Overhead Item,Amount,Rule Type\n';
      allocRows.forEach((row) => {
        row.overhead_items.forEach((item: OverheadItem) => {
          const rule = allocationRules.find((r) => r.rule_name === item.item);
          csv += `${row.buName},${item.item},${item.amount},${rule?.rule_type || 'proportional'}\n`;
        });
      });
    } else if (type === 'rules') {
      csv = 'Rule Name,Type,Total Amount,Description,Status\n';
      allocationRules.forEach((rule) => {
        csv += `${rule.rule_name},${rule.rule_type},${rule.total_amount},${rule.description || ''},${rule.is_active ? 'Active' : 'Inactive'}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `finops_chargeback_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    setReportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-navy-100">Chargeback & Cost Allocation</h2>
          <p className="text-sm text-navy-500 mt-1">
            Cost allocation by business unit with reserved instance and savings plan analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* BU Filter */}
          <div className="flex items-center bg-navy-800/50 rounded-lg p-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedBU('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                selectedBU === 'all' ? 'bg-navy-700 text-navy-100' : 'text-navy-400'
              }`}
            >
              All
            </button>
            {businessUnits.map((bu) => (
              <button
                key={bu.id}
                onClick={() => setSelectedBU(bu.id)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                  selectedBU === bu.id ? 'bg-navy-700 text-navy-100' : 'text-navy-400'
                }`}
              >
                {bu.code}
              </button>
            ))}
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
                  onClick={() => handleExportCSV('chargeback')}
                  className="w-full px-4 py-3 text-sm text-left text-navy-200 hover:bg-navy-700 transition-colors flex items-center gap-3"
                >
                  <FileText className="w-4 h-4 text-primary-400" />
                  Chargeback Summary
                </button>
                <button
                  onClick={() => handleExportCSV('overhead')}
                  className="w-full px-4 py-3 text-sm text-left text-navy-200 hover:bg-navy-700 transition-colors flex items-center gap-3"
                >
                  <Share2 className="w-4 h-4 text-amber-400" />
                  Overhead Breakdown
                </button>
                <button
                  onClick={() => handleExportCSV('rules')}
                  className="w-full px-4 py-3 text-sm text-left text-navy-200 hover:bg-navy-700 transition-colors flex items-center gap-3"
                >
                  <Info className="w-4 h-4 text-accent-400" />
                  Allocation Rules
                </button>
              </div>
            )}
          </div>
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
                'bg-emerald-500/10 text-emerald-400'
              }`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className={`flex items-center gap-1 text-xs ${kpi.trendUp ? 'text-coral-400' : 'text-emerald-400'}`}>
                {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.trend}
              </span>
            </div>
            <div className="metric-value text-navy-100">{kpi.value}</div>
            <p className="metric-label">{kpi.label}</p>
            <p className="text-xs text-navy-600 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Cost Allocation by BU */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-navy-800/50">
          <h3 className="font-medium text-navy-100">Cost Allocation by Business Unit</h3>
          <p className="text-xs text-navy-500 mt-1">Detailed chargeback breakdown per business unit</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-800/50 bg-navy-900/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Business Unit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Direct Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Shared Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">% of Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Budget</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Variance</th>
              </tr>
            </thead>
            <tbody>
              {filteredAllocations.map((alloc) => {
                const bu = buMap.get(alloc.business_unit_id);
                return (
                  <tr key={alloc.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-500/10 rounded-lg">
                          <Building2 className="w-4 h-4 text-primary-400" />
                        </div>
                        <span className="text-sm font-medium text-navy-100">{bu?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-300 text-right">
                      ${alloc.direct_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-300 text-right">
                      ${alloc.shared_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-100 text-right font-medium">
                      ${alloc.total_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-navy-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${alloc.allocation_percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-navy-300">{alloc.allocation_percentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-400 text-right">
                      ${(bu?.budget || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${alloc.variance_pct > 0 ? 'text-coral-400' : 'text-emerald-400'}`}>
                        {alloc.variance_pct > 0 ? '+' : ''}{alloc.variance_pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {selectedBU === 'all' && (
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
                  <td className="px-4 py-3 text-sm font-bold text-navy-400 text-right">
                    ${businessUnits.reduce((s, bu) => s + (bu.budget || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Overhead Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overhead by BU */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-4 border-b border-navy-800/50 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-navy-100">Shared Overhead Breakdown</h3>
              <p className="text-xs text-navy-500 mt-1">How shared costs are allocated per business unit</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-800/50 bg-navy-900/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-navy-500 uppercase">Business Unit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">VPC & NAT</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Support</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">K8s</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Data Transfer</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Security</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-navy-500 uppercase">Total Shared</th>
                </tr>
              </thead>
              <tbody>
                {allocRows.map((row) => (
                  <tr key={row.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-500/10 rounded-lg">
                          <Share2 className="w-4 h-4 text-accent-400" />
                        </div>
                        <span className="text-sm font-medium text-navy-100">{row.buName}</span>
                      </div>
                    </td>
                    {row.overhead_items.map((item: OverheadItem, i: number) => (
                      <td key={i} className="px-4 py-3 text-sm text-navy-300 text-right">
                        ${item.amount.toLocaleString()}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-amber-300 text-right font-medium">
                      ${row.shared_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-navy-700 bg-navy-900/40">
                  <td className="px-4 py-3 text-sm font-bold text-navy-100">Total</td>
                  {allocationRules.map((rule, i) => (
                    <td key={i} className="px-4 py-3 text-sm font-bold text-navy-100 text-right">
                      ${rule.total_amount.toLocaleString()}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm font-bold text-navy-100 text-right">
                    ${totalSharedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Allocation Rules Summary */}
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
      </div>

      {/* RI / Savings Plan Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RI Savings Summary */}
        <div className="card p-5">
          <h3 className="font-medium text-navy-100 mb-4">Reserved Instance Savings</h3>
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-emerald-400">${(grandRISavings / 1000).toFixed(0)}K</p>
            <p className="text-xs text-navy-500 mt-1">total RI savings</p>
          </div>
          <div className="space-y-3">
            {allocRows.map((row) => (
              <div key={row.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-navy-300">{row.buName}</span>
                  <span className="text-navy-100 font-medium">${(row.ri_savings / 1000).toFixed(0)}K</span>
                </div>
                <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(row.ri_savings / (grandRISavings || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SP Savings Summary */}
        <div className="card p-5">
          <h3 className="font-medium text-navy-100 mb-4">Savings Plan Savings</h3>
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-accent-400">${(grandSPSavings / 1000).toFixed(0)}K</p>
            <p className="text-xs text-navy-500 mt-1">total SP savings</p>
          </div>
          <div className="space-y-3">
            {allocRows.map((row) => (
              <div key={row.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-navy-300">{row.buName}</span>
                  <span className="text-navy-100 font-medium">${(row.sp_savings / 1000).toFixed(0)}K</span>
                </div>
                <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-500 rounded-full transition-all duration-500"
                    style={{ width: `${(row.sp_savings / (grandSPSavings || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Composition */}
        <div className="card p-5">
          <h3 className="font-medium text-navy-100 mb-4">Cost Composition</h3>
          <DonutChart
            data={[
              { name: 'Direct', value: totalDirectCost, color: '#0ea5e9' },
              { name: 'Shared', value: totalSharedCost, color: '#f59e0b' },
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
          </div>
        </div>
      </div>

      {/* Report Generation Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setReportModalOpen(false)}>
          <div className="card p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-navy-100">Generate Chargeback Report</h3>
              <button onClick={() => setReportModalOpen(false)} className="text-navy-500 hover:text-navy-300">
                <ChevronRight className="w-5 h-5 rotate-90" />
              </button>
            </div>
            <p className="text-sm text-navy-400 mb-4">Select a business unit and export format.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-navy-500 mb-2 block">Business Unit</label>
                <select
                  value={selectedReportBU}
                  onChange={(e) => setSelectedReportBU(e.target.value)}
                  className="input"
                >
                  <option value="all">All Business Units</option>
                  {businessUnits.map((bu) => (
                    <option key={bu.id} value={bu.id}>{bu.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleExport('excel')}
                  className="btn btn-secondary justify-center"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="btn btn-secondary justify-center"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>

              <div className="p-3 bg-navy-800/30 rounded-lg">
                <p className="text-xs text-navy-500 mb-2">Report includes:</p>
                <ul className="space-y-1 text-xs text-navy-400">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> Monthly invoice summary</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> Chargeback statement per BU</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> Budget vs actual variance</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> RI/Savings plan analysis</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
