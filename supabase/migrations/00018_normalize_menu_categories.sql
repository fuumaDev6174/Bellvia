-- Normalize menus.category text → menu_categories table

CREATE TABLE menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE(company_id, name)
);

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_menu_categories" ON menu_categories
  FOR SELECT TO anon USING (true);

CREATE POLICY "auth_read_menu_categories" ON menu_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "staff_manage_menu_categories" ON menu_categories
  FOR ALL TO authenticated
  USING (company_id IN (SELECT public.staff_company_ids()))
  WITH CHECK (company_id IN (SELECT public.staff_company_ids()));

-- Migrate existing category strings to menu_categories table
INSERT INTO menu_categories (company_id, name, sort_order)
SELECT DISTINCT m.company_id, m.category,
  CASE m.category
    WHEN 'カット' THEN 1
    WHEN 'カラー' THEN 2
    WHEN 'パーマ' THEN 3
    WHEN 'トリートメント' THEN 4
    WHEN 'スパ' THEN 5
    ELSE 6
  END
FROM menus m
WHERE m.category IS NOT NULL
ON CONFLICT (company_id, name) DO NOTHING;

-- Add category_id column
ALTER TABLE menus ADD COLUMN category_id uuid REFERENCES menu_categories(id) ON DELETE SET NULL;

-- Populate category_id from existing category text
UPDATE menus m
SET category_id = mc.id
FROM menu_categories mc
WHERE mc.company_id = m.company_id AND mc.name = m.category;

-- Drop old category column
ALTER TABLE menus DROP COLUMN category;
