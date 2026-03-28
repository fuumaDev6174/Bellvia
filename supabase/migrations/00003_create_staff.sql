CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('company_admin', 'store_manager', 'stylist')),
  bio text,
  photo_url text,
  specialties text[] DEFAULT '{}',
  position text,
  sort_order int DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);
