import { NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"

export const dynamic = "force-dynamic"

const ADMIN_USERNAME = "honeydrew_admin"
const ADMIN_PASSWORD = "HoneydrewMills2024!"

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Username and password required" }, { status: 400 })
    }

    // Validate admin credentials
    const isValid = username === ADMIN_USERNAME && password === ADMIN_PASSWORD

    const sql = getNeon()
    const dbConnected = !!sql

    if (sql) {
      try {
        await sql`
          INSERT INTO admin_logs (action, admin_username, details, ip_address, user_agent, created_at)
          VALUES (
            ${isValid ? "admin_login_success" : "admin_login_failed"},
            ${username},
            ${JSON.stringify({
              success: isValid,
              timestamp: new Date().toISOString(),
            })}::jsonb,
            ${req.headers.get("x-forwarded-for") || "unknown"},
            ${req.headers.get("user-agent") || "unknown"},
            NOW()
          )
        `
      } catch (dbErr) {
        console.error("[v0] Failed to log admin login:", dbErr)
        // Don't fail the login if logging fails
      }
    }

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
          dbConnected,
        },
        { status: 401 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Admin login successful",
      dbConnected,
      admin: {
        username: ADMIN_USERNAME,
        loginTime: new Date().toISOString(),
        platform: "Honeydrew Mills",
      },
    })
  } catch (error: any) {
    console.error("[v0] Admin login error:", error)
    return NextResponse.json({ success: false, message: error?.message || "Login failed" }, { status: 500 })
  }
}
