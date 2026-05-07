import { type NextRequest, NextResponse } from "next/server"
import { transferBetweenUsers } from "@/lib/neon-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { senderId, recipientId, amount, authMethod, verificationScore, deviceId, note } = body

    if (!senderId || !recipientId || !amount) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (senderId === recipientId) {
      return NextResponse.json({ success: false, error: "Cannot transfer to yourself" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ success: false, error: "Amount must be positive" }, { status: 400 })
    }

    const result = await transferBetweenUsers({
      senderId,
      recipientId,
      amount: Number(amount),
      authMethod: authMethod || "biometric",
      verificationScore,
      deviceId,
      note,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      newBalance: result.senderNewBalance,
    })
  } catch (error: any) {
    console.error("[v0] Transfer error:", error)
    return NextResponse.json({ success: false, error: error.message || "Transfer failed" }, { status: 500 })
  }
}
