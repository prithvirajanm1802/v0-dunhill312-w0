import { NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"

export async function POST(req: Request) {
  try {
    const { userId, amount, note } = await req.json()

    if (!userId) {
      return NextResponse.json({ success: false, message: "userId is required" }, { status: 400 })
    }

    const sql = getNeon()

    // Generate unique QR data
    const qrId = `QR_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const qrData = JSON.stringify({
      id: qrId,
      userId,
      amount: amount || null,
      note: note || null,
      type: amount ? "payment" : "user",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    })

    if (sql) {
      try {
        // Get user info
        const userResult = await sql`
          SELECT id, full_name, mobile, balance FROM honeydrew_users WHERE id = ${userId}
        `

        const user = userResult[0]

        // Save QR code to database
        await sql`
          INSERT INTO qr_codes (user_id, qr_data, payment_id, expires_at, created_at)
          VALUES (
            ${userId},
            ${qrData},
            ${amount ? qrId : null},
            NOW() + INTERVAL '24 hours',
            NOW()
          )
        `

        // Log admin action
        await sql`
          INSERT INTO admin_logs (action_type, resource_type, resource_id, details, created_at)
          VALUES (
            'qr_generated',
            'user',
            ${userId}::uuid,
            ${JSON.stringify({ qrId, amount, note, userName: user?.full_name })}::jsonb,
            NOW()
          )
        `.catch(() => {})

        return NextResponse.json({
          success: true,
          qrId,
          qrData,
          user: user
            ? {
                id: user.id,
                name: user.full_name,
                mobile: user.mobile,
              }
            : null,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
      } catch (dbError) {
        console.error("[v0] DB error generating QR:", dbError)
      }
    }

    // Fallback without DB
    return NextResponse.json({
      success: true,
      qrId,
      qrData,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] QR generate error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
