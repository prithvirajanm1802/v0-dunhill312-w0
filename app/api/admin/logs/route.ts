import { type NextRequest, NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sql = getNeon()

    if (!sql) {
      return NextResponse.json({
        success: false,
        error: "Database not connected",
        logs: [],
      })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const actionType = searchParams.get("actionType")

    let logs
    if (actionType) {
      logs = await sql`
        SELECT 
          id,
          action_type,
          resource_type,
          resource_id,
          admin_id,
          details,
          ip_address,
          user_agent,
          severity,
          created_at
        FROM admin_logs
        WHERE action_type = ${actionType}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
    } else {
      logs = await sql`
        SELECT 
          id,
          action_type,
          resource_type,
          resource_id,
          admin_id,
          details,
          ip_address,
          user_agent,
          severity,
          created_at
        FROM admin_logs
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
    }

    return NextResponse.json({
      success: true,
      logs: logs.map((log: any) => ({
        id: log.id,
        type: log.action_type,
        action: log.action_type,
        resourceType: log.resource_type,
        resourceId: log.resource_id,
        adminId: log.admin_id,
        userId: log.details?.userId || log.resource_id,
        details: log.details,
        timestamp: new Date(log.created_at).getTime(),
        success: true,
        severity: log.severity,
      })),
      count: logs.length,
      source: "neon",
    })
  } catch (error) {
    console.error("[v0] Get admin logs error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve logs",
        logs: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = getNeon()

    if (!sql) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not connected",
        },
        { status: 500 },
      )
    }

    const { adminId, actionType, resourceType, resourceId, details, severity } = await request.json()

    if (!adminId || !actionType || !resourceType || !resourceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const ipAddress = request.headers.get("x-forwarded-for") || "0.0.0.0"
    const userAgent = request.headers.get("user-agent") || ""

    const result = await sql`
      INSERT INTO admin_logs (
        admin_id,
        action_type,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        severity,
        created_at
      ) VALUES (
        ${adminId},
        ${actionType},
        ${resourceType},
        ${resourceId},
        ${JSON.stringify(details || {})}::jsonb,
        ${ipAddress},
        ${userAgent},
        ${severity || "low"},
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      log: result[0],
      storedIn: "neon",
    })
  } catch (error) {
    console.error("[v0] Create admin log error:", error)
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 })
  }
}
