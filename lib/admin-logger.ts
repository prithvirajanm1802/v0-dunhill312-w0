export interface AdminLogEntry {
  id: string
  timestamp: number
  userId?: string
  action: string
  details: any
  success: boolean
  errorMessage?: string
}

export interface BiometricLogEntry {
  id: string
  timestamp: number
  userId: string
  type: "face" | "fingerprint"
  action: "register" | "verify"
  success: boolean
  confidence?: number
  errorMessage?: string
}

class AdminLogger {
  private static instance: AdminLogger
  private logs: AdminLogEntry[] = []
  private biometricLogs: BiometricLogEntry[] = []

  private constructor() {
    this.loadLogs()
  }

  static getInstance(): AdminLogger {
    if (!AdminLogger.instance) {
      AdminLogger.instance = new AdminLogger()
    }
    return AdminLogger.instance
  }

  private loadLogs() {
    try {
      if (typeof window !== "undefined") {
        const adminLogs = localStorage.getItem("adminLogs")
        const biometricLogs = localStorage.getItem("biometricLogs")

        if (adminLogs) this.logs = JSON.parse(adminLogs)
        if (biometricLogs) this.biometricLogs = JSON.parse(biometricLogs)
      }
    } catch (error) {
      console.error("[v0] Error loading logs from localStorage:", error)
    }
  }

  private saveLogs() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("adminLogs", JSON.stringify(this.logs))
        localStorage.setItem("biometricLogs", JSON.stringify(this.biometricLogs))
      }
    } catch (error) {
      console.error("[v0] Error saving logs to localStorage:", error)
    }
  }

  logAdminAction(entry: Omit<AdminLogEntry, "id" | "timestamp">) {
    const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newEntry: AdminLogEntry = {
      ...entry,
      id,
      timestamp: Date.now(),
    }
    this.logs.push(newEntry)
    this.saveLogs()
    console.log("[v0] Admin action logged:", newEntry)
    return newEntry
  }

  logBiometricAction(entry: Omit<BiometricLogEntry, "id" | "timestamp">) {
    const id = `bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newEntry: BiometricLogEntry = {
      ...entry,
      id,
      timestamp: Date.now(),
    }
    this.biometricLogs.push(newEntry)
    this.saveLogs()
    console.log("[v0] Biometric action logged:", newEntry)
    return newEntry
  }

  getAdminLogs(): AdminLogEntry[] {
    return [...this.logs]
  }

  getBiometricLogs(): BiometricLogEntry[] {
    return [...this.biometricLogs]
  }

  getLogs(limit?: number): AdminLogEntry[] {
    if (limit) return this.logs.slice(-limit)
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
    this.biometricLogs = []
    this.saveLogs()
    console.log("[v0] All logs cleared")
  }
}

export const adminLogger = AdminLogger.getInstance()

export function logAdminEvent(entry: Omit<AdminLogEntry, "id" | "timestamp">) {
  return adminLogger.logAdminAction(entry)
}
