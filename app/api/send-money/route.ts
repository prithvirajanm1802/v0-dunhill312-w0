import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const { userId, recipientMobile, amount } = await request.json()

    if (!userId || !recipientMobile || !amount) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Get sender's current balance
    const senderResult = await sql`
      SELECT id, balance, full_name FROM honeydrew_users WHERE id = $1
    `([userId])

    if (!senderResult.length) {
      return NextResponse.json({ success: false, error: "Sender not found" }, { status: 404 })
    }

    const sender = senderResult[0]
    const previousBalance = sender.balance

    if (previousBalance < amount) {
      return NextResponse.json({ success: false, error: "Insufficient balance" }, { status: 400 })
    }

    // Get recipient by mobile number
    const recipientResult = await sql`
      SELECT id, balance FROM honeydrew_users WHERE mobile = $1
    `([recipientMobile])

    if (!recipientResult.length) {
      return NextResponse.json({ success: false, error: "Recipient not found" }, { status: 404 })
    }

    const recipient = recipientResult[0]

    // Deduct from sender
    const newSenderBalance = previousBalance - amount
    await sql`
      UPDATE honeydrew_users SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
    `([newSenderBalance, userId])

    // Add to recipient
    const newRecipientBalance = recipient.balance + amount
    await sql`
      UPDATE honeydrew_users SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
    `([newRecipientBalance, recipient.id])

    // Create transaction records
    const transactionId = `TXN${Date.now()}`

    await sql`
      INSERT INTO user_transactions 
      (user_id, transaction_type, amount, balance_before, balance_after, recipient_id, recipient_mobile, description, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `([
      userId,
      "send_money",
      amount,
      previousBalance,
      newSenderBalance,
      recipient.id,
      recipientMobile,
      `Money sent to ${recipientMobile}`,
      "completed",
    ])

    await sql`
      INSERT INTO user_transactions 
      (user_id, transaction_type, amount, balance_before, balance_after, recipient_id, description, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `([
      recipient.id,
      "receive_money",
      amount,
      recipient.balance,
      newRecipientBalance,
      userId,
      `Money received from ${sender.full_name}`,
      "completed",
    ])

    return NextResponse.json({
      success: true,
      transactionId,
      newBalance: newSenderBalance,
      previousBalance,
      recipient: recipientMobile,
      amount,
    })
  } catch (error) {
    console.error("[v0] Send money error:", error)
    return NextResponse.json({ success: false, error: "Failed to process transfer" }, { status: 500 })
  }
}
