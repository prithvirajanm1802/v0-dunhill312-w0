// Temporarily disable all MongoDB imports to fix build
// This file will be re-enabled once webpack config is fixed

export async function getMongoClient() {
  throw new Error("MongoDB temporarily disabled - using localStorage fallback")
}

export async function getMongoDb() {
  throw new Error("MongoDB temporarily disabled - using localStorage fallback")
}

export async function closeMongoConnection() {
  // No-op
}
