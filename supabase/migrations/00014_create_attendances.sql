-- Create attendances table for staff clock-in/clock-out
CREATE TABLE attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  clock_in timestamptz NOT NULL,
  clock_out timestamptz,
  clock_in_note text,
  clock_out_note text,
  status text NOT NULL DEFAULT 'clocked_in'
    CHECK (status IN ('clocked_in', 'completed', 'corrected')),
  corrected_by uuid REFERENCES staff(id) ON DELETE SET NULL,
  correction_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one open clock-in per staff at a time
CREATE UNIQUE INDEX attendances_open_clock_in
  ON attendances (staff_id)
  WHERE status = 'clocked_in';

-- Performance indexes
CREATE INDEX attendances_store_clock_in_idx ON attendances (store_id, clock_in);
CREATE INDEX attendances_company_id_idx ON attendances (company_id);

-- RLS
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_read_own_attendances" ON attendances
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.staff_company_ids()));

CREATE POLICY "staff_insert_own_attendance" ON attendances
  FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.staff_company_ids()));

CREATE POLICY "staff_update_own_company_attendances" ON attendances
  FOR UPDATE TO authenticated
  USING (company_id IN (SELECT public.staff_company_ids()))
  WITH CHECK (company_id IN (SELECT public.staff_company_ids()));

-- updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON attendances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
