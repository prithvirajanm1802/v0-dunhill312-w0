"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Smartphone, Tv, Building, Shield, CheckCircle, Fingerprint } from "lucide-react"
import { toast } from "react-hot-toast"
import { BiometricVerificationModal } from "@/components/biometric-verification-modal"
import { dbService } from "@/lib/db-service"
import { syncTransaction, syncUserData } from "@/lib/cross-device-sync"
import { getActiveSession } from "@/lib/session-manager"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const paymentMethods = [
  {
    id: "upi",
    name: "UPI Payment",
    icon: <Smartphone className="h-6 w-6 text-blue-500" />,
    description: "Pay using UPI ID or QR code",
    popular: true,
  },
  {
    id: "card",
    name: "Credit/Debit Card",
    icon: <CreditCard className="h-6 w-6 text-green-500" />,
    description: "Visa, Mastercard, RuPay accepted",
    popular: true,
  },
  {
    id: "netbanking",
    name: "Net Banking",
    icon: <Building className="h-6 w-6 text-purple-500" />,
    description: "Pay directly from your bank account",
    popular: false,
  },
  {
    id: "wallet",
    name: "Digital Wallet",
    icon: <Tv className="h-6 w-6 text-orange-500" />,
    description: "Paytm, PhonePe, Google Pay",
    popular: true,
  },
]

const banks = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank",
  "IDFC First Bank",
]

