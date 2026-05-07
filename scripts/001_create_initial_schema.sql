-- Honeydrew Mills Payment System - Initial Database Schema
-- This script creates all necessary tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS honeydrew_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    username VARCHAR(100) UNIQUE,
    password_hash TEXT NOT NULL,
    balance DECIMAL(12, 2) DEFAULT 10000.00,
    fingerprint_registered BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- User biometrics table (fingerprint/passkey only)
CREATE TABLE IF NOT EXISTS user_biometrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
    biometric_type VARCHAR(50) NOT NULL CHECK (biometric_type IN ('fingerprint')),
    biometric_features JSONB NOT NULL,
    image_hash TEXT,
    model_version VARCHAR(50),
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, biometric_type, is_primary)
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- User transactions table
CREATE TABLE IF NOT EXISTS user_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
    recipient UUID REFERENCES honeydrew_users(id),
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    balance_before DECIMAL(12, 2),
    balance_after DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'completed',
    category VARCHAR(100),
    payment_method VARCHAR(100),
    auth_method VARCHAR(50),
    verification_score DECIMAL(5, 2),
    device_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Sync records table
CREATE TABLE IF NOT EXISTS sync_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    data_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT FALSE
);

-- Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON honeydrew_users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON honeydrew_users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_username ON honeydrew_users(username);
CREATE INDEX IF NOT EXISTS idx_biometrics_user_id ON user_biometrics(user_id);
CREATE INDEX IF NOT EXISTS idx_biometrics_type ON user_biometrics(biometric_type);
CREATE INDEX IF NOT EXISTS idx_sessions_user_device ON user_sessions(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(user_id, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON user_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_user_device ON sync_records(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

-- Insert demo admin user (password: admin123)
INSERT INTO honeydrew_users (id, full_name, email, mobile, username, password_hash, balance, is_active)
VALUES (
    uuid_generate_v4(),
    'Admin User',
    'admin@honeydrew.com',
    '9999999999',
    'admin',
    '$2b$10$K7L/GxG3jVjKEF3P8BxZ0.zQE1pNGJX5V8YX8QK1JZVX5V8YX8QK1J', -- bcrypt hash of 'admin123'
    100000.00,
    true
) ON CONFLICT (mobile) DO NOTHING;

COMMENT ON TABLE honeydrew_users IS 'Stores user account information';
COMMENT ON TABLE user_biometrics IS 'Stores fingerprint/passkey biometric data only';
COMMENT ON TABLE user_sessions IS 'Tracks active user sessions and devices';
COMMENT ON TABLE user_transactions IS 'Records all financial transactions';
COMMENT ON TABLE sync_records IS 'Handles cross-device data synchronization';
COMMENT ON TABLE admin_logs IS 'Audit trail for administrative actions';
