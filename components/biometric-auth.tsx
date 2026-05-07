"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Fingerprint, CheckCircle, AlertCircle, Loader2, Shield } from "lucide-react"
import { FingerprintAuth } from "./fingerprint-auth"
import { useToast } from "@/hooks/use-toast"

interface BiometricAuthProps {
  onFingerprint?: (userId: string) => void
  onFaceId?: (userId: string) => void
  onError?: (error: string) => void
  userId?: string
  requireRealBiometrics?: boolean
  registrationMode?: boolean
  autoStartCamera?: boolean
  mode?: "register" | "verify"
  onComplete?: (data: { faceRegistered: boolean; fingerprintRegistered: boolean }) => void
}

export function BiometricAuth({
  onFingerprint,
  onFaceId,
  onError,
  userId = "",
  requireRealBiometrics = false,
  registrationMode = false,
  autoStartCamera = false,
  mode = "verify",
  onComplete,
}: BiometricAuthProps) {
  const { toast } = useToast()
  const [activeMethod, setActiveMethod] = useState<"fingerprint" | null>(null)
  const [fingerprintVerified, setFingerprintVerified] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const callbackCalledRef = useRef(false)

  const effectiveUserId =
    userId ||
    (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("currentUser") || "{}").id : "") ||
    "default_user"

  useEffect(() => {
    callbackCalledRef.current = false
  }, [userId])

  const triggerSuccessCallback = useCallback(
    (type: "fingerprint") => {
      if (callbackCalledRef.current) {
        return
      }
      callbackCalledRef.current = true

      if (type === "fingerprint" && onFingerprint) {
        onFingerprint(effectiveUserId)
      }

      if (onComplete) {
        onComplete({
          faceRegistered: false,
          fingerprintRegistered: type === "fingerprint" || fingerprintVerified,
        })
      }
    },
    [effectiveUserId, onFingerprint, onComplete, fingerprintVerified],
  )

  const handleFingerprintSuccess = useCallback(() => {
    setFingerprintVerified(true)
    setActiveMethod(null)
    setProgress(100)

    toast({
      title: "Fingerprint Verified!",
      description: "Authentication completed",
      variant: "default",
    })

    triggerSuccessCallback("fingerprint")
  }, [toast, triggerSuccessCallback])

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setIsProcessing(false)
    setProgress(0)

    toast({
      title: "Verification Error",
      description: errorMessage,
      variant: "destructive",
    })

    if (onError) {
      onError(errorMessage)
    }
  }

  const startFingerprintVerification = () => {
    setError(null)
    callbackCalledRef.current = false
    setActiveMethod("fingerprint")
  }

  const cancelVerification = () => {
    setActiveMethod(null)
    setError(null)
    setProgress(0)
  }

  if (activeMethod === "fingerprint") {
    return (
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="space-y-4">
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Verifying fingerprint...</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <FingerprintAuth
              onSuccess={handleFingerprintSuccess}
              onError={handleError}
              userId={effectiveUserId}
              mode="verify"
            />

            <Button variant="outline" onClick={cancelVerification} className="w-full bg-transparent">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Processing...</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      <div className="grid gap-4">
        {/* Fingerprint Verification Button */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${fingerprintVerified ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-border"}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${fingerprintVerified ? "bg-green-100 dark:bg-green-900" : "bg-blue-100 dark:bg-blue-900"}`}
                >
                  <Fingerprint
                    className={`h-6 w-6 ${fingerprintVerified ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Fingerprint</h3>
                  <p className="text-sm text-muted-foreground">
                    {fingerprintVerified
                      ? "Fingerprint verified successfully"
                      : "Verify your fingerprint for quick access"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {fingerprintVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Button
                    onClick={startFingerprintVerification}
                    disabled={isProcessing}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Biometric Verification Required</AlertTitle>
          <AlertDescription>Verify your identity using fingerprint to complete the payment.</AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
