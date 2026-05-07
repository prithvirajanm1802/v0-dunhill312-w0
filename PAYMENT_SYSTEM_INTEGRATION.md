# Unified Payment Verification System - Integration Guide

## System Architecture Overview

The Honeydrew Mills payment system is a comprehensive solution supporting multiple payment methods with QR code generation, cross-device synchronization, and unified verification.

## Core Components

### 1. QR Code Payment System
- **Location**: `lib/qr-payment.ts`, `lib/qr-code-generator.ts`
- **Features**:
  - Cryptographically signed QR codes
  - Support for QR, GPay, PhonePe, UPI payment types
  - Automatic expiration (30 minutes default)
  - URL-safe encoding for QR data

### 2. Payment Verification APIs
- **Fingerprint Verification**: `/api/verify/fingerprint` - Biometric authentication
- **Face Recognition**: `/api/verify/face` - Face ID with liveness detection
- **PIN Verification**: `/api/verify/pin` - 4-digit PIN authentication
- **QR Generation**: `/api/qr-payment/generate` - Create payment QR codes
- **QR Verification**: `/api/qr-payment/verify` - Verify scanned QR codes
- **Payment Processing**: `/api/qr-payment/process` - Process QR payments

### 3. Cross-Device Sync
- **Location**: `lib/device-sync.ts`, `lib/device-sync-hooks.ts`
- **Endpoints**:
  - `/api/sync/payment-status` - Sync payment status across devices
  - `/api/sync/devices` - Device registration and management
- **Features**:
  - Real-time payment status synchronization
  - Multi-device session management
  - Device trust and verification

### 4. Admin Dashboard & Logging
- **Location**: `app/admin/page.tsx`, `lib/admin-logging.ts`
- **Endpoints**: `/api/admin/logs`, `/api/admin/statistics`
- **Features**:
  - Real-time activity monitoring
  - Suspicious activity detection
  - Action type and severity tracking
  - Audit logging

### 5. Stripe Integration
- **Location**: `lib/stripe-service.ts`
- **Endpoints**:
  - `/api/payments/stripe/create-intent` - Create payment intent
  - `/api/payments/stripe/confirm` - Confirm payment
  - `/api/payments/stripe/refund` - Process refunds
- **Features**:
  - Payment intent management
  - Customer management
  - Refund processing
  - Charge verification

## UI Components

### QRPaymentGenerator
\`\`\`tsx
<QRPaymentGenerator onPaymentGenerated={(data) => console.log(data)} />
\`\`\`
- Generate secure payment QR codes
- Configure amount and merchant
- Download QR code images
- Real-time expiration timer

### QRPaymentScanner
\`\`\`tsx
<QRPaymentScanner userId={userId} onPaymentScanned={(data) => {}} />
\`\`\`
- Scan QR codes from other payment apps
- Verify payment data
- Support for multiple payment types

### PaymentVerificationModal
\`\`\`tsx
<PaymentVerificationModal
  paymentId={id}
  amount={100}
  merchant="Merchant Name"
  userId={userId}
  onVerified={() => {}}
/>
\`\`\`
- Biometric and PIN verification
- Multiple verification methods
- Real-time status feedback

## Database Schema

### Tables
- `payments` - Payment records with status tracking
- `qr_codes` - QR code data and metadata
- `payment_verification_logs` - Verification attempts and results
- `device_sync_logs` - Cross-device synchronization records
- `admin_logs` - Admin actions and audit trail
- `payment_disputes` - Dispute and refund tracking
- `stripe_payment_mappings` - Stripe integration mapping

## Usage Examples

### Generate QR Code
\`\`\`typescript
const response = await fetch('/api/qr-payment/generate', {
  method: 'POST',
  body: JSON.stringify({
    amount: 100,
    merchant: 'Honeydrew Mills',
    merchantId: 'merchant_honeydrew',
    paymentType: 'qr',
    expiryMinutes: 30
  })
});
const data = await response.json();
// Returns: { transactionId, qrImage, expiresAt, ... }
\`\`\`

### Verify Payment
\`\`\`typescript
const response = await fetch('/api/qr-payment/verify', {
  method: 'POST',
  body: JSON.stringify({
    qrData: scannedData,
    deviceId: deviceId,
    verificationMethod: 'qr_scan'
  })
});
\`\`\`

### Fingerprint Verification
\`\`\`typescript
const response = await fetch('/api/verify/fingerprint', {
  method: 'POST',
  body: JSON.stringify({
    paymentId: paymentId,
    userId: userId,
    fingerprintData: biometricTemplate,
    deviceName: 'iPhone 14'
  })
});
\`\`\`

### Cross-Device Sync
\`\`\`typescript
const { syncStatus, syncPaymentStatus } = usePaymentSync(userId, deviceId);
await syncPaymentStatus({ /* payment status object */ });
\`\`\`

### Admin Actions
\`\`\`typescript
const response = await fetch('/api/admin/logs?actionType=payment_verified');
const response = await fetch('/api/admin/statistics');
\`\`\`

## Security Features

1. **Cryptographic Signing**: QR codes are signed with SHA-256
2. **Biometric Authentication**: Fingerprint and face recognition
3. **Device Verification**: Each device is verified before allowing payments
4. **Session Management**: Automatic session expiration after 24 hours
5. **Audit Logging**: All admin actions logged with timestamps and IP addresses
6. **Cross-Device Security**: Secure sync with encryption support

## Payment Flow

1. **Initiation**: User initiates payment (amount, merchant)
2. **QR Generation**: System generates signed QR code
3. **Scanning**: Recipient scans QR code or user provides payment data
4. **Verification**: Biometric/PIN/QR verification
5. **Processing**: Stripe processes payment
6. **Confirmation**: Payment confirmed and synced across devices
7. **Admin Logging**: Action logged in admin dashboard

## Deployment Checklist

- [ ] Database tables created (run scripts/01-init-payment-schema.sql)
- [ ] Stripe API keys configured in environment variables
- [ ] QR secret key set in environment variables
- [ ] Device tracking enabled
- [ ] Admin access configured
- [ ] Cross-device sync endpoints tested
- [ ] Payment verification methods tested
- [ ] Admin dashboard accessible

## Environment Variables Required

\`\`\`
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
QR_SECRET
NEON_NEON_DATABASE_URL (for Neon)
\`\`\`

## Performance Optimization

- QR codes cached for 30 minutes
- Admin logs limited to 1000 recent entries
- Device sync stores only last 50 syncs per user
- Indexes on frequently queried columns

## API Response Format

All endpoints return:
\`\`\`typescript
{
  success: boolean;
  error?: string;
  data?: any;
  timestamp: number;
}
\`\`\`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| QR code not generating | Check if `qrcode` package installed |
| Signature verification failed | Verify QR_SECRET environment variable |
| Device sync not working | Check device ID generation |
| Admin logs empty | Check AdminLogger initialization |
| Stripe payment fails | Verify Stripe API keys and payment intent |

## Support & Monitoring

- Monitor `/api/admin/statistics` for system health
- Check admin logs for suspicious activities
- Review payment verification failures
- Track device registration patterns
- Monitor Stripe integration issues
