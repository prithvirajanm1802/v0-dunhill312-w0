-- Honeydrew Mills Database Schema
-- Creates all necessary tables for the application

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sent', 'received', 'recharge', 'bill')),
  amount DECIMAL(15, 2) NOT NULL,
  recipient VARCHAR(255),
  category VARCHAR(50),
  balance_before DECIMAL(15, 2),
  balance_after DECIMAL(15, 2),
  auth_method VARCHAR(50),
  payment_method VARCHAR(50),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Biometric data table
CREATE TABLE IF NOT EXISTS biometric_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  fingerprint_enabled BOOLEAN DEFAULT FALSE,
  face_enabled BOOLEAN DEFAULT FALSE,
  fingerprint_data TEXT,
  face_data TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Face training data table (stores trained face models)
CREATE TABLE IF NOT EXISTS face_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  embeddings JSONB NOT NULL, -- Array of face embeddings
  avg_embedding JSONB NOT NULL, -- Average embedding for quick comparison
  training_metadata JSONB NOT NULL, -- Training date, samples count, quality, confidence
  descriptor_stats JSONB, -- Statistical data about embeddings
  model_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255),
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Passkeys table
CREATE TABLE IF NOT EXISTS passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_type VARCHAR(100),
  transports JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_face_training_user_id ON face_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
