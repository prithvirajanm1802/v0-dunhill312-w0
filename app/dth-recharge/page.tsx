"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Tv, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BiometricAuth } from "@/components/biometric-auth"
import { PaymentReceipt } from "@/components/payment-receipt"
import { useToast } from "@/hooks/use-toast"
import { processPayment } from "@/lib/payment-service"

const operators = [
  { id: "tataplay", name: "Tata Play", logo: "T" },
  { id: "airtel", name: "Airtel Digital TV", logo: "A" },
  { id: "sundirect", name: "Sun Direct", logo: "S" },
  { id: "dishtv", name: "Dish TV", logo: "D" },
  { id: "videocon", name: "Videocon d2h", logo: "V" },
  { id: "jiotv", name: "Jio TV+", logo: "J" },
]

const plans: Record<string, any[]> = {
  tataplay: [
    {
      id: "tp1",
      name: "Hindi Lite",
      amount: 199,
      validity: "1 month",
      channels: "100+",
      description: "Basic Hindi entertainment",
    },
    {
      id: "tp2",
      name: "Hindi Smart",
      amount: 299,
      validity: "1 month",
      channels: "180+",
      description: "Hindi + Regional channels",
      popular: true,
    },
    {
      id: "tp3",
      name: "Hindi Max",
      amount: 449,
      validity: "1 month",
      channels: "250+",
      description: "All Hindi + Sports HD",
    },
    {
      id: "tp4",
      name: "Premium HD",
      amount: 699,
      validity: "1 month",
      channels: "350+",
      description: "All channels + HD + OTT",
    },
    {
      id: "tp5",
      name: "Hindi Smart",
      amount: 2990,
      validity: "1 year",
      channels: "180+",
      description: "Annual pack - Save ₹598",
    },
    {
      id: "tp6",
      name: "Premium HD",
      amount: 6990,
      validity: "1 year",
      channels: "350+",
      description: "Annual pack - Save ₹1398",
    },
  ],
  airtel: [
    {
      id: "ad1",
      name: "Value Lite HD",
      amount: 226,
      validity: "1 month",
      channels: "145+",
      description: "Basic HD entertainment",
    },
    {
      id: "ad2",
      name: "Value Sports HD",
      amount: 359,
      validity: "1 month",
      channels: "200+",
      description: "All Sports + Hindi",
      popular: true,
    },
    {
      id: "ad3",
      name: "Premium HD",
      amount: 494,
      validity: "1 month",
      channels: "280+",
      description: "Premium + Movies HD",
    },
    {
      id: "ad4",
      name: "All In One",
      amount: 649,
      validity: "1 month",
      channels: "350+",
      description: "Complete entertainment",
    },
    {
      id: "ad5",
      name: "Value Sports HD",
      amount: 3590,
      validity: "1 year",
      channels: "200+",
      description: "Annual pack - Save ₹718",
    },
  ],
  sundirect: [
    {
      id: "sd1",
      name: "Tamil Basic",
      amount: 149,
      validity: "1 month",
      channels: "80+",
      description: "Basic Tamil channels",
    },
    {
      id: "sd2",
      name: "South Super",
      amount: 249,
      validity: "1 month",
      channels: "150+",
      description: "All South languages",
      popular: true,
    },
    {
      id: "sd3",
      name: "South Premium",
      amount: 399,
      validity: "1 month",
      channels: "220+",
      description: "Premium South + Sports",
    },
    {
      id: "sd4",
      name: "South Max HD",
      amount: 549,
      validity: "1 month",
      channels: "280+",
      description: "HD South channels",
    },
    {
      id: "sd5",
      name: "South Premium",
      amount: 3990,
      validity: "1 year",
      channels: "220+",
      description: "Annual pack",
    },
  ],
  dishtv: [
    {
      id: "dt1",
      name: "Super Family",
      amount: 219,
      validity: "1 month",
      channels: "140+",
      description: "Family entertainment",
    },
    {
      id: "dt2",
      name: "Titanium",
      amount: 349,
      validity: "1 month",
      channels: "210+",
      description: "Sports + Movies",
      popular: true,
    },
    {
      id: "dt3",
      name: "Titanium HD",
      amount: 499,
      validity: "1 month",
      channels: "270+",
      description: "Full HD experience",
    },
    {
      id: "dt4",
      name: "Diamond HD",
      amount: 649,
      validity: "1 month",
      channels: "330+",
      description: "Premium HD + OTT",
    },
  ],
  videocon: [
    {
      id: "vd1",
      name: "New Gold",
      amount: 209,
      validity: "1 month",
      channels: "130+",
      description: "Gold entertainment",
    },
    {
      id: "vd2",
      name: "New Diamond",
      amount: 329,
      validity: "1 month",
      channels: "190+",
      description: "Diamond pack",
      popular: true,
    },
    {
      id: "vd3",
      name: "Platinum HD",
      amount: 479,
      validity: "1 month",
      channels: "250+",
      description: "Platinum HD experience",
    },
  ],
  jiotv: [
    {
      id: "jt1",
      name: "Jio Family",
      amount: 399,
      validity: "1 month",
      channels: "500+",
      description: "All channels + OTT",
      popular: true,
    },
    {
      id: "jt2",
      name: "Jio Premium",
      amount: 599,
      validity: "1 month",
      channels: "650+",
      description: "Premium + 15 OTT apps",
    },
    {
      id: "jt3",
      name: "Jio Family",
      amount: 3999,
      validity: "1 year",
      channels: "500+",
      description: "Annual Family pack",
    },
  ],
}

