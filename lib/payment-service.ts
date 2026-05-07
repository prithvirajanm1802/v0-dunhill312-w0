// Payment service for cross-device payment integration
import { createTransaction, updateUserBalance, getUserById, getUserTransactions, saveSyncRecord } from "./neon-db"

export interface PaymentRequest {
  userId: string
  amount: number
  recipient: string
  category: string
  paymentMethod?: string
  authMethod: "face" | "fingerprint" | "passkey"
  verificationScore?: number
  deviceId?: string
  metadata?: Record<string, any>
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  newBalance?: number
  previousBalance?: number
  error?: string
  timestamp?: string
}

// Process payment for signed-in users across all devices
export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
  const timestamp = new Date().toISOString()

  try {
    // Get user from database
    const user = await getUserById(request.userId)

    if (!user) {
      // Fallback to localStorage if database not available
      return processLocalPayment(request)
    }

    const currentBalance = Number.parseFloat(user.balance)

    // Check sufficient balance
    if (currentBalance < request.amount) {
      return {
        success: false,
        error: "Insufficient balance",
      }
    }

    const newBalance = currentBalance - request.amount

    // Create transaction record
    const transaction = await createTransaction({
      userId: request.userId,
      transactionType: "sent",
      amount: request.amount,
      recipient: request.recipient,
      category: request.category,
      paymentMethod: request.paymentMethod || "wallet",
      status: "completed",
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      authMethod: request.authMethod,
      verificationScore: request.verificationScore,
      deviceId: request.deviceId,
      metadata: request.metadata,
    })

    // Update user balance
    await updateUserBalance(request.userId, newBalance)

    // Create sync record for cross-device sync
    if (request.deviceId) {
      await saveSyncRecord({
        userId: request.userId,
        deviceId: request.deviceId,
        dataType: "transaction",
        data: {
          transactionId: transaction?.id,
          amount: request.amount,
          recipient: request.recipient,
          newBalance,
          timestamp,
        },
      })
    }

    return {
      success: true,
      transactionId: transaction?.id?.toString() || `TXN${Date.now()}`,
      newBalance,
      previousBalance: currentBalance,
      timestamp,
    }
  } catch (error) {
    console.error("[v0] Payment processing error:", error)
    return processLocalPayment(request)
  }
}

// Fallback to localStorage payment processing
function processLocalPayment(request: PaymentRequest): PaymentResult {
  const timestamp = new Date().toISOString()

  try {
    const userStr = localStorage.getItem("currentUser")
    if (!userStr) {
      return { success: false, error: "User not logged in" }
    }

    const user = JSON.parse(userStr)
    const currentBalance = user.balance || 10000

    if (currentBalance < request.amount) {
      return { success: false, error: "Insufficient balance" }
    }

    const newBalance = currentBalance - request.amount
    user.balance = newBalance

    // Save updated user
    localStorage.setItem("currentUser", JSON.stringify(user))

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}`

    // Save transaction to local storage
    const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
    const transaction = {
      id: transactionId,
      userId: request.userId,
      type: "sent",
      amount: request.amount,
      recipient: request.recipient,
      category: request.category,
      authMethod: request.authMethod,
      verificationScore: request.verificationScore,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      date: timestamp,
      status: "completed",
      metadata: request.metadata,
    }
    transactions.unshift(transaction)
    localStorage.setItem("transactions", JSON.stringify(transactions))

    // Update users list
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const userIndex = users.findIndex((u: any) => u.id === user.id)
    if (userIndex !== -1) {
      users[userIndex].balance = newBalance
      localStorage.setItem("users", JSON.stringify(users))
    }

    return {
      success: true,
      transactionId,
      newBalance,
      previousBalance: currentBalance,
      timestamp,
    }
  } catch (error) {
    console.error("[v0] Local payment error:", error)
    return { success: false, error: "Payment processing failed" }
  }
}

// Get user balance (from DB or localStorage)
export async function getUserBalance(userId: string): Promise<number> {
  try {
    const user = await getUserById(userId)
    if (user) {
      return Number.parseFloat(user.balance)
    }
  } catch (error) {
    console.error("[v0] Error getting user balance from DB:", error)
  }

  // Fallback to localStorage
  const userStr = localStorage.getItem("currentUser")
  if (userStr) {
    const user = JSON.parse(userStr)
    return user.balance || 10000
  }

  return 10000 // Default balance
}

// Get transaction history (from DB or localStorage)
export async function getTransactionHistory(userId: string, limit = 50): Promise<any[]> {
  try {
    const transactions = await getUserTransactions(userId, limit)
    if (transactions && transactions.length > 0) {
      return transactions.map((t) => ({
        id: t.id,
        type: t.transaction_type,
        amount: Number.parseFloat(t.amount as any),
        recipient: t.recipient,
        category: t.category,
        authMethod: t.auth_method,
        verificationScore: t.verification_score,
        balanceBefore: t.balance_before ? Number.parseFloat(t.balance_before as any) : null,
        balanceAfter: t.balance_after ? Number.parseFloat(t.balance_after as any) : null,
        date: t.created_at,
        status: t.status,
        metadata: t.metadata,
      }))
    }
  } catch (error) {
    console.error("[v0] Error getting transactions from DB:", error)
  }

  // Fallback to localStorage
  const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
  return transactions.filter((t: any) => t.userId === userId).slice(0, limit)
}

// Sync user data across devices
export async function syncUserData(
  userId: string,
  deviceId: string,
): Promise<{
  balance: number
  transactions: any[]
}> {
  const balance = await getUserBalance(userId)
  const transactions = await getTransactionHistory(userId)

  return { balance, transactions }
}
