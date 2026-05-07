import { NextResponse } from "next/server"

export async function GET() {
  // Return simple mock connection
  return NextResponse.json({
    success: true,
    message: "Using mock database",
    details: {
      host: "mock",
      version: "1.0.0",
      uptime: 0,
    },
  })
}

export async function POST() {
  return GET()
}