export default function DthRechargePage() {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [subscriberId, setSubscriberId] = useState("")
  const [operator, setOperator] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<"face" | "fingerprint">("fingerprint")
  const [transactionId, setTransactionId] = useState("")
  const [transactionTimestamp, setTransactionTimestamp] = useState("")
  const [previousBalance, setPreviousBalance] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("currentUser")
      return user ? JSON.parse(user) : null
    }
    return null
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleContinue = () => {
    if (!subscriberId || subscriberId.length < 8) {
      toast({
        title: "Invalid Subscriber ID",
        description: "Please enter a valid subscriber ID/customer ID",
        variant: "destructive",
      })
      return
    }
    setStep(2)
  }

  const handleSelectOperator = (op: string) => {
    setOperator(op)
    setStep(3)
  }

  const handleSelectPlan = (plan: any) => {
    if (currentUser && currentUser.balance < plan.amount) {
      toast({
        title: "Insufficient Balance",
        description: `Your balance is ${formatCurrency(currentUser.balance)}`,
        variant: "destructive",
      })
      return
    }
    setSelectedPlan(plan)
    setPreviousBalance(currentUser?.balance || 0)
    setStep(4) // Go to biometric verification
  }

  const handleBiometricSuccess = async (method: "face" | "fingerprint" = "fingerprint") => {
    setAuthMethod(method)
    setIsLoading(true)

    try {
      if (!currentUser || !selectedPlan) {
        throw new Error("Missing user or plan data")
      }

      const deviceId = localStorage.getItem("deviceId") || `device_${Date.now()}`
      if (!localStorage.getItem("deviceId")) {
        localStorage.setItem("deviceId", deviceId)
      }

      const result = await processPayment({
        userId: currentUser.id,
        amount: selectedPlan.amount,
        recipient: `${operators.find((op) => op.id === operator)?.name} DTH`,
        category: "dth_recharge",
        authMethod: method,
        verificationScore: 90,
        deviceId,
        metadata: {
          subscriberId,
          operator,
          planName: selectedPlan.name,
          validity: selectedPlan.validity,
          channels: selectedPlan.channels,
        },
      })

      if (result.success) {
        const updatedUser = { ...currentUser, balance: result.newBalance }
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)

        setTransactionId(result.transactionId || `TXN${Date.now()}`)
        setTransactionTimestamp(result.timestamp || new Date().toISOString())

        toast({
          title: "Recharge Successful",
          description: `Your DTH has been recharged with ${formatCurrency(selectedPlan.amount)} plan.`,
        })
        setStep(5) // Go to receipt
      } else {
        throw new Error(result.error || "Payment failed")
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSubscriberId("")
    setOperator("")
    setSelectedPlan(null)
  }

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Tv className="h-5 w-5" />
            DTH Recharge
          </h1>
          {currentUser && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              Balance: {formatCurrency(currentUser.balance)}
            </p>
          )}
        </div>
      </div>

      {/* Step 1: Enter Subscriber ID */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Subscriber ID</CardTitle>
            <CardDescription>Please enter your DTH subscriber ID or customer ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subscriberId">Subscriber ID / Customer ID</Label>
              <Input
                id="subscriberId"
                placeholder="Enter subscriber ID"
                value={subscriberId}
                onChange={(e) => setSubscriberId(e.target.value.replace(/\s/g, ""))}
              />
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleContinue}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Operator */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select DTH Operator</CardTitle>
            <CardDescription>Choose your DTH service provider</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {operators.map((op) => (
                <Card
                  key={op.id}
                  className="cursor-pointer hover:border-emerald-500 transition-colors"
                  onClick={() => handleSelectOperator(op.id)}
                >
                  <CardContent className="flex flex-col items-center justify-center p-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-2">
                      <span className="font-bold text-lg text-emerald-600">{op.logo}</span>
                    </div>
                    <span className="text-sm font-medium text-center">{op.name}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={() => setStep(1)}>
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Plan */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Plan</CardTitle>
            <CardDescription>
              Choose a recharge plan for {operators.find((op) => op.id === operator)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="monthly">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
              <TabsContent value="monthly" className="space-y-3">
                {plans[operator]
                  ?.filter((plan) => plan.validity === "1 month")
                  .map((plan) => (
                    <Card
                      key={plan.id}
                      className={`cursor-pointer hover:border-emerald-500 transition-colors ${plan.popular ? "border-emerald-500 ring-1 ring-emerald-500" : ""}`}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">{formatCurrency(plan.amount)}</span>
                              {plan.popular && (
                                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="font-medium text-sm">{plan.name}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{plan.channels} channels</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
              <TabsContent value="yearly" className="space-y-3">
                {plans[operator]
                  ?.filter((plan) => plan.validity === "1 year")
                  .map((plan) => (
                    <Card
                      key={plan.id}
                      className="cursor-pointer hover:border-emerald-500 transition-colors"
                      onClick={() => handleSelectPlan(plan)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-lg">{formatCurrency(plan.amount)}</span>
                            <p className="font-medium text-sm">{plan.name}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{plan.channels} channels</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
            <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={() => setStep(2)}>
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Biometric Verification */}
      {step === 4 && selectedPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Verify Payment</CardTitle>
            <CardDescription>
              Confirm recharge of {formatCurrency(selectedPlan.amount)} for{" "}
              {operators.find((op) => op.id === operator)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-emerald-50 dark:bg-slate-800 p-4 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold">{formatCurrency(selectedPlan.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Validity</span>
                <span className="font-medium">{selectedPlan.validity}</span>
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
              onClick={() => setStep(3)}
              disabled={isLoading}
            >
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Receipt */}
      {step === 5 && selectedPlan && (
        <PaymentReceipt
          transactionId={transactionId}
          amount={selectedPlan.amount}
          recipient={`${operators.find((op) => op.id === operator)?.name} DTH`}
          service="DTH Recharge"
          timestamp={transactionTimestamp}
          previousBalance={previousBalance}
          newBalance={currentUser?.balance || 0}
          authMethod={authMethod}
          metadata={{
            "Subscriber ID": subscriberId,
            Plan: selectedPlan.name,
            Validity: selectedPlan.validity,
            Channels: selectedPlan.channels,
          }}
          onNewPayment={resetForm}
        />
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[300px]">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
              <p className="text-center font-medium">Processing your recharge...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
