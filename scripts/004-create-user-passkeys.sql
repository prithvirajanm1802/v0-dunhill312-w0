-- Migration: Create user_passkeys table with proper UUID references
-- This table links passkeys to users with matching UUID columns

-- First, check if user_passkeys already exists and drop if needed
DROP TABLE IF EXISTS user_passkeys;

-- Create user_passkeys table with proper UUID foreign key
CREATE TABLE user_passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_type VARCHAR(100),
  device_name VARCHAR(255),
  transports JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP,
  
  -- Ensure user_id is a valid UUID that matches users.id
  CONSTRAINT fk_user_passkeys_user 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_passkeys_user_id ON user_passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passkeys_credential_id ON user_passkeys(credential_id);

-- Add comment for documentation
COMMENT ON TABLE user_passkeys IS 'Stores WebAuthn passkeys for user authentication';
COMMENT ON COLUMN user_passkeys.user_id IS 'UUID reference to users.id - must be valid UUID';
COMMENT ON COLUMN user_passkeys.credential_id IS 'Unique WebAuthn credential identifier';
COMMENT ON COLUMN user_passkeys.public_key IS 'Base64 encoded public key for verification';
