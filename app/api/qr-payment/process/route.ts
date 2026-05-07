import { type NextRequest, NextResponse } from "next/server"
import { decodeQRData, parseQRCodeUrl } from "@/lib/qr-payment"

export async function POST(request: NextRequest) {
  try {
    const { qrData, userId, verificationMethod, deviceId } = await request.json()

    if (!qrData || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let paymentData
    if (qrData.includes("honeydrew://")) {
      paymentData = parseQRCodeUrl(qrData)
    } else {
      paymentData = decodeQRData(qrData)
    }

    if (!paymentData) {
      return NextResponse.json({ error: "Invalid QR data" }, { status: 400 })
    }


    const transactionId = paymentData.transactionId
    const response = {
      success: true,
      transactionId,
      status: "processing",
      amount: paymentData.amount,
      merchant: paymentData.merchant,
      timestamp: Date.now(),
      verificationMethod,
      deviceId,
    }

    console.log("[v0] QR payment processing:", response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] QR payment processing error:", error)
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 })
  }
}
