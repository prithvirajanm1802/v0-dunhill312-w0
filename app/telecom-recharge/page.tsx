"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, CheckCircle, Loader2, Phone, Smartphone, Wallet } from "lucide-react"
import Link from "next/link"
import { PaymentReceipt } from "@/components/payment-receipt"

interface Plan {
  id: string
  amount: number
  validity: string
  data: string
  type: "data" | "unlimited" | "talktime"
  description: string
}

interface CurrentUser {
  id: string
  name: string
  fullName?: string
  balance: number
  biometricEnabled?: boolean
  fingerprintRegistered?: boolean
}

const operators = [
  { id: "jio", name: "Jio", color: "bg-blue-600" },
  { id: "airtel", name: "Airtel", color: "bg-red-600" },
  { id: "vi", name: "Vi", color: "bg-purple-600" },
]

const plans: Record<string, Plan[]> = {
  jio: [
    { id: "j1", amount: 155, validity: "28 days", data: "1GB/day", type: "data", description: "Unlimited calls" },
    { id: "j2", amount: 299, validity: "28 days", data: "2GB/day", type: "unlimited", description: "Truly unlimited" },
    { id: "j3", amount: 479, validity: "56 days", data: "1.5GB/day", type: "data", description: "Long validity" },
    { id: "j4", amount: 666, validity: "84 days", data: "1.5GB/day", type: "data", description: "Best value" },
  ],
  airtel: [
    { id: "a1", amount: 179, validity: "28 days", data: "1GB/day", type: "data", description: "Unlimited calls" },
    { id: "a2", amount: 319, validity: "28 days", data: "2GB/day", type: "unlimited", description: "Premium pack" },
    { id: "a3", amount: 549, validity: "56 days", data: "2GB/day", type: "data", description: "Extended validity" },
    { id: "a4", amount: 719, validity: "84 days", data: "1.5GB/day", type: "data", description: "Super value" },
  ],
  vi: [
    { id: "v1", amount: 155, validity: "28 days", data: "1GB/day", type: "data", description: "Unlimited calls" },
    { id: "v2", amount: 299, validity: "28 days", data: "1.5GB/day", type: "unlimited", description: "Vi Hero" },
    { id: "v3", amount: 475, validity: "56 days", data: "1.5GB/day", type: "data", description: "Double validity" },
    { id: "v4", amount: 699, validity: "84 days", data: "1.5GB/day", type: "data", description: "Best offer" },
  ],
}

