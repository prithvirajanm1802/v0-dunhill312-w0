"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, QrCode, CheckCircle2, AlertCircle } from "lucide-react"
import { QRScanner } from "@/components/qr-scanner"
import { BiometricVerificationModal } from "@/components/biometric-verification-modal"
import { qrManagement } from "@/lib/qr-management"
import { useToast } from "@/hooks/use-toast"

interface PaymentState {
  step: "scan" | "confirm" | "biometric" | "completed"
  merchantName?: string
  upiId?: string
  amount?: number
  qrId?: string
  scannedQRData?: string
}

export default function QRPaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [state, setState] = useState<PaymentState>({ step: "scan" })
  const [customAmount, setCustomAmount] = useState("")
  const [paymentNote, setPaymentNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBiometricModal, setShowBiometricModal] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("honeydrew_current_user")
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (err) {
        console.error("Error loading user:", err)
      }
    }
  }, [])

  const handleQRScan = (data: string) => {
    try {
      setError(null)

      // Parse UPI string or extract QR ID from scanned data
      let qrId: string | null = null
      let merchantName = "Unknown"
      let upiId = ""
      let amount: number | undefined

      // Check if it's a stored QR code ID
      if (data.startsWith("qr_")) {
        qrId = data
        const qrCode = qrManagement.getQRCodeById(qrId)
        if (qrCode && qrCode.isActive) {
          merchantName = qrCode.merchantName
          upiId = qrCode.upiId
          amount = qrCode.amount
        } else {
          throw new Error("QR code not found or is inactive")
        }
      } else if (data.includes("upi://")) {
        // Parse UPI format
        const upiMatch = data.match(/pa=([^&]+)/)
        const nameMatch = data.match(/pn=([^&]+)/)
        const amountMatch = data.match(/am=([^&]+)/)

        if (upiMatch) upiId = decodeURIComponent(upiMatch[1])
        if (nameMatch) merchantName = decodeURIComponent(nameMatch[1])
        if (amountMatch) amount = Number.parseInt(amountMatch[1])
      } else {
        throw new Error("Invalid QR code format")
      }

      setState({
        step: "confirm",
        merchantName,
        upiId,
        amount,
        qrId: qrId || undefined,
        scannedQRData: data,
      })

      toast({
        title: "QR Code Scanned",
        description: `Merchant: ${merchantName}`,
      })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleQRError = (errorMsg: string) => {
    setError(errorMsg)
  }

  const handleConfirmPayment = async () => {
    try {
      setError(null)

      const finalAmount = customAmount ? Number.parseInt(customAmount) : state.amount
      if (!finalAmount || finalAmount <= 0) {
        throw new Error("Please enter a valid amount")
      }

      // Record QR scan in analytics
      if (state.qrId) {
        const scanLog = qrManagement.recordQRScan(state.qrId, user?.id || "unknown")
        console.log("[v0] QR scan recorded:", scanLog.id)
      }

      setState((prev) => ({
        ...prev,
        step: "biometric",
        amount: finalAmount,
      }))

      setShowBiometricModal(true)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleBiometricSuccess = async () => {
    setShowBiometricModal(false)
    setLoading(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update transaction
      const currentUser = localStorage.getItem("honeydrew_current_user")
      if (currentUser) {
        const userData = JSON.parse(currentUser)
        userData.balance = (userData.balance || 0) - (state.amount || 0)
        localStorage.setItem("honeydrew_current_user", JSON.stringify(userData))
      }

      // Create transaction record
      const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newTransaction = {
        id: transactionId,
        type: "sent",
        amount: state.amount,
        recipient: state.merchantName,
        recipientUPI: state.upiId,
        date: new Date().toISOString(),
        category: "qr_payment",
        note: paymentNote,
        qrId: state.qrId,
        status: "completed",
      }

      transactions.push(newTransaction)
      localStorage.setItem("transactions", JSON.stringify(transactions))

      // Update QR scan log status
      if (state.qrId) {
        const scanLogs = qrManagement.getQRScanLogs(state.qrId)
        const latestScan = scanLogs[scanLogs.length - 1]
        if (latestScan) {
          qrManagement.updateScanLogStatus(latestScan.id, "completed", transactionId)
        }

        // Update QR code stats
        const qrCode = qrManagement.getQRCodeById(state.qrId)
        if (qrCode) {
          qrManagement.updateQRCode(state.qrId, {
            totalAmountCollected: (qrCode.totalAmountCollected || 0) + (state.amount || 0),
          })
        }
      }

      // Log transaction
      const adminLogs = JSON.parse(localStorage.getItem("adminLogs") || "[]")
      adminLogs.push({
        timestamp: Date.now(),
        type: "transaction",
        userId: user?.id || "unknown",
        action: "qr_payment_completed",
        success: true,
        details: {
          transactionId,
          amount: state.amount,
          merchant: state.merchantName,
          qrId: state.qrId,
          verificationMethod: "biometric",
        },
      })
      localStorage.setItem("adminLogs", JSON.stringify(adminLogs))

      setState((prev) => ({
        ...prev,
        step: "completed",
      }))

      toast({
        title: "Payment Successful",
        description: `₹${state.amount} sent to ${state.merchantName}`,
      })

      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    } catch (err: any) {
      setError(err.message)
      setState((prev) => ({ ...prev, step: "confirm" }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <div className="flex items-center mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="mr-2 dark:text-slate-400 hover:dark:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground dark:text-slate-100">QR Payment</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {state.step === "scan" && (
          <Card className="border-blue-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <QrCode className="h-5 w-5" />
                Scan Merchant QR Code
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                Point your camera at the merchant's QR code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QRScanner onScan={handleQRScan} onError={handleQRError} />
            </CardContent>
          </Card>
        )}

        {state.step === "confirm" && (
          <Card className="border-green-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-foreground dark:text-slate-100">Confirm Payment Details</CardTitle>
              <CardDescription className="dark:text-slate-400">Review and confirm before proceeding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-foreground/60 dark:text-slate-400">Merchant</span>
                  <span className="font-semibold text-foreground dark:text-slate-100">{state.merchantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60 dark:text-slate-400">UPI ID</span>
                  <span className="font-mono text-sm text-foreground dark:text-slate-100">{state.upiId}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between">
                  <span className="text-foreground/60 dark:text-slate-400">Amount</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    ₹{customAmount || state.amount || 0}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-amount" className="text-foreground dark:text-slate-200">
                  Enter Amount (₹)
                </Label>
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder={`${state.amount || "0"}`}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-note" className="text-foreground dark:text-slate-200">
                  Payment Note (Optional)
                </Label>
                <Input
                  id="payment-note"
                  placeholder="Add a note for this payment"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 dark:border-slate-700 dark:text-slate-300 bg-transparent"
                  onClick={() => setState({ step: "scan" })}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700"
                  onClick={handleConfirmPayment}
                  disabled={loading}
                >
                  Proceed to Verification
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {state.step === "completed" && (
          <Card className="border-green-200 dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="pt-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Payment Successful!</h2>
                <p className="text-foreground/60 dark:text-slate-400">Your payment has been processed</p>
              </div>
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-foreground/60 dark:text-slate-400">Amount Sent</span>
                  <span className="font-bold text-foreground dark:text-slate-100">₹{state.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60 dark:text-slate-400">To</span>
                  <span className="font-semibold text-foreground dark:text-slate-100">{state.merchantName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60 dark:text-slate-400">Time</span>
                  <span className="text-foreground dark:text-slate-100">{new Date().toLocaleString()}</span>
                </div>
              </div>
              <p className="text-sm text-foreground/60 dark:text-slate-400">Redirecting to dashboard in 3 seconds...</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Biometric Verification Modal */}
      <BiometricVerificationModal
        open={showBiometricModal}
        onOpenChange={setShowBiometricModal}
        onSuccess={handleBiometricSuccess}
        title="Verify Payment"
        description={`Verify your identity to send ₹${state.amount} to ${state.merchantName}`}
        userId={user?.id || "current_user"}
      />
    </div>
  )
}
