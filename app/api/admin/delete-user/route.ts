import { type NextRequest, NextResponse } from "next/server"
import { deleteUser } from "@/lib/neon-db"
import { logAdminAction } from "@/lib/admin-logging"

export async function POST(request: NextRequest) {
  try {
    const { userId, adminUsername } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    const result = await deleteUser(userId)

    if (result.success) {
      await logAdminAction({
        action: "delete_user",
        adminUsername: adminUsername || "admin",
        userId: userId,
        details: {
          deletedUser: result.user,
          timestamp: new Date().toISOString(),
        },
      })

      return NextResponse.json({
        success: true,
        message: "User deleted permanently from database",
        user: result.user,
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Delete user error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 })
  }
}
