export interface CloudProvider {
  id: string;
  name: string;
  display_name: string;
  icon?: string;
  color?: string;
}

export interface DashboardKPIs {
  id: string;
  total_cloud_spend: number;
  month_over_month_growth: number;
  forecasted_spend: number;
  savings_achieved: number;
  commitment_coverage: number;
  budget_variance: number;
  last_updated: string;
}

export interface CloudCost {
  id: string;
  provider_id: string;
  account_id: string;
  account_name: string | null;
  service_name: string | null;
  service_category: string | null;
  region: string | null;
  cost_date: string;
  daily_cost: number;
  currency: string;
  tags: Record<string, string>;
}

export interface BusinessUnit {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
  budget: number | null;
  owner_email: string | null;
}

export interface Application {
  id: string;
  name: string;
  business_unit_id: string | null;
  environment: string | null;
  team: string | null;
}

export interface Resource {
  id: string;
  resource_id: string;
  resource_name: string | null;
  provider_id: string;
  service_name: string | null;
  resource_type: string | null;
  region: string | null;
  status: string | null;
  monthly_cost: number | null;
  utilization_percent: number | null;
  tags: Record<string, string>;
  application_id: string | null;
}

export interface Recommendation {
  id: string;
  resource_id: string;
  recommendation_type: string;
  title: string;
  description: string | null;
  potential_savings: number | null;
  confidence_score: number | null;
  risk_score: number | null;
  status: string;
}

export interface KubernetesCluster {
  id: string;
  name: string;
  provider_id: string;
  cluster_type: string | null;
  region: string | null;
  monthly_cost: number | null;
}

export interface KubernetesCost {
  id: string;
  cluster_id: string;
  namespace: string;
  pod_count: number | null;
  cost_date: string;
  daily_cost: number;
}

export interface Commitment {
  id: string;
  provider_id: string;
  commitment_type: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  monthly_commitment: number | null;
  utilized_amount: number | null;
  coverage_percent: number | null;
  status: string | null;
}

export interface BudgetPolicy {
  id: string;
  name: string;
  scope: string | null;
  budget_amount: number | null;
  alert_threshold_50: boolean;
  alert_threshold_75: boolean;
  alert_threshold_90: boolean;
  alert_threshold_100: boolean;
  is_active: boolean;
}

export interface CostAnomaly {
  id: string;
  provider_id: string;
  detected_at: string;
  anomaly_type: string;
  severity: string;
  cost_impact: number | null;
  description: string | null;
  status: string;
}

export interface CostAllocation {
  id: string;
  business_unit_id: string;
  period_start: string;
  period_end: string;
  direct_cost: number;
  shared_cost: number;
  total_cost: number;
  allocation_percentage: number;
  overhead_items: OverheadItem[];
  ri_savings: number;
  sp_savings: number;
  variance_pct: number;
}

export interface OverheadItem {
  item: string;
  amount: number;
}

export interface AllocationRule {
  id: string;
  rule_name: string;
  rule_type: string;
  total_amount: number;
  allocations: Record<string, number>;
  description: string | null;
  is_active: boolean;
}

export interface AIChatMessage {
  id: string;
  session_id: string;
  user_id: string | null;
  query: string;
  response: string | null;
  created_at: string;
}

export type ViewType =
  | 'dashboard'
  | 'cost-explorer'
  | 'business-mapping'
  | 'resources'
  | 'recommendations'
  | 'kubernetes'
  | 'commitments'
  | 'analytics'
  | 'ai-analytics'
  | 'copilot'
  | 'governance'
  | 'deployment-guide';

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}
