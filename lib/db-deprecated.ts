// Backward compatibility exports - all operations use localStorage
import * as db from "./db"

export const dbService = {
  getUsers: () => db.getUsers(),
  getUserById: (id: string) => db.getUserById(id),
  getUserByMobile: (mobile: string) => db.getUserByMobile(mobile),
  createUser: (user: any) => db.createUser(user),
  updateUser: (user: any) => db.updateUser(user),
  deleteUser: (id: string) => {
    const users = db.getUsers()
    const filtered = users.filter((u) => u.id !== id)
    localStorage.setItem("registeredUsers", JSON.stringify(filtered))
    return users.length !== filtered.length
  },
  getTransactions: () => db.getTransactions(),
  getTransactionsByUserId: (id: string) => db.getTransactionsByUserId(id),
  createTransaction: (txn: any) => db.createTransaction(txn),
  getBiometricData: () => db.getBiometricData(),
  getBiometricDataByUserId: (id: string) => db.getBiometricDataByUserId(id),
  saveBiometricData: (data: any) => db.saveBiometricData(data),
  getQRCodes: () => db.getQRCodes(),
  createQRCode: (qr: any) => db.createQRCode(qr),
  deleteQRCode: (id: number) => db.deleteQRCode(id),
  initDatabase: () => db.initDatabase(),
  verifyBiometricForPayment: (userId: string, data: string) => Math.random() < 0.9,
  isTransactionSecure: (userId: string, amount: number) => {
    const bioData = db.getBiometricDataByUserId(userId)
    const user = db.getUserById(userId)
    return !!(bioData?.fingerprint && user && user.balance >= amount)
  },
  createSecureTransaction: (txn: any, verified: boolean) => {
    if (!verified) throw new Error("Biometric verification required")
    return db.createTransaction(txn)
  },
}
