
CREATE TABLE expense_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_type TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expense_categories_type ON expense_categories(category_type);

-- Pagos de Servicios
INSERT INTO expense_categories (name, category_type) VALUES ('ANDE', 'servicio');
INSERT INTO expense_categories (name, category_type) VALUES ('ESSAP', 'servicio');
INSERT INTO expense_categories (name, category_type) VALUES ('Alquiler', 'servicio');
INSERT INTO expense_categories (name, category_type) VALUES ('Recolección de Basura', 'servicio');
INSERT INTO expense_categories (name, category_type) VALUES ('Internet', 'servicio');
INSERT INTO expense_categories (name, category_type) VALUES ('Teléfono', 'servicio');
INSERT INTO expense_categories (name, category_type) VALUES ('Gas', 'servicio');
INSERT INTO expense_categories (name, category_type) VALUES ('Seguro', 'servicio');
INSERT INTO expense_categories (name, category_type) VALUES ('Mantenimiento', 'servicio');
INSERT INTO expense_categories (name, category_type) VALUES ('Limpieza', 'servicio');

-- Otros Egresos
INSERT INTO expense_categories (name, category_type) VALUES ('Sueldos', 'operativo');
INSERT INTO expense_categories (name, category_type) VALUES ('Transporte', 'operativo');
INSERT INTO expense_categories (name, category_type) VALUES ('Publicidad', 'operativo');
INSERT INTO expense_categories (name, category_type) VALUES ('Materiales de Oficina', 'operativo');
INSERT INTO expense_categories (name, category_type) VALUES ('Otros', 'operativo');
