import { type NextRequest, NextResponse } from "next/server"

interface SyncData {
  userId: string
  deviceId: string
  paymentStatus: Record<string, any>
  verificationStatus: Record<string, any>
  timestamp: number
}

// In-memory store for demo (replace with database)
const syncStore = new Map<string, SyncData>()

export async function POST(request: NextRequest) {
  try {
    const { userId, deviceId, paymentStatus, verificationStatus } = await request.json()

    if (!userId || !deviceId) {
      return NextResponse.json({ error: "Missing userId or deviceId" }, { status: 400 })
    }

    const syncKey = `${userId}-${deviceId}`
    const syncData: SyncData = {
      userId,
      deviceId,
      paymentStatus,
      verificationStatus,
      timestamp: Date.now(),
    }

    syncStore.set(syncKey, syncData)

    console.log("[v0] Payment status synced:", {
      userId,
      deviceId,
      paymentsCount: Object.keys(paymentStatus || {}).length,
    })

    return NextResponse.json({
      success: true,
      synced: true,
      timestamp: syncData.timestamp,
    })
  } catch (error) {
    console.error("[v0] Sync error:", error)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const deviceId = searchParams.get("deviceId")

    if (!userId || !deviceId) {
      return NextResponse.json({ error: "Missing userId or deviceId" }, { status: 400 })
    }

    const syncKey = `${userId}-${deviceId}`
    const syncData = syncStore.get(syncKey)

    if (!syncData) {
      return NextResponse.json({
        success: true,
        synced: false,
        message: "No sync data available",
      })
    }

    return NextResponse.json({
      success: true,
      synced: true,
      data: syncData,
    })
  } catch (error) {
    console.error("[v0] Get sync error:", error)
    return NextResponse.json({ error: "Failed to retrieve sync data" }, { status: 500 })
  }
}
