"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Wallet, ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

export default function StripePaymentPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [amount, setAmount] = useState("")
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("honeydrew_current_user")
    if (user) {
      setCurrentUser(JSON.parse(user))
    } else {
      router.push("/login")
    }
  }, [router])

  const handleCreatePayment = async () => {
    if (!amount || Number(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/stripe/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          amount: Math.round(Number(amount) * 100), // Convert to paise
          currency: "inr",
          description: `Add ₹${amount} to wallet`,
        }),
      })

      const data = await response.json()

      if (data.success && data.clientSecret) {
        setClientSecret(data.clientSecret)
        toast({
          title: "Payment Session Created",
          description: "Complete your payment below",
        })
      } else {
        throw new Error(data.message || "Failed to create payment")
      }
    } catch (error: any) {
      console.error("[v0] Create payment error:", error)
      toast({
        title: "Payment Creation Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const quickAmounts = [100, 500, 1000, 2000, 5000]

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add Money with Stripe</h1>
            <p className="text-sm text-muted-foreground">Secure payment gateway</p>
          </div>
        </div>

        {/* User Balance */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    ₹{currentUser?.balance?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-white">
                {currentUser?.name}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {!clientSecret ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Enter Amount
              </CardTitle>
              <CardDescription>Choose or enter the amount you want to add</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Amount Buttons */}
              <div>
                <Label className="mb-3 block">Quick Select</Label>
                <div className="grid grid-cols-3 gap-3">
                  {quickAmounts.map((amt) => (
                    <Button
                      key={amt}
                      variant={amount === amt.toString() ? "default" : "outline"}
                      onClick={() => setAmount(amt.toString())}
                      className={amount === amt.toString() ? "bg-emerald-600" : ""}
                    >
                      ₹{amt}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Custom Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                />
              </div>

              {/* Payment Button */}
              <Button
                onClick={handleCreatePayment}
                disabled={isLoading || !amount}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay ₹{amount || "0"} with Stripe
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                <p>Powered by Stripe • Secure Payment Gateway</p>
                <p className="mt-1">Your payment information is encrypted and secure</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Complete Payment</CardTitle>
              <CardDescription>Secure checkout powered by Stripe</CardDescription>
            </CardHeader>
            <CardContent>
              <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </CardContent>
          </Card>
        )}

        {/* Payment Complete */}
        {paymentComplete && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100">Payment Successful!</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">₹{amount} has been added to your wallet</p>
                </div>
                <Button onClick={() => router.push("/dashboard")} className="bg-emerald-600 hover:bg-emerald-700">
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
