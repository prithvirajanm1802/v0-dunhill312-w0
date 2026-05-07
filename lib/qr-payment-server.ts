import crypto from "crypto"
import type { QRPaymentData } from "./qr-payment"

/**
 * Create signed QR payment data (SERVER ONLY)
 * This function must only be called from server components or API routes
 */
export function createQRPaymentData(
  amount: number,
  merchant: string,
  merchantId: string,
  paymentType: "qr" | "gpay" | "phonepay" | "upi" = "qr",
  expiryMinutes = 30,
): QRPaymentData {
  const timestamp = Date.now()
  const expiresAt = timestamp + expiryMinutes * 60 * 1000
  const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`

  const qrSecret = process.env.QR_SECRET || "honeydrew-secret"
  const dataToSign = `${amount}|${merchant}|${merchantId}|${timestamp}|${transactionId}`
  const signature = crypto
    .createHash("sha256")
    .update(dataToSign + qrSecret)
    .digest("hex")

  return {
    id: crypto.randomUUID(),
    amount,
    currency: "USD",
    merchant,
    merchantId,
    timestamp,
    expiresAt,
    paymentType,
    transactionId,
    signature,
  }
}

/**
 * Verify QR payment data signature (SERVER ONLY)
 * This function must only be called from server components or API routes
 */
export function verifyQRPaymentSignature(data: QRPaymentData): boolean {
  const qrSecret = process.env.QR_SECRET || "honeydrew-secret"
  const dataToSign = `${data.amount}|${data.merchant}|${data.merchantId}|${data.timestamp}|${data.transactionId}`
  const expectedSignature = crypto
    .createHash("sha256")
    .update(dataToSign + qrSecret)
    .digest("hex")

  return data.signature === expectedSignature
}
