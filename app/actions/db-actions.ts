"use server"

import { revalidatePath } from "next/cache"

// Mock database functions with no imports
export async function getDatabaseStatus() {
  return {
    success: true,
    message: "Using mock database",
    type: "mock",
  }
}

export async function initializeDatabase() {
  return {
    success: true,
    message: "Database initialized successfully",
  }
}

export async function testDatabaseConnection() {
  return {
    success: true,
    message: "Successfully connected to mock database!",
  }
}

export async function getDatabaseStats() {
  return {
    success: true,
    message: "Database stats retrieved",
    stats: {
      users: 0,
      transactions: 0,
      qrCodes: 0,
    },
  }
}

export async function refreshDatabaseStats() {
  revalidatePath("/admin-dashboard")
  return { success: true }
}

// Mock data functions
export async function getUserCount() {
  return { success: true, count: 0 }
}

export async function getTransactionCount() {
  return { success: true, count: 0 }
}

export async function getQRCodeCount() {
  return { success: true, count: 0 }
}

export async function getBiometricDataCount() {
  return { success: true, count: 0 }
}
