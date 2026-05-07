# Honeydrew Mills - Neon DB & Stripe Integration Setup Guide

## Overview
This guide will help you set up Neon PostgreSQL database and Stripe payment integration for Honeydrew Mills. All users across all devices (mobile, laptop, desktop) will be synced in real-time through Neon DB.

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Set Up Neon Database

1. **Create a Neon Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up for a free account
   - Create a new project named "honeydrew-mills"

2. **Get Your Database URL**
   - In your Neon dashboard, copy the connection string
   - It looks like: `postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

3. **Add to v0 Environment Variables**
   - Click on the **Vars** section in the left sidebar of your v0 chat
   - Add a new variable:
     - Name: `DATABASE_URL`
     - Value: (paste your Neon connection string)

### Step 2: Run Database Setup Scripts

In your Neon SQL Editor (or from v0):

1. **Execute the table creation script**
   ```sql
   -- Run scripts/01-create-tables.sql
   ```
   - This creates all necessary tables: users, passkeys, transactions, admin_logs, qr_codes, stripe_payments, p2p_requests
   - Uses `IF NOT EXISTS` to avoid "relation already exists" errors
   - Creates indexes for performance
   - Sets up triggers for automatic timestamp updates

2. **Verify Tables Were Created**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
   - You should see: honeydrew_users, passkeys, user_transactions, admin_logs, qr_codes, stripe_payments, p2p_requests, user_sessions, user_biometrics, sync_records

### Step 3: Set Up Stripe (Optional but Recommended)

1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com)
   - Sign up for an account
   - Get your API keys from the Dashboard

2. **Add Stripe Keys to v0**
   - In the **Vars** section, add:
     - Name: `STRIPE_SECRET_KEY`
     - Value: `sk_test_...` (your Stripe secret key)
   - Also add:
     - Name: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
     - Value: `pk_test_...` (your Stripe publishable key)

---

## ✅ Verify Setup

### Check Database Connection

1. **Go to System Status Page**
   - Navigate to `/system-status` in your app
   - You should see:
     - ✓ Neon PostgreSQL Connected
     - ✓ All table counts displayed
     - ✓ "All devices synced in real-time"

2. **Check Admin Dashboard**
   - Go to `/admin-dashboard`
   - You should see:
     - Database status: Connected
     - All users listed (initially empty)
     - Real-time sync indicator

### Test User Registration

1. **Create a Test User**
   - Go to `/signup`
   - Fill in the form and register
   - Check Neon SQL Editor:
     ```sql
     SELECT * FROM honeydrew_users;
     SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 5;
     ```
   - Your new user should appear in both tables!

2. **Login from Multiple Devices**
   - Login from your phone browser
   - Login from your laptop
   - Both should see the same balance
   - All logins logged in `admin_logs` table

### Test P2P Transfer

1. **Create Two Users**
   - Register two different users
   - Note their emails/phone numbers

2. **Transfer Between Users**
   - Login as User A
   - Go to `/transfer`
   - Search for User B by email or mobile
   - Send money
   - Check database:
     ```sql
     SELECT * FROM user_transactions ORDER BY created_at DESC;
     SELECT * FROM p2p_requests;
     ```
   - Both users' balances should update instantly
   - Transaction logged in database

### Test Stripe Payment (if configured)

1. **Add Money**
   - Go to `/stripe-payment`
   - Enter an amount
   - Use Stripe test card: `4242 4242 4242 4242`
   - Check database:
     ```sql
     SELECT * FROM stripe_payments;
     ```

---

## 📊 Database Schema Overview

### Core Tables

1. **honeydrew_users** - All user accounts
   - id, full_name, email, mobile, password_hash
   - balance, is_active, role
   - biometric_enabled, fingerprint_registered
   - created_at, last_login_at

2. **user_transactions** - All transactions
   - user_id, sender_id, receiver_id
   - transaction_type (sent, received, deposit, withdrawal, etc.)
   - amount, balance_before, balance_after
   - status, metadata

3. **admin_logs** - All admin activities
   - admin_id, action_type, resource_type
   - severity, details (JSONB)
   - ip_address, user_agent
   - created_at

4. **passkeys** - WebAuthn/fingerprint data
   - user_id, credential_id, public_key
   - device_type, device_name
   - is_active

5. **stripe_payments** - Stripe payment records
   - user_id, stripe_payment_intent_id
   - amount, currency, status
   - metadata

6. **p2p_requests** - P2P transfer requests
   - sender_id, receiver_id
   - amount, message, status
   - created_at, completed_at

### Indexes for Performance
- All foreign keys are indexed
- Email, mobile, and username have indexes
- Created_at columns have DESC indexes for sorting
- Status fields are indexed for filtering

---

## 🔐 Security Features

### Multi-Device Sync
- All users synced across all devices in real-time
- Login from phone → See same balance on laptop
- Make transaction on laptop → Updates instantly on phone
- Public database accessible from all devices

### Admin Logging
- Every action logged to Neon DB
- Includes: user signups, logins, transfers, balance views
- Tracks: device info, IP address, user agent
- Severity levels: low, medium, high, critical

### Biometric Authentication
- Fingerprint data stored in passkeys table
- WebAuthn compliant
- Device-specific credentials
- Secure public key cryptography

---

## 🛠️ Troubleshooting

### "relation honeydrew_users does not exist"
**Solution:** Run the SQL script `scripts/01-create-tables.sql` in your Neon SQL Editor

### "DATABASE_URL not configured"
**Solution:** Add your Neon connection string to the Vars section in v0

### "User not found" on login
**Solution:** Check if the user exists:
```sql
SELECT * FROM honeydrew_users WHERE email = 'your@email.com';
```

### Stripe payments not working
**Solution:** 
1. Verify `STRIPE_SECRET_KEY` is set in Vars
2. Check Stripe dashboard for errors
3. Ensure you're using test mode keys

### P2P transfer fails
**Solution:**
1. Verify both users exist in database
2. Check sender has sufficient balance
3. Look at admin_logs for error details:
```sql
SELECT * FROM admin_logs WHERE severity = 'high' ORDER BY created_at DESC;
```

---

## 📱 Multi-Device Setup

### How It Works
1. User registers on **Phone** → Stored in Neon DB
2. User logs in on **Laptop** → Fetches same data from Neon DB
3. User makes transaction on **Desktop** → Updates balance in Neon DB
4. All devices see updated balance instantly

### Admin Dashboard
- Shows ALL users from ALL devices
- Real-time balance updates
- See which devices are active
- Track login locations and times

---

## 🎯 What's Included

### ✅ Fully Integrated Features

1. **User Management**
   - Registration with email/mobile
   - Login with password or biometric
   - Multi-device sync

2. **Transactions**
   - P2P transfers between users
   - Balance updates
   - Transaction history

3. **Admin Dashboard**
   - View all users
   - See balances and transactions
   - Add money to user accounts
   - View detailed logs

4. **Stripe Payments**
   - Create payment intents
   - Add money to wallet
   - Track payment status

5. **Security**
   - Biometric authentication
   - Admin logging
   - Secure password hashing (bcrypt)

---

## 📞 Support

If you encounter any issues:
1. Check the System Status page (`/system-status`)
2. Review admin logs in Neon SQL Editor
3. Verify all environment variables are set
4. Check browser console for errors

---

## 🎉 You're All Set!

Your Honeydrew Mills app now has:
- ✅ Neon PostgreSQL database connected
- ✅ All users synced across devices
- ✅ Admin dashboard with real-time data
- ✅ P2P transfers between users
- ✅ Stripe payment integration
- ✅ Complete audit logging

Start by registering a new user and watch it appear in your Neon database and admin dashboard!
