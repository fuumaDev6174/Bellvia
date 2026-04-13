-- Normalize stores.business_hours JSONB → store_business_hours table (1NF)

CREATE TABLE store_business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon, 6=Sun
  open_time time NOT NULL,
  close_time time NOT NULL,
  UNIQUE(store_id, day_of_week)
);

ALTER TABLE store_business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_store_hours" ON store_business_hours
  FOR SELECT TO anon USING (true);

CREATE POLICY "auth_read_store_hours" ON store_business_hours
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "staff_manage_store_hours" ON store_business_hours
  FOR ALL TO authenticated
  USING (store_id IN (SELECT store_id FROM stores WHERE company_id IN (SELECT public.staff_company_ids())))
  WITH CHECK (store_id IN (SELECT store_id FROM stores WHERE company_id IN (SELECT public.staff_company_ids())));

-- Migrate existing data from JSONB
DO $$
DECLARE
  r RECORD;
  day_key text;
  day_idx int;
  day_map jsonb := '{"mon":0,"tue":1,"wed":2,"thu":3,"fri":4,"sat":5,"sun":6}'::jsonb;
  hours_obj jsonb;
BEGIN
  FOR r IN SELECT id, business_hours FROM stores WHERE business_hours IS NOT NULL LOOP
    FOR day_key IN SELECT jsonb_object_keys(r.business_hours) LOOP
      hours_obj := r.business_hours->day_key;
      IF hours_obj IS NOT NULL AND hours_obj != 'null'::jsonb THEN
        day_idx := (day_map->>day_key)::int;
        INSERT INTO store_business_hours (store_id, day_of_week, open_time, close_time)
        VALUES (r.id, day_idx, (hours_obj->>'open')::time, (hours_obj->>'close')::time)
        ON CONFLICT (store_id, day_of_week) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Drop old column
ALTER TABLE stores DROP COLUMN business_hours;
