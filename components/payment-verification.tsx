"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { paymentVerification } from "@/lib/payment-verification"
import { Lock, Smartphone, Fingerprint, Check } from "lucide-react"

interface PaymentVerificationProps {
  amount: number
  service: string
  serviceType: string
  metadata: Record<string, any>
  onSuccess: (transactionId: string) => void
  onCancel: () => void
}

export function PaymentVerificationFlow({
  amount,
  service,
  serviceType,
  metadata,
  onSuccess,
  onCancel,
}: PaymentVerificationProps) {
  const { toast } = useToast()
  const [step, setStep] = useState("method") // method -> otp -> biometric -> confirm -> complete
  const [paymentMethod, setPaymentMethod] = useState("upi")
  const [otp, setOtp] = useState("")
  const [verificationId, setVerificationId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectMethod = async () => {
    try {
      setIsLoading(true)

      const response = await paymentVerification.initiatePayment({
        id: `pay_${Date.now()}`,
        userId: "",
        amount,
        method: paymentMethod as any,
        service,
        serviceType,
        metadata,
        timestamp: new Date().toISOString(),
      })

      setVerificationId(response.verificationId)

      // Send OTP
      await paymentVerification.verifyPaymentMethod(response.verificationId, paymentMethod)

      setStep("otp")
      toast({
        title: "OTP Sent",
        description: `OTP has been sent to your ${paymentMethod}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    try {
      setIsLoading(true)

      const result = await paymentVerification.verifyOTP(verificationId, otp)

      if (!result.valid) {
        toast({
          title: "Invalid OTP",
          description: "Please enter a valid OTP",
          variant: "destructive",
        })
        return
      }

      setStep("biometric")
      toast({
        title: "OTP Verified",
        description: "Now verify with biometric",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBiometricVerification = async (type: "face" | "fingerprint") => {
    try {
      setIsLoading(true)

      const result = await paymentVerification.verifyBiometric(verificationId, type)

      if (!result.verified) {
        toast({
          title: "Verification Failed",
          description: "Biometric verification failed. Please try again.",
          variant: "destructive",
        })
        return
      }

      setStep("confirm")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmPayment = async () => {
    try {
      setIsLoading(true)

      const result = await paymentVerification.confirmPayment(verificationId)

      if (result.confirmed) {
        setStep("complete")
        toast({
          title: "Payment Successful",
          description: `Transaction ID: ${result.transactionId}`,
        })
        onSuccess(result.transactionId)
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Secure Payment Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Amount */}
        <div className="bg-emerald-50 dark:bg-slate-800 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-slate-400">{service}</p>
          <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-400 mt-1">₹{amount.toLocaleString()}</p>
        </div>

        {/* Step: Payment Method Selection */}
        {step === "method" && (
          <div className="space-y-4">
            <Label className="text-base font-semibold">Select Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              {["upi", "card", "netbanking", "wallet"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-3 rounded-lg border-2 transition ${
                    paymentMethod === method
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900"
                      : "border-gray-200 dark:border-slate-700"
                  }`}
                >
                  <Smartphone className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-sm font-medium">{method.toUpperCase()}</p>
                </button>
              ))}
            </div>
            <Button onClick={handleSelectMethod} disabled={isLoading} className="w-full bg-emerald-600">
              {isLoading ? "Sending OTP..." : "Continue"}
            </Button>
          </div>
        )}

        {/* Step: OTP Verification */}
        {step === "otp" && (
          <div className="space-y-4">
            <Label className="text-base font-semibold">Enter OTP</Label>
            <Input
              type="text"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="border-emerald-200 dark:border-slate-700 text-center text-2xl tracking-widest"
            />
            <div className="flex gap-3">
              <Button onClick={onCancel} variant="outline" className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button
                onClick={handleVerifyOTP}
                disabled={otp.length !== 6 || isLoading}
                className="flex-1 bg-emerald-600"
              >
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Biometric Verification */}
        {step === "biometric" && (
          <div className="space-y-4">
            <Label className="text-base font-semibold">Verify with Biometric</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleBiometricVerification("face")}
                disabled={isLoading}
                className="bg-emerald-600 h-24 flex-col"
              >
                <div className="text-2xl mb-2">📱</div>
                Face ID
              </Button>
              <Button
                onClick={() => handleBiometricVerification("fingerprint")}
                disabled={isLoading}
                className="bg-emerald-600 h-24 flex-col"
              >
                <Fingerprint className="h-6 w-6 mx-auto mb-2" />
                Fingerprint
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirmation */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-slate-800 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">Confirm Payment Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-semibold">{service}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-semibold">₹{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span className="font-semibold uppercase">{paymentMethod}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={onCancel} variant="outline" className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleConfirmPayment} disabled={isLoading} className="flex-1 bg-emerald-600">
                {isLoading ? "Processing..." : "Confirm & Pay"}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "complete" && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-100 p-6 rounded-full">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-400 mb-1">Payment Successful</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">Your payment has been processed securely</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
