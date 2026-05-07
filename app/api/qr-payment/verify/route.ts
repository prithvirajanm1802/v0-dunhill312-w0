import { type NextRequest, NextResponse } from "next/server"
import { verifyQRPaymentSignature } from "@/lib/qr-payment-server"
import { decodeQRData, isQRCodeExpired, parseQRCodeUrl } from "@/lib/qr-payment"

export async function POST(request: NextRequest) {
  try {
    const { qrData, deviceId, verificationMethod } = await request.json()

    if (!qrData) {
      return NextResponse.json({ error: "QR data required" }, { status: 400 })
    }

    let paymentData

    // Try to parse from URL format or direct JSON
    if (qrData.includes("honeydrew://")) {
      paymentData = parseQRCodeUrl(qrData)
    } else {
      paymentData = decodeQRData(qrData)
    }

    if (!paymentData) {
      return NextResponse.json({ error: "Invalid QR data" }, { status: 400 })
    }

    // Verify signature
    if (!verifyQRPaymentSignature(paymentData)) {
      return NextResponse.json({ error: "Invalid QR signature" }, { status: 400 })
    }

    // Check expiration
    if (isQRCodeExpired(paymentData)) {
      return NextResponse.json({ error: "QR code expired" }, { status: 400 })
    }

    console.log("[v0] QR payment verified:", {
      transactionId: paymentData.transactionId,
      amount: paymentData.amount,
      deviceId,
      verificationMethod,
    })

    return NextResponse.json({
      success: true,
      transactionId: paymentData.transactionId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      merchant: paymentData.merchant,
      paymentType: paymentData.paymentType,
      verified: true,
      verificationTimestamp: Date.now(),
    })
  } catch (error) {
    console.error("[v0] QR payment verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
