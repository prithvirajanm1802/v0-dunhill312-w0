import { NextResponse } from "next/server"
import { getSQL } from "@/lib/neon-db"

export async function POST(req: Request) {
  try {
    const { userId, amount, recipient, category, authMethod, verificationScore, deviceId, metadata } = await req.json()

    if (!userId || !amount || !recipient) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    const sql = getSQL()
    if (!sql) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not connected",
        },
        { status: 500 },
      )
    }

    // Get user's current balance
    const userResult = await sql`
      SELECT id, full_name, balance FROM honeydrew_users WHERE id = ${userId}
    `

    if (!userResult[0]) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      )
    }

    const user = userResult[0]

    if (Number(user.balance) < amount) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient balance",
        },
        { status: 400 },
      )
    }

    // Calculate new balance
    const newBalance = Number(user.balance) - amount

    // Update user balance
    await sql`
      UPDATE honeydrew_users
      SET balance = ${newBalance}, updated_at = NOW()
      WHERE id = ${userId}
    `

    // Create transaction record
    const transactionResult = await sql`
      INSERT INTO user_transactions (
        user_id, recipient, transaction_type, amount, balance_before, balance_after,
        status, auth_method, verification_score, device_id, payment_method, category, metadata, completed_at
      )
      VALUES (
        ${userId}, ${recipient}, 'sent', ${amount},
        ${user.balance}, ${newBalance}, 'completed', ${authMethod || "fingerprint"},
        ${verificationScore || null}, ${deviceId || null},
        'wallet', ${category || "payment"}, ${JSON.stringify(metadata || {})},
        NOW()
      )
      RETURNING id, amount, status, created_at
    `

    return NextResponse.json({
      success: true,
      transactionId: transactionResult[0].id,
      newBalance,
      message: "Payment completed successfully",
    })
  } catch (error: any) {
    console.error("[v0] Payment processing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process payment",
      },
      { status: 500 },
    )
  }
}
