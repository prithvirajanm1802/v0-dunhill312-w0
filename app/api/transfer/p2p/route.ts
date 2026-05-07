import { NextResponse } from "next/server"
import { transferBetweenUsers } from "@/lib/neon-db"

export async function POST(req: Request) {
  try {
    const { senderId, recipientId, amount, authMethod, verificationScore, deviceId, note } = await req.json()

    // Validate inputs
    if (!senderId || !recipientId) {
      return NextResponse.json(
        {
          success: false,
          error: "Sender and recipient IDs are required",
        },
        { status: 400 },
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid transfer amount",
        },
        { status: 400 },
      )
    }

    if (senderId === recipientId) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot transfer to yourself",
        },
        { status: 400 },
      )
    }

    // Perform the transfer
    const result = await transferBetweenUsers({
      senderId,
      recipientId,
      amount,
      authMethod: authMethod || "fingerprint",
      verificationScore,
      deviceId,
      note,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      senderNewBalance: result.senderNewBalance,
      recipientNewBalance: result.recipientNewBalance,
      message: "Transfer completed successfully",
    })
  } catch (error: any) {
    console.error("[v0] P2P transfer error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process transfer",
      },
      { status: 500 },
    )
  }
}
