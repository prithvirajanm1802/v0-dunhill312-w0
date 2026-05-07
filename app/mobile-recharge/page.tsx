"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Phone, Wifi, Clock, CheckCircle, Loader2, Zap, Wallet, Receipt } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BiometricAuth } from "@/components/biometric-auth"
import { processPayment } from "@/lib/payment-service"

type PlanType = "all" | "regular" | "data" | "talktime"

interface Plan {
  id: string
  amount: number
  validity: string
  data: string
  description: string
  type: "regular" | "data" | "talktime"
  popular?: boolean
}

// Recharge plans for different operators
const plans: Record<string, Plan[]> = {
  jio: [
    {
      id: "jio1",
      amount: 149,
      validity: "24 days",
      data: "1GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
    },
    {
      id: "jio2",
      amount: 239,
      validity: "28 days",
      data: "1.5GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
      popular: true,
    },
    {
      id: "jio3",
      amount: 299,
      validity: "28 days",
      data: "2GB/day",
      description: "Unlimited calls + 100 SMS/day + JioTV",
      type: "regular",
    },
    {
      id: "jio4",
      amount: 479,
      validity: "56 days",
      data: "1.5GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
    },
    {
      id: "jio5",
      amount: 666,
      validity: "84 days",
      data: "1.5GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
    },
    { id: "jio6", amount: 199, validity: "23 days", data: "2GB/day", description: "Data only pack", type: "data" },
    { id: "jio7", amount: 11, validity: "1 day", data: "1GB", description: "Data add-on", type: "data" },
    { id: "jio8", amount: 21, validity: "1 day", data: "2GB", description: "Data add-on", type: "data" },
    { id: "jio9", amount: 10, validity: "N/A", data: "N/A", description: "₹10 Talktime", type: "talktime" },
    { id: "jio10", amount: 20, validity: "N/A", data: "N/A", description: "₹20 Talktime", type: "talktime" },
  ],
  airtel: [
    {
      id: "airtel1",
      amount: 179,
      validity: "28 days",
      data: "1GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
    },
    {
      id: "airtel2",
      amount: 265,
      validity: "28 days",
      data: "1.5GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
      popular: true,
    },
    {
      id: "airtel3",
      amount: 299,
      validity: "28 days",
      data: "2GB/day",
      description: "Unlimited calls + 100 SMS/day + Wynk",
      type: "regular",
    },
    {
      id: "airtel4",
      amount: 455,
      validity: "56 days",
      data: "1.5GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
    },
    {
      id: "airtel5",
      amount: 719,
      validity: "84 days",
      data: "1.5GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
    },
    { id: "airtel6", amount: 48, validity: "28 days", data: "3GB total", description: "Data pack", type: "data" },
    { id: "airtel7", amount: 98, validity: "28 days", data: "6GB total", description: "Data pack", type: "data" },
    { id: "airtel8", amount: 10, validity: "N/A", data: "N/A", description: "₹7.47 Talktime", type: "talktime" },
    { id: "airtel9", amount: 20, validity: "N/A", data: "N/A", description: "₹14.95 Talktime", type: "talktime" },
  ],
  vi: [
    {
      id: "vi1",
      amount: 179,
      validity: "28 days",
      data: "1GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
    },
    {
      id: "vi2",
      amount: 249,
      validity: "28 days",
      data: "1.5GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
      popular: true,
    },
    {
      id: "vi3",
      amount: 299,
      validity: "28 days",
      data: "2GB/day",
      description: "Unlimited calls + 100 SMS/day + Vi Movies",
      type: "regular",
    },
    {
      id: "vi4",
      amount: 449,
      validity: "56 days",
      data: "1.5GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
    },
    {
      id: "vi5",
      amount: 699,
      validity: "84 days",
      data: "1.5GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
    },
    { id: "vi6", amount: 48, validity: "28 days", data: "3GB total", description: "Data pack", type: "data" },
    { id: "vi7", amount: 98, validity: "28 days", data: "6GB total", description: "Data pack", type: "data" },
    { id: "vi8", amount: 10, validity: "N/A", data: "N/A", description: "₹7.47 Talktime", type: "talktime" },
  ],
  bsnl: [
    {
      id: "bsnl1",
      amount: 107,
      validity: "24 days",
      data: "1GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
    },
    {
      id: "bsnl2",
      amount: 197,
      validity: "30 days",
      data: "2GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
      popular: true,
    },
    {
      id: "bsnl3",
      amount: 247,
      validity: "30 days",
      data: "2GB/day",
      description: "Unlimited calls + 100 SMS/day + BSNL Tunes",
      type: "regular",
    },
    {
      id: "bsnl4",
      amount: 397,
      validity: "60 days",
      data: "2GB/day",
      description: "Unlimited calls + 100 SMS/day",
      type: "regular",
    },
    { id: "bsnl5", amount: 18, validity: "N/A", data: "N/A", description: "₹14.00 Talktime", type: "talktime" },
  ],
}

