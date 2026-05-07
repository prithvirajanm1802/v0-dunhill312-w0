-- Honeydrew Mills Complete Database Schema for Neon
-- This script creates all necessary tables for the application

-- Users table
CREATE TABLE IF NOT EXISTS honeydrew_users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  balance DECIMAL(12, 2) DEFAULT 10000.00,
  is_active BOOLEAN DEFAULT true,
  face_registered BOOLEAN DEFAULT false,
  fingerprint_registered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- User sessions for cross-device sync
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- User biometrics
CREATE TABLE IF NOT EXISTS user_biometrics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  biometric_type VARCHAR(50) NOT NULL, -- 'face' or 'fingerprint'
  biometric_features JSONB,
  image_hash VARCHAR(255),
  model_version VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, biometric_type)
);

-- User transactions
CREATE TABLE IF NOT EXISTS user_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'sent', 'received', 'recharge', 'bill_payment'
  amount DECIMAL(12, 2) NOT NULL,
  recipient VARCHAR(255),
  category VARCHAR(100),
  payment_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'completed',
  balance_before DECIMAL(12, 2),
  balance_after DECIMAL(12, 2),
  auth_method VARCHAR(50), -- 'face', 'fingerprint', 'passkey'
  verification_score DECIMAL(5, 2),
  device_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Sync records for cross-device synchronization
CREATE TABLE IF NOT EXISTS sync_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  data_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  synced_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false
);

-- Passkeys for WebAuthn
CREATE TABLE IF NOT EXISTS user_passkeys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES honeydrew_users(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_type VARCHAR(100),
  backed_up BOOLEAN DEFAULT false,
  transports TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_mobile ON honeydrew_users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_username ON honeydrew_users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_device_id ON user_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON user_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_user_device ON sync_records(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON user_passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_credential_id ON user_passkeys(credential_id);
