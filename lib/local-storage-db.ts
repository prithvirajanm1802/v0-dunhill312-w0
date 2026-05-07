// Local storage database service for Honeydrew Mills
// This replaces all previous database implementations with a simple localStorage solution

// Types
export interface User {
  id: string
  fullName: string
  mobile: string
  username: string
  password: string
  balance: number
  createdAt: Date
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

// Simple encryption/decryption for sensitive data
const encrypt = (text: string): string => {
  // Simple encryption for demo purposes
  return btoa(text)
}

const decrypt = (text: string): string => {
  // Simple decryption for demo purposes
  return atob(text)
}

// Database service
export const dbService = {
  // User methods
  getUsers: (): User[] => {
    try {
      return JSON.parse(localStorage.getItem("registeredUsers") || "[]")
    } catch (error) {
      console.error("Error fetching users:", error)
      return []
    }
  },

  getUserById: (id: string): User | null => {
    try {
      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      return users.find((user: User) => user.id === id) || null
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error)
      return null
    }
  },

  getUserByMobile: (mobile: string): User | null => {
    try {
      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      return users.find((user: User) => user.mobile === mobile) || null
    } catch (error) {
      console.error(`Error fetching user with mobile ${mobile}:`, error)
      return null
    }
  },

  createUser: (user: Omit<User, "id" | "createdAt">): User => {
    try {
      const newUser = {
        ...user,
        id: `user_${Date.now()}`,
        createdAt: new Date(),
      }
      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      localStorage.setItem("registeredUsers", JSON.stringify([...users, newUser]))
      return newUser
    } catch (error) {
      console.error("Error creating user:", error)
      throw new Error("Failed to create user")
    }
  },

