/*
# Cost Allocation Schema for Business Mapping & Chargeback

1. New Tables
- `cost_allocations`: Tracks per-BU cost breakdown per period
  - `business_unit_id` (uuid, FK to business_units)
  - `period_start`, `period_end` (date range)
  - `direct_cost` (numeric) — costs tagged directly to this BU
  - `shared_cost` (numeric) — overhead allocated to this BU
  - `total_cost` (numeric) — direct + shared
  - `allocation_percentage` (numeric) — % of shared pool this BU receives
  - `overhead_items` (jsonb) — breakdown of individual overhead items
  - `ri_savings` (numeric) — reserved instance savings applied
  - `sp_savings` (numeric) — savings plan savings applied
  - `variance_pct` (numeric) — % over/under budget

- `allocation_rules`: Defines how shared costs are split across BUs
  - `rule_name` (text) — e.g. "VPC Network", "Enterprise Support"
  - `rule_type` (text) — e.g. "proportional", "equal", "fixed"
  - `total_amount` (numeric) — total cost of this shared item
  - `allocations` (jsonb) — {bu_id: percentage, ...}
  - `description` (text)
  - `is_active` (boolean)

2. Security
- Enable RLS on both tables
- Single-tenant app: anon + authenticated can CRUD
*/

CREATE TABLE IF NOT EXISTS cost_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id uuid NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  direct_cost numeric(12,2) NOT NULL DEFAULT 0,
  shared_cost numeric(12,2) NOT NULL DEFAULT 0,
  total_cost numeric(12,2) NOT NULL DEFAULT 0,
  allocation_percentage numeric(5,2) NOT NULL DEFAULT 0,
  overhead_items jsonb DEFAULT '[]',
  ri_savings numeric(12,2) DEFAULT 0,
  sp_savings numeric(12,2) DEFAULT 0,
  variance_pct numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS allocation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  rule_type text NOT NULL DEFAULT 'proportional',
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  allocations jsonb NOT NULL DEFAULT '{}',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cost_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cost_allocations" ON cost_allocations;
CREATE POLICY "anon_select_cost_allocations" ON cost_allocations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cost_allocations" ON cost_allocations;
CREATE POLICY "anon_insert_cost_allocations" ON cost_allocations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cost_allocations" ON cost_allocations;
CREATE POLICY "anon_update_cost_allocations" ON cost_allocations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cost_allocations" ON cost_allocations;
CREATE POLICY "anon_delete_cost_allocations" ON cost_allocations FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_allocation_rules" ON allocation_rules;
CREATE POLICY "anon_select_allocation_rules" ON allocation_rules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_allocation_rules" ON allocation_rules;
CREATE POLICY "anon_insert_allocation_rules" ON allocation_rules FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_allocation_rules" ON allocation_rules;
CREATE POLICY "anon_update_allocation_rules" ON allocation_rules FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_allocation_rules" ON allocation_rules;
CREATE POLICY "anon_delete_allocation_rules" ON allocation_rules FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_cost_allocations_bu ON cost_allocations(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_cost_allocations_period ON cost_allocations(period_start, period_end);
