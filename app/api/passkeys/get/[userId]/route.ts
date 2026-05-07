import { NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  try {
    const sql = getNeon()
    if (!sql) {
      console.log("[v0] Passkey retrieval: DATABASE_URL not configured, using localStorage fallback")
      return NextResponse.json(
        {
          success: true,
          message: "Using local storage - no persistent database configured",
          fallback: true,
        },
        { status: 200 },
      )
    }

    const rows = await sql`
      SELECT credential_id, public_key, device_type, last_used FROM passkeys WHERE user_id = ${params.userId}::uuid LIMIT 1
    `.catch(() => [])

    if (!rows?.length) {
      // Also try user_passkeys table with proper UUID casting
      const userPasskeys = await sql`
        SELECT credential_id, public_key, device_type, last_used FROM user_passkeys WHERE user_id = ${params.userId}::uuid LIMIT 1
      `.catch(() => [])

      if (!userPasskeys?.length) {
        return NextResponse.json({ success: false, message: "No passkey found for this user" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        credentialId: userPasskeys[0].credential_id,
        publicKey: userPasskeys[0].public_key,
        deviceType: userPasskeys[0].device_type,
        lastUsed: userPasskeys[0].last_used,
      })
    }

    return NextResponse.json({
      success: true,
      credentialId: rows[0].credential_id,
      publicKey: rows[0].public_key,
      deviceType: rows[0].device_type,
      lastUsed: rows[0].last_used,
    })
  } catch (error: any) {
    console.error("[v0] Passkey get API error:", error)
    return NextResponse.json({ success: false, message: error?.message || "Internal error" }, { status: 500 })
  }
}
