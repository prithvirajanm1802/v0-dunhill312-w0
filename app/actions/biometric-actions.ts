"use server"

import { revalidatePath } from "next/cache"
import { sanitizeMessage } from "@/lib/message-sanitizer"
import { dbService } from "@/lib/db"

export async function registerSpecificUser(mobile: string, name: string, biometricData?: any) {
  try {
    console.log("[v0] Registering user:", mobile)

    // Check if user already exists in localStorage
    const existingUser = dbService.getUserByMobile(mobile)
    if (existingUser) {
      return {
        success: false,
        message: "User with this mobile number already exists",
      }
    }

    // Create a new user in localStorage
    const newUser = {
      fullName: name,
      mobile: mobile,
      username: mobile,
      password: "password123",
      balance: 1000,
      createdAt: new Date().toISOString(),
    }

    const createdUser = dbService.createUser(newUser)

    // If biometric data is provided, save it
    if (biometricData) {
      dbService.saveBiometricData({
        userId: createdUser.id,
        fingerprint: !!biometricData.fingerprint,
        face: !!biometricData.face,
        fingerprintData: biometricData.fingerprintData || "",
        faceData: biometricData.faceData || "",
        createdAt: new Date().toISOString(),
      })
    }

    revalidatePath("/dashboard")

    return {
      success: true,
      message: "User registered successfully",
      userId: createdUser.id,
    }
  } catch (error: any) {
    console.error("[v0] User registration failed:", error)
    return {
      success: false,
      message: sanitizeMessage(error?.message || "Registration failed"),
    }
  }
}

export async function saveBiometricData(userId: string, biometricType: "face" | "fingerprint", encodedData: string) {
  try {
    if (!userId) {
      return {
        success: false,
        message: "User ID is required",
      }
    }

    console.log("[v0] Saving biometric data for user:", userId)

    // Save to localStorage
    const biometricRecord = {
      userId,
      type: biometricType,
      encodedData,
      timestamp: Date.now(),
    }

    const records = dbService.getBiometricData()[userId] || []
    records.push(biometricRecord)

    const allBiometric = dbService.getBiometricData()
    allBiometric[userId] = records

    if (typeof window !== "undefined") {
      localStorage.setItem("biometricData", JSON.stringify(allBiometric))
    }

    return {
      success: true,
      message: `${biometricType} data saved successfully`,
    }
  } catch (error: any) {
    console.error("[v0] Failed to save biometric data:", error)
    return {
      success: false,
      message: sanitizeMessage(error?.message || "Failed to save biometric data"),
    }
  }
}

export async function getBiometricData(userId: string, biometricType: "face" | "fingerprint") {
  try {
    if (!userId) {
      return {
        success: false,
        message: `No ${biometricType} data found for this user`,
      }
    }

    console.log("[v0] Retrieving biometric data for user:", userId)

    const allBiometric = dbService.getBiometricData()
    const biometricData = allBiometric[userId]?.find((b: any) => b.type === biometricType)

    if (!biometricData) {
      return {
        success: false,
        message: `No ${biometricType} data found for this user`,
      }
    }

    return {
      success: true,
      message: `${biometricType} data retrieved successfully`,
      data: biometricData,
    }
  } catch (error: any) {
    console.error("[v0] Failed to retrieve biometric data:", error)
    return {
      success: false,
      message: sanitizeMessage(error?.message || "Failed to retrieve biometric data"),
    }
  }
}

export async function checkBiometricStatus(userId: string) {
  try {
    if (!userId) {
      return {
        success: false,
        message: "User ID is required",
      }
    }

    const allBiometric = dbService.getBiometricData()
    const biometricData = allBiometric[userId]

    return {
      success: true,
      fingerprintRegistered: !!biometricData?.find((b: any) => b.type === "fingerprint"),
      faceRegistered: !!biometricData?.find((b: any) => b.type === "face"),
    }
  } catch (error: any) {
    console.error("[v0] Failed to check biometric status:", error)
    return {
      success: false,
      fingerprintRegistered: false,
      faceRegistered: false,
    }
  }
}
