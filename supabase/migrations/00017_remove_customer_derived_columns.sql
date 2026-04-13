-- Remove derived columns from customers (3NF normalization)
-- These values are computable from reservations table

-- Create view for computing stats
CREATE VIEW customer_stats AS
SELECT
  c.id AS customer_id,
  COALESCE(COUNT(r.id) FILTER (WHERE r.status = 'completed'), 0) AS visit_count,
  MIN(r.start_at) FILTER (WHERE r.status = 'completed') AS first_visit_at,
  MAX(r.start_at) FILTER (WHERE r.status = 'completed') AS last_visit_at
FROM customers c
LEFT JOIN reservations r ON r.customer_id = c.id
GROUP BY c.id;

-- Drop derived columns
ALTER TABLE customers DROP COLUMN visit_count;
ALTER TABLE customers DROP COLUMN first_visit_at;
ALTER TABLE customers DROP COLUMN last_visit_at;

-- Update guest reservation RPC to remove derived column updates
CREATE OR REPLACE FUNCTION public.create_guest_reservation(
  p_store_id uuid,
  p_staff_id uuid,
  p_menu_id uuid,
  p_start_at timestamptz,
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_company_id uuid;
  v_duration int;
  v_end_at timestamptz;
  v_reservation_id uuid;
  v_customer_id uuid;
  v_conflict_count int;
  v_staff_active boolean;
  v_menu_name text;
  v_staff_name text;
  v_store_name text;
BEGIN
  -- Validate store
  SELECT company_id, name INTO v_company_id, v_store_name
  FROM stores WHERE id = p_store_id AND is_active = true;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive store';
  END IF;

  -- Validate staff belongs to store and is active
  SELECT is_active, display_name INTO v_staff_active, v_staff_name
  FROM staff WHERE id = p_staff_id AND store_id = p_store_id;
  IF v_staff_active IS NULL OR NOT v_staff_active THEN
    RAISE EXCEPTION 'Invalid or inactive stylist';
  END IF;

  -- Validate menu and get duration
  SELECT duration_min, name INTO v_duration, v_menu_name
  FROM menus WHERE id = p_menu_id AND store_id = p_store_id AND is_public = true;
  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Invalid or unavailable menu';
  END IF;

  -- Calculate end time
  v_end_at := p_start_at + (v_duration || ' minutes')::interval;

  -- Check for overlapping reservations for this stylist
  SELECT count(*) INTO v_conflict_count
  FROM reservations
  WHERE staff_id = p_staff_id
    AND status = 'confirmed'
    AND start_at < v_end_at
    AND end_at > p_start_at;

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'This time slot is no longer available';
  END IF;

  -- Find or create customer by phone within company
  SELECT id INTO v_customer_id
  FROM customers
  WHERE company_id = v_company_id AND phone = p_guest_phone
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (company_id, name, phone, email, source)
    VALUES (v_company_id, p_guest_name, p_guest_phone, p_guest_email, 'web')
    RETURNING id INTO v_customer_id;
  ELSE
    -- Update email if provided
    UPDATE customers
    SET email = COALESCE(p_guest_email, email)
    WHERE id = v_customer_id;
  END IF;

  -- Create reservation
  INSERT INTO reservations (
    store_id, company_id, staff_id, customer_id, menu_id,
    start_at, end_at, status, source,
    guest_name, guest_phone, guest_email, notes
  ) VALUES (
    p_store_id, v_company_id, p_staff_id, v_customer_id, p_menu_id,
    p_start_at, v_end_at, 'confirmed', 'web',
    p_guest_name, p_guest_phone, p_guest_email, p_notes
  )
  RETURNING id INTO v_reservation_id;

  -- Return reservation details
  RETURN json_build_object(
    'reservation_id', v_reservation_id,
    'store_name', v_store_name,
    'staff_name', v_staff_name,
    'menu_name', v_menu_name,
    'start_at', p_start_at,
    'end_at', v_end_at,
    'guest_name', p_guest_name
  );
END;
$$;
