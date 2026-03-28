-- RPC function for anonymous guest reservations
-- Uses SECURITY DEFINER to bypass RLS safely
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
    INSERT INTO customers (company_id, name, phone, email, source, first_visit_at)
    VALUES (v_company_id, p_guest_name, p_guest_phone, p_guest_email, 'web', now())
    RETURNING id INTO v_customer_id;
  ELSE
    -- Update last visit and increment count
    UPDATE customers
    SET last_visit_at = now(),
        visit_count = visit_count + 1,
        email = COALESCE(p_guest_email, email)
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

-- Grant execute to anonymous users (for guest booking)
GRANT EXECUTE ON FUNCTION public.create_guest_reservation TO anon;
GRANT EXECUTE ON FUNCTION public.create_guest_reservation TO authenticated;

-- RPC function to get available time slots for a store/date
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_store_id uuid,
  p_date date,
  p_menu_id uuid,
  p_staff_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_duration int;
  v_result json;
BEGIN
  -- Get menu duration
  SELECT duration_min INTO v_duration
  FROM menus WHERE id = p_menu_id AND store_id = p_store_id AND is_public = true;
  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Invalid menu';
  END IF;

  -- Get shifts and existing reservations, compute available slots
  WITH working_staff AS (
    SELECT s.id AS staff_id, s.display_name,
           sh.start_time, sh.end_time, sh.break_start, sh.break_end
    FROM staff s
    JOIN shifts sh ON sh.staff_id = s.id AND sh.date = p_date AND sh.status IN ('published', 'confirmed')
    WHERE s.store_id = p_store_id
      AND s.is_active = true
      AND (p_staff_id IS NULL OR s.id = p_staff_id)
  ),
  time_slots AS (
    SELECT
      ws.staff_id,
      ws.display_name,
      gs.slot_time
    FROM working_staff ws
    CROSS JOIN LATERAL (
      SELECT (p_date + ws.start_time + (n * interval '30 minutes'))::timestamptz AS slot_time
      FROM generate_series(0, 47) AS n
      WHERE (p_date + ws.start_time + (n * interval '30 minutes'))::time >= ws.start_time
        AND (p_date + ws.start_time + (n * interval '30 minutes') + (v_duration || ' minutes')::interval)::time <= ws.end_time
        -- Exclude break time
        AND NOT (
          ws.break_start IS NOT NULL
          AND ws.break_end IS NOT NULL
          AND (p_date + ws.start_time + (n * interval '30 minutes'))::time < ws.break_end
          AND (p_date + ws.start_time + (n * interval '30 minutes') + (v_duration || ' minutes')::interval)::time > ws.break_start
        )
    ) gs
  ),
  available_slots AS (
    SELECT ts.slot_time, ts.staff_id, ts.display_name
    FROM time_slots ts
    WHERE NOT EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.staff_id = ts.staff_id
        AND r.status = 'confirmed'
        AND r.start_at < (ts.slot_time + (v_duration || ' minutes')::interval)
        AND r.end_at > ts.slot_time
    )
  )
  SELECT json_agg(
    json_build_object(
      'time', slot_time,
      'staff_id', staff_id,
      'staff_name', display_name
    ) ORDER BY slot_time, display_name
  ) INTO v_result
  FROM available_slots;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_slots TO anon;
GRANT EXECUTE ON FUNCTION public.get_available_slots TO authenticated;
