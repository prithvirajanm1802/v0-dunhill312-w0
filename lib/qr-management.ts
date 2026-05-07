/**
 * QR Code Management System
 * Admin functionality for creating and managing QR codes
 */

export interface StoredQRCode {
  id: string
  userId: string
  merchantName: string
  merchantUPI?: string
  upiId: string
  qrData: string
  amount?: number
  description?: string
  category: "upi" | "payment" | "billing" | "subscription" | "donation" | "other"
  isActive: boolean
  createdAt: number
  expiresAt?: number
  scanCount: number
  successfulTransactions: number
  totalAmountCollected: number
}

export interface QRScanLog {
  id: string
  qrCodeId: string
  scannedBy: string
  scannedAt: number
  amount?: number
  transactionId?: string
  status: "pending" | "completed" | "failed"
  deviceInfo?: string
}

export const qrManagement = {
  // Generate QR code ID
  generateQRId(): string {
    return `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  // Create new QR code
  createQRCode(
    userId: string,
    merchantName: string,
    upiId: string,
    options?: {
      amount?: number
      description?: string
      category?: StoredQRCode["category"]
      merchantUPI?: string
    },
  ): StoredQRCode {
    const qrId = this.generateQRId()

    // Generate QR data (URL format that contains merchant info)
    const qrData = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&tn=${encodeURIComponent(
      options?.description || "Payment",
    )}${options?.amount ? `&am=${options.amount}` : ""}`

    const qrCode: StoredQRCode = {
      id: qrId,
      userId,
      merchantName,
      merchantUPI: options?.merchantUPI || upiId,
      upiId,
      qrData,
      amount: options?.amount,
      description: options?.description,
      category: options?.category || "other",
      isActive: true,
      createdAt: Date.now(),
      scanCount: 0,
      successfulTransactions: 0,
      totalAmountCollected: 0,
    }

    // Store in admin QR codes
    const qrCodes = JSON.parse(localStorage.getItem("honeydrew_qr_codes") || "[]")
    qrCodes.push(qrCode)
    localStorage.setItem("honeydrew_qr_codes", JSON.stringify(qrCodes))

    // Log admin action
    const adminLogs = JSON.parse(localStorage.getItem("adminLogs") || "[]")
    adminLogs.push({
      timestamp: Date.now(),
      type: "qr_code",
      userId,
      action: "qr_code_created",
      success: true,
      details: {
        qrId,
        merchantName,
        category: qrCode.category,
      },
    })
    localStorage.setItem("adminLogs", JSON.stringify(adminLogs))

    return qrCode
  },

  // Get all QR codes for admin
  getAllQRCodes(): StoredQRCode[] {
    return JSON.parse(localStorage.getItem("honeydrew_qr_codes") || "[]")
  },

  // Get QR codes for specific user
  getUserQRCodes(userId: string): StoredQRCode[] {
    const allCodes = this.getAllQRCodes()
    return allCodes.filter((qr) => qr.userId === userId)
  },

  // Get QR code by ID
  getQRCodeById(qrId: string): StoredQRCode | null {
    const codes = this.getAllQRCodes()
    return codes.find((qr) => qr.id === qrId) || null
  },

  // Update QR code
  updateQRCode(qrId: string, updates: Partial<StoredQRCode>): StoredQRCode | null {
    const codes = this.getAllQRCodes()
    const index = codes.findIndex((qr) => qr.id === qrId)

    if (index === -1) return null

    codes[index] = { ...codes[index], ...updates }
    localStorage.setItem("honeydrew_qr_codes", JSON.stringify(codes))

    return codes[index]
  },

  // Deactivate QR code
  deactivateQRCode(qrId: string): void {
    this.updateQRCode(qrId, { isActive: false })

    const adminLogs = JSON.parse(localStorage.getItem("adminLogs") || "[]")
    adminLogs.push({
      timestamp: Date.now(),
      type: "qr_code",
      action: "qr_code_deactivated",
      success: true,
      details: { qrId },
    })
    localStorage.setItem("adminLogs", JSON.stringify(adminLogs))
  },

  // Delete QR code
  deleteQRCode(qrId: string): void {
    const codes = this.getAllQRCodes()
    const filtered = codes.filter((qr) => qr.id !== qrId)
    localStorage.setItem("honeydrew_qr_codes", JSON.stringify(filtered))

    const adminLogs = JSON.parse(localStorage.getItem("adminLogs") || "[]")
    adminLogs.push({
      timestamp: Date.now(),
      type: "qr_code",
      action: "qr_code_deleted",
      success: true,
      details: { qrId },
    })
    localStorage.setItem("adminLogs", JSON.stringify(adminLogs))
  },

  // Record QR scan
  recordQRScan(qrId: string, scannedBy: string): QRScanLog {
    const scanLog: QRScanLog = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      qrCodeId: qrId,
      scannedBy,
      scannedAt: Date.now(),
      status: "pending",
    }

    // Update scan count
    const qrCode = this.getQRCodeById(qrId)
    if (qrCode) {
      this.updateQRCode(qrId, {
        scanCount: qrCode.scanCount + 1,
      })
    }

    // Store scan log
    const scanLogs = JSON.parse(localStorage.getItem("honeydrew_qr_scan_logs") || "[]")
    scanLogs.push(scanLog)
    localStorage.setItem("honeydrew_qr_scan_logs", JSON.stringify(scanLogs))

    return scanLog
  },

  // Get QR scan logs
  getQRScanLogs(qrId?: string): QRScanLog[] {
    const logs = JSON.parse(localStorage.getItem("honeydrew_qr_scan_logs") || "[]")
    return qrId ? logs.filter((log: QRScanLog) => log.qrCodeId === qrId) : logs
  },

  // Update scan log status
  updateScanLogStatus(scanLogId: string, status: QRScanLog["status"], transactionId?: string): void {
    const logs = this.getQRScanLogs()
    const log = logs.find((l) => l.id === scanLogId)

    if (log) {
      log.status = status
      if (transactionId) log.transactionId = transactionId

      localStorage.setItem("honeydrew_qr_scan_logs", JSON.stringify(logs))

      // Update transaction count if successful
      if (status === "completed") {
        const qrCode = this.getQRCodeById(log.qrCodeId)
        if (qrCode) {
          this.updateQRCode(log.qrCodeId, {
            successfulTransactions: qrCode.successfulTransactions + 1,
          })
        }
      }
    }
  },

  // Get QR statistics
  getQRStatistics(qrId: string) {
    const qrCode = this.getQRCodeById(qrId)
    if (!qrCode) return null

    const scans = this.getQRScanLogs(qrId)
    const completedScans = scans.filter((s) => s.status === "completed")

    return {
      totalScans: qrCode.scanCount,
      successfulTransactions: qrCode.successfulTransactions,
      failedTransactions: scans.filter((s) => s.status === "failed").length,
      pendingTransactions: scans.filter((s) => s.status === "pending").length,
      totalAmountCollected: qrCode.totalAmountCollected,
      conversionRate: qrCode.scanCount > 0 ? (qrCode.successfulTransactions / qrCode.scanCount) * 100 : 0,
    }
  },
}
