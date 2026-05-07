"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Smartphone, Wallet, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { BiometricAuth } from "@/components/biometric-auth"
import { PaymentReceipt } from "@/components/payment-receipt"
import { processPayment } from "@/lib/payment-service"

const playStorePackages = [
  { amount: 99, popular: false },
  { amount: 199, popular: false },
  { amount: 499, popular: true },
  { amount: 999, popular: false },
  { amount: 1999, popular: false },
  { amount: 4999, popular: false },
]

export default function GooglePlayPage() {
  const { toast } = useToast()
  const [step, setStep] = useState(1) // 1: select, 2: verify, 3: receipt
  const [selectedAmount, setSelectedAmount] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [email, setEmail] = useState("")
  const [authMethod, setAuthMethod] = useState<"face" | "fingerprint">("fingerprint")
  const [transactionId, setTransactionId] = useState("")
  const [transactionTimestamp, setTransactionTimestamp] = useState("")
  const [previousBalance, setPreviousBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("currentUser")
      if (user) setCurrentUser(JSON.parse(user))
    }
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getAmount = () => Number(selectedAmount || customAmount || 0)

  const handleProceedToVerify = () => {
    const amount = getAmount()

    if (!amount || amount < 50) {
      toast({
        title: "Invalid Amount",
        description: "Minimum recharge amount is ₹50",
        variant: "destructive",
      })
      return
    }

    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid Google Play email",
        variant: "destructive",
      })
      return
    }

    if (currentUser && amount > currentUser.balance) {
      toast({
        title: "Insufficient Balance",
        description: `Your balance is ${formatCurrency(currentUser.balance)}`,
        variant: "destructive",
      })
      return
    }

    setPreviousBalance(currentUser?.balance || 0)
    setStep(2)
  }

  const handleBiometricSuccess = async (method: "face" | "fingerprint" = "fingerprint") => {
    setAuthMethod(method)
    setIsLoading(true)

    try {
      const amount = getAmount()
      const deviceId = localStorage.getItem("deviceId") || `device_${Date.now()}`

      const result = await processPayment({
        userId: currentUser.id,
        amount,
        recipient: "Google Play Store",
        category: "gift_card",
        authMethod: method,
        verificationScore: 90,
        deviceId,
        metadata: {
          email,
          type: "Google Play Gift Card",
        },
      })

      if (result.success) {
        const updatedUser = { ...currentUser, balance: result.newBalance }
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)

        setTransactionId(result.transactionId || `TXN${Date.now()}`)
        setTransactionTimestamp(result.timestamp || new Date().toISOString())

        toast({
          title: "Recharge Successful!",
          description: `Google Play balance of ${formatCurrency(amount)} credited to ${email}`,
        })
        setStep(3)
      } else {
        throw new Error(result.error || "Recharge failed")
      }
    } catch (error: any) {
      toast({
        title: "Recharge Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedAmount("")
    setCustomAmount("")
    setEmail("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="border-emerald-200 hover:bg-emerald-50 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Google Play Recharge</h1>
            {currentUser && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                Balance: {formatCurrency(currentUser.balance)}
              </p>
            )}
          </div>
        </div>

        {/* Step 1: Select Package */}
        {step === 1 && (
          <>
            <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900 mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                  <Smartphone className="h-5 w-5" />
                  Select Package
                </CardTitle>
                <CardDescription>Choose a preset package or enter custom amount</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {playStorePackages.map((pkg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                        selectedAmount === pkg.amount.toString()
                          ? "border-emerald-600 bg-emerald-50 dark:bg-slate-800"
                          : "border-emerald-200 dark:border-slate-700 hover:border-emerald-400"
                      } ${pkg.popular ? "ring-2 ring-yellow-400" : ""}`}
                      onClick={() => {
                        setSelectedAmount(pkg.amount.toString())
                        setCustomAmount("")
                      }}
                    >
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(pkg.amount)}</p>
                      {pkg.popular && <p className="text-xs text-yellow-600 font-semibold">POPULAR</p>}
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <Label>Or Enter Custom Amount</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                    <Input
                      type="number"
                      placeholder="Min ₹50"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value)
                        setSelectedAmount("")
                      }}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Google Play Email</Label>
                  <Input
                    type="email"
                    placeholder="your@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {(selectedAmount || customAmount) && email && (
                  <div className="bg-emerald-50 dark:bg-slate-800 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span>Amount:</span>
                      <span className="font-bold">{formatCurrency(getAmount())}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Account:</span>
                      <span className="font-medium truncate ml-2">{email}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Processing Fee:</span>
                      <span>FREE</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleProceedToVerify}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={(!selectedAmount && !customAmount) || !email}
                >
                  Continue to Verify
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
                <CardContent className="pt-4 text-center">
                  <Zap className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-medium">Instant Credit</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
                <CardContent className="pt-4 text-center">
                  <Smartphone className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-medium">Secure</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
                <CardContent className="pt-4 text-center">
                  <Wallet className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-medium">No Expiry</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Step 2: Biometric Verification */}
        {step === 2 && (
          <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-emerald-800 dark:text-emerald-400">Verify Payment</CardTitle>
              <CardDescription>Confirm Google Play recharge of {formatCurrency(getAmount())}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-emerald-50 dark:bg-slate-800 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span>Amount:</span>
                  <span className="font-bold">{formatCurrency(getAmount())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium truncate ml-2">{email}</span>
                </div>
              </div>

              <BiometricAuth
                onFingerprint={() => handleBiometricSuccess("fingerprint")}
                onFaceId={() => handleBiometricSuccess("face")}
                userId={currentUser?.id || ""}
                mode="verify"
              />

              <Button
                variant="outline"
                className="w-full mt-4 bg-transparent"
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Receipt */}
        {step === 3 && (
          <PaymentReceipt
            transactionId={transactionId}
            amount={getAmount()}
            recipient="Google Play Store"
            service="Google Play Recharge"
            timestamp={transactionTimestamp}
            previousBalance={previousBalance}
            newBalance={currentUser?.balance || 0}
            authMethod={authMethod}
            metadata={{
              Email: email,
              Type: "Gift Card Balance",
            }}
            onNewPayment={resetForm}
          />
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-[300px]">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                <p className="text-center font-medium">Processing recharge...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
