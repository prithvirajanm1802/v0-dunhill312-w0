# Honeydrew Mills - Digital Payment Platform

A secure digital payment platform with biometric authentication, multi-device sync, and real-time transactions.

## 🌟 Features

### Core Functionality
- 💳 **Digital Wallet** - Secure money management
- 👆 **Biometric Authentication** - Fingerprint login via WebAuthn
- 💸 **P2P Transfers** - Send money to registered users instantly
- 📱 **Multi-Device Sync** - Access your account from any device
- 🎯 **QR Payments** - Scan and pay
- 📊 **Transaction History** - Track all your payments
- 🔐 **Admin Dashboard** - Complete user and transaction management

### Payment Options
- Mobile Recharge (Jio, Airtel, Vi, BSNL)
- DTH Recharge (Tata Play, Airtel Digital TV)
- Bill Payments (Electricity, Water, Gas)
- Stripe Integration for adding funds
- P2P transfers between users

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Neon PostgreSQL account
- Stripe account (optional)

### Environment Variables Required

Add these in the **Vars** section of your v0 sidebar:

```env
# Neon Database (REQUIRED)
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# Stripe (Optional - for payment processing)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Database Setup

1. **Create Neon Database**
   - Go to [neon.tech](https://neon.tech)
   - Create a new project
   - Copy your DATABASE_URL

2. **Run SQL Scripts**
   - Open Neon SQL Editor
   - Run `scripts/01-create-tables.sql`
   - Verify tables were created

3. **Check Connection**
   - Go to `/system-status` in your app
   - Should show "Neon PostgreSQL Connected"

See `NEON_STRIPE_SETUP.md` for detailed setup instructions.

## 📊 Database Schema

### Main Tables
- `honeydrew_users` - User accounts (synced across all devices)
- `user_transactions` - All transactions
- `admin_logs` - Admin activity logs
- `passkeys` - Biometric authentication data
- `stripe_payments` - Stripe payment records
- `p2p_requests` - P2P transfer requests
- `qr_codes` - QR payment codes

## 🎯 Key Routes

### User Routes
- `/` - Landing page
- `/signup` - User registration
- `/login` - User login (password or biometric)
- `/dashboard` - Main user dashboard
- `/transfer` - P2P money transfer
- `/wallet` - Wallet management
- `/stripe-payment` - Add money via Stripe

### Admin Routes
- `/admin-login` - Admin login
- `/admin-dashboard` - Admin control panel
- `/system-status` - System health check

## 🔐 Security Features

1. **Biometric Authentication**
   - WebAuthn/FIDO2 compliant
   - Fingerprint and face recognition
   - Device-specific credentials

2. **Multi-Device Sync**
   - All data stored in Neon DB
   - Real-time synchronization
   - Login from any device

3. **Admin Logging**
   - All actions logged
   - Includes device info, IP, user agent
   - Severity levels for prioritization

4. **Secure Transfers**
   - Biometric verification required
   - Balance validation
   - Transaction rollback on failure

## 👥 User Management

### Registration
- Users register with email, mobile, password
- Optional biometric setup
- Initial balance: ₹10,000
- Stored in Neon DB

### Login
- Password or biometric authentication
- Multi-device support
- Session management
- Login tracking in admin logs

### P2P Transfers
- Search users by email or mobile
- Only transfer to registered users
- Biometric verification required
- Instant balance updates
- Transaction logging

## 🔧 Admin Features

### Dashboard
- View all users across all devices
- See real-time balances
- Track active sessions
- Monitor biometric enrollment

### User Management
- Add money to user accounts
- View user biometric data
- Check transaction history
- Deactivate accounts

### Logging
- All actions logged to Neon DB
- Filter by action type
- View detailed information
- Export capabilities

## 📱 Multi-Device Support

Your account works seamlessly across:
- 📱 Mobile phones (iOS/Android)
- 💻 Laptops (Mac/Windows)
- 🖥️ Desktops
- 📟 Tablets

**How it works:**
1. Sign up on any device
2. Data stored in Neon DB
3. Login from another device
4. See same balance and transactions
5. Make a transaction on one device
6. Instantly reflected on all devices

## 🎨 Tech Stack

- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Database:** Neon PostgreSQL
- **Authentication:** WebAuthn, bcrypt
- **Payments:** Stripe
- **Deployment:** Vercel

## 📦 Project Structure

```
honeydrew-mills/
├── app/
│   ├── api/              # API routes
│   │   ├── admin/        # Admin APIs
│   │   ├── auth/         # Authentication
│   │   ├── transfer/     # P2P transfers
│   │   ├── stripe/       # Stripe integration
│   │   └── users/        # User management
│   ├── dashboard/        # User dashboard
│   ├── admin-dashboard/  # Admin panel
│   ├── transfer/         # P2P transfer page
│   └── ...
├── components/           # Reusable components
│   ├── ui/              # shadcn/ui components
│   └── ...
├── lib/                 # Utility functions
│   ├── neon-db.ts       # Database operations
│   ├── stripe-config.ts # Stripe configuration
│   └── ...
├── scripts/             # SQL scripts
│   └── 01-create-tables.sql
└── ...
```

## 🐛 Troubleshooting

### Common Issues

**"relation honeydrew_users does not exist"**
- Run the SQL scripts in Neon SQL Editor
- Check DATABASE_URL is set correctly

**"User not found" on login**
- Verify user exists in database
- Check email/mobile is correct

**P2P transfer fails**
- Ensure both users are registered
- Check sender has sufficient balance
- Verify biometric is registered

**Stripe not working**
- Check STRIPE_SECRET_KEY is set
- Use test mode for development
- Verify publishable key is public (NEXT_PUBLIC_)

See `NEON_STRIPE_SETUP.md` for detailed solutions.

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🙏 Acknowledgments

- Built with [v0.dev](https://v0.dev)
- Database: [Neon](https://neon.tech)
- Payments: [Stripe](https://stripe.com)
- UI Components: [shadcn/ui](https://ui.shadcn.com)

---

**Need Help?** Check `/system-status` for diagnostics and database connection info.
