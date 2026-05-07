-- Honeydrew Mills Database Schema for User Payments
-- This script creates the necessary tables for user authentication and payment tracking

-- Users table for storing registered users
CREATE TABLE IF NOT EXISTS honeydrew_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  balance DECIMAL(12, 2) DEFAULT 10000.00,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- User sessions for cross-device authentication
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  device_id VARCHAR(100) NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Biometric data for face verification
CREATE TABLE IF NOT EXISTS user_biometrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  biometric_type VARCHAR(50) NOT NULL, -- 'face', 'fingerprint'
  biometric_features JSONB, -- Stores the face signature data
  image_hash VARCHAR(255),
  model_version VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, biometric_type)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS user_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'sent', 'received', 'recharge', 'bill'
  amount DECIMAL(12, 2) NOT NULL,
  recipient VARCHAR(255),
  category VARCHAR(50), -- 'transfer', 'bill', 'income', 'payment'
  payment_method VARCHAR(50), -- 'upi', 'card', 'netbanking', 'wallet'
  status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
  balance_before DECIMAL(12, 2),
  balance_after DECIMAL(12, 2),
  auth_method VARCHAR(50), -- 'face', 'fingerprint', 'pin', 'passkey'
  verification_score INTEGER, -- Face match score if applicable
  device_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Cross-device sync records
CREATE TABLE IF NOT EXISTS sync_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  device_id VARCHAR(100) NOT NULL,
  data_type VARCHAR(50) NOT NULL, -- 'user', 'transaction', 'biometric', 'settings'
  data JSONB NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON user_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_user_biometrics_user_id ON user_biometrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id ON user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_status ON user_transactions(status);
CREATE INDEX IF NOT EXISTS idx_sync_records_user_id ON sync_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_records_device_id ON sync_records(device_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_honeydrew_users_updated_at ON honeydrew_users;
CREATE TRIGGER update_honeydrew_users_updated_at
    BEFORE UPDATE ON honeydrew_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_biometrics_updated_at ON user_biometrics;
CREATE TRIGGER update_user_biometrics_updated_at
    BEFORE UPDATE ON user_biometrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
