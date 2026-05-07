"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle, AlertCircle, Fingerprint, Eye } from "lucide-react"

interface PaymentVerificationModalProps {
  paymentId: string
  amount: number
  merchant: string
  userId: string
  onVerified?: (result: any) => void
  onCancelled?: () => void
}

export function PaymentVerificationModal({
  paymentId,
  amount,
  merchant,
  userId,
  onVerified,
  onCancelled,
}: PaymentVerificationModalProps) {
  const [verificationMethod, setVerificationMethod] = useState<"fingerprint" | "face" | "pin">("fingerprint")
  const [pinInput, setPinInput] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<"idle" | "success" | "failed">("idle")
  const [error, setError] = useState<string | null>(null)

  const verifyFingerprint = async () => {
    try {
      setIsVerifying(true)
      setError(null)

      const response = await fetch("/api/verify/fingerprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          userId,
          fingerprintData: "simulated_fingerprint_data",
          deviceName: navigator.userAgent,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setVerificationResult("success")
        onVerified?.(data)
      } else {
        setVerificationResult("failed")
        setError(data.message || "Fingerprint verification failed")
      }
    } catch (err) {
      setVerificationResult("failed")
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  const verifyFace = async () => {
    try {
      setIsVerifying(true)
      setError(null)

      const response = await fetch("/api/verify/face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          userId,
          faceData: "simulated_face_data",
          liveness: { confidence: 0.95 },
          deviceName: navigator.userAgent,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setVerificationResult("success")
        onVerified?.(data)
      } else {
        setVerificationResult("failed")
        setError(data.message || "Face verification failed")
      }
    } catch (err) {
      setVerificationResult("failed")
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  const verifyPIN = async () => {
    try {
      setIsVerifying(true)
      setError(null)

      if (!pinInput || pinInput.length !== 4) {
        setError("PIN must be 4 digits")
        setIsVerifying(false)
        return
      }

      const response = await fetch("/api/verify/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          userId,
          pin: pinInput,
          deviceName: navigator.userAgent,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setVerificationResult("success")
        onVerified?.(data)
      } else {
        setVerificationResult("failed")
        setError(data.message || "PIN verification failed")
      }
    } catch (err) {
      setVerificationResult("failed")
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Payment</CardTitle>
          <CardDescription>Authenticate to complete payment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Summary */}
          <div className="space-y-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between text-sm">
              <span>Amount:</span>
              <span className="font-semibold">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Merchant:</span>
              <span className="font-semibold">{merchant}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Payment ID:</span>
              <span className="font-mono text-xs">{paymentId.substring(0, 8)}...</span>
            </div>
          </div>

          {verificationResult === "idle" && (
            <>
              {/* Verification Method Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Choose Verification Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setVerificationMethod("fingerprint")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      verificationMethod === "fingerprint"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <Fingerprint className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs">Fingerprint</span>
                  </button>
                  <button
                    onClick={() => setVerificationMethod("face")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      verificationMethod === "face"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <Eye className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs">Face ID</span>
                  </button>
                  <button
                    onClick={() => setVerificationMethod("pin")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      verificationMethod === "pin"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <span className="text-lg font-bold">****</span>
                    <span className="text-xs block">PIN</span>
                  </button>
                </div>
              </div>

              {/* PIN Input */}
              {verificationMethod === "pin" && (
                <div>
                  <label className="text-sm font-medium">Enter 4-Digit PIN</label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="****"
                    className="font-mono text-center text-xl tracking-widest"
                  />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={onCancelled} className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button
                  onClick={
                    verificationMethod === "fingerprint"
                      ? verifyFingerprint
                      : verificationMethod === "face"
                        ? verifyFace
                        : verifyPIN
                  }
                  disabled={isVerifying || (verificationMethod === "pin" && pinInput.length !== 4)}
                  className="flex-1"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    `Verify with ${verificationMethod === "pin" ? "PIN" : verificationMethod}`
                  )}
                </Button>
              </div>
            </>
          )}

          {verificationResult === "success" && (
            <div className="space-y-4 text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <p className="font-semibold text-green-700 dark:text-green-300">Verification Successful</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Payment ready to process</p>
              </div>
            </div>
          )}

          {verificationResult === "failed" && (
            <div className="space-y-4 text-center py-6">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-300">Verification Failed</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{error || "Please try again"}</p>
              </div>
              <Button onClick={() => setVerificationResult("idle")} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