export default function TelecomRechargePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [selectedOperator, setSelectedOperator] = useState<string>("jio")
  const [mobileNumber, setMobileNumber] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [previousBalance, setPreviousBalance] = useState(0)

  useEffect(() => {
    const userData = localStorage.getItem("honeydrew_current_user") || localStorage.getItem("currentUser")
    if (!userData) {
      router.push("/login")
      return
    }
    setCurrentUser(JSON.parse(userData))
  }, [router])

  const handleRecharge = async () => {
    if (!selectedPlan || !currentUser || !mobileNumber) {
      toast({
        title: "Missing Information",
        description: "Please select a plan and enter mobile number",
        variant: "destructive",
      })
      return
    }

    if (currentUser.balance < selectedPlan.amount) {
      toast({
        title: "Insufficient Balance",
        description: "Please add money to your wallet",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    setPreviousBalance(currentUser.balance)

    try {
      const deviceId = localStorage.getItem("deviceId") || `device_${Date.now()}`
      if (!localStorage.getItem("deviceId")) {
        localStorage.setItem("deviceId", deviceId)
      }

      // Process payment
      const response = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          amount: selectedPlan.amount,
          recipient: `${operators.find((o) => o.id === selectedOperator)?.name} ${mobileNumber}`,
          category: "mobile_recharge",
          authMethod: "fingerprint",
          verificationScore: 95,
          deviceId,
          metadata: {
            operator: selectedOperator,
            mobileNumber,
            planId: selectedPlan.id,
            validity: selectedPlan.validity,
            data: selectedPlan.data,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        const updatedUser = { ...currentUser, balance: result.newBalance }
        setCurrentUser(updatedUser)
        localStorage.setItem("honeydrew_current_user", JSON.stringify(updatedUser))
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))

        setTransactionId(result.transactionId || `TXN${Date.now()}`)
        setShowReceipt(true)

        // Log recharge to admin logs
        try {
          await fetch("/api/admin/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              adminId: "system",
              actionType: "mobile_recharge",
              resourceType: "transaction",
              resourceId: result.transactionId,
              severity: "low",
              details: {
                userId: currentUser.id,
                userName: currentUser.name || currentUser.fullName,
                operator: selectedOperator,
                mobileNumber,
                amount: selectedPlan.amount,
                planDetails: selectedPlan,
                timestamp: new Date().toISOString(),
              },
            }),
          })
        } catch (logError) {
          console.warn("[v0] Failed to log admin activity:", logError)
        }

        toast({
          title: "Recharge Successful",
          description: `${mobileNumber} recharged with ₹${selectedPlan.amount}`,
        })
      } else {
        toast({
          title: "Recharge Failed",
          description: result.error || "Failed to process recharge",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Recharge error:", error)
      toast({
        title: "Error",
        description: "An error occurred during recharge",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  if (!currentUser) {
    return null
  }

  if (showReceipt && selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <PaymentReceipt
            transactionId={transactionId}
            amount={selectedPlan.amount}
            recipient={`${operators.find((o) => o.id === selectedOperator)?.name} ${mobileNumber}`}
            service="Mobile Recharge"
            timestamp={new Date().toISOString()}
            previousBalance={previousBalance}
            newBalance={currentUser.balance}
            authMethod="fingerprint"
            metadata={{
              operator: operators.find((o) => o.id === selectedOperator)?.name,
              mobileNumber,
              validity: selectedPlan.validity,
              data: selectedPlan.data,
            }}
            onNewPayment={() => {
              setShowReceipt(false)
              setSelectedPlan(null)
              setMobileNumber("")
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-emerald-800 dark:text-emerald-400">Telecom Recharge</h1>
            <p className="text-emerald-600 dark:text-emerald-500">Jio, Airtel, Vi - Instant recharge</p>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <span className="text-sm text-muted-foreground">Wallet Balance</span>
              </div>
              <span className="text-2xl font-bold text-emerald-600">{formatCurrency(currentUser.balance)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Operator Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Operator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {operators.map((op) => (
                <Button
                  key={op.id}
                  variant={selectedOperator === op.id ? "default" : "outline"}
                  className={selectedOperator === op.id ? op.color : "bg-transparent"}
                  onClick={() => setSelectedOperator(op.id)}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  {op.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mobile Number */}
        <Card>
          <CardHeader>
            <CardTitle>Mobile Number</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter 10-digit mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                className="pl-10"
                maxLength={10}
              />
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Select Plan</CardTitle>
            <CardDescription>
              Choose a recharge plan for {operators.find((o) => o.id === selectedOperator)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {plans[selectedOperator].map((plan) => (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all ${selectedPlan?.id === plan.id ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : ""}`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-2xl font-bold text-emerald-600">₹{plan.amount}</p>
                        <p className="text-sm text-muted-foreground">{plan.validity}</p>
                      </div>
                      {selectedPlan?.id === plan.id && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        {plan.data}
                      </Badge>
                      <p className="text-sm">{plan.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recharge Button */}
        <Button
          onClick={handleRecharge}
          disabled={!selectedPlan || !mobileNumber || mobileNumber.length !== 10 || processing}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>Recharge {selectedPlan ? formatCurrency(selectedPlan.amount) : "Now"}</>
          )}
        </Button>
      </div>
    </div>
  )
}
