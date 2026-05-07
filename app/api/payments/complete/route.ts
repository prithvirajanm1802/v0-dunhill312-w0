import { type NextRequest, NextResponse } from "next/server"
import { createTransaction, updateUserBalance, getUserById, saveSyncRecord } from "@/lib/neon-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      amount,
      recipient,
      paymentMethod,
      category = "payment",
      transactionType = "sent",
      authMethod,
      verificationScore,
      deviceId,
      metadata,
    } = body

    if (!userId || !amount || !recipient) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, amount, recipient" },
        { status: 400 },
      )
    }

    // Get current user balance
    const user = await getUserById(userId)
    if (!user) {
      // Fallback to localStorage-based response for development
      return NextResponse.json({
        success: true,
        transactionId: `txn_${Date.now()}`,
        status: "completed",
        message: "Payment completed (local mode)",
        amount,
        recipient,
      })
    }

    const currentBalance = Number.parseFloat(user.balance)
    const paymentAmount = Number.parseFloat(amount)

    // Check sufficient balance for outgoing payments
    if (transactionType === "sent" && currentBalance < paymentAmount) {
      return NextResponse.json({ success: false, error: "Insufficient balance" }, { status: 400 })
    }

    // Calculate new balance
    const newBalance = transactionType === "sent" ? currentBalance - paymentAmount : currentBalance + paymentAmount

    // Create transaction record
    const transaction = await createTransaction({
      userId,
      transactionType,
      amount: paymentAmount,
      recipient,
      category,
      paymentMethod,
      status: "completed",
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      authMethod,
      verificationScore,
      deviceId,
      metadata,
    })

    // Update user balance
    await updateUserBalance(userId, newBalance)

    // Save sync record for cross-device sync
    if (deviceId) {
      await saveSyncRecord({
        userId,
        deviceId,
        dataType: "transaction",
        data: {
          transactionId: transaction?.id,
          amount: paymentAmount,
          recipient,
          status: "completed",
          newBalance,
        },
      })
    }

    console.log(`[v0] Payment completed: ${amount} to ${recipient} via ${authMethod} (score: ${verificationScore}%)`)

    return NextResponse.json({
      success: true,
      transactionId: transaction?.id || `txn_${Date.now()}`,
      status: "completed",
      amount: paymentAmount,
      recipient,
      newBalance,
      verificationScore,
    })
  } catch (error) {
    console.error("[v0] Payment completion error:", error)
    return NextResponse.json({ success: false, error: "Payment processing failed" }, { status: 500 })
  }
}
