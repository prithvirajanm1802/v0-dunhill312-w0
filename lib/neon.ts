// Neon database connection for Honeydrew Mills
import { neon } from "@neondatabase/serverless"

// Create a singleton connection
let sqlInstance: ReturnType<typeof neon> | null = null

export function getNeon() {
  if (!process.env.DATABASE_URL) {
    console.warn("[Neon] DATABASE_URL not set, database features disabled")
    return null
  }

  if (!sqlInstance) {
    sqlInstance = neon(process.env.DATABASE_URL)
    console.log("[Neon] Database connection initialized")
  }

  return sqlInstance
}

// Helper to run queries with error handling
export async function query<T = any>(queryText: string, params?: any[]): Promise<T[]> {
  const sql = getNeon()
  if (!sql) {
    throw new Error("Database not configured")
  }

  try {
    const result = await sql(queryText, params)
    return result as T[]
  } catch (error) {
    console.error("[Neon] Query error:", error)
    throw error
  }
}

// Check if database is available
export function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL
}

export async function ensurePasskeysTable() {
  const sql = getNeon()
  if (!sql) {
    console.log("[Neon] No database, using localStorage for passkeys")
    return true
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS passkeys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        credential_id TEXT UNIQUE NOT NULL,
        public_key TEXT NOT NULL,
        counter INTEGER DEFAULT 0,
        device_type VARCHAR(100),
        transports JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        last_used TIMESTAMP
      )
    `
    console.log("[Neon] Passkeys table ensured")
    return true
  } catch (error) {
    console.error("[Neon] Error ensuring passkeys table:", error)
    return false
  }
}
