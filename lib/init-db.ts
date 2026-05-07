import { initDatabase } from "./db"

export async function initializeDatabase() {
  try {
    console.log("[v0] Initializing database...")
    const result = initDatabase()
    console.log("[v0]", result.message)
    return { success: true, message: "Database initialized successfully" }
  } catch (error) {
    console.error("[v0] Database initialization failed:", error)
    return { success: false, message: `Database initialization failed: ${error}` }
  }
}

export async function runInitialization() {
  if (typeof window === "undefined") {
    const result = await initializeDatabase()
    console.log(result.message)
    return result
  }
  return { success: false, message: "Cannot run on client" }
}
