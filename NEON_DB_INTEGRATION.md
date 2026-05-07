# Honeydrew Mills - Neon Database Integration Guide

## Overview
Honeydrew Mills is fully integrated with **Neon PostgreSQL** database for cross-device data synchronization and real-time user management.

---

## ✅ Features Fully Integrated with Neon DB

### 1. **User Registration & Authentication**
- All user signups are stored in the `honeydrew_users` table
- Users can register from any device (phone, laptop, tablet)
- Biometric data (face and fingerprint) stored securely
- **Location**: `app/signup/page.tsx` → `app/api/users/register/route.ts` → Neon DB

### 2. **Admin Logging (Cross-Device)**
- Every signup, login, and activity logged to `admin_logs` table
- All devices tracked with IP address, user agent, and device info
- **Location**: `app/api/admin/logs/route.ts`
- **Admin Dashboard**: `/admin-dashboard` shows all users and activities

### 3. **User Balance Management**
- User balances stored in `honeydrew_users.balance` column
- Updated in real-time after every transaction
- Synchronized across all devices
- **Functions**: `updateUserBalance()` in `lib/neon-db.ts`

### 4. **P2P Transfers (User-to-User)**
- Send money between registered users
- Balance automatically updated for both sender and recipient
- Transaction recorded in `user_transactions` table
- **API**: `app/api/transfer/p2p/route.ts`
- **Page**: `/transfer`

### 5. **Stripe Payment Integration**
- Add money to wallet using Stripe
- Webhook automatically updates user balance in Neon DB
- All Stripe transactions logged
- **Webhook**: `app/api/stripe/webhook/route.ts`
- **Page**: `/stripe-payment`

### 6. **Telecom Recharge Services**
- Jio, Airtel, and Vi plans available
- Balance deducted from Neon DB wallet
- Transaction logged with complete details
- Payment receipt shown with before/after balance
- **Page**: `/telecom-recharge`, `/mobile-recharge`

### 7. **Payment Receipts**
- All payments show detailed receipt
- Displays: Transaction ID, date/time, amount, previous balance, new balance
- **Component**: `components/payment-receipt.tsx`

### 8. **Session Management**
- Active sessions tracked in `user_sessions` table
- Shows concurrent logins across devices
- **Visible in**: Admin Dashboard

---

## 📊 Database Schema

### Main Tables:
1. **honeydrew_users** - All user accounts
2. **passkeys** - Biometric authentication data
3. **user_transactions** - All payment transactions
4. **admin_logs** - System activity logs
5. **qr_codes** - Generated QR codes for payments
6. **user_sessions** - Active login sessions
7. **sync_records** - Cross-device synchronization

---

## 🔗 Key API Endpoints

### User Management
- `GET /api/users/all` - Get all registered users from Neon DB
- `POST /api/users/register` - Register new user to Neon DB
- `POST /api/auth/login` - Login and create session in Neon DB
- `GET /api/users/search?q=` - Search users by name/mobile/username

### Admin & Logs
- `GET /api/admin/logs` - Retrieve admin logs from Neon DB
- `POST /api/admin/logs` - Create new admin log entry
- `GET /api/admin/db-status` - Check Neon DB connection status
- `GET /api/admin/statistics` - Get system statistics

### Payments & Transfers
- `POST /api/transfer/p2p` - P2P user-to-user transfer
- `POST /api/stripe/webhook` - Stripe payment webhook
- `POST /api/payments/process` - Process payment and update balance

---

## 🚀 How to Access Features

### For Users:
1. **Dashboard**: `/dashboard` - Main user interface
2. **P2P Transfer**: `/transfer` - Send money to other users
3. **Add Money**: `/stripe-payment` - Add funds via Stripe
4. **Recharge**: `/telecom-recharge` or `/mobile-recharge`
5. **Wallet**: `/wallet` - View balance and transactions

### For Admins:
1. **Admin Dashboard**: `/admin-dashboard` - View all users and logs
2. **System Status**: `/system-status` - Check Neon DB connectivity
3. **Admin Login**: `/admin-login`

---

## 🔒 Security Features

1. **Biometric Authentication** - Face and fingerprint verification
2. **Session Tracking** - All logins monitored across devices
3. **Admin Logging** - Every action logged with timestamp
4. **Secure Transactions** - All payments verified and logged
5. **Cross-Device Sync** - Data synchronized in real-time

---

## 📱 Cross-Device Functionality

Users can:
- Sign up from any device (phone, laptop, tablet)
- Login from multiple devices simultaneously
- Access same wallet balance across all devices
- Receive P2P transfers on any device
- View transaction history from any device

All data is stored centrally in Neon PostgreSQL database and synchronized in real-time.

---

## 🛠️ Developer Notes

### Environment Variables Required:
\`\`\`
DATABASE_URL=<your-neon-postgresql-connection-string>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
\`\`\`

### Key Library Files:
- `lib/neon.ts` - Neon connection setup
- `lib/neon-db.ts` - Database operations
- `lib/payment-service.ts` - Payment processing
- `lib/admin-logger.ts` - Admin logging utilities

---

## ✅ Verification Checklist

- [x] Neon DB connected and operational
- [x] Users stored in database (cross-device)
- [x] Admin logs recording all activities
- [x] P2P transfers working with balance updates
- [x] Stripe integration functional
- [x] Payment receipts displaying correctly
- [x] Balance updates after every payment
- [x] Session tracking across devices
- [x] Telecom recharge services integrated

---

## 📞 Support

For system status and connectivity check, visit: `/system-status`

This page shows:
- Neon DB connection status
- Total users across all devices
- Active sessions count
- Transaction counts
- Recent admin logs
- Quick access to all features

---

**Last Updated**: January 2025
**Database**: Neon PostgreSQL (Public Access)
**Platform**: Honeydrew Mills Digital Payment System
\`\`\`

\`\`\`tsx file="" isHidden
