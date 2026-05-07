import { NextResponse } from "next/server"
import { getAdminStats } from "@/lib/neon-db"

export async function GET() {
  try {
    const stats = await getAdminStats()

    if (!stats) {
      return NextResponse.json({
        success: false,
        error: "Failed to fetch statistics",
      })
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: Number(stats.users.total_users) || 0,
        activeUsers: Number(stats.users.active_users) || 0,
        fingerprintRegistered: Number(stats.users.fingerprint_registered) || 0,
        totalBalance: Number(stats.users.total_balance) || 0,
        totalTransactions: Number(stats.transactions.total_transactions) || 0,
        totalSent: Number(stats.transactions.total_sent) || 0,
        totalReceived: Number(stats.transactions.total_received) || 0,
        todayTransactions: Number(stats.transactions.today_transactions) || 0,
        activeSessions: Number(stats.sessions.active_sessions) || 0,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error fetching admin stats:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
    })
  }
}
