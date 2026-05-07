import { type NextRequest, NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"

export async function POST(request: NextRequest) {
  try {
    const { requestId, senderId, receiverId, amount } = await request.json()

    if (!requestId || !senderId || !receiverId || !amount) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    const sql = getNeon()
    if (!sql) {
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 500 })
    }

    // Get sender
    const senderResult = await sql`
      SELECT id, full_name, balance FROM honeydrew_users WHERE id = ${senderId}::uuid
    `

    if (!senderResult || senderResult.length === 0) {
      return NextResponse.json({ success: false, error: "Sender not found" }, { status: 404 })
    }

    const sender = senderResult[0]

    // Check balance
    if (Number(sender.balance) < amount) {
      return NextResponse.json({ success: false, error: "Insufficient balance" }, { status: 400 })
    }

    // Get receiver
    const receiverResult = await sql`
      SELECT id, full_name, balance FROM honeydrew_users WHERE id = ${receiverId}::uuid
    `

    if (!receiverResult || receiverResult.length === 0) {
      return NextResponse.json({ success: false, error: "Receiver not found" }, { status: 404 })
    }

    const receiver = receiverResult[0]

    // Calculate new balances
    const senderNewBalance = Number(sender.balance) - amount
    const receiverNewBalance = Number(receiver.balance) + amount

    // Update sender balance
    await sql`
      UPDATE honeydrew_users SET balance = ${senderNewBalance}, updated_at = NOW()
      WHERE id = ${senderId}::uuid
    `

    // Update receiver balance
    await sql`
      UPDATE honeydrew_users SET balance = ${receiverNewBalance}, updated_at = NOW()
      WHERE id = ${receiverId}::uuid
    `

    // Create sender transaction
    await sql`
      INSERT INTO user_transactions (
        user_id, sender_id, receiver_id, transaction_type, amount,
        balance_before, balance_after, status, payment_method, category, metadata, completed_at
      ) VALUES (
        ${senderId}::uuid, ${senderId}::uuid, ${receiverId}::uuid, 'sent', ${amount},
        ${sender.balance}, ${senderNewBalance}, 'completed', 'internal', 'p2p_transfer',
        ${JSON.stringify({ receiverName: receiver.full_name, requestId })}::jsonb, NOW()
      )
    `

    // Create receiver transaction
    await sql`
      INSERT INTO user_transactions (
        user_id, sender_id, receiver_id, transaction_type, amount,
        balance_before, balance_after, status, payment_method, category, metadata, completed_at
      ) VALUES (
        ${receiverId}::uuid, ${senderId}::uuid, ${receiverId}::uuid, 'received', ${amount},
        ${receiver.balance}, ${receiverNewBalance}, 'completed', 'internal', 'p2p_transfer',
        ${JSON.stringify({ senderName: sender.full_name, requestId })}::jsonb, NOW()
      )
    `

    // Update P2P request status
    await sql`
      UPDATE p2p_requests
      SET status = 'completed', completed_at = NOW()
      WHERE request_id = ${requestId}
    `

    // Log transfer
    await sql`
      INSERT INTO admin_logs (admin_id, action_type, resource_type, resource_id, severity, details)
      VALUES (
        ${senderId},
        'p2p_transfer_completed',
        'transaction',
        ${requestId},
        'medium',
        ${JSON.stringify({
          senderName: sender.full_name,
          receiverName: receiver.full_name,
          amount,
          senderNewBalance,
          receiverNewBalance,
        })}::jsonb
      )
    `

    return NextResponse.json({
      success: true,
      senderNewBalance,
      receiverNewBalance,
      message: "Transfer completed successfully",
    })
  } catch (error: any) {
    console.error("[v0] P2P execute error:", error)
    return NextResponse.json({ success: false, error: error.message || "Transfer failed" }, { status: 500 })
  }
}
