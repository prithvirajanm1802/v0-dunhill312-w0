-- Seed some test data
INSERT INTO payments (user_id, amount, currency, status, payment_type, description, merchant_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, 50.00, 'USD', 'completed', 'qr', 'Coffee Shop Purchase', '550e8400-e29b-41d4-a716-446655440001'::uuid),
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, 25.50, 'USD', 'completed', 'gpay', 'Grocery Store', '550e8400-e29b-41d4-a716-446655440002'::uuid),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, 100.00, 'USD', 'pending', 'qr', 'Restaurant Payment', '550e8400-e29b-41d4-a716-446655440001'::uuid)
ON CONFLICT DO NOTHING;
