
INSERT INTO products (sku, name, category, cost_price, sale_price, stock, min_stock, expiration_date, is_combo, is_active, created_at, updated_at) VALUES
-- Yerba Mate
('YM001', 'Yerba Mate Pajarito 1kg', 'Yerba Mate', 28000, 35000, 50, 10, '2025-12-31', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('YM002', 'Yerba Mate Kurupí 500g', 'Yerba Mate', 15000, 19000, 40, 10, '2025-11-30', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('YM003', 'Yerba Mate Selecta 1kg', 'Yerba Mate', 30000, 38000, 35, 10, '2025-10-31', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('YM004', 'Yerba Mate Campesino 500g', 'Yerba Mate', 14000, 18000, 45, 10, '2026-01-15', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Termos
('TM001', 'Termo Stanley 1L Verde', 'Termos', 180000, 250000, 8, 3, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('TM002', 'Termo Lumilagro 1L', 'Termos', 45000, 65000, 15, 5, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('TM003', 'Termo Acero Inox 750ml', 'Termos', 35000, 48000, 12, 5, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Guampas
('GP001', 'Guampa de Cuero Premium', 'Guampas', 25000, 38000, 20, 5, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GP002', 'Guampa de Madera Artesanal', 'Guampas', 18000, 28000, 25, 5, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GP003', 'Guampa Palo Santo', 'Guampas', 35000, 55000, 10, 3, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Hielo
('HI001', 'Bolsa de Hielo 3kg', 'Hielo', 5000, 8000, 30, 15, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('HI002', 'Bolsa de Hielo 5kg', 'Hielo', 8000, 12000, 25, 10, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Bebidas
('BE001', 'Coca-Cola 2.5L', 'Bebidas', 12000, 16000, 60, 20, '2025-06-30', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('BE002', 'Pepsi 2L', 'Bebidas', 10000, 14000, 50, 20, '2025-07-15', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('BE003', 'Agua Mineral Seltz 1.5L', 'Bebidas', 4000, 6000, 80, 30, '2026-01-01', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('BE004', 'Jugo Pulp Naranja 1L', 'Bebidas', 8000, 12000, 40, 15, '2025-04-30', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('BE005', 'Cerveza Pilsen 1L', 'Bebidas', 9000, 13000, 100, 30, '2025-08-31', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Lácteos
('LA001', 'Leche La Pradera 1L', 'Lácteos', 6000, 8500, 40, 15, '2025-02-15', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('LA002', 'Yogurt Parmalat 1L', 'Lácteos', 12000, 16000, 25, 10, '2025-02-10', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('LA003', 'Queso Paraguay 500g', 'Lácteos', 25000, 35000, 15, 5, '2025-02-20', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Snacks
('SN001', 'Papas Lays Clásicas 150g', 'Snacks', 8000, 12000, 35, 10, '2025-05-31', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('SN002', 'Doritos Nacho 180g', 'Snacks', 10000, 15000, 30, 10, '2025-06-15', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('SN003', 'Galletas Oreo 108g', 'Snacks', 6000, 9000, 45, 15, '2025-09-30', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('SN004', 'Maní Salado 200g', 'Snacks', 5000, 8000, 40, 15, '2025-07-31', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Accesorios
('AC001', 'Bombilla Acero Inox', 'Accesorios', 8000, 12000, 50, 15, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AC002', 'Bombilla Alpaca Premium', 'Accesorios', 25000, 38000, 20, 5, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AC003', 'Filtro para Bombilla x5', 'Accesorios', 3000, 5000, 60, 20, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AC004', 'Cepillo Limpia Bombilla', 'Accesorios', 4000, 7000, 30, 10, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
