-- Seed realistic cost data for last 30 days
DO $$
DECLARE
  day_offset INTEGER;
  provider RECORD;
  base_cost DECIMAL(15,2);
BEGIN
  FOR day_offset IN 0..29 LOOP
    FOR provider IN SELECT id, name FROM cloud_providers WHERE name != 'private' LOOP
      base_cost := CASE 
        WHEN provider.name = 'aws' THEN 45000 + (random() * 15000)
        WHEN provider.name = 'azure' THEN 32000 + (random() * 12000)
        WHEN provider.name = 'gcp' THEN 18000 + (random() * 8000)
        WHEN provider.name = 'oci' THEN 5000 + (random() * 3000)
        WHEN provider.name = 'alibaba' THEN 3000 + (random() * 2000)
        WHEN provider.name = 'kubernetes' THEN 22000 + (random() * 10000)
      END;
      
      INSERT INTO cloud_costs (provider_id, account_id, account_name, service_name, service_category, region, cost_date, daily_cost)
      VALUES (
        provider.id,
        'acc-' || provider.name || '-001',
        provider.name || ' Production Account',
        CASE 
          WHEN provider.name = 'aws' THEN 
            CASE (random() * 4)::int
              WHEN 0 THEN 'EC2'
              WHEN 1 THEN 'RDS'
              WHEN 2 THEN 'S3'
              WHEN 3 THEN 'Lambda'
              ELSE 'EKS'
            END
          WHEN provider.name = 'azure' THEN
            CASE (random() * 4)::int
              WHEN 0 THEN 'Virtual Machines'
              WHEN 1 THEN 'SQL Database'
              WHEN 2 THEN 'Blob Storage'
              WHEN 3 THEN 'Functions'
              ELSE 'AKS'
            END
          WHEN provider.name = 'gcp' THEN
            CASE (random() * 4)::int
              WHEN 0 THEN 'Compute Engine'
              WHEN 1 THEN 'Cloud SQL'
              WHEN 2 THEN 'Cloud Storage'
              WHEN 3 THEN 'Cloud Functions'
              ELSE 'GKE'
            END
          ELSE 'Compute'
        END,
        CASE (random() * 3)::int
          WHEN 0 THEN 'Compute'
          WHEN 1 THEN 'Database'
          WHEN 2 THEN 'Storage'
          ELSE 'Networking'
        END,
        CASE (random() * 2)::int
          WHEN 0 THEN 'us-east-1'
          WHEN 1 THEN 'us-west-2'
          ELSE 'eu-west-1'
        END,
        CURRENT_DATE - day_offset,
        base_cost * (0.8 + random() * 0.4)
      );
    END LOOP;
  END LOOP;
END $$;

-- Seed Business Units
INSERT INTO business_units (name, code, budget, owner_email) VALUES
('Enterprise Solutions', 'ES', 850000.00, 'enterprise.solutions@nttdata.com'),
('Digital Transformation', 'DT', 720000.00, 'digital.transform@nttdata.com'),
('Cloud Services', 'CS', 650000.00, 'cloud.services@nttdata.com'),
('Data & AI', 'DAA', 420000.00, 'data.ai@nttdata.com'),
('Infrastructure Services', 'IS', 380000.00, 'infrastructure@nttdata.com');

-- Seed Applications
INSERT INTO applications (name, business_unit_id, environment, team) VALUES
('Customer Portal', (SELECT id FROM business_units WHERE code = 'ES'), 'production', 'Portal Team'),
('Payment Gateway', (SELECT id FROM business_units WHERE code = 'ES'), 'production', 'Payments Team'),
('Analytics Platform', (SELECT id FROM business_units WHERE code = 'DT'), 'production', 'Analytics Team'),
('ML Pipeline', (SELECT id FROM business_units WHERE code = 'DAA'), 'production', 'ML Engineering'),
('API Gateway', (SELECT id FROM business_units WHERE code = 'CS'), 'production', 'Platform Team'),
('Backup Manager', (SELECT id FROM business_units WHERE code = 'IS'), 'production', 'DevOps Team'),
('Staging Environment', (SELECT id FROM business_units WHERE code = 'ES'), 'staging', 'Dev Team'),
('Dev Environment', (SELECT id FROM business_units WHERE code = 'DT'), 'development', 'Dev Team');

-- Seed Resources using random provider/app
DO $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 1..50 LOOP
    INSERT INTO resources (resource_id, resource_name, provider_id, service_name, resource_type, region, status, monthly_cost, utilization_percent, application_id)
    VALUES (
      'res-' || i,
      'Resource ' || i,
      (SELECT id FROM cloud_providers ORDER BY random() LIMIT 1),
      (ARRAY['EC2', 'RDS', 'S3', 'Lambda', 'Virtual Machines', 'SQL Database', 'Compute Engine', 'Cloud SQL'])[1 + (random() * 7)::int],
      (ARRAY['vm', 'database', 'storage', 'container', 'serverless'])[1 + (random() * 4)::int],
      (ARRAY['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'])[1 + (random() * 3)::int],
      (ARRAY['running', 'stopped', 'terminated'])[1 + (random() * 2)::int],
      random() * 15000 + 500,
      random() * 100,
      (SELECT id FROM applications ORDER BY random() LIMIT 1)
    );
  END LOOP;
