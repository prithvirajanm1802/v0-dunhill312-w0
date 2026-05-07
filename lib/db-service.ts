import { prisma } from "./prisma"

// User types
export interface User {
  id: string
  fullName: string
  mobile: string
  username: string
  password: string
  balance: number
  createdAt: Date
}

// Transaction types
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

// Biometric data types
export interface BiometricData {
  userId: string
  fingerprint: boolean
  face: boolean
  fingerprintData?: string
  faceData?: string
}

// QR Code types
export interface QRCode {
  id: number
  name: string
  amount: string
  qrData: string
}

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Simple encryption/decryption for sensitive data
const encrypt = (text: string): string => {
  // Simple encryption for demo purposes
  return btoa(text)
}

const decrypt = (text: string): string => {
  // Simple decryption for demo purposes
  return atob(text)
}

// Database service with v0-supported options
export const dbService = {
  // User methods
  getUsers: async (): Promise<User[]> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      return JSON.parse(localStorage.getItem("registeredUsers") || "[]")
    }

    try {
      const users = await prisma.user.findMany()
      return users as unknown as User[]
    } catch (error) {
      console.error("Error fetching users:", error)
      return []
    }
  },

  getUserById: async (id: string): Promise<User | null> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      return users.find((user: User) => user.id === id) || null
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id },
      })
      return user as unknown as User | null
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error)
      return null
    }
  },

  getUserByMobile: async (mobile: string): Promise<User | null> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      return users.find((user: User) => user.mobile === mobile) || null
    }

    try {
      const user = await prisma.user.findUnique({
        where: { mobile },
      })
      return user as unknown as User | null
    } catch (error) {
      console.error(`Error fetching user with mobile ${mobile}:`, error)
      return null
    }
  },

  createUser: async (user: Omit<User, "id" | "createdAt">): Promise<User> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      const newUser = {
        ...user,
        id: `user_${Date.now()}`,
        createdAt: new Date(),
      }
      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      localStorage.setItem("registeredUsers", JSON.stringify([...users, newUser]))
      return newUser
    }

    try {
      const createdUser = await prisma.user.create({
        data: {
          fullName: user.fullName,
          mobile: user.mobile,
          username: user.username,
          password: user.password, // In production, this should be hashed
          balance: user.balance,
        },
      })
      return createdUser as unknown as User
    } catch (error) {
      console.error("Error creating user:", error)
      throw new Error("Failed to create user")
    }
  },

  updateUser: async (user: User): Promise<User> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      const updatedUsers = users.map((u: User) => (u.id === user.id ? user : u))
      localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))
      return user
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: user.fullName,
          mobile: user.mobile,
          username: user.username,
          password: user.password,
          balance: user.balance,
        },
      })
      return updatedUser as unknown as User
    } catch (error) {
      console.error(`Error updating user ${user.id}:`, error)
      throw new Error("Failed to update user")
    }
  },

  deleteUser: async (id: string): Promise<boolean> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
      const updatedUsers = users.filter((user: User) => user.id !== id)
      localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))
      return users.length !== updatedUsers.length
    }

    try {
      await prisma.user.delete({
        where: { id },
      })
      return true
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error)
      return false
    }
  },

  // Transaction methods
  getTransactions: async (): Promise<Transaction[]> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      return JSON.parse(localStorage.getItem("transactions") || "[]")
    }

    try {
      const transactions = await prisma.transaction.findMany({
        orderBy: { date: "desc" },
      })
      return transactions as unknown as Transaction[]
    } catch (error) {
      console.error("Error fetching transactions:", error)
      return []
    }
  },

  getTransactionsByUserId: async (userId: string): Promise<Transaction[]> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
      return transactions.filter((transaction: Transaction) => transaction.userId === userId)
    }

    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      })
      return transactions as unknown as Transaction[]
    } catch (error) {
      console.error(`Error fetching transactions for user ${userId}:`, error)
      return []
    }
  },

  // Enhanced biometric verification for payments
  verifyBiometricForPayment: async (userId: string, fingerprintData: string): Promise<boolean> => {
    try {
      // In browser preview mode, simulate verification
      const biometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")
      const userData = biometricData[userId]

      if (!userData || !userData.fingerprint) {
        return false
      }

      // Check if the fingerprint data matches the registered user
      // In a real app, we would compare the actual fingerprint data
      // For this demo, we'll simulate a match with 90% probability
      const isMatch = Math.random() < 0.9

      if (!isMatch) {
        console.log("Fingerprint verification failed: Biometric mismatch")
        return false
      }

      // Ensure the fingerprint scan is complete (100%)
      // In a real app, this would be handled by the fingerprint sensor
      const isComplete = fingerprintData.includes("_secure")

      if (!isComplete) {
        console.log("Fingerprint verification failed: Incomplete scan")
        return false
      }

      return true
    } catch (error) {
      console.error(`Error verifying biometric for payment (user ${userId}):`, error)
      return false
    }
  },

  // Function to verify face for payment
  verifyFaceForPayment: async (userId: string, faceData: string): Promise<boolean> => {
    try {
      // Get the stored biometric data for this user
      const biometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")
      const userData = biometricData[userId]

      if (!userData || !userData.face) {
        return false
      }

      // Check if the face data matches the registered user
      // In a real app, we would compare the actual face data
      // For this demo, we'll simulate a match with 90% probability
      const isMatch = Math.random() < 0.9

      if (!isMatch) {
        console.log("Face verification failed: Biometric mismatch")
        return false
      }

      return true
    } catch (error) {
      console.error(`Error verifying face for payment (user ${userId}):`, error)
      return false
    }
  },

  // Add a method to check if a transaction is secure
  isTransactionSecure: async (userId: string, amount: number): Promise<boolean> => {
    // Check if the user has biometric data registered
    const biometricData = await dbService.getBiometricDataByUserId(userId)
    if (!biometricData || !biometricData.fingerprint) {
      return false
    }

    // Check if the amount is within safe limits
    const user = await dbService.getUserById(userId)
    if (!user) return false

    // Ensure the user has sufficient balance with a 10% buffer
    return user.balance >= amount * 1.1
  },

  // Enhanced transaction creation with biometric verification
  createSecureTransaction: async (
    transaction: Omit<Transaction, "id">,
    biometricVerified: boolean,
  ): Promise<Transaction | null> => {
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
  },

  createTransaction: async (transaction: Omit<Transaction, "id">): Promise<Transaction> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
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
    }

    try {
      // Get user's current balance
      const user = await prisma.user.findUnique({
        where: { id: transaction.userId },
      })

      if (!user) {
        throw new Error("User not found")
      }

      const balanceBefore = user.balance
      let balanceAfter = balanceBefore

      // Update balance based on transaction type
      if (transaction.type === "sent" || transaction.type === "recharge" || transaction.type === "bill") {
        balanceAfter = balanceBefore - Number(transaction.amount)
      } else if (transaction.type === "received") {
        balanceAfter = balanceBefore + Number(transaction.amount)
      }

      // Create transaction with balance info
      const createdTransaction = await prisma.transaction.create({
        data: {
          type: transaction.type,
          amount: transaction.amount,
          recipient: transaction.recipient,
          category: transaction.category,
          userId: transaction.userId,
          balanceBefore,
          balanceAfter,
          authMethod: transaction.authMethod,
        },
      })

      // Update user balance
      await prisma.user.update({
        where: { id: transaction.userId },
        data: { balance: balanceAfter },
      })

      return createdTransaction as unknown as Transaction
    } catch (error) {
      console.error("Error creating transaction:", error)
      throw new Error("Failed to create transaction")
    }
  },

  // Biometric methods
  getBiometricData: async (): Promise<Record<string, BiometricData>> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      return JSON.parse(localStorage.getItem("biometricData") || "{}")
    }

    try {
      const biometricData = await prisma.biometricData.findMany()

      // Convert to record format
      const result: Record<string, BiometricData> = {}
      for (const data of biometricData) {
        result[data.userId] = {
          userId: data.userId,
          fingerprint: data.fingerprint,
          face: data.face,
          fingerprintData: data.fingerprintData ? decrypt(data.fingerprintData) : undefined,
          faceData: data.faceData ? decrypt(data.faceData) : undefined,
        }
      }

      return result
    } catch (error) {
      console.error("Error fetching biometric data:", error)
      return {}
    }
  },

  getBiometricDataByUserId: async (userId: string): Promise<BiometricData | null> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      const biometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")
      return biometricData[userId] || null
    }

    try {
      const data = await prisma.biometricData.findUnique({
        where: { userId },
      })

      if (!data) return null

      return {
        userId: data.userId,
        fingerprint: data.fingerprint,
        face: data.face,
        fingerprintData: data.fingerprintData ? decrypt(data.fingerprintData) : undefined,
        faceData: data.faceData ? decrypt(data.faceData) : undefined,
      }
    } catch (error) {
      console.error(`Error fetching biometric data for user ${userId}:`, error)
      return null
    }
  },

  saveBiometricData: async (data: BiometricData): Promise<void> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      const biometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")
      biometricData[data.userId] = data
      localStorage.setItem("biometricData", JSON.stringify(biometricData))
      return
    }

    try {
      // Check if biometric data already exists for this user
      const existingData = await prisma.biometricData.findUnique({
        where: { userId: data.userId },
      })

      // Encrypt sensitive data
      const fingerprintData = data.fingerprintData ? encrypt(data.fingerprintData) : null
      const faceData = data.faceData ? encrypt(data.faceData) : null

      if (existingData) {
        // Update existing record
        await prisma.biometricData.update({
          where: { userId: data.userId },
          data: {
            fingerprint: data.fingerprint,
            face: data.face,
            fingerprintData,
            faceData,
          },
        })
      } else {
        // Create new record
        await prisma.biometricData.create({
          data: {
            userId: data.userId,
            fingerprint: data.fingerprint,
            face: data.face,
            fingerprintData,
            faceData,
          },
        })
      }
    } catch (error) {
      console.error(`Error saving biometric data for user ${data.userId}:`, error)
      throw new Error("Failed to save biometric data")
    }
  },

  // QR Code methods
  getQRCodes: async (): Promise<QRCode[]> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      return JSON.parse(localStorage.getItem("qrCodes") || "[]")
    }

    try {
      const qrCodes = await prisma.qRCode.findMany()
      return qrCodes as unknown as QRCode[]
    } catch (error) {
      console.error("Error fetching QR codes:", error)
      return []
    }
  },

  createQRCode: async (qrCode: Omit<QRCode, "id">): Promise<QRCode> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      const qrCodes = JSON.parse(localStorage.getItem("qrCodes") || "[]")
      const newQRCode = {
        ...qrCode,
        id: qrCodes.length + 1,
      }
      localStorage.setItem("qrCodes", JSON.stringify([...qrCodes, newQRCode]))
      return newQRCode
    }

    try {
      const createdQRCode = await prisma.qRCode.create({
        data: {
          name: qrCode.name,
          amount: qrCode.amount,
          qrData: qrCode.qrData,
        },
      })

      return createdQRCode as unknown as QRCode
    } catch (error) {
      console.error("Error creating QR code:", error)
      throw new Error("Failed to create QR code")
    }
  },

  deleteQRCode: async (id: number): Promise<boolean> => {
    if (isBrowser) {
      // In browser preview mode, use localStorage
      const qrCodes = JSON.parse(localStorage.getItem("qrCodes") || "[]")
      const updatedQRCodes = qrCodes.filter((qrCode: QRCode) => qrCode.id !== id)
      localStorage.setItem("qrCodes", JSON.stringify(updatedQRCodes))
      return qrCodes.length !== updatedQRCodes.length
    }

    try {
      await prisma.qRCode.delete({
        where: { id },
      })
      return true
    } catch (error) {
      console.error(`Error deleting QR code ${id}:`, error)
      return false
    }
  },

  // Database initialization
  initDatabase: async (): Promise<{ success: boolean; message: string }> => {
    if (isBrowser) {
      // In browser preview mode, just return success
      return { success: true, message: "Using localStorage for development" }
    }

    try {
      // Test database connection
      await prisma.$connect()
      return { success: true, message: "Connected to database" }
    } catch (error) {
      console.error("Failed to connect to database:", error)
      return { success: false, message: "Failed to connect to database" }
    }
  },
}

// Initialize database on module load if in browser
if (isBrowser) {
  dbService.initDatabase()
}

export * from "./db"
export * from "./db-deprecated"
