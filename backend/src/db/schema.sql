-- Smart Ration PostgreSQL Schema

CREATE TABLE IF NOT EXISTS ration_cards (
    card_no VARCHAR(50) PRIMARY KEY,
    holder_name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL, -- 'APL', 'BPL', 'Antyodaya'
    family_size INT NOT NULL DEFAULT 1,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    item_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- 'kg', 'litre', 'packets'
    price_per_unit DECIMAL(10,2) NOT NULL,
    category_limit_rules TEXT NOT NULL, -- JSON string mapping card category to entitlement rules
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shops (
    shop_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    stock TEXT NOT NULL, -- JSON string representing available stock per item_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id VARCHAR(50) PRIMARY KEY,
    card_no VARCHAR(50) NOT NULL REFERENCES ration_cards(card_no),
    items TEXT NOT NULL, -- JSON string array of booked items
    slot_time VARCHAR(100) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    qr_token TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'BOOKED', -- 'BOOKED', 'ISSUED', 'EXPIRED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    txn_id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL REFERENCES bookings(booking_id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issued_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL REFERENCES bookings(booking_id),
    shop_id VARCHAR(50) NOT NULL REFERENCES shops(shop_id),
    verified_by_fingerprint INT NOT NULL DEFAULT 1,
    fingerprint_score DECIMAL(5,2) DEFAULT 98.50,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
