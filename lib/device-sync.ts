/**
 * Cross-Device Sync & Session Management
 * Enables secure access across multiple devices
 */

export interface DeviceInfo {
  id: string
  name: string
  type: "mobile" | "tablet" | "desktop"
  lastActive: number
  isVerified: boolean
  isTrusted: boolean
}

export interface SyncedSession {
  userId: string
  deviceId: string
  token: string
  expiresAt: number
  createdAt: number
  lastActive: number
  isActive: boolean
}

export const deviceSync = {
  // Generate unique device ID
  generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  // Detect device type
  detectDeviceType(): "mobile" | "tablet" | "desktop" {
    const ua = navigator.userAgent
    if (/mobile|android|iphone|ipod/i.test(ua)) return "mobile"
    if (/ipad|tablet/i.test(ua)) return "tablet"
    return "desktop"
  },

  // Register device
  registerDevice(userId: string, deviceName?: string): DeviceInfo {
    const deviceId = this.generateDeviceId()
    const deviceInfo: DeviceInfo = {
      id: deviceId,
      name: deviceName || `Device ${new Date().toLocaleDateString()}`,
      type: this.detectDeviceType(),
      lastActive: Date.now(),
      isVerified: false,
      isTrusted: false,
    }

    // Store device info
    const devices = JSON.parse(localStorage.getItem(`honeydrew_devices_${userId}`) || "[]")
    devices.push(deviceInfo)
    localStorage.setItem(`honeydrew_devices_${userId}`, JSON.stringify(devices))

    return deviceInfo
  },

  // Get registered devices for user
  getDevices(userId: string): DeviceInfo[] {
    return JSON.parse(localStorage.getItem(`honeydrew_devices_${userId}`) || "[]")
  },

  // Mark device as trusted
  trustDevice(userId: string, deviceId: string): void {
    const devices = this.getDevices(userId)
    const device = devices.find((d) => d.id === deviceId)
    if (device) {
      device.isTrusted = true
      device.isVerified = true
      localStorage.setItem(`honeydrew_devices_${userId}`, JSON.stringify(devices))
    }
  },

  // Create session token
  createSessionToken(userId: string, deviceId: string): string {
    const token = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
    const session: SyncedSession = {
      userId,
      deviceId,
      token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      createdAt: Date.now(),
      lastActive: Date.now(),
      isActive: true,
    }

    const sessions = JSON.parse(localStorage.getItem(`honeydrew_sessions_${userId}`) || "[]")
    sessions.push(session)
    localStorage.setItem(`honeydrew_sessions_${userId}`, JSON.stringify(sessions))

    return token
  },

  // Validate session token
  validateSessionToken(userId: string, token: string): boolean {
    const sessions = JSON.parse(localStorage.getItem(`honeydrew_sessions_${userId}`) || "[]")
    const session = sessions.find((s: SyncedSession) => s.token === token && s.isActive)

    if (!session) return false
    if (session.expiresAt < Date.now()) {
      session.isActive = false
      localStorage.setItem(`honeydrew_sessions_${userId}`, JSON.stringify(sessions))
      return false
    }

    // Update last active
    session.lastActive = Date.now()
    localStorage.setItem(`honeydrew_sessions_${userId}`, JSON.stringify(sessions))
    return true
  },

  // Sync user data across devices
  syncUserData(userId: string, data: any): void {
    const syncRecord = {
      userId,
      data,
      syncedAt: Date.now(),
    }

    const syncHistory = JSON.parse(localStorage.getItem(`honeydrew_sync_${userId}`) || "[]")
    syncHistory.push(syncRecord)

    // Keep only last 50 syncs
    if (syncHistory.length > 50) {
      syncHistory.shift()
    }

    localStorage.setItem(`honeydrew_sync_${userId}`, JSON.stringify(syncHistory))
  },

  // Get latest synced data
  getLatestSyncData(userId: string): any | null {
    const syncHistory = JSON.parse(localStorage.getItem(`honeydrew_sync_${userId}`) || "[]")
    return syncHistory.length > 0 ? syncHistory[syncHistory.length - 1].data : null
  },

  // Revoke session
  revokeSession(userId: string, deviceId: string): void {
    const sessions = JSON.parse(localStorage.getItem(`honeydrew_sessions_${userId}`) || "[]")
    const activeSessions = sessions.filter((s: SyncedSession) => !(s.deviceId === deviceId && s.isActive))
    localStorage.setItem(`honeydrew_sessions_${userId}`, JSON.stringify(activeSessions))
  },

  // Revoke all sessions (logout from all devices)
  revokeAllSessions(userId: string): void {
    localStorage.removeItem(`honeydrew_sessions_${userId}`)
  },

  // Get active sessions
  getActiveSessions(userId: string): SyncedSession[] {
    const sessions = JSON.parse(localStorage.getItem(`honeydrew_sessions_${userId}`) || "[]")
    return sessions.filter((s: SyncedSession) => s.isActive && s.expiresAt > Date.now())
  },

  // Detect suspicious login
  detectSuspiciousLogin(userId: string, deviceId: string): boolean {
    const devices = this.getDevices(userId)
    const loginDevice = devices.find((d) => d.id === deviceId)

    // Suspicious if device is new and not trusted
    if (loginDevice && !loginDevice.isTrusted && !loginDevice.isVerified) {
      return true
    }

    return false
  },
}
