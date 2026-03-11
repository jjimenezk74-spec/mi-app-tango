
CREATE TABLE purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_name TEXT,
  receipt_type TEXT NOT NULL,
  receipt_number TEXT NOT NULL,
  total INTEGER NOT NULL,
  notes TEXT,
  user_id INTEGER,
  user_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost INTEGER NOT NULL,
  total_cost INTEGER NOT NULL,
  previous_cost INTEGER,
  new_avg_cost INTEGER,
  is_new_product INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchases_created_at ON purchases(created_at);
CREATE INDEX idx_purchases_receipt_number ON purchases(receipt_number);
CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
