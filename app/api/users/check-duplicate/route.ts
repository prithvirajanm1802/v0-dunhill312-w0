import { type NextRequest, NextResponse } from "next/server"
import { getSQL } from "@/lib/neon-db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, mobile } = body

    const sql = getSQL()

    let emailExists = false
    let mobileExists = false

    if (sql) {
      // Check if email exists in database
      if (email) {
        const emailResult = await sql`
          SELECT id FROM honeydrew_users WHERE LOWER(email) = LOWER(${email}) LIMIT 1
        `
        emailExists = emailResult.length > 0
      }

      // Check if mobile exists in database
      if (mobile) {
        const mobileResult = await sql`
          SELECT id FROM honeydrew_users WHERE mobile = ${mobile} LIMIT 1
        `
        mobileExists = mobileResult.length > 0
      }
    }

    return NextResponse.json({
      success: true,
      emailExists,
      mobileExists,
    })
  } catch (error: any) {
    console.error("[v0] Duplicate check error:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      emailExists: false,
      mobileExists: false,
    })
  }
}
