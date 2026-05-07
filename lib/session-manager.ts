// Multi-device session management
// Handles authentication state across devices

export interface Session {
  sessionId: string
  userId: string
  deviceId: string
  createdAt: number
  expiresAt: number
  isActive: boolean
  lastActivity: number
}

// Create a new session
export function createSession(userId: string, deviceId: string, expiryHours = 24): Session {
  const now = Date.now()
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const session: Session = {
    sessionId,
    userId,
    deviceId,
    createdAt: now,
    expiresAt: now + expiryHours * 60 * 60 * 1000,
    isActive: true,
    lastActivity: now,
  }

  // Store session
  localStorage.setItem(`honeydrew_session_${sessionId}`, JSON.stringify(session))
  localStorage.setItem(`honeydrew_active_session_${userId}`, sessionId)

  return session
}

// Get active session
export function getActiveSession(userId: string): Session | null {
  try {
    const sessionId = localStorage.getItem(`honeydrew_active_session_${userId}`)
    if (!sessionId) return null

    const sessionData = localStorage.getItem(`honeydrew_session_${sessionId}`)
    if (!sessionData) return null

    const session: Session = JSON.parse(sessionData)

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(`honeydrew_session_${sessionId}`)
      localStorage.removeItem(`honeydrew_active_session_${userId}`)
      return null
    }

    // Update last activity
    session.lastActivity = Date.now()
    localStorage.setItem(`honeydrew_session_${sessionId}`, JSON.stringify(session))

    return session
  } catch (error) {
    console.error("[v0] Error getting active session:", error)
    return null
  }
}

// Validate session across devices
export function isSessionValid(userId: string): boolean {
  const session = getActiveSession(userId)
  return session !== null && session.isActive
}

// End session (logout)
export function endSession(userId: string): void {
  try {
    const sessionId = localStorage.getItem(`honeydrew_active_session_${userId}`)
    if (sessionId) {
      localStorage.removeItem(`honeydrew_session_${sessionId}`)
      localStorage.removeItem(`honeydrew_active_session_${userId}`)
      console.log("[v0] Session ended for user:", userId)
    }
  } catch (error) {
    console.error("[v0] Error ending session:", error)
  }
}

// Get all active sessions for a user
export function getAllUserSessions(userId: string): Session[] {
  try {
    const sessions: Session[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(`honeydrew_session_${userId}`)) {
        const data = localStorage.getItem(key)
        if (data) {
          const session: Session = JSON.parse(data)
          if (session.expiresAt > Date.now() && session.isActive) {
            sessions.push(session)
          }
        }
      }
    }

    return sessions
  } catch (error) {
    console.error("[v0] Error getting user sessions:", error)
    return []
  }
}

// Revoke session from another device
export function revokeSessionFromDevice(userId: string, sessionId: string): boolean {
  try {
    const sessionData = localStorage.getItem(`honeydrew_session_${sessionId}`)
    if (!sessionData) return false

    const session: Session = JSON.parse(sessionData)
    if (session.userId !== userId) return false

    session.isActive = false
    localStorage.setItem(`honeydrew_session_${sessionId}`, JSON.stringify(session))
    console.log("[v0] Session revoked:", sessionId)

    return true
  } catch (error) {
    console.error("[v0] Error revoking session:", error)
    return false
  }
}

export const sessionManager = {
  createSession,
  getActiveSession,
  isSessionValid,
  endSession,
  getAllUserSessions,
  revokeSessionFromDevice,
}
