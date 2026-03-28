CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff(id),
  customer_id uuid REFERENCES customers(id),
  menu_id uuid NOT NULL REFERENCES menus(id),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
  source text DEFAULT 'web',
  guest_name text,
  guest_phone text,
  guest_email text,
  notes text,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
