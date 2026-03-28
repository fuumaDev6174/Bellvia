CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_kana text,
  phone text,
  email text,
  line_id text,
  gender text,
  birthday date,
  notes text,
  first_visit_at timestamptz,
  last_visit_at timestamptz,
  visit_count int NOT NULL DEFAULT 0,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
