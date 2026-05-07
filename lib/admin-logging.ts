import crypto from "crypto"
import { getNeon } from "@/lib/neon"

export type AdminActionType =
  | "payment_verified"
  | "payment_failed"
  | "qr_generated"
  | "user_blocked"
  | "dispute_resolved"
  | "device_revoked"
  | "session_terminated"
  | "suspicious_activity_detected"
  | "admin_login_success"
  | "admin_login_failed"
  | "user_registered"
  | "stripe_session_created"

export interface AdminLog {
  id: string
  adminId: string
  actionType: AdminActionType | string
  resourceType: "payment" | "qr_code" | "user" | "device" | "dispute" | "admin" | string
  resourceId: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: number
  severity: "low" | "medium" | "high" | "critical"
}

// In-memory fallback store
const inMemoryLogs: AdminLog[] = []

export class AdminLogger {
  static async createLogAsync(
    adminId: string,
    actionType: AdminActionType | string,
    resourceType: string,
    resourceId: string,
    details: Record<string, any>,
    ipAddress: string,
    userAgent: string,
    severity: "low" | "medium" | "high" | "critical" = "low",
  ): Promise<AdminLog> {
    const log: AdminLog = {
      id: crypto.randomUUID(),
      adminId,
      actionType,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
      timestamp: Date.now(),
      severity,
    }

    const sql = getNeon()
    if (sql) {
      try {
        await sql`
          INSERT INTO admin_logs (id, action, admin_username, user_id, details, ip_address, user_agent, created_at)
          VALUES (
            ${log.id}::uuid,
            ${actionType},
            ${adminId},
            ${resourceId !== "system" ? resourceId : null}::uuid,
            ${JSON.stringify({ ...details, resourceType, severity })}::jsonb,
            ${ipAddress},
            ${userAgent},
            NOW()
          )
        `
      } catch (dbErr) {
        console.error("[v0] Failed to store log in Neon:", dbErr)
        // Fallback to in-memory
        inMemoryLogs.push(log)
      }
    } else {
      inMemoryLogs.push(log)
    }

    if (inMemoryLogs.length > 1000) {
      inMemoryLogs.shift()
    }

    return log
  }

  // Sync version for backward compatibility
  static createLog(
    adminId: string,
    actionType: AdminActionType | string,
    resourceType: string,
    resourceId: string,
    details: Record<string, any>,
    ipAddress: string,
    userAgent: string,
    severity: "low" | "medium" | "high" | "critical" = "low",
  ): AdminLog {
    const log: AdminLog = {
      id: crypto.randomUUID(),
      adminId,
      actionType,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
      timestamp: Date.now(),
      severity,
    }

    // Store async in background
    const sql = getNeon()
    if (sql) {
      sql`
        INSERT INTO admin_logs (id, action, admin_username, user_id, details, ip_address, user_agent, created_at)
        VALUES (
          ${log.id}::uuid,
          ${actionType},
          ${adminId},
          ${resourceId !== "system" ? resourceId : null}::uuid,
          ${JSON.stringify({ ...details, resourceType, severity })}::jsonb,
          ${ipAddress},
          ${userAgent},
          NOW()
        )
      `.catch((err) => {
        console.error("[v0] Background log insert failed:", err)
        inMemoryLogs.push(log)
      })
    } else {
      inMemoryLogs.push(log)
    }

    return log
  }

  static async getLogsAsync(filters?: {
    adminId?: string
    actionType?: AdminActionType | string
    resourceType?: string
    severity?: string
    startDate?: number
    endDate?: number
    limit?: number
  }): Promise<AdminLog[]> {
    const sql = getNeon()

    if (sql) {
      try {
        const limit = filters?.limit || 50
        const rows = await sql`
          SELECT 
            id,
            action,
            admin_username,
            user_id,
            details,
            ip_address,
            user_agent,
            created_at
          FROM admin_logs
          ORDER BY created_at DESC
          LIMIT ${limit}
        `

        return rows.map((row: any) => ({
          id: row.id,
          adminId: row.admin_username || "system",
          actionType: row.action,
          resourceType: row.details?.resourceType || "admin",
          resourceId: row.user_id || "system",
          details: row.details || {},
          ipAddress: row.ip_address || "",
          userAgent: row.user_agent || "",
          timestamp: new Date(row.created_at).getTime(),
          severity: row.details?.severity || "low",
        }))
      } catch (dbErr) {
        console.error("[v0] Failed to fetch logs from Neon:", dbErr)
      }
    }

    // Fallback to in-memory
    return AdminLogger.getLogs(filters)
  }

  static getLogs(filters?: {
    adminId?: string
    actionType?: AdminActionType | string
    resourceType?: string
    severity?: string
    startDate?: number
    endDate?: number
    limit?: number
  }): AdminLog[] {
    let results = [...inMemoryLogs]

    if (filters?.adminId) {
      results = results.filter((log) => log.adminId === filters.adminId)
    }

    if (filters?.actionType) {
      results = results.filter((log) => log.actionType === filters.actionType)
    }

    if (filters?.resourceType) {
      results = results.filter((log) => log.resourceType === filters.resourceType)
    }

    if (filters?.severity) {
      results = results.filter((log) => log.severity === filters.severity)
    }

    if (filters?.startDate) {
      results = results.filter((log) => log.timestamp >= filters.startDate!)
    }

    if (filters?.endDate) {
      results = results.filter((log) => log.timestamp <= filters.endDate!)
    }

    results.sort((a, b) => b.timestamp - a.timestamp)

    if (filters?.limit) {
      results = results.slice(0, filters.limit)
    }

    return results
  }

  static getLogsByResource(resourceType: string, resourceId: string): AdminLog[] {
    return inMemoryLogs.filter((log) => log.resourceType === resourceType && log.resourceId === resourceId)
  }

  static getSuspiciousActivity(hours = 24): AdminLog[] {
    const sinceTime = Date.now() - hours * 60 * 60 * 1000
    return inMemoryLogs.filter(
      (log) => log.timestamp >= sinceTime && (log.severity === "high" || log.severity === "critical"),
    )
  }

  static getStatistics() {
    const now = Date.now()
    const today = now - 24 * 60 * 60 * 1000
    const thisWeek = now - 7 * 24 * 60 * 60 * 1000

    const todayLogs = inMemoryLogs.filter((log) => log.timestamp >= today)
    const weekLogs = inMemoryLogs.filter((log) => log.timestamp >= thisWeek)

    const actionCounts = inMemoryLogs.reduce(
      (acc, log) => {
        acc[log.actionType] = (acc[log.actionType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const severityCounts = inMemoryLogs.reduce(
      (acc, log) => {
        acc[log.severity] = (acc[log.severity] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalLogs: inMemoryLogs.length,
      todayLogs: todayLogs.length,
      weekLogs: weekLogs.length,
      actionCounts,
      severityCounts,
      suspiciousActivityCount: inMemoryLogs.filter((log) => log.severity === "high" || log.severity === "critical")
        .length,
    }
  }
}

export async function logAdminAction(params: {
  action: string
  adminUsername?: string
  userId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}) {
  const log = await AdminLogger.createLogAsync(
    params.adminUsername || "admin",
    params.action,
    "admin",
    params.userId || "system",
    params.details || {},
    params.ipAddress || "0.0.0.0",
    params.userAgent || "Honeydrew Mills Admin",
    "medium",
  )
  return log
}
