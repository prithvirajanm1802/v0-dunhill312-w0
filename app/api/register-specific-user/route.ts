import { NextResponse } from "next/server"
import { registerSpecificUser } from "@/app/actions/biometric-actions"

export async function POST(request: Request) {
  try {
    const { mobile, name, biometricData } = await request.json()

    // Validate input
    if (!mobile || !name) {
      return NextResponse.json({ success: false, message: "Mobile number and name are required" }, { status: 400 })
    }

    // Check if this is the specific user we want to register
    if (mobile === "9945684638" && name === "Prithvi") {
      // Register the specific user
      const result = await registerSpecificUser(mobile, name, biometricData)

      if (result.success) {
        // Create user in localStorage (client-side will handle this)
        return NextResponse.json({
          success: true,
          message: result.message,
          userId: result.userId,
        })
      } else {
        return NextResponse.json({ success: false, message: result.message }, { status: 500 })
      }
    } else {
      // For any other user, proceed with normal registration
      return NextResponse.json({
        success: true,
        message: "User registration request received",
      })
    }
  } catch (error) {
    console.error("Error in register-specific-user API:", error)
    return NextResponse.json({ success: false, message: "An error occurred during registration" }, { status: 500 })
  }
}
