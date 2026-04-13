-- Normalize staff.specialties text[] → staff_specialties table (1NF)

CREATE TABLE staff_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  specialty text NOT NULL,
  UNIQUE(staff_id, specialty)
);

ALTER TABLE staff_specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_staff_specialties" ON staff_specialties
  FOR SELECT TO anon USING (true);

CREATE POLICY "auth_read_staff_specialties" ON staff_specialties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "staff_manage_specialties" ON staff_specialties
  FOR ALL TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE company_id IN (SELECT public.staff_company_ids())))
  WITH CHECK (staff_id IN (SELECT id FROM staff WHERE company_id IN (SELECT public.staff_company_ids())));

-- Migrate existing data
INSERT INTO staff_specialties (staff_id, specialty)
SELECT s.id, unnest(s.specialties)
FROM staff s
WHERE s.specialties IS NOT NULL AND array_length(s.specialties, 1) > 0
ON CONFLICT DO NOTHING;

-- Drop old column
ALTER TABLE staff DROP COLUMN specialties;
