-- Insert default admin user (password: Admin@123)
-- Password hash is bcrypt hash of 'Admin@123'
INSERT INTO users (email, password_hash, full_name, balance, is_admin, is_active)
VALUES (
  'admin@honeydrew.com',
  '$2a$10$rLGzqBqbX5mI0pu7LxKmH.mW3xKrFZKYvWLFZGQYfJQQxqwYxqwYx',
  'System Administrator',
  0.00,
  TRUE,
  TRUE
)
ON CONFLICT (email) DO NOTHING;
