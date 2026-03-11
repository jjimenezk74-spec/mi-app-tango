CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ruc_ci TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_ruc_ci ON customers(ruc_ci);
CREATE INDEX idx_customers_name ON customers(name);

ALTER TABLE sales ADD COLUMN customer_id INTEGER;
ALTER TABLE sales ADD COLUMN customer_name TEXT;
ALTER TABLE sales ADD COLUMN customer_ruc_ci TEXT;