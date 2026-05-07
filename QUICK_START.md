# Quick Start Guide - Honeydrew Mills Payment System

## Installation

1. **Install dependencies** (if needed):
\`\`\`bash
npm install qrcode stripe
\`\`\`

2. **Database Setup**:
   - Execute \`scripts/01-init-payment-schema.sql\` in your Neon database
   - Optionally run \`scripts/02-seed-payment-data.sql\` for test data

3. **Environment Variables**:
   Add to your \`.env.local\` or Vercel environment:
   \`\`\`
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   QR_SECRET=your_secret_key_here
   NEON_NEON_DATABASE_URL=postgresql://...
   \`\`\`
   
   Note: QR_SECRET is a private environment variable (no NEXT_PUBLIC_ prefix) and is only used on the server-side.

## Basic Usage

### For End Users

1. **Generate QR Payment**:
   - Navigate to `/payments/qr`
   - Click "Generate QR"
   - Enter amount and payment type
   - Share QR code with recipient

2. **Scan & Pay**:
   - Click "Scan QR"
   - Paste QR data or use scanner
   - Verify with biometric/PIN
   - Confirm payment

### For Merchants

1. **Display QR**:
   \`\`\`tsx
   import { QRPaymentGenerator } from '@/components/qr-payment-generator';
   
   export default function Checkout() {
     return <QRPaymentGenerator onPaymentGenerated={handlePayment} />;
   }
   \`\`\`

2. **Accept QR Payments**:
   \`\`\`tsx
   import { QRPaymentScanner } from '@/components/qr-payment-scanner';
   
   export default function PaymentTerminal() {
     return <QRPaymentScanner userId={merchantId} onPaymentScanned={handleQR} />;
   }
   \`\`\`

### For Admins

1. **Access Dashboard**:
   - Navigate to `/admin`
   - View real-time statistics
   - Monitor suspicious activities
   - Review payment logs

## Testing

### Test Payments
\`\`\`
Amount: $100.00
Merchant: Honeydrew Mills
Payment Type: QR

PIN: 1234
Fingerprint: Auto-verified (demo)
Face ID: Auto-verified (demo)
\`\`\`

### Test Endpoints
\`\`\`bash
# Generate QR Code
curl -X POST http://localhost:3000/api/qr-payment/generate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "merchant": "Honeydrew Mills",
    "merchantId": "merchant_honeydrew",
    "paymentType": "qr"
  }'

# Verify QR Code
curl -X POST http://localhost:3000/api/qr-payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "qrData": "honeydrew://pay?data=...",
    "deviceId": "device_123",
    "verificationMethod": "qr_scan"
  }'

# Get Admin Statistics
curl http://localhost:3000/api/admin/statistics

# Get Admin Logs
curl http://localhost:3000/api/admin/logs?limit=50
\`\`\`

## Features Checklist

- [x] QR Code Generation
- [x] QR Code Scanning
- [x] Biometric Verification (Fingerprint)
- [x] Face ID Verification
- [x] PIN Verification
- [x] Cross-Device Sync
- [x] Admin Dashboard
- [x] Payment Logging
- [x] Stripe Integration
- [x] GPay/PhonePe/UPI Support
- [x] Device Management
- [x] Suspicious Activity Detection

## Pages & Routes

| Route | Purpose |
|-------|---------|
| `/payments/qr` | QR payment generation and scanning |
| `/admin` | Admin dashboard with statistics |
| `/api/qr-payment/generate` | Generate QR codes |
| `/api/qr-payment/verify` | Verify QR codes |
| `/api/verify/fingerprint` | Fingerprint authentication |
| `/api/verify/face` | Face ID authentication |
| `/api/verify/pin` | PIN authentication |
| `/api/sync/payment-status` | Cross-device sync |
| `/api/sync/devices` | Device management |
| `/api/admin/logs` | Admin logs |
| `/api/admin/statistics` | System statistics |

## Common Tasks

### Add New Payment Method
1. Update `paymentType` in `lib/qr-payment.ts`
2. Add verification handler in `app/api/verify/` folder
3. Update UI components to show new method

### Custom Verification
1. Create new file `app/api/verify/[method]/route.ts`
2. Implement verification logic
3. Update `PaymentVerificationModal` component

### Enable Real Database
1. Replace in-memory stores with database queries
2. Update API routes to use Neon queries
3. Implement proper transactions and rollbacks

## Performance Tips

- Cache QR codes for 30 minutes
- Use pagination for admin logs
- Batch cross-device syncs
- Monitor Stripe API rate limits
- Use CDN for QR code images

## Security Best Practices

- Always verify QR signatures
- Validate payment amounts on backend
- Use HTTPS for all payments
- Implement rate limiting on verification endpoints
- Log all admin actions
- Monitor for suspicious patterns
- Rotate QR secrets regularly

## Support

For issues or questions:
1. Check `/api/admin/statistics` for system health
2. Review admin logs for error patterns
3. Verify environment variables
4. Check Stripe dashboard for payment issues
5. Test with provided test cases

## Next Steps

1. Customize branding and colors
2. Add email/SMS notifications
3. Implement recurring payments
4. Add dispute resolution flow
5. Integrate analytics
6. Set up monitoring and alerts
