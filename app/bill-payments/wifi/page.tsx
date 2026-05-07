"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BiometricAuth } from "@/components/biometric-auth"
import { useToast } from "@/hooks/use-toast"
import { processPayment } from "@/lib/payment-service"

// WiFi providers
const providers = [
  { id: "jio", name: "Jio Fiber", logo: "/jio-logo.svg" },
  { id: "airtel", name: "Airtel Fiber", logo: "/airtel-logo.svg" },
  { id: "bsnl", name: "BSNL Broadband", logo: "/bsnl-logo.svg" },
  { id: "vi", name: "Vi Fiber", logo: "/vi-logo.svg" },
  { id: "act", name: "ACT Fibernet", logo: "/jio-logo.svg" }, // Using Jio logo as placeholder
]

// WiFi plans
const plans = {
  jio: [
    { id: "jio1", name: "Basic", speed: "30 Mbps", data: "Unlimited", price: 399, validity: "28 days" },
    { id: "jio2", name: "Standard", speed: "100 Mbps", data: "Unlimited", price: 699, validity: "28 days" },
    { id: "jio3", name: "Premium", speed: "300 Mbps", data: "Unlimited", price: 999, validity: "28 days" },
    { id: "jio4", name: "Ultra", speed: "1 Gbps", data: "Unlimited", price: 1499, validity: "28 days" },
  ],
  airtel: [
    { id: "airtel1", name: "Basic", speed: "40 Mbps", data: "Unlimited", price: 499, validity: "30 days" },
    { id: "airtel2", name: "Standard", speed: "100 Mbps", data: "Unlimited", price: 799, validity: "30 days" },
    { id: "airtel3", name: "Premium", speed: "200 Mbps", data: "Unlimited", price: 999, validity: "30 days" },
    { id: "airtel4", name: "Ultra", speed: "1 Gbps", data: "Unlimited", price: 1499, validity: "30 days" },
  ],
  bsnl: [
    { id: "bsnl1", name: "Basic", speed: "30 Mbps", data: "Unlimited", price: 449, validity: "30 days" },
    { id: "bsnl2", name: "Standard", speed: "60 Mbps", data: "Unlimited", price: 599, validity: "30 days" },
    { id: "bsnl3", name: "Premium", speed: "100 Mbps", data: "Unlimited", price: 799, validity: "30 days" },
    { id: "bsnl4", name: "Ultra", speed: "200 Mbps", data: "Unlimited", price: 999, validity: "30 days" },
  ],
  vi: [
    { id: "vi1", name: "Basic", speed: "30 Mbps", data: "Unlimited", price: 399, validity: "28 days" },
    { id: "vi2", name: "Standard", speed: "60 Mbps", data: "Unlimited", price: 699, validity: "28 days" },
    { id: "vi3", name: "Premium", speed: "100 Mbps", data: "Unlimited", price: 999, validity: "28 days" },
  ],
  act: [
    { id: "act1", name: "Basic", speed: "40 Mbps", data: "Unlimited", price: 549, validity: "30 days" },
    { id: "act2", name: "Standard", speed: "100 Mbps", data: "Unlimited", price: 749, validity: "30 days" },
    { id: "act3", name: "Premium", speed: "150 Mbps", data: "Unlimited", price: 999, validity: "30 days" },
    { id: "act4", name: "Ultra", speed: "300 Mbps", data: "Unlimited", price: 1299, validity: "30 days" },
  ],
}

export default function WifiBillPage() {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [provider, setProvider] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("currentUser")
      return user ? JSON.parse(user) : null
    }
    return null
  })

  const handleContinue = () => {
    if (!provider) {
      toast({
        title: "Provider Required",
        description: "Please select a WiFi provider",
        variant: "destructive",
      })
      return
    }

    if (!accountNumber) {
      toast({
        title: "Account Number Required",
        description: "Please enter your account/customer ID",
        variant: "destructive",
      })
      return
    }

    setStep(2)
  }

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan)

    // Check if user has sufficient balance
    if (currentUser && currentUser.balance < plan.price) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to make this payment",
        variant: "destructive",
      })
      return
    }

    setShowBiometricPrompt(true)
  }

  const handleBiometricSuccess = async () => {
    setShowBiometricPrompt(false)
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
        amount: selectedPlan.price,
        recipient: `${providers.find((p) => p.id === provider)?.name} - ${selectedPlan.name}`,
        category: "bill",
        authMethod: "biometric",
        verificationScore: 0.9,
        deviceId,
        metadata: {
          provider,
          accountNumber,
          planName: selectedPlan.name,
          speed: selectedPlan.speed,
          validity: selectedPlan.validity,
        },
      })

      if (result.success) {
        const updatedUser = { ...currentUser, balance: result.newBalance }
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)

        toast({
          title: "Payment Successful",
          description: `Your WiFi bill of ₹${selectedPlan.price} has been paid.`,
        })
        setStep(3)
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

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link href="/bill-payments">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">WiFi Bill</h1>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Pay WiFi Bill</CardTitle>
            <CardDescription>Enter your WiFi connection details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">WiFi Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number / Customer ID</Label>
              <Input
                id="accountNumber"
                placeholder="Enter account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleContinue}>
              Continue
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Plan</CardTitle>
            <CardDescription>Choose a plan for {providers.find((p) => p.id === provider)?.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm">
                Your balance: <span className="font-bold">₹{currentUser?.balance}</span>
              </p>
            </div>
            <div className="space-y-4">
              {plans[provider as keyof typeof plans]?.map((plan) => (
                <Card
                  key={plan.id}
                  className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                    currentUser && currentUser.balance < plan.price ? "opacity-50" : ""
                  }`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-lg">₹{plan.price}</span>
                      <span className="text-sm text-gray-500">Validity: {plan.validity}</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">
                        {plan.name} - {plan.speed}
                      </p>
                      <p className="text-gray-500">{plan.data} data</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full bg-transparent" onClick={() => setStep(1)}>
              Back
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Successful</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-1">Bill Payment Completed</h3>
            <p className="text-gray-500 text-center mb-4">Your WiFi bill has been paid successfully.</p>
            <div className="bg-gray-50 w-full p-4 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-medium">₹{selectedPlan?.price}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium">{providers.find((p) => p.id === provider)?.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Plan</span>
                <span className="font-medium">
                  {selectedPlan?.name} - {selectedPlan?.speed}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Account Number</span>
                <span className="font-medium">{accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-medium">WIFI{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Link href="/dashboard" className="w-full">
              <Button className="w-full">Back to Home</Button>
            </Link>
            <Button variant="outline" className="w-full bg-transparent">
              Download Receipt
            </Button>
          </CardFooter>
        </Card>
      )}

      {showBiometricPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[300px]">
            <CardHeader>
              <CardTitle className="text-foreground">Authentication Required</CardTitle>
              <CardDescription>Verify your identity to complete the payment</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <BiometricAuth
                onFingerprint={handleBiometricSuccess}
                onFaceId={handleBiometricSuccess}
                userId={currentUser?.id || ""}
                mode="verify"
              />
            </CardContent>
            <div className="p-4 text-center">
              <Button variant="outline" onClick={() => setShowBiometricPrompt(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[300px]">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
              <p className="text-center">Processing your payment...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
