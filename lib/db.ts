// Unified database service using localStorage only
// This is the single source of truth for all database operations

export interface User {
  id: string
  fullName: string
  mobile: string
  username: string
  password: string
  balance: number
  createdAt: string
}

export interface Transaction {
  id: string
  type: "sent" | "received" | "recharge" | "bill"
  amount: string
  recipient: string
  date: string
  category: "transfer" | "bill" | "income"
  userId: string
  balanceBefore?: number
  balanceAfter?: number
  authMethod?: "fingerprint" | "face" | "admin"
}

export interface BiometricData {
  userId: string
  fingerprint: boolean
  face: boolean
  fingerprintData?: string
  faceData?: string
}

export interface QRCode {
  id: number
  name: string
  amount: string
  qrData: string
}

// Initialize database with demo data
export function initDatabase(): { success: boolean; message: string } {
  try {
    // Check if we already have data
    const users = getUsers()
    if (users.length === 0) {
      const adminUser: User = {
        id: "admin_user_1",
        fullName: "Demo Admin",
        mobile: "9999999999",
        username: "admin",
        password: "12345678",
        balance: 100000,
        createdAt: new Date().toISOString(),
      }
      const testUser: User = {
        id: "test_user_1",
        fullName: "Test User",
        mobile: "8888888888",
        username: "testuser",
        password: "password123",
        balance: 50000,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem("registeredUsers", JSON.stringify([adminUser, testUser]))
      console.log("[v0] Database initialized with demo users")
    }
    return { success: true, message: "Database initialized" }
  } catch (error) {
    console.error("[v0] Database initialization failed:", error)
    return { success: false, message: "Database initialization failed" }
  }
}

// User operations
export function getUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem("registeredUsers") || "[]")
  } catch (error) {
    console.error("[v0] Error getting users:", error)
    return []
  }
}

export function getUserById(id: string): User | null {
  try {
    const users = getUsers()
    return users.find((user) => user.id === id) || null
  } catch (error) {
    console.error("[v0] Error getting user by ID:", error)
    return null
  }
}

export function getUserByMobile(mobile: string): User | null {
  try {
    const users = getUsers()
    return users.find((user) => user.mobile === mobile) || null
  } catch (error) {
    console.error("[v0] Error getting user by mobile:", error)
    return null
  }
}

export function getUserByUsername(username: string): User | null {
  try {
    const users = getUsers()
    return users.find((user) => user.username === username) || null
  } catch (error) {
    console.error("[v0] Error getting user by username:", error)
    return null
  }
}

export function createUser(user: Omit<User, "id" | "createdAt">): User {
  try {
    const newUser: User = {
      ...user,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    const users = getUsers()
    users.push(newUser)
    localStorage.setItem("registeredUsers", JSON.stringify(users))
    console.log("[v0] User created:", newUser.id)
    return newUser
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    throw error
  }
}

export function updateUser(user: User): User {
  try {
    const users = getUsers()
    const index = users.findIndex((u) => u.id === user.id)
    if (index !== -1) {
      users[index] = user
      localStorage.setItem("registeredUsers", JSON.stringify(users))
      console.log("[v0] User updated:", user.id)
    }
    return user
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    throw error
  }
}

// Transaction operations
export function getTransactions(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem("transactions") || "[]")
  } catch (error) {
    console.error("[v0] Error getting transactions:", error)
    return []
  }
}

export function getTransactionsByUserId(userId: string): Transaction[] {
  try {
    const transactions = getTransactions()
    return transactions.filter((t) => t.userId === userId)
  } catch (error) {
    console.error("[v0] Error getting user transactions:", error)
    return []
  }
}

export function createTransaction(transaction: Omit<Transaction, "id">): Transaction {
  try {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    // Update user balance
    const user = getUserById(transaction.userId)
    if (user) {
      const balanceBefore = user.balance
      let balanceAfter = balanceBefore

      if (["sent", "recharge", "bill"].includes(transaction.type)) {
        balanceAfter = balanceBefore - Number(transaction.amount)
      } else if (transaction.type === "received") {
        balanceAfter = balanceBefore + Number(transaction.amount)
      }

      newTransaction.balanceBefore = balanceBefore
      newTransaction.balanceAfter = balanceAfter

      user.balance = balanceAfter
      updateUser(user)
    }

    const transactions = getTransactions()
    transactions.unshift(newTransaction)
    localStorage.setItem("transactions", JSON.stringify(transactions))
    console.log("[v0] Transaction created:", newTransaction.id)
    return newTransaction
  } catch (error) {
    console.error("[v0] Error creating transaction:", error)
    throw error
  }
}

// Biometric operations
export function getBiometricData(): Record<string, BiometricData> {
  try {
    return JSON.parse(localStorage.getItem("biometricData") || "{}")
  } catch (error) {
    console.error("[v0] Error getting biometric data:", error)
    return {}
  }
}

export function getBiometricDataByUserId(userId: string): BiometricData | null {
  try {
    const data = getBiometricData()
    return data[userId] || null
  } catch (error) {
    console.error("[v0] Error getting biometric data by user:", error)
    return null
  }
}

export function saveBiometricData(data: BiometricData): void {
  try {
    const biometricData = getBiometricData()
    biometricData[data.userId] = data
    localStorage.setItem("biometricData", JSON.stringify(biometricData))
    console.log("[v0] Biometric data saved for user:", data.userId)
  } catch (error) {
    console.error("[v0] Error saving biometric data:", error)
    throw error
  }
}

// QR Code operations
export function getQRCodes(): QRCode[] {
  try {
    return JSON.parse(localStorage.getItem("qrCodes") || "[]")
  } catch (error) {
    console.error("[v0] Error getting QR codes:", error)
    return []
  }
}

export function createQRCode(qrCode: Omit<QRCode, "id">): QRCode {
  try {
    const qrCodes = getQRCodes()
    const newQRCode: QRCode = {
      ...qrCode,
      id: qrCodes.length + 1,
    }
    qrCodes.push(newQRCode)
    localStorage.setItem("qrCodes", JSON.stringify(qrCodes))
    return newQRCode
  } catch (error) {
    console.error("[v0] Error creating QR code:", error)
    throw error
  }
}

export function deleteQRCode(id: number): boolean {
  try {
    const qrCodes = getQRCodes()
    const filtered = qrCodes.filter((q) => q.id !== id)
    localStorage.setItem("qrCodes", JSON.stringify(filtered))
    return qrCodes.length !== filtered.length
  } catch (error) {
    console.error("[v0] Error deleting QR code:", error)
    return false
  }
}

// Initialize database on module load
if (typeof window !== "undefined") {
  initDatabase()
}

// Create dbService object as wrapper around all db functions for backward compatibility
export const dbService = {
  initDatabase,
  getUsers,
  getUserById,
  getUserByMobile,
  getUserByUsername,
  createUser,
  updateUser,
  getTransactions,
  getTransactionsByUserId,
  createTransaction,
  getBiometricData,
  getBiometricDataByUserId,
  saveBiometricData,
  getQRCodes,
  createQRCode,
  deleteQRCode,
}
