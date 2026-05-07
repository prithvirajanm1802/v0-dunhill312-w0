import { NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const sql = getNeon()

    if (!sql) {
      return NextResponse.json({
        success: false,
        error: "Database not connected",
        users: [],
        stats: null,
      })
    }

    const users = await sql`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.mobile,
        u.username,
        u.balance,
        u.is_active,
        u.face_registered,
        u.fingerprint_registered,
        u.face_image,
        u.created_at,
        u.updated_at,
        u.last_login_at,
        COUNT(DISTINCT s.id) as active_sessions
      FROM honeydrew_users u
      LEFT JOIN user_sessions s ON s.user_id = u.id AND s.is_active = true
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `

    const statsResult = await sql`
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT u.id) FILTER (WHERE u.is_active = true) as active_users,
        COUNT(DISTINCT u.id) FILTER (WHERE u.fingerprint_registered = true) as fingerprint_registered,
        COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = true) as active_sessions,
        COUNT(DISTINCT q.id) as qr_codes_generated,
        COALESCE(SUM(u.balance), 0) as total_balance
      FROM honeydrew_users u
      LEFT JOIN user_sessions s ON s.user_id = u.id AND s.is_active = true
      LEFT JOIN qr_codes q ON q.user_id = u.id
    `

    const stats = statsResult[0] || {}

    return NextResponse.json({
      success: true,
      users: users.map((u: any) => ({
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        mobile: u.mobile,
        username: u.username,
        balance: Number(u.balance || 0),
        isActive: u.is_active,
        faceRegistered: u.face_registered,
        fingerprintRegistered: u.fingerprint_registered,
        faceImage: u.face_image,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        lastLoginAt: u.last_login_at,
        activeSessions: Number(u.active_sessions || 0),
      })),
      stats: {
        users: {
          total_users: Number(stats.total_users || 0),
          active_users: Number(stats.active_users || 0),
          fingerprint_registered: Number(stats.fingerprint_registered || 0),
          active_sessions: Number(stats.active_sessions || 0),
          qr_codes_generated: Number(stats.qr_codes_generated || 0),
          total_balance: Number(stats.total_balance || 0),
        },
      },
      dbConnected: true,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        users: [],
        stats: null,
        dbConnected: false,
      },
      { status: 500 },
    )
  }
}
