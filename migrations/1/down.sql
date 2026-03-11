
DROP INDEX IF EXISTS idx_inventory_movements_type;
DROP INDEX IF EXISTS idx_inventory_movements_product_id;
DROP TABLE IF EXISTS inventory_movements;

DROP INDEX IF EXISTS idx_sale_items_sale_id;
DROP TABLE IF EXISTS sale_items;

DROP INDEX IF EXISTS idx_sales_created_at;
DROP INDEX IF EXISTS idx_sales_receipt;
DROP TABLE IF EXISTS sales;

DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_sku;
DROP TABLE IF EXISTS products;
