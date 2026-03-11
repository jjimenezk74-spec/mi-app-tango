
DROP INDEX IF EXISTS idx_suppliers_name;
DROP TABLE IF EXISTS suppliers;
ALTER TABLE purchases DROP COLUMN supplier_id;
