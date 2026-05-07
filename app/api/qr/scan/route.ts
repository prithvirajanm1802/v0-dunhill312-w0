import { NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"

export async function POST(req: Request) {
  try {
    const { qrData, scannerId } = await req.json()

    if (!qrData) {
      return NextResponse.json({ success: false, message: "qrData is required" }, { status: 400 })
    }

    let parsedQr
    try {
      parsedQr = typeof qrData === "string" ? JSON.parse(qrData) : qrData
    } catch {
      return NextResponse.json({ success: false, message: "Invalid QR code format" }, { status: 400 })
    }

    const { userId, amount, note, type, expiresAt } = parsedQr

    // Check expiry
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return NextResponse.json({ success: false, message: "QR code has expired" }, { status: 400 })
    }

    if (scannerId && scannerId === userId) {
      return NextResponse.json(
        { success: false, message: "You cannot scan your own QR code for payment" },
        { status: 400 },
      )
    }

    const sql = getNeon()

    if (sql) {
      try {
        // Get target user info
        const targetUser = await sql`
          SELECT id, full_name, mobile, balance FROM honeydrew_users WHERE id = ${userId}::uuid
        `

        if (!targetUser.length) {
          return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
        }

        const faceData = await sql`
          SELECT face_data FROM biometric_data WHERE user_id = ${userId}::uuid LIMIT 1
        `.catch(() => [])

        // Update scan count in qr_codes table
        await sql`
          UPDATE qr_codes 
          SET scanned_count = COALESCE(scanned_count, 0) + 1, last_scanned_at = NOW()
          WHERE user_id = ${userId}::uuid
        `.catch(() => {})

        // Log the scan
        await sql`
          INSERT INTO admin_logs (action_type, resource_type, resource_id, details, created_at)
          VALUES (
            'qr_scanned',
            'user',
            ${scannerId ? scannerId : userId}::uuid,
            ${JSON.stringify({
              qrId: parsedQr.id,
              targetUserId: userId,
              targetUserName: targetUser[0].full_name,
              scannerId,
              amount,
              note,
              scanTime: new Date().toISOString(),
            })}::jsonb,
            NOW()
          )
        `.catch(() => {})

        return NextResponse.json({
          success: true,
          type,
          targetUser: {
            id: targetUser[0].id,
            name: targetUser[0].full_name,
            mobile: targetUser[0].mobile,
            faceImage: faceData?.[0]?.face_data || null,
          },
          amount,
          note,
          qrId: parsedQr.id,
        })
      } catch (dbError) {
        console.error("[v0] DB error scanning QR:", dbError)
      }
    }

    // Fallback response
    return NextResponse.json({
      success: true,
      type,
      targetUser: { id: userId },
      amount,
      note,
      qrId: parsedQr.id,
    })
  } catch (error: any) {
    console.error("[v0] QR scan error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
