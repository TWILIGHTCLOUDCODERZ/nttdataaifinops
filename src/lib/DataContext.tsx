import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { supabase } from './supabase';
import { useTimeFilter } from './TimeFilterContext';
import { getPeriodMultiplier } from './timeFilter';
import { DashboardKPIs, CloudProvider, CloudCost, BusinessUnit, Application, CostAnomaly, CostAllocation, AllocationRule } from '../types';

export interface CloudCostEvent {
  id: string;
  provider_id: string | null;
  provider_name: string | null;
  account_id: string;
  account_name: string | null;
  service_name: string | null;
  service_category: string | null;
  resource_id: string | null;
  resource_name: string | null;
  region: string | null;
  business_unit_id: string | null;
  business_unit_name: string | null;
  application_id: string | null;
  application_name: string | null;
  environment: string | null;
  team: string | null;
  cost_date: string;
  daily_cost: number;
  currency: string;
  commitment_type: string | null;
  commitment_savings: number | null;
  anomaly_type: string | null;
  anomaly_severity: string | null;
  anomaly_description: string | null;
  recommendation_type: string | null;
  potential_savings: number | null;
  tags: Record<string, string>;
  created_at: string;
}

// The canonical monthly total is $342K. All derived totals are computed via multipliers.
// 7d  => $150K  (× 0.4386)
// 1mo => $342K  (× 1.0)
// 3mo => $850K  (× 2.485)
// 1yr => $2.85M (× 8.333)
export const CANONICAL_MONTHLY_SPEND = 342000;

export interface SubsidiaryData {
  id: string;
  name: string;
  color: string;
  budget: number;
  actualCost: number;
  sharedCost: number;
  chargeback: number;
  variance: number;
  momGrowth: number;
  riSavings: number;
  spSavings: number;
  coverage: number;
  utilization: number;
  riExpiration: string;
  wastedCommitment: number;
  projection: number;
}

export interface ModelData {
  name: string;
  provider: string;
  color: string;
  tokens: number;
  cost: number;
  requests: number;
  avgLatency: number;
}

export interface UnifiedDataContextValue {
  // Loading state
  loading: boolean;

  // Period multiplier
  multiplier: number;

  // ─── Core KPIs ─────────────────────────────────
  totalCloudSpend: number;
  totalCloudSpendFormatted: string;
  forecastedSpend: number;
  savingsAchieved: number;
  commitmentCoverage: number;
  budgetVariance: number;
  monthOverMonthGrowth: number;

  // ─── Dashboard / Provider data ─────────────────
  providers: CloudProvider[];
  costsByProvider: { name: string; value: number; color: string }[];
  costsByCategory: { name: string; value: number; color: string }[];
  dailyCosts: { name: string; value: number }[];
  anomalies: CostAnomaly[];

  // ─── Business / Subsidiary data ────────────────
  businessUnits: BusinessUnit[];
  applications: Application[];
  subsidiaries: SubsidiaryData[];
  grandTotalSpend: number;
  grandActualCost: number;
  grandSharedCost: number;
  grandChargeback: number;
  grandRISavings: number;
  grandSPSavings: number;
  grandWasted: number;
  avgCoverage: number;
  avgUtilization: number;

  // ─── AI Analytics data ──────────────────────────
  aiModels: ModelData[];
  aiTotalTokens: number;
  aiTotalCost: number;
  aiTotalRequests: number;

  // ─── Raw data (for advanced use) ───────────────
  cloudCosts: CloudCost[];
  costEvents: CloudCostEvent[];
  kpis: DashboardKPIs | null;

  // Normalization factor: raw DB costs → canonical monthly total
  costScaleFactor: number;

  // ─── Allocation data ───────────────────────────
  costAllocations: CostAllocation[];
  allocationRules: AllocationRule[];
  totalDirectCost: number;
  totalSharedCost: number;
  grandAllocationTotal: number;
  grandRISavings: number;
  grandSPSavings: number;
  unallocatedAmount: number;
}

