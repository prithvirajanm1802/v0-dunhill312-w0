import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    // Fetch transaction history from Neon DB
    const transactions = await sql`
      SELECT 
        id, 
        transaction_type, 
        amount, 
        balance_before, 
        balance_after,
        recipient_id,
        recipient_mobile,
        description,
        status,
        metadata,
        created_at
      FROM user_transactions 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `([userId])

    return NextResponse.json({
      success: true,
      transactions: transactions.map((t: any) => ({
        id: t.id,
        type: t.transaction_type,
        amount: Number.parseFloat(t.amount),
        balanceBefore: Number.parseFloat(t.balance_before),
        balanceAfter: Number.parseFloat(t.balance_after),
        recipient: t.recipient_mobile || t.description,
        description: t.description,
        status: t.status,
        metadata: t.metadata,
        timestamp: t.created_at,
      })),
    })
  } catch (error) {
    console.error("[v0] Transaction history error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch transactions" }, { status: 500 })
  }
}
