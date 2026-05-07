"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BiometricAuth } from "./biometric-auth"
import { processPayment, getUserBalance } from "@/lib/payment-service"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, XCircle, Wallet } from "lucide-react"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (result: { transactionId: string; newBalance: number }) => void
  amount: number
  recipient: string
  category: string
  description?: string
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  amount,
  recipient,
  category,
  description,
}: PaymentModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<"verify" | "processing" | "success" | "error">("verify")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userBalance, setUserBalance] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [authMethod, setAuthMethod] = useState<"face" | "fingerprint" | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Load current user
      const userStr = localStorage.getItem("currentUser")
      if (userStr) {
        const user = JSON.parse(userStr)
        setCurrentUser(user)

        // Get balance (from DB or localStorage)
        getUserBalance(user.id).then((balance) => {
          setUserBalance(balance)
        })
      }
      setStep("verify")
      setError(null)
      setAuthMethod(null)
    }
  }, [isOpen])

  const handleBiometricSuccess = async (method: "face" | "fingerprint", userId: string) => {
    setAuthMethod(method)
    setStep("processing")

    // Get device ID for cross-device sync
    const deviceId = localStorage.getItem("deviceId") || `device_${Date.now()}`
    if (!localStorage.getItem("deviceId")) {
      localStorage.setItem("deviceId", deviceId)
    }

    try {
      const result = await processPayment({
        userId: currentUser?.id || userId,
        amount,
        recipient,
        category,
        authMethod: method,
        verificationScore: method === "face" ? 0.85 : 1.0,
        deviceId,
        metadata: {
          description,
          platform: navigator.platform,
          userAgent: navigator.userAgent,
        },
      })

      if (result.success) {
        setStep("success")

        // Update local user balance
        if (currentUser && result.newBalance !== undefined) {
          const updatedUser = { ...currentUser, balance: result.newBalance }
          localStorage.setItem("currentUser", JSON.stringify(updatedUser))
          setUserBalance(result.newBalance)
        }

        setTimeout(() => {
          onSuccess({
            transactionId: result.transactionId || `txn_${Date.now()}`,
            newBalance: result.newBalance || userBalance - amount,
          })
          onClose()
        }, 1500)
      } else {
        setError(result.error || "Payment failed")
        setStep("error")
      }
    } catch (err: any) {
      console.error("[v0] Payment error:", err)
      setError(err.message || "Payment processing failed")
      setStep("error")
    }
  }

  const handleCancel = () => {
    setStep("verify")
    setError(null)
    onClose()
  }

  const insufficientBalance = userBalance < amount

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "verify" && "Authentication Required"}
            {step === "processing" && "Processing Payment"}
            {step === "success" && "Payment Successful"}
            {step === "error" && "Payment Failed"}
          </DialogTitle>
          <DialogDescription>
            {step === "verify" && "Verify your identity to complete the payment"}
            {step === "processing" && "Please wait while we process your payment..."}
            {step === "success" && "Your payment has been completed successfully"}
            {step === "error" && error}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Balance and Amount Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Current Balance
              </span>
              <span className="font-medium">₹{userBalance.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Payment Amount</span>
              <span className="font-medium text-red-600">-₹{amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="text-sm font-medium">Balance After Payment</span>
              <span className={`font-bold ${insufficientBalance ? "text-red-600" : "text-green-600"}`}>
                ₹{(userBalance - amount).toLocaleString("en-IN")}
              </span>
            </div>
            {recipient && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">To</span>
                <span>{recipient}</span>
              </div>
            )}
          </div>

          {insufficientBalance && step === "verify" && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
              Insufficient balance. Please top up your wallet to continue.
            </div>
          )}

          {step === "verify" && !insufficientBalance && currentUser && (
            <BiometricAuth
              userId={currentUser.id}
              mode="verify"
              onFaceId={(userId) => handleBiometricSuccess("face", userId)}
              onFingerprint={(userId) => handleBiometricSuccess("fingerprint", userId)}
              onError={(err) => {
                setError(err)
                toast({
                  title: "Verification Failed",
                  description: err,
                  variant: "destructive",
                })
              }}
            />
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
              <p className="text-sm text-muted-foreground">
                Processing payment via {authMethod === "face" ? "Face Recognition" : "Fingerprint"}...
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <p className="text-lg font-medium text-green-600">Payment Successful!</p>
              <p className="text-sm text-muted-foreground">
                ₹{amount.toLocaleString("en-IN")} has been sent to {recipient}
              </p>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <XCircle className="h-16 w-16 text-red-600" />
              <p className="text-lg font-medium text-red-600">Payment Failed</p>
              <p className="text-sm text-muted-foreground text-center">{error}</p>
              <Button onClick={() => setStep("verify")} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {step === "verify" && (
            <Button variant="outline" onClick={handleCancel} className="w-full bg-transparent">
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
