export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"
import { getStripe } from "@/lib/stripe"

export async function GET() {
  const results = {
    neon: {
      connected: false,
      message: "",
      tables: [] as string[],
    },
    stripe: {
      connected: false,
      message: "",
    },
    timestamp: new Date().toISOString(),
  }

  // Test Neon Connection
  try {
    const sql = getNeon()
    if (!sql) {
      results.neon.message = "DATABASE_URL not configured"
    } else {
      // Try to query the database
      const tablesResult = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `
      results.neon.connected = true
      results.neon.tables = tablesResult.map((row: any) => row.table_name)
      results.neon.message = `Connected successfully. Found ${results.neon.tables.length} tables.`
    }
  } catch (error: any) {
    results.neon.message = `Error: ${error.message}`
  }

  // Test Stripe Connection
  try {
    const stripe = getStripe()
    if (!stripe) {
      results.stripe.message = "STRIPE_SECRET_KEY not configured"
    } else {
      // Try to retrieve the account
      const account = await stripe.accounts.retrieve()
      results.stripe.connected = true
      results.stripe.message = `Connected successfully. Account ID: ${account.id}`
    }
  } catch (error: any) {
    results.stripe.message = `Error: ${error.message}`
  }

  return NextResponse.json(results)
}
