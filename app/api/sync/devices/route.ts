import { type NextRequest, NextResponse } from "next/server"
import { deviceSync } from "@/lib/device-sync"

export async function POST(request: NextRequest) {
  try {
    const { userId, deviceName } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const device = deviceSync.registerDevice(userId, deviceName)

    console.log("[v0] Device registered:", {
      userId,
      deviceId: device.id,
      deviceType: device.type,
    })

    return NextResponse.json({
      success: true,
      device,
      sessionToken: deviceSync.createSessionToken(userId, device.id),
    })
  } catch (error) {
    console.error("[v0] Device registration error:", error)
    return NextResponse.json({ error: "Device registration failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const devices = deviceSync.getDevices(userId)
    const activeSessions = deviceSync.getActiveSessions(userId)

    console.log("[v0] Retrieved devices:", {
      userId,
      deviceCount: devices.length,
      activeSessionCount: activeSessions.length,
    })

    return NextResponse.json({
      success: true,
      devices,
      activeSessions: activeSessions.length,
    })
  } catch (error) {
    console.error("[v0] Get devices error:", error)
    return NextResponse.json({ error: "Failed to retrieve devices" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const deviceId = searchParams.get("deviceId")

    if (!userId || !deviceId) {
      return NextResponse.json({ error: "Missing userId or deviceId" }, { status: 400 })
    }

    deviceSync.revokeSession(userId, deviceId)

    console.log("[v0] Device session revoked:", {
      userId,
      deviceId,
    })

    return NextResponse.json({
      success: true,
      message: "Session revoked",
    })
  } catch (error) {
    console.error("[v0] Revoke session error:", error)
    return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 })
  }
}
