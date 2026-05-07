import { type NextRequest, NextResponse } from "next/server"
import { AdminLogger } from "@/lib/admin-logging"

export async function GET(request: NextRequest) {
  try {
    const statistics = AdminLogger.getStatistics()
    const suspiciousActivity = AdminLogger.getSuspiciousActivity(24)

    return NextResponse.json({
      success: true,
      statistics,
      suspiciousActivityCount: suspiciousActivity.length,
      recentSuspiciousActivities: suspiciousActivity.slice(0, 10),
    })
  } catch (error) {
    console.error("[v0] Get statistics error:", error)
    return NextResponse.json({ error: "Failed to retrieve statistics" }, { status: 500 })
  }
}
