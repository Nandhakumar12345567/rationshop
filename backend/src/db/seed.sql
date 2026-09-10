-- Smart Ration PostgreSQL Seed Data

DELETE FROM issued_logs;
DELETE FROM transactions;
DELETE FROM bookings;
DELETE FROM shops;
DELETE FROM items;
DELETE FROM ration_cards;

-- Password for all seed users is 'password123'
-- Bcrypt hash: $2a$10$w099z5ZcMv4G18z/J2l/d.Fj.L/aO9o4dE2vB0nS3i2K.0gK3i0y6
INSERT INTO ration_cards (card_no, holder_name, category, family_size, password_hash, phone) VALUES
('TN-04-BPL-883921', 'Ramesh Kumar', 'BPL', 6, '$2a$10$w099z5ZcMv4G18z/J2l/d.Fj.L/aO9o4dE2vB0nS3i2K.0gK3i0y6', '9876543210'),
('TN-04-AAY-109283', 'Priya Sundaram', 'Antyodaya', 5, '$2a$10$w099z5ZcMv4G18z/J2l/d.Fj.L/aO9o4dE2vB0nS3i2K.0gK3i0y6', '9876543211'),
('TN-04-APL-549102', 'Karthik Subramanian', 'APL', 3, '$2a$10$w099z5ZcMv4G18z/J2l/d.Fj.L/aO9o4dE2vB0nS3i2K.0gK3i0y6', '9876543212'),
('SHOP-STAFF-001', 'Velu (FPS #401 Staff)', 'STAFF', 1, '$2a$10$w099z5ZcMv4G18z/J2l/d.Fj.L/aO9o4dE2vB0nS3i2K.0gK3i0y6', '9876543213'),
('ADMIN-001', 'District Civil Supplies Admin', 'ADMIN', 1, '$2a$10$w099z5ZcMv4G18z/J2l/d.Fj.L/aO9o4dE2vB0nS3i2K.0gK3i0y6', '9876543214');

INSERT INTO items (item_id, name, unit, price_per_unit, category_limit_rules) VALUES
('ITEM-RICE', 'Raw Rice (அரிசி)', 'kg', 0.00, '{"BPL": 20, "Antyodaya": 35, "APL": 10}'),
('ITEM-WHEAT', 'Wheat (கோதுமை)', 'kg', 2.00, '{"BPL": 10, "Antyodaya": 15, "APL": 5}'),
('ITEM-SUGAR', 'Subsidized Sugar (சர்க்கரை)', 'kg', 13.50, '{"BPL": 2, "Antyodaya": 3, "APL": 1}'),
('ITEM-DAL', 'Toor Dal (துவரம் பருப்பு)', 'kg', 30.00, '{"BPL": 1, "Antyodaya": 2, "APL": 1}'),
('ITEM-OIL', 'Palmolein Oil (சமையல் எண்ணெய்)', 'litre', 25.00, '{"BPL": 1, "Antyodaya": 2, "APL": 1}'),
('ITEM-KEROSENE', 'Kerosene (மண்ணெண்ணெய்)', 'litre', 15.00, '{"BPL": 3, "Antyodaya": 5, "APL": 0}');

INSERT INTO shops (shop_id, name, location, stock) VALUES
('FPS-TN-0401', 'Fair Price Shop #401 - T. Nagar', 'GN Chetty Road, T. Nagar, Chennai', '{"ITEM-RICE": 2500, "ITEM-WHEAT": 1200, "ITEM-SUGAR": 500, "ITEM-DAL": 300, "ITEM-OIL": 400, "ITEM-KEROSENE": 200}');
