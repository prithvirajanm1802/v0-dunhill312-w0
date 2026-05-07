import { NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const sql = getNeon()

    if (!sql) {
      return NextResponse.json({
        success: true,
        connected: false,
        status: "disconnected",
        message: "DATABASE_URL not configured. Please add your Neon DATABASE_URL in the Vars section.",
        details: {
          hasEnvVar: false,
          provider: null,
        },
      })
    }

    const startTime = Date.now()
    const result = await sql`SELECT NOW() as server_time, current_database() as db_name`
    const latency = Date.now() - startTime

    const tableCounts = {
      users: 0,
      passkeys: 0,
      transactions: 0,
      adminLogs: 0,
      qrCodes: 0,
      stripePay: 0,
      p2pRequests: 0,
    }

    try {
      const tablesExist = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('honeydrew_users', 'passkeys', 'user_transactions', 'admin_logs', 'qr_codes', 'stripe_payments', 'p2p_requests')
      `

      const existingTables = tablesExist.map((t: any) => t.table_name)

      // Only count tables that exist
      if (existingTables.includes("honeydrew_users")) {
        const usersCount = await sql`SELECT COUNT(*) as count FROM honeydrew_users`
        tableCounts.users = Number(usersCount[0]?.count || 0)
      }
      if (existingTables.includes("passkeys")) {
        const passkeysCount = await sql`SELECT COUNT(*) as count FROM passkeys`
        tableCounts.passkeys = Number(passkeysCount[0]?.count || 0)
      }
      if (existingTables.includes("user_transactions")) {
        const txCount = await sql`SELECT COUNT(*) as count FROM user_transactions`
        tableCounts.transactions = Number(txCount[0]?.count || 0)
      }
      if (existingTables.includes("admin_logs")) {
        const logsCount = await sql`SELECT COUNT(*) as count FROM admin_logs`
        tableCounts.adminLogs = Number(logsCount[0]?.count || 0)
      }
      if (existingTables.includes("qr_codes")) {
        const qrCount = await sql`SELECT COUNT(*) as count FROM qr_codes`
        tableCounts.qrCodes = Number(qrCount[0]?.count || 0)
      }
      if (existingTables.includes("stripe_payments")) {
        const stripeCount = await sql`SELECT COUNT(*) as count FROM stripe_payments`
        tableCounts.stripePay = Number(stripeCount[0]?.count || 0)
      }
      if (existingTables.includes("p2p_requests")) {
        const p2pCount = await sql`SELECT COUNT(*) as count FROM p2p_requests`
        tableCounts.p2pRequests = Number(p2pCount[0]?.count || 0)
      }
    } catch (tableError) {
      console.log("[v0] Table count error (non-critical):", tableError)
    }

    return NextResponse.json({
      success: true,
      connected: true,
      status: "connected",
      message: "Neon PostgreSQL connected - All devices synced in real-time",
      details: {
        hasEnvVar: true,
        provider: "Neon PostgreSQL",
        serverTime: result[0]?.server_time,
        database: result[0]?.db_name,
        latency: `${latency}ms`,
        tables: tableCounts,
        multiDevice: true,
        publicAccess: true,
      },
    })
  } catch (error: any) {
    console.error("[v0] DB status check error:", error)
    return NextResponse.json({
      success: false,
      connected: false,
      status: "error",
      message: error?.message || "Failed to connect to database",
      details: {
        hasEnvVar: !!process.env.DATABASE_URL,
        provider: "Neon",
        error: error?.message,
      },
    })
  }
}
