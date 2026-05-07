import { NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  try {
    const sql = getNeon()

    if (!sql) {
      return NextResponse.json({ success: false, message: "Database not configured" }, { status: 500 })
    }

    const transactions = await sql`
      SELECT id, user_id, recipient, transaction_type, amount, balance_before, balance_after,
             status, auth_method, payment_method, category, metadata, created_at, completed_at
      FROM user_transactions
      WHERE user_id = ${params.userId}
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      success: true,
      transactions,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching transactions:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
