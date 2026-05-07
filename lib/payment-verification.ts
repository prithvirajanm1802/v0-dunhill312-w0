import { dbService } from "./db"
import { sessionManager } from "./session-manager"
import { crossDeviceSync } from "./cross-device-sync"
import crypto from "crypto"

export interface PaymentRequest {
  id: string
  userId: string
  amount: number
  method: "upi" | "card" | "netbanking" | "wallet" | "crypto"
  service: string
  serviceType: string
  metadata: Record<string, any>
  timestamp: string
}

export interface VerificationStep {
  step: "payment-method" | "otp" | "biometric" | "confirmation" | "complete"
  completed: boolean
  timestamp: string
}

export interface VerificationRecord {
  id: string
  paymentId: string
  userId: string
  verificationType: "fingerprint" | "face" | "pin"
  deviceId: string
  deviceName: string
  ipAddress: string
  userAgent: string
  status: "success" | "failed"
  errorMessage?: string
  timestamp: string
}

export function generateDeviceId(userAgent: string, ipAddress: string): string {
  const combined = `${userAgent}:${ipAddress}`
  return crypto.createHash("sha256").update(combined).digest("hex").substring(0, 32)
}

export function hashSensitiveData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex").substring(0, 16)
}

export function createVerificationRecord(
  paymentId: string,
  userId: string,
  verificationType: "fingerprint" | "face" | "pin",
  deviceId: string,
  deviceName: string,
  ipAddress: string,
  userAgent: string,
  status: "success" | "failed",
  errorMessage?: string,
): VerificationRecord {
  return {
    id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    paymentId,
    userId,
    verificationType,
    deviceId,
    deviceName,
    ipAddress,
    userAgent,
    status,
    errorMessage,
    timestamp: new Date().toISOString(),
  }
}

class PaymentVerificationService {
  private activeVerifications: Map<string, PaymentRequest> = new Map()
  private verificationSteps: Map<string, VerificationStep[]> = new Map()

  async initiatePayment(request: PaymentRequest): Promise<{ verificationId: string }> {
    // Validate user session
    const session = await sessionManager.getSession()
    if (!session) {
      throw new Error("Authentication required")
    }

    request.userId = session.userId
    request.timestamp = new Date().toISOString()

    // Store verification request
    this.activeVerifications.set(request.id, request)
    this.verificationSteps.set(request.id, [])

    // Log verification initiation
    await dbService.logAudit({
      action: "payment_initiated",
      paymentId: request.id,
      service: request.service,
      amount: request.amount,
      timestamp: new Date().toISOString(),
    })

    return { verificationId: request.id }
  }

  async verifyPaymentMethod(verificationId: string, method: string): Promise<{ otpSent: boolean }> {
    const request = this.activeVerifications.get(verificationId)
    if (!request) {
      throw new Error("Verification not found")
    }

    // Add step completion
    this.recordStep(verificationId, "payment-method")

    // Send OTP based on method
    const otpSent = await this.sendOTP(request.userId, method)

    return { otpSent }
  }

  async verifyOTP(verificationId: string, otp: string): Promise<{ valid: boolean }> {
    const request = this.activeVerifications.get(verificationId)
    if (!request) {
      throw new Error("Verification not found")
    }

    // Validate OTP (mock implementation)
    const isValid = otp.length === 6 && /^\d+$/.test(otp)

    if (isValid) {
      this.recordStep(verificationId, "otp")
    }

    return { valid: isValid }
  }

  async verifyBiometric(verificationId: string, biometricType: "face" | "fingerprint"): Promise<{ verified: boolean }> {
    const request = this.activeVerifications.get(verificationId)
    if (!request) {
      throw new Error("Verification not found")
    }

    // Check if user has biometric registered
    const session = await sessionManager.getSession()
    if (!session) {
      throw new Error("Session expired")
    }

    // Mock biometric verification
    const verified = true

    if (verified) {
      this.recordStep(verificationId, "biometric")
    }

    return { verified }
  }

  async confirmPayment(verificationId: string): Promise<{ confirmed: boolean; transactionId: string }> {
    const request = this.activeVerifications.get(verificationId)
    if (!request) {
      throw new Error("Verification not found")
    }

    // Validate all steps completed
    const steps = this.verificationSteps.get(verificationId) || []
    if (steps.length < 2) {
      throw new Error("Verification incomplete")
    }

    this.recordStep(verificationId, "confirmation")

    // Process payment
    const transaction = {
      id: `txn_${Date.now()}`,
      paymentId: request.id,
      userId: request.userId,
      amount: request.amount,
      method: request.method,
      service: request.service,
      serviceType: request.serviceType,
      status: "completed",
      timestamp: new Date().toISOString(),
      metadata: request.metadata,
    }

    // Save transaction
    await dbService.addTransaction(transaction)

    // Sync across devices
    await crossDeviceSync.syncData({
      type: "transaction",
      data: transaction,
    })

    this.recordStep(verificationId, "complete")

    // Clean up
    this.activeVerifications.delete(verificationId)

    return {
      confirmed: true,
      transactionId: transaction.id,
    }
  }

  private recordStep(verificationId: string, step: VerificationStep["step"]): void {
    const steps = this.verificationSteps.get(verificationId) || []
    steps.push({
      step,
      completed: true,
      timestamp: new Date().toISOString(),
    })
    this.verificationSteps.set(verificationId, steps)
  }

  private async sendOTP(userId: string, method: string): Promise<boolean> {
    // Mock OTP sending
    console.log(`[Payment Verification] Sending OTP via ${method} for user ${userId}`)
    return true
  }

  getVerificationStatus(verificationId: string): VerificationStep[] | null {
    return this.verificationSteps.get(verificationId) || null
  }
}

export const paymentVerification = new PaymentVerificationService()