  updateUser: (user: User): User => {
    try {
      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      const updatedUsers = users.map((u: User) => (u.id === user.id ? user : u))
      localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))
      return user
    } catch (error) {
      console.error(`Error updating user ${user.id}:`, error)
      throw new Error("Failed to update user")
    }
  },

  deleteUser: (id: string): boolean => {
    try {
      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      const updatedUsers = users.filter((user: User) => user.id !== id)
      localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))
      return users.length !== updatedUsers.length
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error)
      return false
    }
  },

  // Transaction methods
  getTransactions: (): Transaction[] => {
    try {
      return JSON.parse(localStorage.getItem("transactions") || "[]")
    } catch (error) {
      console.error("Error fetching transactions:", error)
      return []
    }
  },

  getTransactionsByUserId: (userId: string): Transaction[] => {
    try {
      const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
      return transactions.filter((transaction: Transaction) => transaction.userId === userId)
    } catch (error) {
      console.error(`Error fetching transactions for user ${userId}:`, error)
      return []
    }
  },

  // Enhanced biometric verification for payments
  verifyBiometricForPayment: (userId: string, fingerprintData: string): boolean => {
    try {
      // In browser preview mode, simulate verification
      const biometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")
      const userData = biometricData[userId]

      if (!userData || !userData.fingerprint) {
        return false
      }

      // Simulate matching process with 90% success rate for demo
      return Math.random() < 0.9
    } catch (error) {
      console.error(`Error verifying biometric for payment (user ${userId}):`, error)
      return false
    }
  },

  // Add a method to check if a transaction is secure
  isTransactionSecure: (userId: string, amount: number): boolean => {
    try {
      // Check if the user has biometric data registered
      const biometricData = dbService.getBiometricDataByUserId(userId)
      if (!biometricData || !biometricData.fingerprint) {
        return false
      }

      // Check if the amount is within safe limits
      const user = dbService.getUserById(userId)
      if (!user) return false

      // Ensure the user has sufficient balance with a 10% buffer
      return user.balance >= amount * 1.1
    } catch (error) {
      console.error(`Error checking transaction security for user ${userId}:`, error)
      return false
    }
  },

  // Enhanced transaction creation with biometric verification
  createSecureTransaction: (transaction: Omit<Transaction, "id">, biometricVerified: boolean): Transaction | null => {
    try {
      // Only proceed if biometric is verified for security
      if (!biometricVerified) {
        throw new Error("Biometric verification required for secure transactions")
      }

      // Create the transaction with additional security logging
      return dbService.createTransaction({
        ...transaction,
        // Add verification metadata
        authMethod: "fingerprint",
      })
    } catch (error) {
      console.error("Error creating secure transaction:", error)
      return null
    }
  },

  createTransaction: (transaction: Omit<Transaction, "id">): Transaction => {
    try {
      const newTransaction = {
        ...transaction,
        id: `transaction_${Date.now()}`,
      }
      const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
      localStorage.setItem("transactions", JSON.stringify([newTransaction, ...transactions]))

      // Update user balance
      if (transaction.type === "sent" || transaction.type === "recharge" || transaction.type === "bill") {
        const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
        const user = users.find((u: User) => u.id === transaction.userId)
        if (user) {
          const balanceBefore = user.balance
          user.balance -= Number(transaction.amount)
          localStorage.setItem("registeredUsers", JSON.stringify(users.map((u: User) => (u.id === user.id ? user : u))))

          // Update transaction with balance info
          newTransaction.balanceBefore = balanceBefore
          newTransaction.balanceAfter = user.balance

          // Update in localStorage
          const updatedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
          const transactionIndex = updatedTransactions.findIndex((t: Transaction) => t.id === newTransaction.id)
          if (transactionIndex !== -1) {
            updatedTransactions[transactionIndex] = newTransaction
            localStorage.setItem("transactions", JSON.stringify(updatedTransactions))
          }
        }
      } else if (transaction.type === "received") {
        const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
        const user = users.find((u: User) => u.id === transaction.userId)
        if (user) {
          const balanceBefore = user.balance
          user.balance += Number(transaction.amount)
          localStorage.setItem("registeredUsers", JSON.stringify(users.map((u: User) => (u.id === user.id ? user : u))))

          // Update transaction with balance info
          newTransaction.balanceBefore = balanceBefore
          newTransaction.balanceAfter = user.balance

          // Update in localStorage
          const updatedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]")
          const transactionIndex = updatedTransactions.findIndex((t: Transaction) => t.id === newTransaction.id)
          if (transactionIndex !== -1) {
            updatedTransactions[transactionIndex] = newTransaction
            localStorage.setItem("transactions", JSON.stringify(updatedTransactions))
          }
        }
      }

      return newTransaction
    } catch (error) {
      console.error("Error creating transaction:", error)
      throw new Error("Failed to create transaction")
    }
  },

  // Biometric methods
  getBiometricData: (): Record<string, BiometricData> => {
    try {
      return JSON.parse(localStorage.getItem("biometricData") || "{}")
    } catch (error) {
      console.error("Error fetching biometric data:", error)
      return {}
    }
  },

  getBiometricDataByUserId: (userId: string): BiometricData | null => {
    try {
      const biometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")
      return biometricData[userId] || null
    } catch (error) {
      console.error(`Error fetching biometric data for user ${userId}:`, error)
      return null
    }
  },

  saveBiometricData: (data: BiometricData): void => {
    try {
      const biometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")

      // Encrypt sensitive data if provided
      if (data.fingerprintData) {
        data.fingerprintData = encrypt(data.fingerprintData)
      }

      if (data.faceData) {
        data.faceData = encrypt(data.faceData)
      }

      biometricData[data.userId] = data
      localStorage.setItem("biometricData", JSON.stringify(biometricData))
    } catch (error) {
      console.error(`Error saving biometric data for user ${data.userId}:`, error)
      throw new Error("Failed to save biometric data")
    }
  },

  // QR Code methods
  getQRCodes: (): QRCode[] => {
    try {
      return JSON.parse(localStorage.getItem("qrCodes") || "[]")
    } catch (error) {
      console.error("Error fetching QR codes:", error)
      return []
    }
  },

  createQRCode: (qrCode: Omit<QRCode, "id">): QRCode => {
    try {
      const qrCodes = JSON.parse(localStorage.getItem("qrCodes") || "[]")
      const newQRCode = {
        ...qrCode,
        id: qrCodes.length + 1,
      }
      localStorage.setItem("qrCodes", JSON.stringify([...qrCodes, newQRCode]))
      return newQRCode
    } catch (error) {
      console.error("Error creating QR code:", error)
      throw new Error("Failed to create QR code")
    }
  },

  deleteQRCode: (id: number): boolean => {
    try {
      const qrCodes = JSON.parse(localStorage.getItem("qrCodes") || "[]")
      const updatedQRCodes = qrCodes.filter((qrCode: QRCode) => qrCode.id !== id)
      localStorage.setItem("qrCodes", JSON.stringify(updatedQRCodes))
      return qrCodes.length !== updatedQRCodes.length
    } catch (error) {
      console.error(`Error deleting QR code ${id}:`, error)
      return false
    }
  },

  // Database initialization - just sets up initial data in localStorage
  initDatabase: (): { success: boolean; message: string } => {
    try {
      // Check if we already have data
      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")

      // If no users exist, create a demo admin user
      if (users.length === 0) {
        const adminUser = {
          id: "admin_user",
          fullName: "Admin User",
          mobile: "8147282072",
          username: "admin",
          password: "12345678",
          balance: 100000,
          createdAt: new Date(),
        }

        localStorage.setItem("registeredUsers", JSON.stringify([adminUser]))
        console.log("Created demo admin user")
      }

      return { success: true, message: "Local storage database initialized" }
    } catch (error) {
      console.error("Database initialization failed:", error)
      return { success: false, message: `Database initialization failed: ${error}` }
    }
  },
}

// Initialize database on module load if in browser
if (typeof window !== "undefined") {
  dbService.initDatabase()
}

export * from "./db"
