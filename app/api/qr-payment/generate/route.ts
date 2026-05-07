import { type NextRequest, NextResponse } from "next/server"
import { createQRPaymentData, verifyQRPaymentSignature } from "@/lib/qr-payment-server"
import { formatQRPaymentForCode } from "@/lib/qr-payment"
import { generateQRCodeImage } from "@/lib/qr-code-generator"

export async function POST(request: NextRequest) {
  try {
    const { amount, merchant, merchantId, paymentType = "qr", expiryMinutes = 30 } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!merchant || !merchantId) {
      return NextResponse.json({ error: "Merchant information required" }, { status: 400 })
    }

    // Create payment data
    const paymentData = createQRPaymentData(amount, merchant, merchantId, paymentType, expiryMinutes)

    // Verify signature before generating QR
    if (!verifyQRPaymentSignature(paymentData)) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 400 })
    }

    // Format data for QR code
    const qrData = formatQRPaymentForCode(paymentData)

    // Generate QR code image
    const qrImage = await generateQRCodeImage(qrData)

    // Log to console (in production, this would go to a database)
    console.log("[v0] QR code generated:", {
      transactionId: paymentData.transactionId,
      amount,
      merchant,
      expiresAt: new Date(paymentData.expiresAt).toISOString(),
    })

    return NextResponse.json({
      success: true,
      transactionId: paymentData.transactionId,
      amount,
      currency: paymentData.currency,
      merchant,
      qrImage,
      expiresAt: paymentData.expiresAt,
      paymentType,
    })
  } catch (error) {
    console.error("[v0] QR payment generation error:", error)
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
  }
}
