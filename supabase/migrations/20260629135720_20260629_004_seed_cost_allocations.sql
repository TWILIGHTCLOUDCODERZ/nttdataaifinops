/*
# Seed Cost Allocation Data for Business Units

1. Seeded Data
- `allocation_rules`: 5 shared cost rules (VPC, Enterprise Support, K8s, Data Transfer, Monitoring)
- `cost_allocations`: Per-BU breakdowns for June 2026 period
  - Direct costs vary by BU size
  - Shared costs split by proportional allocation
  - Overhead items JSONB breakdown per BU
  - RI/SP savings, variance percentages

2. Notes
- Total monthly cloud spend = $342,000 (canonical)
- Shared overhead = $82,000 (~24% of total)
- Direct costs = $260,000 (~76% of total)
- Allocation percentages proportional to budget
*/

INSERT INTO allocation_rules (rule_name, rule_type, total_amount, allocations, description, is_active) VALUES
  ('VPC Network & NAT', 'proportional', 18000, '{"4eddcb19-1f15-4c1e-a98e-571f7bd1956d": 18.5, "ba609029-fe11-4ade-bc4f-7715bbfdb973": 14.0, "8da0bb01-ee67-4cac-9b8c-da06925dd5e6": 23.0, "81f8f709-f094-4c4b-af74-f6fa4b9150fe": 28.0, "e2e6e6c9-79dc-4b1e-bc51-3d39f15954fd": 16.5}', 'Shared VPC, NAT Gateways, DNS across all BUs', true),
  ('Enterprise Support Plan', 'proportional', 12000, '{"4eddcb19-1f15-4c1e-a98e-571f7bd1956d": 18.5, "ba609029-fe11-4ade-bc4f-7715bbfdb973": 14.0, "8da0bb01-ee67-4cac-9b8c-da06925dd5e6": 23.0, "81f8f709-f094-4c4b-af74-f6fa4b9150fe": 28.0, "e2e6e6c9-79dc-4b1e-bc51-3d39f15954fd": 16.5}', 'AWS Enterprise Support billed proportionally', true),
  ('Shared Kubernetes Cluster', 'proportional', 22000, '{"4eddcb19-1f15-4c1e-a98e-571f7bd1956d": 22.0, "ba609029-fe11-4ade-bc4f-7715bbfdb973": 18.0, "8da0bb01-ee67-4cac-9b8c-da06925dd5e6": 25.0, "81f8f709-f094-4c4b-af74-f6fa4b9150fe": 20.0, "e2e6e6c9-79dc-4b1e-bc51-3d39f15954fd": 15.0}', 'Shared EKS cluster costs by pod usage', true),
  ('Data Transfer & Egress', 'proportional', 16000, '{"4eddcb19-1f15-4c1e-a98e-571f7bd1956d": 15.0, "ba609029-fe11-4ade-bc4f-7715bbfdb973": 20.0, "8da0bb01-ee67-4cac-9b8c-da06925dd5e6": 30.0, "81f8f709-f094-4c4b-af74-f6fa4b9150fe": 25.0, "e2e6e6c9-79dc-4b1e-bc51-3d39f15954fd": 10.0}', 'Cross-region data transfer costs', true),
  ('Security & Monitoring', 'equal', 14000, '{"4eddcb19-1f15-4c1e-a98e-571f7bd1956d": 20.0, "ba609029-fe11-4ade-bc4f-7715bbfdb973": 20.0, "8da0bb01-ee67-4cac-9b8c-da06925dd5e6": 20.0, "81f8f709-f094-4c4b-af74-f6fa4b9150fe": 20.0, "e2e6e6c9-79dc-4b1e-bc51-3d39f15954fd": 20.0}', 'GuardDuty, CloudWatch, Datadog — equal split', true);

INSERT INTO cost_allocations (business_unit_id, period_start, period_end, direct_cost, shared_cost, total_cost, allocation_percentage, overhead_items, ri_savings, sp_savings, variance_pct) VALUES
  ('4eddcb19-1f15-4c1e-a98e-571f7bd1956d', '2026-06-01', '2026-06-30', 52000, 14800, 66800, 18.0, '[{"item": "VPC Network & NAT", "amount": 3330}, {"item": "Enterprise Support Plan", "amount": 2220}, {"item": "Shared Kubernetes", "amount": 4840}, {"item": "Data Transfer", "amount": 2400}, {"item": "Security & Monitoring", "amount": 2010}]', 4200, 2800, -10.3),
  ('ba609029-fe11-4ade-bc4f-7715bbfdb973', '2026-06-01', '2026-06-30', 38000, 11200, 49200, 13.5, '[{"item": "VPC Network & NAT", "amount": 2520}, {"item": "Enterprise Support Plan", "amount": 1680}, {"item": "Shared Kubernetes", "amount": 3960}, {"item": "Data Transfer", "amount": 3200}, {"item": "Security & Monitoring", "amount": 2010}]', 3100, 1800, -14.7),
  ('8da0bb01-ee67-4cac-9b8c-da06925dd5e6', '2026-06-01', '2026-06-30', 72000, 19400, 91400, 23.6, '[{"item": "VPC Network & NAT", "amount": 4140}, {"item": "Enterprise Support Plan", "amount": 2760}, {"item": "Shared Kubernetes", "amount": 5500}, {"item": "Data Transfer", "amount": 4800}, {"item": "Security & Monitoring", "amount": 2010}]', 5800, 4200, -12.7),
  ('81f8f709-f094-4c4b-af74-f6fa4b9150fe', '2026-06-01', '2026-06-30', 62000, 18000, 80000, 22.0, '[{"item": "VPC Network & NAT", "amount": 5040}, {"item": "Enterprise Support Plan", "amount": 3360}, {"item": "Shared Kubernetes", "amount": 4400}, {"item": "Data Transfer", "amount": 4000}, {"item": "Security & Monitoring", "amount": 2010}]', 5100, 3200, -5.9),
  ('e2e6e6c9-79dc-4b1e-bc51-3d39f15954fd', '2026-06-01', '2026-06-30', 36000, 10600, 46600, 16.0, '[{"item": "VPC Network & NAT", "amount": 2970}, {"item": "Enterprise Support Plan", "amount": 1980}, {"item": "Shared Kubernetes", "amount": 3300}, {"item": "Data Transfer", "amount": 1600}, {"item": "Security & Monitoring", "amount": 2010}]', 2900, 1700, -22.7);
