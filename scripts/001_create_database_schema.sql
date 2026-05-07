-- Create honeydrew_users table
CREATE TABLE IF NOT EXISTS honeydrew_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    username VARCHAR(100) UNIQUE,
    password_hash TEXT NOT NULL,
    balance DECIMAL(12, 2) DEFAULT 10000.00,
    is_active BOOLEAN DEFAULT true,
    face_registered BOOLEAN DEFAULT false,
    fingerprint_registered BOOLEAN DEFAULT false,
    face_image TEXT,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_honeydrew_users_email ON honeydrew_users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_honeydrew_users_mobile ON honeydrew_users(mobile);
CREATE INDEX IF NOT EXISTS idx_honeydrew_users_username ON honeydrew_users(username);

-- Create user_biometrics table for storing biometric data
CREATE TABLE IF NOT EXISTS user_biometrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
    biometric_type VARCHAR(50) NOT NULL,
    biometric_features JSONB NOT NULL,
    image_hash VARCHAR(255),
    model_version VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, biometric_type, is_primary)
);

CREATE INDEX IF NOT EXISTS idx_user_biometrics_user_id ON user_biometrics(user_id);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON user_sessions(device_id);

-- Create user_transactions table for transaction history
CREATE TABLE IF NOT EXISTS user_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    recipient VARCHAR(255),
    category VARCHAR(100),
    payment_method VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    balance_before DECIMAL(12, 2),
    balance_after DECIMAL(12, 2),
    auth_method VARCHAR(100),
    verification_score DECIMAL(5, 2),
    device_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id ON user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_created_at ON user_transactions(created_at DESC);

-- Create passkeys table for WebAuthn passkey storage
CREATE TABLE IF NOT EXISTS passkeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT DEFAULT 0,
    device_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_credential_id ON passkeys(credential_id);

-- Create qr_codes table for QR payment functionality
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
    qr_code_data TEXT NOT NULL,
    amount DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'active',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON qr_codes(user_id);

-- Create sync_records table for cross-device sync
CREATE TABLE IF NOT EXISTS sync_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    data_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    acknowledged BOOLEAN DEFAULT false,
    synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_records_user_id ON sync_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_records_device_id ON sync_records(device_id);

-- Insert default admin user (password: Admin@123)
INSERT INTO honeydrew_users (
    full_name, 
    email, 
    mobile, 
    username, 
    password_hash, 
    balance, 
    role, 
    is_active
) VALUES (
    'Admin User',
    'admin@honeydrew.com',
    '9999999999',
    'admin',
    '$2a$10$rKjYvGpLKd9L9xG3ePqEu.vVf5KQZcZ6YKmPqVQKxvEYJVz5ZYW8G',
    100000.00,
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;
