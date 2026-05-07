import { type NextRequest, NextResponse } from "next/server"
import { createVerificationRecord, generateDeviceId, hashSensitiveData } from "@/lib/payment-verification"

export async function POST(request: NextRequest) {
  try {
    const { paymentId, userId, fingerprintData, deviceName } = await request.json()

    if (!paymentId || !userId || !fingerprintData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get device info
    const userAgent = request.headers.get("user-agent") || ""
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "0.0.0.0"
    const deviceId = generateDeviceId(userAgent, ipAddress)

    // In a real scenario, you would:
    // 1. Validate fingerprint against stored template
    // 2. Check liveness detection
    // 3. Compare match score against threshold

    // Simulate fingerprint verification (90% match)
    const matchScore = 92 // Would come from WebAuthn/fingerprint library
    const isVerified = matchScore > 90

    const verification = createVerificationRecord(
      paymentId,
      userId,
      "fingerprint",
      deviceId,
      deviceName || "Unknown Device",
      ipAddress,
      userAgent,
      isVerified ? "success" : "failed",
      !isVerified ? "Low match score" : undefined,
    )

    console.log("[v0] Fingerprint verification:", {
      transactionId: paymentId,
      status: verification.status,
      matchScore,
      deviceId: hashSensitiveData(deviceId),
    })

    return NextResponse.json({
      success: isVerified,
      verificationId: verification.id,
      status: verification.status,
      matchScore,
      message: isVerified ? "Fingerprint verified" : "Fingerprint verification failed",
    })
  } catch (error) {
    console.error("[v0] Fingerprint verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
