"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Fingerprint, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { verifyPasskey, hasRegisteredPasskey } from "@/lib/fingerprint-auth"

interface PaymentDetails {
  amount: number
  description: string
  serviceName: string
}

interface HoneydrewPaymentVerificationProps {
  paymentDetails: PaymentDetails
  onSuccess: (result: { verified: boolean; method: string; transactionId: string }) => void
  onCancel: () => void
  userId?: string
}

export function HoneydrewPaymentVerification({
  paymentDetails,
  onSuccess,
  onCancel,
  userId,
}: HoneydrewPaymentVerificationProps) {
  const [verificationMethod, setVerificationMethod] = useState<"fingerprint" | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null)
  const [hasPasskey, setHasPasskey] = useState(false)

  useEffect(() => {
    // Get current user from session
    let foundUserId = userId || null
    try {
      const session = localStorage.getItem("honeydrew_session")
      if (session) {
        const sessionData = JSON.parse(session)
        foundUserId = sessionData.userId || sessionData.email || foundUserId
      }

      const currentUser = localStorage.getItem("honeydrew_current_user") || localStorage.getItem("currentUser")
      if (currentUser) {
        const userData = JSON.parse(currentUser)
        foundUserId = userData.id || userData.email || foundUserId
      }

      const users = JSON.parse(localStorage.getItem("honeydrew_users") || "[]")
      if (users.length > 0 && !foundUserId) {
        foundUserId = users[0].id || users[0].email
      }
    } catch {}

    setCurrentUserId(foundUserId)

    if (foundUserId) {
      setHasPasskey(hasRegisteredPasskey(foundUserId))
    }
  }, [userId])

  const handleFingerprintVerification = async () => {
    setIsVerifying(true)
    setError(null)

    try {
      if (!window.PublicKeyCredential) {
        throw new Error("Fingerprint authentication not supported")
      }

      const result = await verifyPasskey(currentUserId || "user")

      if (result.success) {
        completePayment("fingerprint")
      } else {
        throw new Error(result.message || "Fingerprint verification failed")
      }
    } catch (err: any) {
      setError(err.message || "Fingerprint verification failed")
      setIsVerifying(false)
      setVerificationMethod(null)
    }
  }

  const completePayment = (method: string) => {
    setVerificationComplete(true)
    setIsVerifying(false)

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const adminLogs = JSON.parse(localStorage.getItem("adminLogs") || "[]")
      adminLogs.push({
        timestamp: Date.now(),
        type: "payment",
        userId: currentUserId,
        action: "honeydrew_payment",
        success: true,
        details: {
          amount: paymentDetails.amount,
          service: paymentDetails.serviceName,
          method,
          transactionId,
        },
      })
      localStorage.setItem("adminLogs", JSON.stringify(adminLogs))
    } catch {}

    setTimeout(() => {
      onSuccess({ verified: true, method, transactionId })
    }, 1500)
  }

  if (verificationComplete) {
    return (
      <Card className="border-emerald-200 dark:border-slate-700">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-6 rounded-full">
              <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Payment Verified!</h3>
          <p className="text-gray-600 dark:text-slate-400">
            Rs. {paymentDetails.amount.toLocaleString()} for {paymentDetails.serviceName}
          </p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Secured by Honeydrew Mills Biometric Authentication
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
          <Shield className="h-5 w-5" />
          Honeydrew Secure Payment
        </CardTitle>
        <CardDescription>Verify with fingerprint authentication to complete payment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-emerald-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
          <p className="text-sm text-gray-600 dark:text-slate-400">{paymentDetails.description}</p>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
            Rs. {paymentDetails.amount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-500">Service: {paymentDetails.serviceName}</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!verificationMethod && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-center text-gray-700 dark:text-slate-300">
              Verify with fingerprint to continue
            </p>
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setVerificationMethod("fingerprint")
                  handleFingerprintVerification()
                }}
                className="h-24 w-full max-w-xs flex flex-col items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Fingerprint className="h-8 w-8" />
                <span className="text-sm font-medium">Verify with Fingerprint</span>
                {hasPasskey && <span className="text-xs">Ready</span>}
              </Button>
            </div>
          </div>
        )}

        {verificationMethod === "fingerprint" && isVerifying && (
          <div className="text-center space-y-4 py-6">
            <div className="flex justify-center">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-6 rounded-full animate-pulse">
                <Fingerprint className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-emerald-800 dark:text-emerald-300">Touch your fingerprint sensor</p>
              <p className="text-sm text-gray-600 dark:text-slate-400">Verifying via Google Password Manager...</p>
              <Loader2 className="h-5 w-5 mx-auto animate-spin text-emerald-600" />
            </div>
            <Button
              onClick={() => {
                setVerificationMethod(null)
                setIsVerifying(false)
              }}
              variant="outline"
              className="bg-transparent"
            >
              Cancel
            </Button>
          </div>
        )}

        <Button onClick={onCancel} variant="outline" className="w-full bg-transparent" disabled={isVerifying}>
          Cancel Payment
        </Button>

        <p className="text-xs text-center text-gray-500 dark:text-slate-500">
          Powered by Honeydrew Mills Secure Biometric System
        </p>
      </CardContent>
    </Card>
  )
}
