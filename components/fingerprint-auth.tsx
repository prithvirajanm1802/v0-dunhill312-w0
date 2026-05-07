"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Fingerprint, CheckCircle, AlertCircle, Loader2, Shield, User, Crown } from "lucide-react"
import { registerPasskey, verifyPasskey } from "@/lib/fingerprint-auth"

interface FingerprintAuthProps {
  onSuccess: (fingerprintData: any) => void
  onError: (error: string) => void
  userId: string
  mode: "register" | "verify"
  userName?: string
}

export function FingerprintAuth({ onSuccess, onError, userId, mode, userName }: FingerprintAuthProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [scanComplete, setScanComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState("")
  const [confidence, setConfidence] = useState(0)
  const [showAnimation, setShowAnimation] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const successCalledRef = useRef(false)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const startFingerprintAuth = async () => {
    setIsScanning(true)
    setProgress(0)
    setError(null)
    setScanComplete(false)
    setShowAnimation(true)
    successCalledRef.current = false
    setCurrentStep(`Initializing fingerprint ${mode === "verify" ? "verification" : "registration"}...`)

    try {
      setProgress(20)
      setCurrentStep("Checking device compatibility...")

      const compat = await import("@/lib/google-passkey-utils").then((m) => m.getPasskeyCompatibility())

      if (!compat.isSupported) {
        throw new Error(
          `Passkeys are not supported on this browser. Please use Chrome, Safari, Firefox, or Edge with biometric authentication enabled.`,
        )
      }

      setProgress(40)
      setCurrentStep(mode === "register" ? "Waiting for biometric prompt..." : "Waiting for device passkey...")

      if (mode === "register") {
        const res = await registerPasskey(userId, userName || `user_${userId}`, false)

        if (!res.success) {
          throw new Error(res.message || "Registration failed")
        }

        setProgress(90)
        setCurrentStep("Saving passkey...")
        await new Promise((r) => setTimeout(r, 300))
        setProgress(100)
        setScanComplete(true)
        setCurrentStep("Passkey registered successfully!")

        if (!successCalledRef.current) {
          successCalledRef.current = true
          setTimeout(() => {
            onSuccess({ userId, method: "passkey", credentialId: res.credentialId })
          }, 500)
        }
      } else {
        const res = await verifyPasskey(userId)

        if (!res.success) {
          throw new Error(res.message || "Verification failed")
        }

        setProgress(100)
        setScanComplete(true)
        setCurrentStep("Fingerprint verified!")

        if (!successCalledRef.current) {
          successCalledRef.current = true
          setTimeout(() => {
            onSuccess({ userId, method: "passkey" })
          }, 500)
        }
      }
    } catch (e: any) {
      const errorMsg = e?.message || "Fingerprint passkey flow failed"
      setError(errorMsg)
      onError(errorMsg)
      setProgress(0)
    } finally {
      setIsScanning(false)
      setShowAnimation(false)
    }
  }

  const stopProcess = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsScanning(false)
    setShowAnimation(false)
  }

  return (
    <Card className="w-full border-emerald-200 dark:border-emerald-800">
      <CardContent className="p-6">
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Fingerprint className="h-5 w-5 text-emerald-600" />
              <span className="font-medium text-foreground">
                Fingerprint {mode === "register" ? "Registration" : "Verification"}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>User: {userName || userId}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === "register"
                ? "Register your fingerprint for secure authentication"
                : "Verify your identity with your registered fingerprint"}
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="relative">
              <div
                className={`w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                  scanComplete
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : isScanning
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 animate-pulse"
                      : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                }`}
              >
                {scanComplete ? (
                  <CheckCircle className="h-12 w-12 text-green-600" />
                ) : isScanning ? (
                  <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
                ) : (
                  <Fingerprint className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                )}
              </div>

              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full border-4 border-emerald-200 dark:border-emerald-700 animate-ping opacity-50"></div>
                </div>
              )}

              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg">
                  <Crown className="h-3 w-3" />
                  Honeydrew Mills
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <h3 className="font-medium text-lg text-foreground">
                {scanComplete
                  ? mode === "register"
                    ? "Fingerprint Registered!"
                    : "Fingerprint Verified!"
                  : isScanning
                    ? `${mode === "register" ? "Registering" : "Verifying"} Fingerprint...`
                    : `${mode === "register" ? "Register" : "Verify"} Your Fingerprint`}
              </h3>

              <p className="text-sm text-muted-foreground">
                {scanComplete
                  ? mode === "register"
                    ? "Your fingerprint has been securely registered"
                    : currentStep
                  : isScanning
                    ? currentStep
                    : "Touch the fingerprint sensor when ready"}
              </p>
            </div>

            {isScanning && (
              <div className="space-y-3">
                <Progress value={progress} className="w-full h-2" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">{currentStep}</p>
                  <p>{progress}% Complete</p>
                </div>
              </div>
            )}

            {!isScanning && !scanComplete && (
              <Button onClick={startFingerprintAuth} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Fingerprint className="h-4 w-4 mr-2" />
                Start {mode === "register" ? "Registration" : "Verification"}
              </Button>
            )}

            {isScanning && !scanComplete && (
              <Button onClick={stopProcess} variant="outline" className="w-full bg-transparent">
                Cancel
              </Button>
            )}

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  {mode === "register"
                    ? "A secure passkey will be created for this account"
                    : "Using your device's native passkey for verification"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>• Place your finger firmly on the sensor</p>
            <p>• Keep your finger still during scanning</p>
            <p>• Your biometric data is encrypted and secure</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default FingerprintAuth
