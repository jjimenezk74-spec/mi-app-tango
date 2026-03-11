CREATE TABLE combo_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  combo_product_id INTEGER NOT NULL,
  component_product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_combo_items_combo ON combo_items(combo_product_id);
CREATE INDEX idx_combo_items_component ON combo_items(component_product_id);