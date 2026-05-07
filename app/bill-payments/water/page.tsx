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

// Water providers
const providers = [
  { id: "municipal", name: "Municipal Corporation" },
  { id: "water_board", name: "Water Board" },
  { id: "jal_board", name: "Jal Board" },
  { id: "phed", name: "Public Health Engineering Department" },
]

export default function WaterBillPage() {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [provider, setProvider] = useState("")
  const [waterID, setWaterID] = useState("")
  const [amount, setAmount] = useState("")
  const [billDetails, setBillDetails] = useState<any>(null)
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("currentUser")
      return user ? JSON.parse(user) : null
    }
    return null
  })

  const handleFetchBill = () => {
    if (!provider) {
      toast({
        title: "Provider Required",
        description: "Please select a water provider",
        variant: "destructive",
      })
      return
    }

    if (!waterID) {
      toast({
        title: "Water ID Required",
        description: "Please enter your Water ID/Connection Number",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Simulate API call to fetch bill details
    setTimeout(() => {
      setIsLoading(false)

      // Generate random bill amount between 300 and 1500
      const billAmount = Math.floor(Math.random() * 1200) + 300

      setBillDetails({
        provider: providers.find((p) => p.id === provider)?.name,
        waterID,
        amount: billAmount,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        billPeriod: "April 2023",
        units: Math.floor(Math.random() * 200) + 50,
      })

      setAmount(billAmount.toString())
      setStep(2)
    }, 2000)
  }

  const handlePayBill = () => {
    if (!amount || Number(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    // Check if user has sufficient balance
    if (currentUser && currentUser.balance < Number(amount)) {
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
      if (!currentUser || !billDetails) {
        throw new Error("Missing user or bill data")
      }

      const deviceId = localStorage.getItem("deviceId") || `device_${Date.now()}`
      if (!localStorage.getItem("deviceId")) {
        localStorage.setItem("deviceId", deviceId)
      }

      const result = await processPayment({
        userId: currentUser.id,
        amount: Number(amount),
        recipient: billDetails.provider,
        category: "bill",
        authMethod: "biometric",
        verificationScore: 0.9,
        deviceId,
        metadata: {
          provider,
          waterID,
          billPeriod: billDetails.billPeriod,
          units: billDetails.units,
        },
      })

      if (result.success) {
        const updatedUser = { ...currentUser, balance: result.newBalance }
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)

        toast({
          title: "Payment Successful",
          description: `Your water bill of ₹${amount} has been paid.`,
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
        <h1 className="text-xl font-bold">Water Bill</h1>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Pay Water Bill</CardTitle>
            <CardDescription>Enter your water connection details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Water Provider</Label>
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
              <Label htmlFor="waterID">Water ID / Connection Number</Label>
              <Input
                id="waterID"
                placeholder="Enter Water ID"
                value={waterID}
                onChange={(e) => setWaterID(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleFetchBill} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Fetching bill...</span>
                </div>
              ) : (
                "Fetch Bill"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && billDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Bill Details</CardTitle>
            <CardDescription>Review and pay your water bill</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm">
                Your balance: <span className="font-bold">₹{currentUser?.balance}</span>
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium">{billDetails.provider}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Water ID</span>
                <span className="font-medium">{billDetails.waterID}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Bill Period</span>
                <span className="font-medium">{billDetails.billPeriod}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Units Consumed</span>
                <span className="font-medium">{billDetails.units} units</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Due Date</span>
                <span className="font-medium">{billDetails.dueDate}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-700 font-medium">Amount Due</span>
                <span className="font-bold">₹{billDetails.amount}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Pay (₹)</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              className="w-full"
              onClick={handlePayBill}
              disabled={!amount || Number(amount) <= 0 || (currentUser && currentUser.balance < Number(amount))}
            >
              Pay ₹{amount || "0"}
            </Button>
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
            <p className="text-gray-500 text-center mb-4">Your water bill has been paid successfully.</p>
            <div className="bg-gray-50 w-full p-4 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-medium">₹{amount}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium">{billDetails?.provider}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Water ID</span>
                <span className="font-medium">{billDetails?.waterID}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-medium">WATER{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
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
