import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, logUserLogin } from "@/lib/neon-db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password, biometric } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    const user = await getUserByEmail(email.toLowerCase())

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (biometric) {
      await logUserLogin(user.id)

      // Log to admin logs for cross-device tracking
      try {
        await fetch(`${request.nextUrl.origin}/api/admin/logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminId: "system",
            actionType: "user_login",
            resourceType: "user",
            resourceId: user.id,
            severity: "low",
            details: {
              email: user.email,
              name: user.full_name,
              mobile: user.mobile,
              loginMethod: "biometric",
              deviceInfo: request.headers.get("user-agent") || "unknown",
              timestamp: new Date().toISOString(),
            },
          }),
        })
      } catch (logError) {
        console.warn("[v0] Failed to log admin activity:", logError)
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.full_name,
          fullName: user.full_name,
          email: user.email,
          phone: user.mobile,
          mobile: user.mobile,
          username: user.username,
          balance: user.balance,
          fingerprintRegistered: user.fingerprint_registered,
          biometricEnabled: user.fingerprint_registered,
          isActive: true,
        },
      })
    }

    if (!password) {
      return NextResponse.json({ success: false, error: "Password is required" }, { status: 400 })
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 })
    }

    await logUserLogin(user.id)

    try {
      await fetch(`${request.nextUrl.origin}/api/admin/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: "system",
          actionType: "user_login",
          resourceType: "user",
          resourceId: user.id,
          severity: "low",
          details: {
            email: user.email,
            name: user.full_name,
            mobile: user.mobile,
            loginMethod: "password",
            deviceInfo: request.headers.get("user-agent") || "unknown",
            timestamp: new Date().toISOString(),
          },
        }),
      })
    } catch (logError) {
      console.warn("[v0] Failed to log admin activity:", logError)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.full_name,
        fullName: user.full_name,
        email: user.email,
        phone: user.mobile,
        mobile: user.mobile,
        username: user.username,
        balance: user.balance,
        fingerprintRegistered: user.fingerprint_registered,
        biometricEnabled: user.fingerprint_registered,
        isActive: true,
      },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 })
  }
}
