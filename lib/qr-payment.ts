import crypto from "crypto"

export interface QRPaymentData {
  id: string
  amount: number
  currency: string
  merchant: string
  merchantId: string
  timestamp: number
  expiresAt: number
  paymentType: "qr" | "gpay" | "phonepay" | "upi"
  transactionId: string
  signature: string
}

export interface QRCodeImage {
  dataUrl: string
  base64: string
  size: number
}

/**
 * Generate a unique transaction ID for QR payments
 */
export function generateTransactionId(): string {
  return `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
}

/**
 * Encode QR payment data to JSON string
 */
export function encodeQRData(paymentData: QRPaymentData): string {
  return JSON.stringify(paymentData)
}

/**
 * Decode QR data from JSON string
 */
export function decodeQRData(qrDataString: string): QRPaymentData {
  return JSON.parse(qrDataString)
}

/**
 * Check if QR code has expired
 */
export function isQRCodeExpired(qrData: QRPaymentData): boolean {
  return Date.now() > qrData.expiresAt
}

/**
 * Format payment data for QR code (URL safe)
 */
export function formatQRPaymentForCode(paymentData: QRPaymentData): string {
  const encoded = Buffer.from(encodeQRData(paymentData)).toString("base64")
  return `honeydrew://pay?data=${encoded}`
}

/**
 * Parse QR code URL back to payment data
 */
export function parseQRCodeUrl(qrUrl: string): QRPaymentData | null {
  try {
    const match = qrUrl.match(/data=([^&]+)/)
    if (!match) return null

    const decoded = Buffer.from(match[1], "base64").toString("utf-8")
    return decodeQRData(decoded)
  } catch (error) {
    console.error("[v0] Error parsing QR code URL:", error)
    return null
  }
}
