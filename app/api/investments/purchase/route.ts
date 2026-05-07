import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const { userId, amount, investmentType, currentPrice } = await request.json()

    if (!userId || !amount || !investmentType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Get current user balance
    const userResult = await sql`
      SELECT id, balance FROM honeydrew_users WHERE id = $1
    `([userId])

    if (!userResult.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const user = userResult[0]
    const previousBalance = user.balance

    // Check if balance is sufficient
    if (previousBalance < amount) {
      return NextResponse.json(
        { success: false, error: "Insufficient balance", availableBalance: previousBalance },
        { status: 400 },
      )
    }

    // Calculate new balance
    const newBalance = previousBalance - amount

    // Update user balance in database
    await sql`
      UPDATE honeydrew_users 
      SET balance = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `([newBalance, userId])

    // Create transaction record
    const transactionId = `TXN${Date.now()}`
    await sql`
      INSERT INTO user_transactions 
      (user_id, transaction_type, amount, balance_before, balance_after, description, payment_method, status, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `([
      userId,
      "investment",
      amount,
      previousBalance,
      newBalance,
      `${investmentType} Investment Purchase`,
      "wallet",
      "completed",
      JSON.stringify({
        investmentType,
        currentPrice,
        quantity: amount / (currentPrice || 1),
        timestamp: new Date().toISOString(),
      }),
    ])

    // Log admin event
    await sql`
      INSERT INTO admin_logs 
      (admin_id, action_type, target_user_id, amount, description, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
    `([
      "system",
      "investment_purchase",
      userId,
      amount,
      `${investmentType} investment purchased for ₹${amount}`,
      JSON.stringify({ investmentType, currentPrice, transactionId }),
    ])

    return NextResponse.json({
      success: true,
      transactionId,
      newBalance,
      previousBalance,
      amountDeducted: amount,
      investmentType,
    })
  } catch (error) {
    console.error("[v0] Investment purchase error:", error)
    return NextResponse.json({ success: false, error: "Failed to process investment" }, { status: 500 })
  }
}
