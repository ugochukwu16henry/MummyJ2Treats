ALTER TABLE payments
  ADD COLUMN receipt_url TEXT,
  ADD COLUMN ocr_amount NUMERIC(10,2),
  ADD COLUMN auto_verified BOOLEAN DEFAULT false;

