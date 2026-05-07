import { type NextRequest, NextResponse } from "next/server"
import { searchUsers } from "@/lib/neon-db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        users: [],
      })
    }

    const users = await searchUsers(query)

    return NextResponse.json({
      success: true,
      users: users.map((u: any) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        mobile: u.mobile,
        username: u.username,
      })),
    })
  } catch (error: any) {
    console.error("[v0] Error searching users:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