export default function PaymentsPage() {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState("")
  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState("")
  const [upiId, setUpiId] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardName, setCardName] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [verifyMethod, setVerifyMethod] = useState<"face" | "passkey" | null>(null)
  const [showPasskeyModal, setShowPasskeyModal] = useState(false)
  const [verificationScore, setVerificationScore] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored =
        JSON.parse(localStorage.getItem("honeydrew_current_user") || "null") ||
        JSON.parse(localStorage.getItem("currentUser") || "null")
      if (stored) {
        setCurrentUser(stored)
        const session = getActiveSession(stored.id)
        if (!session) {
          toast({
            title: "Session Required",
            description: "Please log in to make payments",
            variant: "destructive",
          })
        }
      }
    }
  }, [])

  const handlePayment = () => {
    if (!selectedMethod || !amount || !recipient) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (selectedMethod === "upi" && !upiId) {
      toast({
        title: "UPI ID Required",
        description: "Please enter a valid UPI ID",
        variant: "destructive",
      })
      return
    }

    if (selectedMethod === "card" && (!cardNumber || !expiryDate || !cvv || !cardName)) {
      toast({
        title: "Card Details Required",
        description: "Please fill in all card details",
        variant: "destructive",
      })
      return
    }

    if (selectedMethod === "netbanking" && !selectedBank) {
      toast({
        title: "Bank Selection Required",
        description: "Please select your bank",
        variant: "destructive",
      })
      return
    }

    setShowBiometricPrompt(true)
  }

  const handleBiometricChoice = () => {
    if (!verifyMethod) {
      toast({
        title: "Verification Method Required",
        description: "Select Passkey for verification",
        variant: "destructive",
      })
      return
    }
    if (verifyMethod === "passkey") {
      setShowPasskeyModal(true)
    }
  }

  const handleBiometricSuccess = async () => {
    console.log("[v0] handleBiometricSuccess called - processing payment")
    setShowBiometricPrompt(false)
    setIsLoading(true)

    try {
      // Get device ID for cross-device sync
      const deviceId = localStorage.getItem("honeydrew_device_id") || `device_${Date.now()}`

      const response = await fetch("/api/payments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          amount: Number.parseFloat(amount),
          recipient,
          paymentMethod: selectedMethod,
          category: "payment",
          transactionType: "sent",
          authMethod: "passkey",
          verificationScore: 100,
          deviceId,
          metadata: {
            upiId: selectedMethod === "upi" ? upiId : undefined,
            cardLast4: selectedMethod === "card" ? cardNumber.slice(-4) : undefined,
            bank: selectedMethod === "netbanking" ? selectedBank : undefined,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Also update local storage for immediate UI feedback
        if (currentUser) {
          const newTransaction = {
            type: "sent" as const,
            amount: amount,
            recipient: recipient,
            date: new Date().toISOString(),
            category: "payment" as const,
            userId: currentUser.id,
            paymentMethod: selectedMethod,
            authMethod: "passkey",
            verificationScore: 100,
            details: {
              upiId: selectedMethod === "upi" ? upiId : undefined,
              cardLast4: selectedMethod === "card" ? cardNumber.slice(-4) : undefined,
              bank: selectedMethod === "netbanking" ? selectedBank : undefined,
            },
          }

          dbService.createTransaction(newTransaction)
          await syncTransaction(currentUser.id, newTransaction)

          // Update user balance locally
          const updatedUser = dbService.getUserById(currentUser.id)
          if (updatedUser) {
            localStorage.setItem("currentUser", JSON.stringify(updatedUser))
            setCurrentUser(updatedUser)
            await syncUserData(currentUser.id, updatedUser)
          }
        }

        setPaymentSuccess(true)
        toast({
          title: "Payment Successful!",
          description: `₹${amount} sent to ${recipient} (Verified: 100%)`,
        })
      } else {
        throw new Error(result.error || "Payment failed")
      }
    } catch (error) {
      console.error("[v0] Payment processing error:", error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An error occurred while processing your payment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onVerified = () => {
    console.log("[v0] onVerified called - passkey verification successful")
    setShowPasskeyModal(false)
    handleBiometricSuccess()
  }

  if (paymentSuccess) {
    return (
      <div className="container max-w-md mx-auto py-6 px-4">
        <Card className="text-center bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Payment Successful!</h2>
              <p className="text-muted-foreground">
                ₹{amount} sent to {recipient}
              </p>
              <div className="bg-muted p-4 rounded-lg w-full">
                <div className="flex justify-between mb-2 text-foreground">
                  <span>Method:</span>
                  <span className="font-medium">{paymentMethods.find((m) => m.id === selectedMethod)?.name}</span>
                </div>
                <div className="flex justify-between mb-2 text-foreground">
                  <span>Amount:</span>
                  <span className="font-medium">₹{amount}</span>
                </div>
                <div className="flex justify-between text-foreground">
                  <span>Status:</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">Completed</span>
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setPaymentSuccess(false)
                    setAmount("")
                    setRecipient("")
                    setSelectedMethod("")
                    setVerificationScore(null)
                  }}
                >
                  New Payment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-md mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Send Money</h1>
          <p className="text-muted-foreground">Secure payment transfer</p>
        </div>
      </div>

      {/* Amount and Recipient */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Payment Details</CardTitle>
          <CardDescription>Enter the amount and recipient</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">
              Amount (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg bg-background text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-foreground">
              Recipient Name
            </Label>
            <Input
              id="recipient"
              placeholder="Enter recipient name"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="bg-background text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Payment Method</CardTitle>
          <CardDescription>Choose how you want to pay</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                selectedMethod === method.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              {method.icon}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{method.name}</span>
                  {method.popular && (
                    <Badge variant="outline" className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      Popular
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 ${
                  selectedMethod === method.id ? "border-primary bg-primary" : "border-muted"
                }`}
              >
                {selectedMethod === method.id && <CheckCircle className="h-4 w-4 text-primary-foreground" />}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dynamic Form based on selected method */}
      {selectedMethod === "upi" && (
        <Card className="bg-card">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upi" className="text-foreground">
                UPI ID
              </Label>
              <Input
                id="upi"
                placeholder="example@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="bg-background text-foreground"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {selectedMethod === "card" && (
        <Card className="bg-card">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-foreground">
                Card Number
              </Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="bg-background text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry" className="text-foreground">
                  Expiry Date
                </Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv" className="text-foreground">
                  CVV
                </Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="bg-background text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardName" className="text-foreground">
                Name on Card
              </Label>
              <Input
                id="cardName"
                placeholder="John Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="bg-background text-foreground"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {selectedMethod === "netbanking" && (
        <Card className="bg-card">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-foreground">Select Bank</Label>
              <Tabs value={selectedBank} onValueChange={setSelectedBank}>
                <TabsList>
                  {banks.map((bank) => (
                    <TabsTrigger key={bank} value={bank}>
                      {bank}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Secure Payment</p>
              <p className="text-sm text-muted-foreground">Protected with biometric verification</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pay Button */}
      <Button
        onClick={handlePayment}
        className="w-full h-12 text-lg"
        disabled={!selectedMethod || !amount || !recipient}
      >
        Pay ₹{amount || "0"} Securely
      </Button>

      {/* Biometric Prompt Modal */}
      {showBiometricPrompt && !showPasskeyModal && (
        <Dialog open={showBiometricPrompt} onOpenChange={setShowBiometricPrompt}>
          <DialogContent className="w-full max-w-sm bg-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">Verify Payment</DialogTitle>
              <DialogDescription>Choose verification method to authorize ₹{amount}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                variant={verifyMethod === "passkey" ? "default" : "outline"}
                className="h-20 flex-col gap-2"
                onClick={() => setVerifyMethod("passkey")}
              >
                <Fingerprint className="h-6 w-6" />
                <span>Passkey</span>
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowBiometricPrompt(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleBiometricChoice} disabled={!verifyMethod}>
                  Continue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Passkey modal */}
      <BiometricVerificationModal
        open={showPasskeyModal}
        onOpenChange={setShowPasskeyModal}
        userId={currentUser?.id || "current_user"}
        title="Verify with Passkey"
        description="Use your device passkey to authorize this payment"
        onSuccess={onVerified}
      />
    </div>
  )
}
