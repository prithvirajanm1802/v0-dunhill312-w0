import { type NextRequest, NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const sql = getNeon()

    if (!sql) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not connected",
        },
        { status: 500 },
      )
    }

    const { userId, amount, adminId, note } = await request.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user ID or amount",
        },
        { status: 400 },
      )
    }

    // Get user's current balance
    const userResult = await sql`
      SELECT id, full_name, email, mobile, balance
      FROM honeydrew_users
      WHERE id = ${userId} AND is_active = true
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
    const currentBalance = Number(user.balance) || 0
    const newBalance = currentBalance + Number(amount)

    // Update user balance
    await sql`
      UPDATE honeydrew_users
      SET balance = ${newBalance}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `

    // Create transaction record
    const transactionResult = await sql`
      INSERT INTO user_transactions (
        sender_id,
        receiver_id,
        amount,
        transaction_type,
        status,
        description,
        metadata
      )
      VALUES (
        'admin',
        ${userId},
        ${amount},
        'admin_credit',
        'completed',
        ${note || "Admin added funds"},
        ${JSON.stringify({
          adminId: adminId || "admin",
          previousBalance: currentBalance,
          newBalance: newBalance,
          timestamp: new Date().toISOString(),
        })}::jsonb
      )
      RETURNING *
    `

    // Create admin log
    await sql`
      INSERT INTO admin_logs (
        admin_id,
        action_type,
        resource_type,
        resource_id,
        details,
        severity,
        created_at
      )
      VALUES (
        ${adminId || "admin"},
        'add_money',
        'user',
        ${userId},
        ${JSON.stringify({
          userId,
          amount,
          previousBalance: currentBalance,
          newBalance: newBalance,
          note: note || "Admin added funds",
        })}::jsonb,
        'medium',
        NOW()
      )
    `

    return NextResponse.json({
      success: true,
      message: `Successfully added ${amount} to ${user.full_name}`,
      transaction: transactionResult[0],
      previousBalance: currentBalance,
      newBalance: newBalance,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        mobile: user.mobile,
      },
    })
  } catch (error) {
    console.error("[v0] Admin add money error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add money",
      },
      { status: 500 },
    )
  }
}
