-- Executive Dashboard KPIs
CREATE TABLE dashboard_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_cloud_spend DECIMAL(15,2) NOT NULL,
  month_over_month_growth DECIMAL(5,2),
  forecasted_spend DECIMAL(15,2),
  savings_achieved DECIMAL(15,2),
  commitment_coverage DECIMAL(5,2),
  budget_variance DECIMAL(5,2),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Cloud Providers
CREATE TABLE cloud_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost Data
CREATE TABLE cloud_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES cloud_providers(id),
  account_id TEXT NOT NULL,
  account_name TEXT,
  service_name TEXT,
  service_category TEXT,
  region TEXT,
  cost_date DATE NOT NULL,
  daily_cost DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Units
CREATE TABLE business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  parent_id UUID REFERENCES business_units(id),
  budget DECIMAL(15,2),
  owner_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_unit_id UUID REFERENCES business_units(id),
  environment TEXT,
  team TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource Inventory
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL UNIQUE,
  resource_name TEXT,
  provider_id UUID REFERENCES cloud_providers(id),
  service_name TEXT,
  resource_type TEXT,
  region TEXT,
  status TEXT,
  monthly_cost DECIMAL(15,2),
  utilization_percent DECIMAL(5,2),
  tags JSONB DEFAULT '{}',
  application_id UUID REFERENCES applications(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimization Recommendations
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id),
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  potential_savings DECIMAL(15,2),
  confidence_score DECIMAL(5,2),
  risk_score DECIMAL(5,2),
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kubernetes Clusters
CREATE TABLE kubernetes_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_id UUID REFERENCES cloud_providers(id),
  cluster_type TEXT,
  region TEXT,
  monthly_cost DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kubernetes Namespace Costs
CREATE TABLE kubernetes_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES kubernetes_clusters(id),
  namespace TEXT NOT NULL,
  pod_count INTEGER,
  cost_date DATE NOT NULL,
  daily_cost DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commitments (RI, Savings Plans)
CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES cloud_providers(id),
  commitment_type TEXT NOT NULL,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  monthly_commitment DECIMAL(15,2),
  utilized_amount DECIMAL(15,2),
  coverage_percent DECIMAL(5,2),
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Policies
CREATE TABLE budget_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scope TEXT,
  budget_amount DECIMAL(15,2),
  alert_threshold_50 BOOLEAN DEFAULT true,
  alert_threshold_75 BOOLEAN DEFAULT true,
  alert_threshold_90 BOOLEAN DEFAULT true,
  alert_threshold_100 BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost Anomalies
CREATE TABLE cost_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES cloud_providers(id),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  anomaly_type TEXT,
  severity TEXT,
  cost_impact DECIMAL(15,2),
  description TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Chat History
CREATE TABLE ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID DEFAULT gen_random_uuid(),
  user_id TEXT,
  query TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Cloud Providers
INSERT INTO cloud_providers (name, display_name, color) VALUES
('aws', 'Amazon Web Services', '#FF9900'),
('azure', 'Microsoft Azure', '#0078D4'),
('gcp', 'Google Cloud Platform', '#4285F4'),
('oci', 'Oracle Cloud Infrastructure', '#F80000'),
('alibaba', 'Alibaba Cloud', '#FF6A00'),
('kubernetes', 'Kubernetes', '#326CE5'),
('private', 'Private Cloud', '#2D3748');

-- Insert initial dashboard KPIs
INSERT INTO dashboard_kpis (total_cloud_spend, month_over_month_growth, forecasted_spend, savings_achieved, commitment_coverage, budget_variance) VALUES
(2847392.45, 8.3, 3092340.00, 482150.00, 67.5, -4.2);

-- Enable RLS
ALTER TABLE dashboard_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kubernetes_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE kubernetes_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (all tables public for dashboard)
CREATE POLICY "allow_all_dashboard_kpis" ON dashboard_kpis FOR ALL USING (true);
CREATE POLICY "allow_all_cloud_providers" ON cloud_providers FOR ALL USING (true);
CREATE POLICY "allow_all_cloud_costs" ON cloud_costs FOR ALL USING (true);
CREATE POLICY "allow_all_business_units" ON business_units FOR ALL USING (true);
CREATE POLICY "allow_all_applications" ON applications FOR ALL USING (true);
CREATE POLICY "allow_all_resources" ON resources FOR ALL USING (true);
CREATE POLICY "allow_all_recommendations" ON recommendations FOR ALL USING (true);
CREATE POLICY "allow_all_kubernetes_clusters" ON kubernetes_clusters FOR ALL USING (true);
CREATE POLICY "allow_all_kubernetes_costs" ON kubernetes_costs FOR ALL USING (true);
CREATE POLICY "allow_all_commitments" ON commitments FOR ALL USING (true);
CREATE POLICY "allow_all_budget_policies" ON budget_policies FOR ALL USING (true);
CREATE POLICY "allow_all_cost_anomalies" ON cost_anomalies FOR ALL USING (true);
CREATE POLICY "allow_all_ai_chat_history" ON ai_chat_history FOR ALL USING (true);
