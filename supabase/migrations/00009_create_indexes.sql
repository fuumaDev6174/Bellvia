CREATE INDEX idx_stores_company ON stores(company_id);
CREATE INDEX idx_stores_slug ON stores(slug);

CREATE INDEX idx_staff_company ON staff(company_id);
CREATE INDEX idx_staff_store ON staff(store_id);
CREATE INDEX idx_staff_user ON staff(user_id);

CREATE INDEX idx_menus_store ON menus(store_id);
CREATE INDEX idx_menus_company ON menus(company_id);

CREATE INDEX idx_customers_company ON customers(company_id);

CREATE INDEX idx_reservations_store_start ON reservations(store_id, start_at);
CREATE INDEX idx_reservations_staff_start ON reservations(staff_id, start_at);
CREATE INDEX idx_reservations_company ON reservations(company_id);

CREATE INDEX idx_shifts_staff_date ON shifts(staff_id, date);
CREATE INDEX idx_shifts_store ON shifts(store_id);
