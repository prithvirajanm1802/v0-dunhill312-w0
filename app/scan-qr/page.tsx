"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, QrCode, Loader2, AlertCircle, Shield } from "lucide-react"
import { QRScanner } from "@/components/qr-scanner"
import { useToast } from "@/hooks/use-toast"
import { ToastContainer } from "@/components/ui/toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BiometricVerificationModal } from "@/components/biometric-verification-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ScannedUser {
  id: string
  name: string
  mobile?: string
  faceImage?: string
}

export default function ScanQRPage() {
  const router = useRouter()
  const { toast, toasts, dismiss } = useToast()
  const [scannedData, setScannedData] = useState<any>(null)
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNote, setPaymentNote] = useState("")
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [paymentInProgress, setPaymentInProgress] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionResult, setTransactionResult] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("honeydrew_current_user")
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData))
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  const handleQRScan = async (data: string) => {
    console.log("[v0] QR code scanned:", data)
    setError(null)

    try {
      // Try to parse as JSON (our QR format)
      let parsedData
      try {
        parsedData = JSON.parse(data)
      } catch {
        // If not JSON, try to extract from query string format
        const params = new URLSearchParams(data)
        parsedData = {
          userId: params.get("userId"),
          amount: params.get("amount"),
          merchant: params.get("merchant"),
        }
      }

      if (parsedData.userId === currentUser?.id) {
        setError("You cannot scan your own QR code for payment")
        return
      }

      // Validate scanned user via API
      const response = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrData: data,
          scannerId: currentUser?.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setScannedData(parsedData)
        setScannedUser({
          id: result.targetUser.id,
          name: result.targetUser.name,
          mobile: result.targetUser.mobile,
          faceImage: result.targetUser.faceImage,
        })

        if (result.amount) {
          setPaymentAmount(String(result.amount))
        } else if (parsedData.amount) {
          setPaymentAmount(String(parsedData.amount))
        }

        if (result.note || parsedData.note) {
          setPaymentNote(result.note || parsedData.note)
        }

        toast({
          title: "User Found",
          description: `Ready to pay ${result.targetUser?.name || "user"}`,
        })
      } else {
        setError(result.message || "Could not find user. Please try again.")
      }
    } catch (error) {
      console.error("[v0] QR scan error:", error)
      setError("Invalid QR code. Please scan a valid Honeydrew payment QR.")
    }
  }

  const handleQRError = (error: string) => {
    toast({
      title: "QR Scan Error",
      description: error,
      variant: "destructive",
    })
  }

  const initiatePayment = () => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      })
      return
    }

    if (!scannedUser?.id) {
      toast({
        title: "Invalid recipient",
        description: "Could not identify the recipient",
        variant: "destructive",
      })
      return
    }

    if (scannedUser.id === currentUser?.id) {
      toast({
        title: "Invalid payment",
        description: "You cannot send money to yourself",
        variant: "destructive",
      })
      return
    }

    if (currentUser?.balance && Number(currentUser.balance) < Number(paymentAmount)) {
      toast({
        title: "Insufficient balance",
        description: `Your balance (₹${currentUser.balance}) is less than the payment amount`,
        variant: "destructive",
      })
      return
    }

    // Show biometric verification
    setShowVerification(true)
  }

  const handleVerificationSuccess = async () => {
    setShowVerification(false)
    setPaymentInProgress(true)
    setError(null)

    try {
      const response = await fetch("/api/banking/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser?.id,
          recipientId: scannedUser?.id,
          amount: Number.parseFloat(paymentAmount),
          authMethod: "biometric",
          note: paymentNote,
          verificationScore: 95,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setTransactionResult(result)

        // Update local user balance
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            balance: result.sender.newBalance,
          }
          localStorage.setItem("honeydrew_current_user", JSON.stringify(updatedUser))
          localStorage.setItem("currentUser", JSON.stringify(updatedUser))
          setCurrentUser(updatedUser)
        }

        setPaymentComplete(true)
        toast({
          title: "Payment Successful",
          description: `₹${paymentAmount} sent to ${scannedUser?.name}`,
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error("[v0] Payment error:", error)
      setError(error.message || "Payment failed. Please try again.")
      toast({
        title: "Payment Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setPaymentInProgress(false)
    }
  }

  const resetForNewPayment = () => {
    setScannedData(null)
    setScannedUser(null)
    setPaymentAmount("")
    setPaymentNote("")
    setPaymentComplete(false)
    setTransactionResult(null)
    setError(null)
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-md">
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Scan & Pay</h1>
      </div>

      {currentUser && (
        <div className="mb-4 p-3 bg-muted rounded-lg flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Your Balance</span>
          <span className="font-bold text-lg">₹{Number(currentUser.balance || 0).toLocaleString()}</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {paymentComplete ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-900 p-4 mb-4">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Payment Successful</h2>
              <p className="text-3xl font-bold text-emerald-600 mb-2">₹{paymentAmount}</p>
              <p className="text-muted-foreground mb-4">Sent to {scannedUser?.name}</p>

              {transactionResult && (
                <div className="w-full p-4 bg-muted rounded-lg mb-4 text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="font-mono text-xs">{transactionResult.transactionId?.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">New Balance</span>
                    <span className="font-bold">₹{transactionResult.sender?.newBalance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span>{new Date(transactionResult.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={resetForNewPayment}>
                  Pay Another
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Dashboard</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : scannedUser ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Confirm Payment
            </CardTitle>
            <CardDescription>Verify recipient details before paying</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 border-2 border-emerald-500">
                    {scannedUser.faceImage ? (
                      <AvatarImage src={scannedUser.faceImage || "/placeholder.svg"} alt={scannedUser.name} />
                    ) : null}
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg">
                      {scannedUser.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{scannedUser.name}</p>
                    {scannedUser.mobile && <p className="text-sm text-muted-foreground">{scannedUser.mobile}</p>}
                    <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified Honeydrew User
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="Enter amount"
                  className="text-2xl font-bold h-14"
                  disabled={!!scannedData?.amount}
                />
                {paymentAmount && currentUser?.balance && Number(paymentAmount) > Number(currentUser.balance) && (
                  <p className="text-xs text-destructive">Amount exceeds your balance</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Input
                  id="note"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="What's this for?"
                />
              </div>

              <Button
                onClick={initiatePayment}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                disabled={
                  paymentInProgress ||
                  !paymentAmount ||
                  (currentUser?.balance && Number(paymentAmount) > Number(currentUser.balance))
                }
              >
                {paymentInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ₹${paymentAmount || "0"}`
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={resetForNewPayment}
                disabled={paymentInProgress}
              >
                Scan Different QR
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan QR Code
            </CardTitle>
            <CardDescription>Scan another user's QR code to send them money instantly</CardDescription>
          </CardHeader>
          <CardContent>
            <QRScanner onScan={handleQRScan} onError={handleQRError} />
          </CardContent>
        </Card>
      )}

      <BiometricVerificationModal
        open={showVerification}
        onOpenChange={setShowVerification}
        onVerified={handleVerificationSuccess}
        title="Verify Payment"
        description={`Confirm payment of ₹${paymentAmount} to ${scannedUser?.name}`}
        userId={currentUser?.id}
      />
    </div>
  )
}
