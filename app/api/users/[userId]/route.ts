import { type NextRequest, NextResponse } from "next/server"
import { getUserWithBiometrics } from "@/lib/neon-db"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = await getUserWithBiometrics(params.userId)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        mobile: user.mobile,
        username: user.username,
        balance: Number(user.balance),
        isActive: user.is_active,
        faceRegistered: user.face_registered,
        fingerprintRegistered: user.fingerprint_registered,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        biometrics: user.biometrics,
        sessions: user.sessions,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error fetching user:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
