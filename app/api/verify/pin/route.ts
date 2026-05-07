import { type NextRequest, NextResponse } from "next/server"
import { createVerificationRecord, generateDeviceId } from "@/lib/payment-verification"

export async function POST(request: NextRequest) {
  try {
    const { paymentId, userId, pin, deviceName } = await request.json()

    if (!paymentId || !userId || !pin) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userAgent = request.headers.get("user-agent") || ""
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "0.0.0.0"
    const deviceId = generateDeviceId(userAgent, ipAddress)

    // In production, you'd hash and verify against stored PIN
    // For demo, simulate PIN verification
    const isVerified = pin.length === 4 && /^\d+$/.test(pin)

    const verification = createVerificationRecord(
      paymentId,
      userId,
      "pin",
      deviceId,
      deviceName || "Unknown Device",
      ipAddress,
      userAgent,
      isVerified ? "success" : "failed",
      !isVerified ? "Invalid PIN" : undefined,
    )

    console.log("[v0] PIN verification:", {
      transactionId: paymentId,
      status: verification.status,
    })

    return NextResponse.json({
      success: isVerified,
      verificationId: verification.id,
      status: verification.status,
      message: isVerified ? "PIN verified" : "PIN verification failed",
    })
  } catch (error) {
    console.error("[v0] PIN verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
