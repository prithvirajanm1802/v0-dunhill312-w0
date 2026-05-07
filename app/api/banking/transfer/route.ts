import { NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"

export async function POST(req: Request) {
  try {
    const { senderId, recipientId, amount, authMethod, note, verificationScore } = await req.json()

    if (!senderId || !recipientId || !amount) {
      return NextResponse.json(
        { success: false, message: "senderId, recipientId, and amount are required" },
        { status: 400 },
      )
    }

    if (amount <= 0) {
      return NextResponse.json({ success: false, message: "Amount must be greater than 0" }, { status: 400 })
    }

    if (senderId === recipientId) {
      return NextResponse.json({ success: false, message: "Cannot transfer to yourself" }, { status: 400 })
    }

    const sql = getNeon()
    if (!sql) {
      return NextResponse.json({ success: false, message: "Database not configured" }, { status: 500 })
    }

    // Get sender
    const senderResult = await sql`
      SELECT id, full_name, balance FROM honeydrew_users WHERE id = ${senderId}::uuid
    `
    if (!senderResult.length) {
      return NextResponse.json({ success: false, message: "Sender not found" }, { status: 404 })
    }
    const sender = senderResult[0]

    // Check balance
    if (Number(sender.balance) < amount) {
      return NextResponse.json(
        { success: false, message: "Insufficient balance", currentBalance: Number(sender.balance) },
        { status: 400 },
      )
    }

    // Get recipient
    const recipientResult = await sql`
      SELECT id, full_name, balance FROM honeydrew_users WHERE id = ${recipientId}::uuid
    `
    if (!recipientResult.length) {
      return NextResponse.json({ success: false, message: "Recipient not found" }, { status: 404 })
    }
    const recipient = recipientResult[0]

    // Calculate new balances
    const senderNewBalance = Number(sender.balance) - amount
    const recipientNewBalance = Number(recipient.balance) + amount

    // Update sender balance
    await sql`
      UPDATE honeydrew_users SET balance = ${senderNewBalance}, updated_at = NOW() WHERE id = ${senderId}::uuid
    `

    // Update recipient balance
    await sql`
      UPDATE honeydrew_users SET balance = ${recipientNewBalance}, updated_at = NOW() WHERE id = ${recipientId}::uuid
    `

    const senderTx = await sql`
      INSERT INTO user_transactions (
        user_id, recipient, transaction_type, amount, balance_before, balance_after,
        status, auth_method, verification_score, payment_method, category, metadata, completed_at
      )
      VALUES (
        ${senderId}::uuid, ${recipientId}::uuid, 'sent', ${amount},
        ${sender.balance}, ${senderNewBalance}, 'completed', ${authMethod || "biometric"},
        ${verificationScore || null}, 'qr_transfer', 'transfer',
        ${JSON.stringify({ note, recipientName: recipient.full_name, transferType: "qr_payment" })}::jsonb, NOW()
      )
      RETURNING id, amount, status, created_at
    `

    await sql`
      INSERT INTO user_transactions (
        user_id, recipient, transaction_type, amount, balance_before, balance_after,
        status, payment_method, category, metadata, completed_at
      )
      VALUES (
        ${recipientId}::uuid, ${senderId}::uuid, 'received', ${amount},
        ${recipient.balance}, ${recipientNewBalance}, 'completed', 'qr_transfer', 'transfer',
        ${JSON.stringify({ note, senderName: sender.full_name, transferType: "qr_payment" })}::jsonb, NOW()
      )
    `

    await sql`
      INSERT INTO admin_logs (action_type, resource_type, resource_id, details, created_at)
      VALUES (
        'qr_money_transfer',
        'transaction',
        ${senderTx[0].id},
        ${JSON.stringify({
          senderId,
          senderName: sender.full_name,
          senderPreviousBalance: Number(sender.balance),
          senderNewBalance,
          recipientId,
          recipientName: recipient.full_name,
          recipientPreviousBalance: Number(recipient.balance),
          recipientNewBalance,
          amount,
          note,
          authMethod,
          verificationScore,
          transferTime: new Date().toISOString(),
        })}::jsonb,
        NOW()
      )
    `.catch(() => {})

    return NextResponse.json({
      success: true,
      transactionId: senderTx[0].id,
      sender: {
        id: senderId,
        name: sender.full_name,
        previousBalance: Number(sender.balance),
        newBalance: senderNewBalance,
      },
      recipient: {
        id: recipientId,
        name: recipient.full_name,
        previousBalance: Number(recipient.balance),
        newBalance: recipientNewBalance,
      },
      amount,
      timestamp: senderTx[0].created_at,
    })
  } catch (error: any) {
    console.error("[v0] Transfer error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
