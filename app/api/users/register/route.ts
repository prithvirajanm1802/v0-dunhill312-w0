import { type NextRequest, NextResponse } from "next/server"
import { registerUser, storeFingerprintData, getSQL } from "@/lib/neon-db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, mobile, password, fingerprintData } = body

    if (!fullName || !mobile || !password) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const sql = getSQL()
    if (sql) {
      // Check if email already exists
      if (email) {
        const emailCheck = await sql`
          SELECT id FROM honeydrew_users WHERE LOWER(email) = LOWER(${email}) LIMIT 1
        `
        if (emailCheck.length > 0) {
          return NextResponse.json(
            { success: false, error: "An account with this email already exists" },
            { status: 409 },
          )
        }
      }

      // Check if mobile already exists
      const mobileCheck = await sql`
        SELECT id FROM honeydrew_users WHERE mobile = ${mobile} LIMIT 1
      `
      if (mobileCheck.length > 0) {
        return NextResponse.json(
          { success: false, error: "An account with this phone number already exists" },
          { status: 409 },
        )
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Register user in database
    const user = await registerUser({
      fullName,
      email,
      mobile,
      passwordHash,
      balance: 10000,
      fingerprintRegistered: !!fingerprintData,
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Failed to register user - user may already exist" },
        { status: 500 },
      )
    }

    // Store fingerprint data if provided
    if (fingerprintData) {
      await storeFingerprintData({
        userId: user.id,
        credentialId: fingerprintData.credentialId,
        publicKey: fingerprintData.publicKey,
        deviceType: fingerprintData.deviceType || "unknown",
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        mobile: user.mobile,
        balance: user.balance,
      },
    })
  } catch (error: any) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ success: false, error: error.message || "Registration failed" }, { status: 500 })
  }
}
