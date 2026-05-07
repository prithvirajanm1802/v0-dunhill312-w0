import { NextResponse } from "next/server"

export async function GET() {
  // Return simple mock stats
  const mockStats = {
    success: true,
    collections: [
      { name: "users", count: 0 },
      { name: "transactions", count: 0 },
      { name: "qrCodes", count: 0 },
    ],
    totalCollections: 3,
  }

  return NextResponse.json(mockStats)
}
