-- Seed initial data for testing and admin access

-- Insert test users (if they don't exist)
INSERT INTO users (id, full_name, email, mobile, password_hash, balance, is_active, biometric_enabled)
VALUES 
  (
    'test_user_1',
    'John Doe',
    'john.doe@example.com',
    '9876543210',
    '$2a$10$dummyhash1', -- Replace with actual bcrypt hash
    5000,
    TRUE,
    TRUE
  ),
  (
    'test_user_2',
    'Jane Smith',
    'jane.smith@example.com',
    '9876543211',
    '$2a$10$dummyhash2', -- Replace with actual bcrypt hash
    7500,
    TRUE,
    FALSE
  )
ON CONFLICT (email) DO NOTHING;

-- Log seeding completion
INSERT INTO admin_logs (admin_id, action_type, resource_type, severity, details)
VALUES (
  'system',
  'database_seeding',
  'system',
  'low',
  '{"message": "Initial seed data inserted", "timestamp": "' || NOW() || '"}'::jsonb
);

-- Create sample transactions for testing
INSERT INTO transactions (transaction_id, sender_id, receiver_id, amount, transaction_type, status, description, completed_at)
VALUES
  (
    'txn_' || gen_random_uuid()::text,
    'test_user_1',
    'test_user_2',
    500,
    'p2p',
    'completed',
    'Test P2P transfer',
    NOW()
  )
ON CONFLICT (transaction_id) DO NOTHING;
