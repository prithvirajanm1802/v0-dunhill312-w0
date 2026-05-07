import { NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"

export async function POST(req: Request) {
  try {
    const { userId, amount, adminId, note, source } = await req.json()

    if (!userId || !amount) {
      return NextResponse.json({ success: false, message: "userId and amount are required" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ success: false, message: "Amount must be greater than 0" }, { status: 400 })
    }

    const sql = getNeon()
    if (!sql) {
      return NextResponse.json({ success: false, message: "Database not configured" }, { status: 500 })
    }

    // Get user
    const userResult = await sql`
      SELECT id, full_name, balance FROM honeydrew_users WHERE id = ${userId}
    `
    if (!userResult.length) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }
    const user = userResult[0]

    const previousBalance = Number(user.balance)
    const newBalance = previousBalance + amount

    // Update balance
    await sql`
      UPDATE honeydrew_users SET balance = ${newBalance}, updated_at = NOW() WHERE id = ${userId}
    `

    // Create transaction
    const tx = await sql`
      INSERT INTO user_transactions (
        user_id, transaction_type, amount, balance_before, balance_after,
        status, payment_method, category, metadata, completed_at
      )
      VALUES (
        ${userId}, 'deposit', ${amount}, ${previousBalance}, ${newBalance},
        'completed', ${source || "admin"}, 'deposit',
        ${JSON.stringify({ note, adminId, source: source || "admin_deposit" })}::jsonb, NOW()
      )
      RETURNING id, created_at
    `

    // Log admin action
    await sql`
      INSERT INTO admin_logs (admin_id, action_type, resource_type, resource_id, details, created_at)
      VALUES (
        ${adminId || null},
        'admin_deposit',
        'user',
        ${userId}::uuid,
        ${JSON.stringify({ amount, note, previousBalance, newBalance, userName: user.full_name })}::jsonb,
        NOW()
      )
    `

    return NextResponse.json({
      success: true,
      transactionId: tx[0].id,
      user: {
        id: userId,
        name: user.full_name,
        previousBalance,
        newBalance,
      },
      amount,
      timestamp: tx[0].created_at,
    })
  } catch (error: any) {
    console.error("[v0] Deposit error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
