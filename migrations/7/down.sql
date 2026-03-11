ALTER TABLE sales DROP COLUMN customer_ruc_ci;
ALTER TABLE sales DROP COLUMN customer_name;
ALTER TABLE sales DROP COLUMN customer_id;

DROP INDEX idx_customers_name;
DROP INDEX idx_customers_ruc_ci;
DROP TABLE customers;