END $$;

-- Seed Recommendations
DO $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 1..25 LOOP
    INSERT INTO recommendations (resource_id, recommendation_type, title, description, potential_savings, confidence_score, risk_score, status)
    VALUES (
      (SELECT id FROM resources ORDER BY random() LIMIT 1),
      (ARRAY['rightsizing', 'idle_cleanup', 'ri_purchase', 'spot_instance', 'storage_optimization'])[1 + (random() * 4)::int],
      (ARRAY[
        'Downsize EC2 instance', 
        'Delete unused EBS volume',
        'Purchase RI for stable workload',
        'Switch to Spot instances',
        'Optimize S3 storage tier'
      ])[1 + (random() * 4)::int],
      'AI-detected optimization opportunity',
      random() * 5000 + 500,
      random() * 40 + 60,
      random() * 30,
      (ARRAY['open', 'in_progress', 'resolved', 'dismissed'])[1 + (random() * 3)::int]
    );
  END LOOP;
END $$;

-- Seed Kubernetes clusters
INSERT INTO kubernetes_clusters (name, provider_id, cluster_type, region, monthly_cost)
VALUES
('prod-cluster-eks-01', (SELECT id FROM cloud_providers WHERE name = 'aws'), 'EKS', 'us-east-1', 28500.00),
('prod-cluster-aks-01', (SELECT id FROM cloud_providers WHERE name = 'azure'), 'AKS', 'eastus', 22300.00),
('prod-cluster-gke-01', (SELECT id FROM cloud_providers WHERE name = 'gcp'), 'GKE', 'us-central1', 18700.00),
('dev-cluster-eks-01', (SELECT id FROM cloud_providers WHERE name = 'aws'), 'EKS', 'us-west-2', 9800.00);

-- Seed Kubernetes namespace costs
INSERT INTO kubernetes_costs (cluster_id, namespace, pod_count, cost_date, daily_cost)
SELECT
  c.id,
  (ARRAY['default', 'kube-system', 'customer-app', 'analytics', 'payments', 'monitoring'])[1 + (random() * 5)::int],
  (random() * 50 + 5)::int,
  CURRENT_DATE - day_offset,
  random() * 800 + 100
FROM kubernetes_clusters c
CROSS JOIN generate_series(0, 29) day_offset;

-- Seed Commitments
INSERT INTO commitments (provider_id, commitment_type, name, start_date, end_date, monthly_commitment, utilized_amount, coverage_percent, status)
VALUES
((SELECT id FROM cloud_providers WHERE name = 'aws'), 'Reserved Instance', 'EC2 RI 1 Year', '2025-01-01', '2025-12-31', 85000.00, 78200.00, 92.0, 'active'),
((SELECT id FROM cloud_providers WHERE name = 'aws'), 'Savings Plan', 'Compute Savings Plan', '2025-03-01', '2026-02-28', 120000.00, 98500.00, 82.1, 'active'),
((SELECT id FROM cloud_providers WHERE name = 'azure'), 'Reserved Instance', 'VM RI 3 Year', '2024-06-01', '2027-05-31', 45000.00, 42100.00, 93.5, 'active'),
((SELECT id FROM cloud_providers WHERE name = 'gcp'), 'CUD', 'Compute CUD 1 Year', '2025-02-01', '2026-01-31', 35000.00, 28900.00, 82.6, 'active'),
((SELECT id FROM cloud_providers WHERE name = 'aws'), 'Reserved Instance', 'RDS RI', '2024-09-01', '2027-08-31', 28000.00, 25400.00, 90.7, 'active');

-- Seed Budget Policies
INSERT INTO budget_policies (name, scope, budget_amount, alert_threshold_50, alert_threshold_75, alert_threshold_90, alert_threshold_100)
VALUES
('Enterprise Solutions Monthly', 'business_unit:ES', 850000.00, true, true, true, true),
('Digital Transformation Monthly', 'business_unit:DT', 720000.00, true, true, true, true),
('Cloud Services Monthly', 'business_unit:CS', 650000.00, true, true, true, true),
('Data & AI Monthly', 'business_unit:DAA', 420000.00, true, true, true, true),
('AWS Production', 'provider:aws', 1500000.00, true, true, true, true);

-- Seed Cost Anomalies
INSERT INTO cost_anomalies (provider_id, anomaly_type, severity, cost_impact, description, status)
VALUES
((SELECT id FROM cloud_providers WHERE name = 'aws'), 'spike', 'high', 15680.00, 'Unexpected EC2 usage spike in us-east-1 region - likely orphaned instances', 'in_review'),
((SELECT id FROM cloud_providers WHERE name = 'azure'), 'spike', 'medium', 5200.00, 'Data egress cost increase - potential optimization opportunity', 'new'),
((SELECT id FROM cloud_providers WHERE name = 'gcp'), 'drop', 'low', -2800.00, 'GKE costs decreased after optimization', 'resolved');
