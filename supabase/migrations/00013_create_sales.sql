-- Create sales table
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES reservations(id) ON DELETE SET NULL,
  amount int NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'card', 'paypay', 'other')),
  paid_at timestamptz NOT NULL DEFAULT now(),
  paypay_transaction_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for PayPay dedup (only non-null values)
CREATE UNIQUE INDEX sales_paypay_txn_unique
  ON sales (paypay_transaction_id)
  WHERE paypay_transaction_id IS NOT NULL;

-- Performance indexes
CREATE INDEX sales_store_paid_at_idx ON sales (store_id, paid_at);
CREATE INDEX sales_company_id_idx ON sales (company_id);

-- RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_manage_own_company_sales" ON sales
  FOR ALL TO authenticated
  USING (company_id IN (SELECT public.staff_company_ids()))
  WITH CHECK (company_id IN (SELECT public.staff_company_ids()));

-- updated_at trigger (reuse existing function from migration 00008)
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
