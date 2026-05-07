# Honeydrew Mills - Database Setup Guide

## Quick Start: Fix "relation honeydrew_users does not exist" Error

### Step 1: Run the Master Database Script

Your Neon database needs to be initialized with the correct tables. I've created a master SQL script for you.

**To run it:**

1. Look for the file: `scripts/000-master-schema.sql`
2. The v0 interface will show a "▶️ Run" button next to SQL files
3. Click the Run button to execute the script
4. Wait for confirmation that tables were created

**What this script does:**
- Creates `honeydrew_users` table with all user data
- Creates `user_transactions` table for P2P transfers
- Creates `admin_logs` table for tracking activities
- Creates `passkeys` table for biometric authentication
- Creates `qr_codes`, `user_sessions`, `user_biometrics`, `sync_records` tables
- Inserts a default admin user (email: admin@honeydrew.com, password: Admin@123)

### Step 2: Verify Database Connection

After running the script, visit: `/connection-status` in your app

You should see:
- ✅ Neon Database: Connected
- ✅ Tables created: 8 tables
- ✅ Users count: 1 (admin user)

### Step 3: Test Signup Flow

1. Go to `/signup`
2. Fill in the registration form:
   - Full Name: Your Name
   - Phone: 1234567890
   - Email: your@email.com
   - Password: Test@123456
3. Click "Continue to Fingerprint Setup"
4. On Step 2, you can either:
   - Register your fingerprint/passkey (recommended)
   - Click "Skip & Continue" to proceed without passkey

**Important Notes:**
- Google Passkey works best on Chrome/Edge browsers
- The passkey is stored in Google Password Manager, not the database
- If you get "Registration cancelled" - just click "Skip & Continue" or try in Chrome

### Step 4: Test Login Flow

1. Go to `/login`
2. Enter your phone number
3. Enter your password
4. Click Login

You should be redirected to `/dashboard`

### Step 5: Test Admin Dashboard

1. Login as admin:
   - Email: admin@honeydrew.com
   - Password: Admin@123
2. Go to `/admin-dashboard`
3. You should see:
   - All registered users
   - Their balances
   - User activity
   - Admin can add money to any user

## Database Schema

### Tables Created:

1. **honeydrew_users** - Main user accounts
2. **user_transactions** - All financial transactions (P2P, Stripe, deposits)
3. **admin_logs** - Admin activity tracking
4. **passkeys** - WebAuthn passkey data
5. **qr_codes** - QR payment codes
6. **user_sessions** - Active user sessions across devices
7. **user_biometrics** - Biometric authentication data
8. **sync_records** - Cross-device synchronization

## Features Working After Setup:

✅ User Registration (with or without passkey)
✅ User Login (password + optional passkey)
✅ Dashboard access
✅ Admin Dashboard with user management
✅ Admin can add money to users (infinite admin balance)
✅ P2P transfers between users
✅ Stripe payment integration
✅ All data synced across devices via Neon DB
✅ Real-time connection status monitoring

## Troubleshooting:

### "relation honeydrew_users does not exist"
→ Run `scripts/000-master-schema.sql`

### "Registration cancelled" on passkey step
→ Click "Skip & Continue" or use Chrome browser

### Can't see registered users in admin dashboard
→ Check `/connection-status` to verify DB connection
→ Make sure the SQL script ran successfully

### Admin login not working
→ The admin credentials are:
   - Email: admin@honeydrew.com
   - Password: Admin@123

## Admin Features:

- **Infinite Balance**: Admin has unlimited funds (∞ displayed)
- **Add Money to Users**: Click "Add Money" button on any user
- **View All Users**: See all registered users from any device
- **Monitor Transactions**: View all P2P transfers and payments
- **Track Activity**: All admin actions logged to `admin_logs` table

## Environment Variables:

Required variables (already set in your v0 project):
- `DATABASE_URL` - Neon PostgreSQL connection
- `STRIPE_SECRET_KEY` - Stripe API secret
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

All environment variables are automatically available to your app!