export default function MobileRechargePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [mobileNumber, setMobileNumber] = useState("")
  const [operator, setOperator] = useState("")
  const [planType, setPlanType] = useState<PlanType>("all")
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false)
  const [transactionId, setTransactionId] = useState<string>("")
  const [transactionDate, setTransactionDate] = useState<string>("")
  const [previousBalance, setPreviousBalance] = useState<number>(0)

  useEffect(() => {
    // Get current logged in user
    const userStr = localStorage.getItem("currentUser")
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUser(user)
      // Pre-fill mobile number if available
      if (user.mobile) {
        setMobileNumber(user.mobile)
      }
    }
  }, [])

  const validateMobileNumber = (number: string) => {
    return /^[6-9]\d{9}$/.test(number)
  }

  const handleMobileSubmit = () => {
    if (!validateMobileNumber(mobileNumber)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      })
      return
    }
    setStep(2)
  }

  const handleOperatorSelect = (op: string) => {
    setOperator(op)
    setStep(3)
  }

  const handlePlanSelect = (plan: Plan) => {
    if (!currentUser) {
      toast({
        title: "Please Login",
        description: "You need to be logged in to make a recharge",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    // Check if user has sufficient balance
    if (currentUser && currentUser.balance < plan.amount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to make this recharge.",
        variant: "destructive",
      })
      return
    }

    setSelectedPlan(plan)
    setPreviousBalance(currentUser.balance)
    setShowBiometricPrompt(true)
  }

  const handleBiometricSuccess = async () => {
    // Close the biometric modal immediately
    setShowBiometricPrompt(false)
    setIsLoading(true)

    if (!selectedPlan || !currentUser) {
      setIsLoading(false)
      return
    }

    // Get device ID for cross-device sync
    const deviceId = localStorage.getItem("deviceId") || `device_${Date.now()}`
    if (!localStorage.getItem("deviceId")) {
      localStorage.setItem("deviceId", deviceId)
    }

    try {
      // Process payment through the payment service
      const result = await processPayment({
        userId: currentUser.id,
        amount: selectedPlan.amount,
        recipient: `${operator.toUpperCase()} ${selectedPlan.type === "regular" ? "Prepaid" : selectedPlan.type === "data" ? "Data Pack" : "Talktime"}`,
        category: "recharge",
        authMethod: "face",
        verificationScore: 90,
        deviceId,
        metadata: {
          mobileNumber,
          operator,
          planId: selectedPlan.id,
          validity: selectedPlan.validity,
          data: selectedPlan.data,
        },
      })

      if (result.success) {
        // Update current user with new balance
        const updatedUser = { ...currentUser, balance: result.newBalance }
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)

        // Also update users list in localStorage
        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const userIndex = users.findIndex((u: any) => u.id === currentUser.id)
        if (userIndex !== -1) {
          users[userIndex].balance = result.newBalance
          localStorage.setItem("users", JSON.stringify(users))
        }

        setTransactionId(result.transactionId || `TXN${Date.now()}`)
        setTransactionDate(
          new Date().toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        )

        toast({
          title: "Recharge Successful",
          description: `Your ${operator.toUpperCase()} number ${mobileNumber} has been recharged with ₹${selectedPlan.amount} plan.`,
        })

        // Move to success/receipt step
        setStep(4)
      } else {
        toast({
          title: "Recharge Failed",
          description: result.error || "Unable to process recharge. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Recharge error:", error)
      toast({
        title: "Recharge Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter plans based on selected type
  const filteredPlans =
    operator && plans[operator as keyof typeof plans]
      ? plans[operator as keyof typeof plans].filter((plan) => {
          if (planType === "all") return true
          return plan.type === planType
        })
      : []

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Mobile Recharge</h1>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
            {s < 4 && <div className={`w-12 h-1 ${step > s ? "bg-emerald-600" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Enter Mobile Number */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Phone className="h-5 w-5" />
              Enter Mobile Number
            </CardTitle>
            <CardDescription>Enter the mobile number to recharge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-foreground">
                Mobile Number
              </Label>
              <div className="flex">
                <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground">
                  +91
                </div>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter 10 digit number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="rounded-l-none"
                  maxLength={10}
                />
              </div>
            </div>
            <Button
              onClick={handleMobileSubmit}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={mobileNumber.length !== 10}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Operator */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Select Operator</CardTitle>
            <CardDescription>Choose your mobile operator for {mobileNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: "jio", name: "Jio", color: "bg-blue-500" },
              { id: "airtel", name: "Airtel", color: "bg-red-500" },
              { id: "vi", name: "Vi (Vodafone Idea)", color: "bg-yellow-500" },
              { id: "bsnl", name: "BSNL", color: "bg-green-500" },
            ].map((op) => (
              <Button
                key={op.id}
                variant="outline"
                className="w-full justify-start h-14 hover:border-emerald-500 bg-transparent"
                onClick={() => handleOperatorSelect(op.id)}
              >
                <div
                  className={`w-8 h-8 ${op.color} rounded-full mr-3 flex items-center justify-center text-white text-xs font-bold`}
                >
                  {op.name[0]}
                </div>
                <span className="text-foreground">{op.name}</span>
              </Button>
            ))}
            <Button variant="ghost" onClick={() => setStep(1)} className="w-full mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Change Number
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Plan */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">{operator.toUpperCase()} Recharge</CardTitle>
                  <CardDescription>{mobileNumber}</CardDescription>
                </div>
                {currentUser && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Wallet className="h-4 w-4" />
                      Balance:{" "}
                      <span className="font-bold text-foreground">
                        ₹{currentUser?.balance?.toLocaleString("en-IN")}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(["all", "regular", "data", "talktime"] as PlanType[]).map((type) => (
                  <Button
                    key={type}
                    variant={planType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlanType(type)}
                    className={planType === type ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                  >
                    {type === "all" ? "All" : type === "regular" ? "Popular" : type === "data" ? "Data" : "Talktime"}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all hover:border-emerald-500 ${
                  currentUser && currentUser.balance < plan.amount ? "opacity-50" : ""
                } ${plan.popular ? "border-emerald-500 ring-1 ring-emerald-500" : ""}`}
                onClick={() => handlePlanSelect(plan)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-bold text-foreground">₹{plan.amount}</span>
                        {plan.popular && (
                          <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {plan.validity}
                        </span>
                        <span className="flex items-center gap-1">
                          <Wifi className="h-3 w-3" />
                          {plan.data}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={currentUser && currentUser.balance < plan.amount}
                    >
                      Recharge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="ghost" onClick={() => setStep(2)} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Change Operator
          </Button>
        </div>
      )}

      {step === 4 && selectedPlan && (
        <Card className="text-center">
          <CardContent className="pt-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Recharge Successful!</h2>
              <p className="text-muted-foreground mt-1">Your recharge has been completed</p>
            </div>

            {/* Receipt Card */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-left border">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-foreground">Transaction Receipt</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-sm text-foreground">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-medium text-foreground">{transactionDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mobile Number</span>
                <span className="font-medium text-foreground">+91 {mobileNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operator</span>
                <span className="font-medium text-foreground">{operator.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium text-foreground">
                  {selectedPlan.validity} | {selectedPlan.data}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-emerald-600">₹{selectedPlan.amount}</span>
              </div>

              {/* Balance Section */}
              <div className="pt-3 mt-3 border-t space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">Wallet Balance</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Previous Balance</span>
                  <span className="text-foreground">₹{previousBalance.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Deducted</span>
                  <span className="text-red-500">- ₹{selectedPlan.amount}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span className="text-foreground">New Balance</span>
                  <span className="text-emerald-600">₹{currentUser?.balance?.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.push("/dashboard")}>
                Go Home
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setStep(1)
                  setSelectedPlan(null)
                  setOperator("")
                  setTransactionId("")
                  setTransactionDate("")
                }}
              >
                New Recharge
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showBiometricPrompt} onOpenChange={setShowBiometricPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Verify Your Identity</DialogTitle>
            <DialogDescription>
              Complete biometric verification to process ₹{selectedPlan?.amount} recharge
            </DialogDescription>
          </DialogHeader>
          {currentUser && (
            <BiometricAuth
              userId={currentUser.id}
              mode="verify"
              onFaceId={handleBiometricSuccess}
              onFingerprint={handleBiometricSuccess}
              onError={(error) => {
                toast({
                  title: "Verification Failed",
                  description: error,
                  variant: "destructive",
                })
              }}
            />
          )}
          <Button variant="outline" onClick={() => setShowBiometricPrompt(false)}>
            Cancel
          </Button>
        </DialogContent>
      </Dialog>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
            <p className="text-foreground font-medium">Processing recharge...</p>
          </div>
        </div>
      )}
    </div>
  )
}
