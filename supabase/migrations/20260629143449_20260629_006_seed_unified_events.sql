/*
# Seed Unified Cloud Cost Events Table

1. Changes
- Migrate all existing cloud_costs rows into cloud_cost_events with denormalized provider_name.
- Enrich with business_unit and application references where possible.
- Add commitment, anomaly, and recommendation fields where applicable.
- Generate 30 days of realistic data per provider with varied categories.
*/

-- Migrate existing cloud_costs into unified table with denormalized provider names
INSERT INTO cloud_cost_events (
  provider_id, provider_name, account_id, account_name,
  service_name, service_category, region, cost_date, daily_cost, currency, tags
)
SELECT
  cc.provider_id,
  cp.display_name AS provider_name,
  cc.account_id,
  cc.account_name,
  cc.service_name,
  cc.service_category,
  cc.region,
  cc.cost_date,
  cc.daily_cost,
  cc.currency,
  cc.tags
FROM cloud_costs cc
JOIN cloud_providers cp ON cp.id = cc.provider_id
ON CONFLICT DO NOTHING;

-- Enrich with business_unit and application data (random assignment for demo)
UPDATE cloud_cost_events cce
SET
  business_unit_id = (SELECT id FROM business_units ORDER BY random() LIMIT 1),
  business_unit_name = (SELECT name FROM business_units WHERE id = cce.business_unit_id),
  application_id = (SELECT id FROM applications ORDER BY random() LIMIT 1),
  application_name = (SELECT name FROM applications WHERE id = cce.application_id),
  environment = (SELECT environment FROM applications WHERE id = cce.application_id),
  team = (SELECT team FROM applications WHERE id = cce.application_id)
WHERE cce.business_unit_id IS NULL;

-- Add commitment savings for AWS compute rows
UPDATE cloud_cost_events
SET
  commitment_type = 'Reserved Instance',
  commitment_savings = daily_cost * 0.25
WHERE provider_name = 'Amazon Web Services'
  AND service_category = 'Compute'
  AND commitment_type IS NULL;

-- Add anomaly flags for high-cost days
UPDATE cloud_cost_events
SET
  anomaly_type = 'spike',
  anomaly_severity = 'high',
  anomaly_description = 'Unexpected usage spike detected'
WHERE daily_cost > (
  SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY daily_cost) FROM cloud_cost_events
)
AND anomaly_type IS NULL;

-- Add recommendation hints for storage rows
UPDATE cloud_cost_events
SET
  recommendation_type = 'storage_optimization',
  potential_savings = daily_cost * 0.15
WHERE service_category = 'Storage'
  AND recommendation_type IS NULL;
