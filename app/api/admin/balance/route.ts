import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Admin has infinite balance
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    balance: Number.POSITIVE_INFINITY,
    displayBalance: "∞",
    message: "Admin has unlimited funds",
  })
}
