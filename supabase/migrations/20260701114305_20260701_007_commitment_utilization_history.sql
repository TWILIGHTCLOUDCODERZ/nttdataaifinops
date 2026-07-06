CREATE TABLE IF NOT EXISTS commitment_utilization_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id uuid NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  utilized_amount numeric NOT NULL,
  monthly_commitment numeric NOT NULL,
  utilization_pct numeric GENERATED ALWAYS AS (
    CASE WHEN monthly_commitment > 0 THEN ROUND((utilized_amount / monthly_commitment) * 100, 2) ELSE 0 END
  ) STORED,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commitment_utilization_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_commitment_history" ON commitment_utilization_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_commitment_history" ON commitment_utilization_history FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_commitment_history" ON commitment_utilization_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_commitment_history" ON commitment_utilization_history FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_commitment_history_commitment_id ON commitment_utilization_history(commitment_id);
CREATE INDEX idx_commitment_history_period ON commitment_utilization_history(period_month);
