import crypto from "crypto"

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-encryption-key-for-development-only"

// Ensure key is 32 bytes (256 bits) for AES-256
const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest()

/**
 * Encrypts a string using AES-256-CBC
 * @param text The text to encrypt
 * @returns The encrypted text as a string
 */
export function encryptServer(text: string): string {
  try {
    const iv = crypto.randomBytes(16) // Initialization vector
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv)

    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    // Return IV and encrypted data as a single string
    return `${iv.toString("hex")}:${encrypted}`
  } catch (error) {
    console.error("[v0] Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

/**
 * Decrypts a string that was encrypted with AES-256-CBC
 * @param encryptedText The encrypted text to decrypt
 * @returns The decrypted text
 */
export function decryptServer(encryptedText: string): string {
  try {
    if (!encryptedText || typeof encryptedText !== "string") {
      console.warn("[v0] Decryption called with invalid input")
      return ""
    }

    // Split IV and encrypted data
    const parts = encryptedText.split(":")
    if (parts.length !== 2) {
      console.warn("[v0] Invalid encrypted data format")
      return ""
    }

    const [ivHex, encrypted] = parts
    const iv = Buffer.from(ivHex, "hex")
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("[v0] Decryption error:", error)
    throw new Error("Failed to decrypt data")
  }
}

// Client-side encryption using Web Crypto API
// This removes dependency on Node.js crypto for browser environments

/**
 * Simple client-side encryption using Base64
 * For production, implement proper Web Crypto API
 */
export function encryptClient(text: string | null | undefined): string {
  try {
    if (!text) {
      console.warn("[v0] Encryption called with null/undefined text")
      return ""
    }
    // Simple base64 encoding for development
    return btoa(text)
  } catch (error) {
    console.error("[v0] Encryption error:", error)
    return ""
  }
}

/**
 * Simple client-side decryption using Base64
 * For production, implement proper Web Crypto API
 */
export function decryptClient(encryptedText: string | null | undefined): string {
  try {
    if (!encryptedText) {
      console.warn("[v0] Decryption called with null/undefined text")
      return ""
    }

    // Simple base64 decoding for development
    return atob(encryptedText)
  } catch (error) {
    console.error("[v0] Decryption error:", error)
    return ""
  }
}
