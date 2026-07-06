/*
# Unified Cloud Cost Events Table

1. New Tables
- `cloud_cost_events` — a single table that captures ALL cost-related details:
  - `id` (uuid, primary key)
  - `provider_id` (uuid, references cloud_providers)
  - `provider_name` (text, denormalized for fast filtering)
  - `account_id` (text)
  - `account_name` (text)
  - `service_name` (text)
  - `service_category` (text)
  - `resource_id` (text)
  - `resource_name` (text)
  - `region` (text)
  - `business_unit_id` (uuid, references business_units)
  - `business_unit_name` (text, denormalized)
  - `application_id` (uuid, references applications)
  - `application_name` (text, denormalized)
  - `environment` (text)
  - `team` (text)
  - `cost_date` (date)
  - `daily_cost` (numeric)
  - `currency` (text, default 'USD')
  - `commitment_type` (text) — RI, SP, CUD, etc.
  - `commitment_savings` (numeric)
  - `anomaly_type` (text)
  - `anomaly_severity` (text)
  - `anomaly_description` (text)
  - `recommendation_type` (text)
  - `potential_savings` (numeric)
  - `tags` (jsonb)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on `cloud_cost_events`.
- Allow anon + authenticated full access (public dashboard data).

3. Indexes
- Index on `cost_date` for time-filter queries.
- Index on `provider_id` for provider breakdowns.
- Index on `service_category` for category charts.
- Index on `business_unit_id` for chargeback views.
- Index on `(cost_date, provider_id)` for combined filtering.
*/

CREATE TABLE IF NOT EXISTS cloud_cost_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES cloud_providers(id),
  provider_name TEXT,
  account_id TEXT NOT NULL,
  account_name TEXT,
  service_name TEXT,
  service_category TEXT,
  resource_id TEXT,
  resource_name TEXT,
  region TEXT,
  business_unit_id UUID REFERENCES business_units(id),
  business_unit_name TEXT,
  application_id UUID REFERENCES applications(id),
  application_name TEXT,
  environment TEXT,
  team TEXT,
  cost_date DATE NOT NULL,
  daily_cost DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  commitment_type TEXT,
  commitment_savings DECIMAL(15,2),
  anomaly_type TEXT,
  anomaly_severity TEXT,
  anomaly_description TEXT,
  recommendation_type TEXT,
  potential_savings DECIMAL(15,2),
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_cloud_cost_events_date ON cloud_cost_events(cost_date);
CREATE INDEX IF NOT EXISTS idx_cloud_cost_events_provider ON cloud_cost_events(provider_id);
CREATE INDEX IF NOT EXISTS idx_cloud_cost_events_category ON cloud_cost_events(service_category);
CREATE INDEX IF NOT EXISTS idx_cloud_cost_events_bu ON cloud_cost_events(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_cloud_cost_events_date_provider ON cloud_cost_events(cost_date, provider_id);

-- Enable RLS
ALTER TABLE cloud_cost_events ENABLE ROW LEVEL SECURITY;

-- Public policies (no auth required for dashboard)
DROP POLICY IF EXISTS "allow_select_cloud_cost_events" ON cloud_cost_events;
CREATE POLICY "allow_select_cloud_cost_events" ON cloud_cost_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "allow_insert_cloud_cost_events" ON cloud_cost_events;
CREATE POLICY "allow_insert_cloud_cost_events" ON cloud_cost_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_cloud_cost_events" ON cloud_cost_events;
CREATE POLICY "allow_update_cloud_cost_events" ON cloud_cost_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_delete_cloud_cost_events" ON cloud_cost_events;
CREATE POLICY "allow_delete_cloud_cost_events" ON cloud_cost_events FOR DELETE
  TO anon, authenticated USING (true);
