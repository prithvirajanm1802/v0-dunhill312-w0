-- Complete user system with biometrics and payments for Honeydrew Mills
-- This creates a public database where all signed users data is stored

-- Users table with balance and biometric flags
CREATE TABLE IF NOT EXISTS honeydrew_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash TEXT NOT NULL,
    balance NUMERIC(15, 2) DEFAULT 10000.00,
    is_active BOOLEAN DEFAULT true,
    face_registered BOOLEAN DEFAULT false,
    fingerprint_registered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- User biometrics table for face and fingerprint data
CREATE TABLE IF NOT EXISTS user_biometrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
    biometric_type VARCHAR(20) NOT NULL, -- 'face' or 'fingerprint'
    biometric_features JSONB, -- stores face descriptors or fingerprint data
    image_hash VARCHAR(255), -- hash of the captured image
    model_version VARCHAR(50),
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, biometric_type, is_primary)
);

-- User sessions for tracking logins from all devices
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- User-to-user transfers
CREATE TABLE IF NOT EXISTS user_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
    recipient UUID REFERENCES honeydrew_users(id),
    transaction_type VARCHAR(20) NOT NULL, -- 'sent', 'received', 'deposit', 'withdrawal'
    amount NUMERIC(15, 2) NOT NULL,
    balance_before NUMERIC(15, 2),
    balance_after NUMERIC(15, 2),
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'cancelled'
    auth_method VARCHAR(20), -- 'face', 'fingerprint', 'password'
    verification_score INTEGER,
    device_id VARCHAR(255),
    payment_method VARCHAR(50), -- 'internal', 'upi', 'bank'
    category VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_honeydrew_users_mobile ON honeydrew_users(mobile);
CREATE INDEX IF NOT EXISTS idx_honeydrew_users_email ON honeydrew_users(email);
CREATE INDEX IF NOT EXISTS idx_user_biometrics_user_id ON user_biometrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON user_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id ON user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_recipient ON user_transactions(recipient);
CREATE INDEX IF NOT EXISTS idx_user_transactions_created_at ON user_transactions(created_at DESC);
