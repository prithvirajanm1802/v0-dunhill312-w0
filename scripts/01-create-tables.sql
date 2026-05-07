-- Updated to use honeydrew_users table name to match existing schema
-- Create all Neon DB tables to store users, transactions, admin logs, passkeys, and QR codes
-- This schema avoids "relation already exists" errors by using IF NOT EXISTS

-- Main users table (honeydrew_users for consistency with existing code)
CREATE TABLE IF NOT EXISTS honeydrew_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  username VARCHAR(255),
  password_hash TEXT NOT NULL,
  balance DECIMAL(12, 2) DEFAULT 10000,
  is_active BOOLEAN DEFAULT TRUE,
  role VARCHAR(50) DEFAULT 'user',
  biometric_enabled BOOLEAN DEFAULT FALSE,
  fingerprint_registered BOOLEAN DEFAULT FALSE,
  face_registered BOOLEAN DEFAULT FALSE,
  face_image TEXT,
  active_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_honeydrew_users_email ON honeydrew_users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_honeydrew_users_mobile ON honeydrew_users(mobile);
CREATE INDEX IF NOT EXISTS idx_honeydrew_users_username ON honeydrew_users(username);
CREATE INDEX IF NOT EXISTS idx_honeydrew_users_role ON honeydrew_users(role);

-- Passkeys table (for WebAuthn/fingerprint authentication)
CREATE TABLE IF NOT EXISTS passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_type VARCHAR(100),
  device_name VARCHAR(255),
  transports JSONB,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_credential_id ON passkeys(credential_id);

-- User transactions table (all transaction types)
CREATE TABLE IF NOT EXISTS user_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  recipient UUID,
  transaction_type VARCHAR(50) NOT NULL, -- 'sent', 'received', 'deposit', 'withdrawal', 'recharge', 'bill_payment'
  amount DECIMAL(12, 2) NOT NULL,
  balance_before DECIMAL(12, 2),
  balance_after DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'cancelled'
  auth_method VARCHAR(50),
  verification_score DECIMAL(5, 2),
  device_id VARCHAR(255),
  payment_method VARCHAR(100),
  category VARCHAR(100),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON user_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON user_transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON user_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON user_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON user_transactions(created_at DESC);

-- Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id VARCHAR(255) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  target_user_id UUID REFERENCES honeydrew_users(id) ON DELETE SET NULL,
  severity VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_type ON admin_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_severity ON admin_logs(severity);

-- QR codes table
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  qr_type VARCHAR(50) NOT NULL,
  qr_data TEXT NOT NULL,
  amount DECIMAL(12, 2),
  merchant_name VARCHAR(255),
  upi_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_qr_id ON qr_codes(qr_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_active ON qr_codes(is_active);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON user_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- User biometrics table
CREATE TABLE IF NOT EXISTS user_biometrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  biometric_type VARCHAR(50) NOT NULL,
  biometric_features JSONB NOT NULL,
  image_hash VARCHAR(255),
  model_version VARCHAR(50),
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, biometric_type, is_primary)
);

CREATE INDEX IF NOT EXISTS idx_user_biometrics_user_id ON user_biometrics(user_id);

-- Sync records table (for multi-device sync)
CREATE TABLE IF NOT EXISTS sync_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sync_records_user_id ON sync_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_records_device_id ON sync_records(device_id);

-- Stripe payments table
CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(100),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stripe_payments_user_id ON stripe_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_status ON stripe_payments(status);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_stripe_intent ON stripe_payments(stripe_payment_intent_id);

-- P2P transfer requests table
CREATE TABLE IF NOT EXISTS p2p_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(255) UNIQUE NOT NULL,
  sender_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_p2p_requests_sender ON p2p_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_p2p_requests_receiver ON p2p_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_p2p_requests_status ON p2p_requests(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for honeydrew_users
DROP TRIGGER IF EXISTS update_honeydrew_users_updated_at ON honeydrew_users;
CREATE TRIGGER update_honeydrew_users_updated_at
BEFORE UPDATE ON honeydrew_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for stripe_payments
DROP TRIGGER IF EXISTS update_stripe_payments_updated_at ON stripe_payments;
CREATE TRIGGER update_stripe_payments_updated_at
BEFORE UPDATE ON stripe_payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_biometrics
DROP TRIGGER IF EXISTS update_user_biometrics_updated_at ON user_biometrics;
CREATE TRIGGER update_user_biometrics_updated_at
BEFORE UPDATE ON user_biometrics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create admin user if not exists
INSERT INTO honeydrew_users (id, full_name, email, mobile, username, password_hash, balance, is_active, role, biometric_enabled)
VALUES (
  gen_random_uuid(),
  'Honeydrew Admin',
  'admin@honeydrew.com',
  '9999999999',
  'honeydrew_admin',
  '$2a$10$YourHashedPasswordHere',
  999999999,
  TRUE,
  'admin',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Log table creation
INSERT INTO admin_logs (admin_id, action_type, resource_type, severity, details)
VALUES (
  'system',
  'database_initialization',
  'system',
  'high',
  '{"message": "All Neon DB tables created successfully", "timestamp": "' || NOW() || '", "source": "SQL script 01-create-tables.sql"}'::jsonb
);
