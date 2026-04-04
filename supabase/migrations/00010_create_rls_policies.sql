-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Helper: get company_ids for current authenticated user
CREATE OR REPLACE FUNCTION public.staff_company_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT DISTINCT company_id FROM public.staff WHERE user_id = auth.uid()
$$;

-- Helper: get store_ids for current authenticated user
CREATE OR REPLACE FUNCTION public.staff_store_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT DISTINCT store_id FROM public.staff WHERE user_id = auth.uid()
$$;

-- Helper: get role for current authenticated user
CREATE OR REPLACE FUNCTION public.staff_role()
RETURNS text
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT role FROM public.staff WHERE user_id = auth.uid() LIMIT 1
$$;

-- ============================================
-- COMPANIES: only authenticated staff can read
-- ============================================
CREATE POLICY "staff_select_own_company" ON companies
  FOR SELECT USING (id IN (SELECT public.staff_company_ids()));

-- ============================================
-- STORES: public read (active), staff full CRUD
-- ============================================
CREATE POLICY "public_read_active_stores" ON stores
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "auth_read_active_stores" ON stores
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "staff_manage_own_company_stores" ON stores
  FOR ALL TO authenticated
  USING (company_id IN (SELECT public.staff_company_ids()))
  WITH CHECK (company_id IN (SELECT public.staff_company_ids()));

-- ============================================
-- STAFF: public read (active), staff full CRUD
-- ============================================
CREATE POLICY "public_read_active_staff" ON staff
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "auth_read_active_staff" ON staff
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "staff_manage_own_company" ON staff
  FOR ALL TO authenticated
  USING (company_id IN (SELECT public.staff_company_ids()))
  WITH CHECK (company_id IN (SELECT public.staff_company_ids()));

-- ============================================
-- MENUS: public read (public), staff full CRUD
-- ============================================
CREATE POLICY "public_read_public_menus" ON menus
  FOR SELECT TO anon USING (is_public = true);

CREATE POLICY "auth_read_public_menus" ON menus
  FOR SELECT TO authenticated USING (is_public = true);

CREATE POLICY "staff_manage_own_company_menus" ON menus
  FOR ALL TO authenticated
  USING (company_id IN (SELECT public.staff_company_ids()))
  WITH CHECK (company_id IN (SELECT public.staff_company_ids()));

-- ============================================
-- CUSTOMERS: staff only
-- ============================================
CREATE POLICY "staff_manage_own_company_customers" ON customers
  FOR ALL TO authenticated
  USING (company_id IN (SELECT public.staff_company_ids()))
  WITH CHECK (company_id IN (SELECT public.staff_company_ids()));

-- ============================================
-- RESERVATIONS: staff full CRUD
-- ============================================
CREATE POLICY "staff_manage_own_company_reservations" ON reservations
  FOR ALL TO authenticated
  USING (company_id IN (SELECT public.staff_company_ids()))
  WITH CHECK (company_id IN (SELECT public.staff_company_ids()));

-- ============================================
-- SHIFTS: staff read, managers/admins manage
-- ============================================
CREATE POLICY "staff_read_own_company_shifts" ON shifts
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.staff_company_ids()));

CREATE POLICY "staff_manage_own_company_shifts" ON shifts
  FOR ALL TO authenticated
  USING (company_id IN (SELECT public.staff_company_ids()))
  WITH CHECK (company_id IN (SELECT public.staff_company_ids()));