const DataContext = createContext<UnifiedDataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { period } = useTimeFilter();
  const [loading, setLoading] = useState(true);
  const [kpis, setKPIs] = useState<DashboardKPIs | null>(null);
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [cloudCosts, setCloudCosts] = useState<CloudCost[]>([]);
  const [costEvents, setCostEvents] = useState<CloudCostEvent[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [anomalies, setAnomalies] = useState<CostAnomaly[]>([]);
  const [costAllocations, setCostAllocations] = useState<CostAllocation[]>([]);
  const [allocationRules, setAllocationRules] = useState<AllocationRule[]>([]);

  const multiplier = useMemo(() => getPeriodMultiplier(period), [period]);

  // ─── Fetch once from Supabase ──────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      const [
        { data: kpiData },
        { data: providersData },
        { data: costsData },
        { data: eventsData },
        { data: buData },
        { data: appData },
        { data: anomaliesData },
        { data: allocData },
        { data: rulesData },
      ] = await Promise.all([
        supabase.from('dashboard_kpis').select('*').limit(1).single(),
        supabase.from('cloud_providers').select('*').order('name'),
        supabase.from('cloud_costs').select('*'),
        supabase.from('cloud_cost_events').select('*'),
        supabase.from('business_units').select('*'),
        supabase.from('applications').select('*'),
        supabase.from('cost_anomalies').select('*').order('detected_at', { ascending: false }),
        supabase.from('cost_allocations').select('*').order('total_cost', { ascending: false }),
        supabase.from('allocation_rules').select('*').order('total_amount', { ascending: false }),
      ]);
      if (cancelled) return;
      setKPIs(kpiData as DashboardKPIs | null);
      setProviders((providersData as CloudProvider[] | null) ?? []);
      setCloudCosts((costsData as CloudCost[] | null) ?? []);
      setCostEvents((eventsData as CloudCostEvent[] | null) ?? []);
      setBusinessUnits((buData as BusinessUnit[] | null) ?? []);
      setApplications((appData as Application[] | null) ?? []);
      setAnomalies((anomaliesData as CostAnomaly[] | null) ?? []);
      setCostAllocations((allocData as CostAllocation[] | null) ?? []);
      setAllocationRules((rulesData as AllocationRule[] | null) ?? []);
      setLoading(false);
    }
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  // ─── Core KPIs (use DB value if available, else canonical fallback) ───
  const dbTotal = kpis?.total_cloud_spend ?? CANONICAL_MONTHLY_SPEND;
  const dbForecast = kpis?.forecasted_spend ?? CANONICAL_MONTHLY_SPEND * 1.1;
  const dbSavings = kpis?.savings_achieved ?? CANONICAL_MONTHLY_SPEND * 0.15;
  const dbCoverage = kpis?.commitment_coverage ?? 67.5;
  const dbVariance = kpis?.budget_variance ?? -4.2;
  const dbMomGrowth = kpis?.month_over_month_growth ?? 8.3;

  // Normalization: raw DB costs → canonical monthly total
  const rawDbTotal = useMemo(() => cloudCosts.reduce((sum, c) => sum + c.daily_cost, 0), [cloudCosts]);
  const costScaleFactor = useMemo(() => dbTotal / (rawDbTotal || dbTotal), [dbTotal, rawDbTotal]);

  const totalCloudSpend = useMemo(() => dbTotal * multiplier, [dbTotal, multiplier]);
  const totalCloudSpendFormatted = useMemo(() => {
    if (totalCloudSpend >= 1000000) return `$${(totalCloudSpend / 1000000).toFixed(2)}M`;
    return `$${(totalCloudSpend / 1000).toFixed(0)}K`;
  }, [totalCloudSpend]);
  const forecastedSpend = useMemo(() => dbForecast * multiplier, [dbForecast, multiplier]);
  const savingsAchieved = useMemo(() => dbSavings * multiplier, [dbSavings, multiplier]);
  const commitmentCoverage = dbCoverage;
  const budgetVariance = dbVariance;
  const monthOverMonthGrowth = dbMomGrowth;

  // ─── Provider costs (prefer unified cloud_cost_events, fall back to cloud_costs) ───
  const costsByProvider = useMemo(() => {
    const source = costEvents.length > 0 ? costEvents : cloudCosts;
    const byProv: Record<string, number> = {};
    source.forEach((c: any) => {
      const key = c.provider_name ?? c.provider_id ?? 'unknown';
      byProv[key] = (byProv[key] || 0) + c.daily_cost;
    });
    if (source.length === 0) {
      return [
        { name: 'AWS', value: totalCloudSpend * 0.45, color: '#FF9900' },
        { name: 'Azure', value: totalCloudSpend * 0.28, color: '#0078D4' },
        { name: 'GCP', value: totalCloudSpend * 0.15, color: '#4285F4' },
        { name: 'Kubernetes', value: totalCloudSpend * 0.08, color: '#326CE5' },
        { name: 'Other', value: totalCloudSpend * 0.04, color: '#94a3b8' },
      ];
    }
    const PROVIDER_COLORS: Record<string, string> = {
      'Amazon Web Services': '#FF9900',
      'Microsoft Azure': '#0078D4',
      'Google Cloud Platform': '#4285F4',
      'Oracle Cloud Infrastructure': '#F80000',
      'Alibaba Cloud': '#FF6A00',
      'Kubernetes': '#326CE5',
      'Private Cloud': '#2D3748',
    };
    return Object.entries(byProv)
      .map(([name, value]) => ({
        name,
        value: value * multiplier,
        color: PROVIDER_COLORS[name] ?? '#94a3b8',
      }))
      .sort((a, b) => b.value - a.value);
  }, [costEvents, cloudCosts, multiplier, totalCloudSpend]);

  const costsByCategory = useMemo(() => {
    const source = costEvents.length > 0 ? costEvents : cloudCosts;
    const byCat: Record<string, number> = {};
    source.forEach((c: any) => {
      const key = c.service_category ?? 'Uncategorized';
      byCat[key] = (byCat[key] || 0) + c.daily_cost;
    });
    const CATEGORY_COLORS: Record<string, string> = {
      Compute: '#0ea5e9',
      Storage: '#14b8a6',
      Database: '#f59e0b',
      Network: '#f43f5e',
      Networking: '#f43f5e',
      'AI / ML': '#8b5cf6',
      Security: '#10b981',
      Monitoring: '#06b6d4',
      Uncategorized: '#94a3b8',
    };

    if (source.length === 0) {
      return [
        { name: 'Compute', value: totalCloudSpend * 0.35, color: CATEGORY_COLORS['Compute'] },
        { name: 'Storage', value: totalCloudSpend * 0.20, color: CATEGORY_COLORS['Storage'] },
        { name: 'Database', value: totalCloudSpend * 0.15, color: CATEGORY_COLORS['Database'] },
        { name: 'Network', value: totalCloudSpend * 0.12, color: CATEGORY_COLORS['Network'] },
        { name: 'AI / ML', value: totalCloudSpend * 0.18, color: CATEGORY_COLORS['AI / ML'] },
      ];
    }
    return Object.entries(byCat)
      .map(([name, value]) => ({ name, value: value * multiplier, color: CATEGORY_COLORS[name] || '#94a3b8' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [costEvents, cloudCosts, multiplier, totalCloudSpend]);

  const dailyCosts = useMemo(() => {
    const source = costEvents.length > 0 ? costEvents : cloudCosts;
    const days: Record<string, number> = {};
    source.forEach((c: any) => {
      const key = c.cost_date;
      days[key] = (days[key] || 0) + c.daily_cost;
    });
    if (source.length === 0) {
      const count = period === 'year' ? 12 : period === 'quarter' ? 13 : 7;
      const base = totalCloudSpend / count;
      return Array.from({ length: count }, (_, i) => {
        const d = new Date();
        if (period === 'year') {
          d.setMonth(d.getMonth() - (count - 1 - i), 1);
        } else if (period === 'quarter') {
          d.setDate(d.getDate() - (count - 1 - i) * 7);
        } else {
          d.setDate(d.getDate() - (count - 1 - i));
        }
        const name = d.toLocaleDateString('en-US', {
          month: 'short',
          day: period === 'year' ? undefined : 'numeric',
        });
        return { name, value: base * (0.9 + Math.sin(i * 0.8) * 0.08) };
      });
    }
    return Object.entries(days)
      .map(([date, value]) => ({ name: date, value: value * multiplier }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [costEvents, cloudCosts, multiplier, totalCloudSpend, period]);

  // ─── Subsidiary data (consistent across all views) ───
  const subsidiaries = useMemo<SubsidiaryData[]>(() => {
    // Budgets sum to CANONICAL_MONTHLY_SPEND for consistency
    const budgets = [126000, 96000, 73000, 47000];
    const colors = ['#0ea5e9', '#14b8a6', '#f59e0b', '#f43f5e'];
    const names = ['Subsidiary 1', 'Subsidiary 2', 'Subsidiary 3', 'Subsidiary 4'];
    const coverages = [82, 67, 54, 38];
    const utilizations = [91, 78, 62, 45];
    const expirations = ['2024-12-15', '2024-09-30', '2024-11-20', '2024-08-05'];

    return names.map((name, i) => {
      const budget = budgets[i] * multiplier;
      const actualCost = Math.round(budget * (0.82 + Math.sin(i * 1.5) * 0.12));
      const sharedCost = Math.round(actualCost * (0.15 + Math.cos(i) * 0.05));
      const chargeback = actualCost + sharedCost;
      const variance = ((actualCost - budget) / budget) * 100;
      const momGrowth = (Math.sin(i * 2.3) * 8 + 3);
      const riSavings = Math.round(actualCost * (coverages[i] / 100) * 0.35);
      const spSavings = Math.round(actualCost * (coverages[i] / 100) * 0.22);
      const wasted = Math.round((riSavings + spSavings) * ((100 - utilizations[i]) / 100) * 0.5);
      const projection = Math.round(chargeback * (1 + momGrowth / 100));

      return {
        id: `sub${i + 1}`,
        name,
        color: colors[i],
        budget,
        actualCost,
        sharedCost,
        chargeback,
        variance,
        momGrowth,
        riSavings,
        spSavings,
        coverage: coverages[i],
        utilization: utilizations[i],
        riExpiration: expirations[i],
        wastedCommitment: wasted,
        projection,
      };
    });
  }, [multiplier]);

  const grandTotalSpend = useMemo(() => subsidiaries.reduce((s, sub) => s + sub.chargeback, 0), [subsidiaries]);
  const grandActualCost = useMemo(() => subsidiaries.reduce((s, sub) => s + sub.actualCost, 0), [subsidiaries]);
  const grandSharedCost = useMemo(() => subsidiaries.reduce((s, sub) => s + sub.sharedCost, 0), [subsidiaries]);
  const grandChargeback = grandTotalSpend;
  const subRISavings = useMemo(() => subsidiaries.reduce((s, sub) => s + sub.riSavings, 0), [subsidiaries]);
  const subSPSavings = useMemo(() => subsidiaries.reduce((s, sub) => s + sub.spSavings, 0), [subsidiaries]);
  const grandWasted = useMemo(() => subsidiaries.reduce((s, sub) => s + sub.wastedCommitment, 0), [subsidiaries]);
  const avgCoverage = useMemo(() => subsidiaries.reduce((s, sub) => s + sub.coverage, 0) / subsidiaries.length, [subsidiaries]);
  const avgUtilization = useMemo(() => subsidiaries.reduce((s, sub) => s + sub.utilization, 0) / subsidiaries.length, [subsidiaries]);

  // ─── AI Model data (AI is separate from cloud spend, still period-scaled) ───
  const aiModels = useMemo<ModelData[]>(() => {
    const base = [
      { name: 'GPT-4o', provider: 'OpenAI', color: '#10b981', baseTokens: 12000000, baseCost: 2400, baseReqs: 450000, baseLatency: 850 },
      { name: 'GPT-4 Turbo', provider: 'OpenAI', color: '#059669', baseTokens: 8000000, baseCost: 3200, baseReqs: 280000, baseLatency: 1200 },
      { name: 'GPT-3.5 Turbo', provider: 'OpenAI', color: '#34d399', baseTokens: 18000000, baseCost: 900, baseReqs: 920000, baseLatency: 450 },
      { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', color: '#f59e0b', baseTokens: 9500000, baseCost: 2850, baseReqs: 340000, baseLatency: 950 },
      { name: 'Claude 3 Opus', provider: 'Anthropic', color: '#d97706', baseTokens: 4200000, baseCost: 2100, baseReqs: 150000, baseLatency: 1800 },
      { name: 'Gemini 1.5 Pro', provider: 'Google', color: '#0ea5e9', baseTokens: 11000000, baseCost: 1650, baseReqs: 380000, baseLatency: 780 },
      { name: 'Gemini 1.5 Flash', provider: 'Google', color: '#38bdf8', baseTokens: 22000000, baseCost: 440, baseReqs: 1100000, baseLatency: 320 },
      { name: 'Llama 3.1 70B', provider: 'Meta', color: '#8b5cf6', baseTokens: 6500000, baseCost: 520, baseReqs: 240000, baseLatency: 650 },
      { name: 'Mistral Large', provider: 'Mistral', color: '#f43f5e', baseTokens: 3800000, baseCost: 570, baseReqs: 130000, baseLatency: 720 },
    ];
    return base.map((m, i) => ({
      name: m.name,
      provider: m.provider,
      color: m.color,
      tokens: Math.round(m.baseTokens * multiplier * (0.9 + Math.sin(i * 1.7) * 0.15)),
      cost: Math.round(m.baseCost * multiplier * (0.9 + Math.cos(i * 2.1) * 0.12)),
      requests: Math.round(m.baseReqs * multiplier * (0.9 + Math.sin(i * 1.3) * 0.1)),
      avgLatency: Math.round(m.baseLatency * (0.95 + Math.cos(i) * 0.08)),
    }));
  }, [multiplier]);

  const aiTotalTokens = useMemo(() => aiModels.reduce((s, m) => s + m.tokens, 0), [aiModels]);
  const aiTotalCost = useMemo(() => aiModels.reduce((s, m) => s + m.cost, 0), [aiModels]);
  const aiTotalRequests = useMemo(() => aiModels.reduce((s, m) => s + m.requests, 0), [aiModels]);

  const totalDirectCost = useMemo(() => costAllocations.reduce((s, a) => s + a.direct_cost, 0), [costAllocations]);
  const totalSharedCost = useMemo(() => costAllocations.reduce((s, a) => s + a.shared_cost, 0), [costAllocations]);
  const grandAllocationTotal = useMemo(() => costAllocations.reduce((s, a) => s + a.total_cost, 0), [costAllocations]);
  const grandRISavings = useMemo(() => costAllocations.reduce((s, a) => s + a.ri_savings, 0), [costAllocations]);
  const grandSPSavings = useMemo(() => costAllocations.reduce((s, a) => s + a.sp_savings, 0), [costAllocations]);
  const unallocatedAmount = useMemo(() => totalCloudSpend - grandAllocationTotal, [totalCloudSpend, grandAllocationTotal]);

  const value = useMemo(
    () => ({
      loading,
      multiplier,
      totalCloudSpend,
      totalCloudSpendFormatted,
      forecastedSpend,
      savingsAchieved,
      commitmentCoverage,
      budgetVariance,
      monthOverMonthGrowth,
      providers,
      costsByProvider,
      costsByCategory,
      dailyCosts,
      anomalies,
      businessUnits,
      applications,
      subsidiaries,
      grandTotalSpend,
      grandActualCost,
      grandSharedCost,
      grandChargeback,
      grandRISavings,
      grandSPSavings,
      grandWasted,
      avgCoverage,
      avgUtilization,
      aiModels,
      aiTotalTokens,
      aiTotalCost,
      aiTotalRequests,
      cloudCosts,
      costEvents,
      kpis,
      costScaleFactor,
      costAllocations,
      allocationRules,
      totalDirectCost,
      totalSharedCost,
      grandAllocationTotal,
      unallocatedAmount,
    }),
    [
      loading,
      multiplier,
      totalCloudSpend,
      totalCloudSpendFormatted,
      forecastedSpend,
      savingsAchieved,
      commitmentCoverage,
      budgetVariance,
      monthOverMonthGrowth,
      providers,
      costsByProvider,
      costsByCategory,
      dailyCosts,
      anomalies,
      businessUnits,
      applications,
      subsidiaries,
      grandTotalSpend,
      grandActualCost,
      grandSharedCost,
      grandChargeback,
      grandRISavings,
      grandSPSavings,
      grandWasted,
      avgCoverage,
      avgUtilization,
      aiModels,
      aiTotalTokens,
      aiTotalCost,
      aiTotalRequests,
      cloudCosts,
      costEvents,
      kpis,
      costScaleFactor,
      costAllocations,
      allocationRules,
      totalDirectCost,
      totalSharedCost,
      grandAllocationTotal,
      unallocatedAmount,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
