"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BiometricAuth } from "@/components/biometric-auth"
import { useToast } from "@/hooks/use-toast"
import { processPayment } from "@/lib/payment-service"

// EMI products
const emiProducts = [
  {
    id: "vivo_v29",
    name: "Vivo V29",
    type: "Mobile Phone",
    totalAmount: 36000,
    emiAmount: 3000,
    remainingAmount: 24000,
    tenure: "12 months",
    nextDueDate: "May 15, 2023",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "lenovo_yoga",
    name: "Lenovo Yoga",
    type: "Laptop",
    totalAmount: 75000,
    emiAmount: 5000,
    remainingAmount: 60000,
    tenure: "15 months",
    nextDueDate: "May 20, 2023",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "samsung_tv",
    name: "Samsung Smart TV",
    type: "Television",
    totalAmount: 45000,
    emiAmount: 3750,
    remainingAmount: 30000,
    tenure: "10 months",
    nextDueDate: "May 18, 2023",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "lg_refrigerator",
    name: "LG Refrigerator",
    type: "Home Appliance",
    totalAmount: 32000,
    emiAmount: 2667,
    remainingAmount: 24000,
    tenure: "9 months",
    nextDueDate: "May 22, 2023",
    image: "/placeholder.svg?height=100&width=100",
  },
]

export default function EMIPaymentPage() {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("currentUser")
      return user ? JSON.parse(user) : null
    }
    return null
  })

  const productDetails = emiProducts.find((p) => p.id === selectedProduct)

  const handleContinue = () => {
    if (!selectedProduct) {
      toast({
        title: "Product Required",
        description: "Please select a product to pay EMI",
        variant: "destructive",
      })
      return
    }

    // Check if user has sufficient balance
    if (currentUser && productDetails && currentUser.balance < productDetails.emiAmount) {
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
      if (!currentUser || !productDetails) {
        throw new Error("Missing user or product data")
      }

      const deviceId = localStorage.getItem("deviceId") || `device_${Date.now()}`
      if (!localStorage.getItem("deviceId")) {
        localStorage.setItem("deviceId", deviceId)
      }

      const result = await processPayment({
        userId: currentUser.id,
        amount: productDetails.emiAmount,
        recipient: `EMI - ${productDetails.name}`,
        category: "bill",
        authMethod: "biometric",
        verificationScore: 0.9,
        deviceId,
        metadata: {
          productId: productDetails.id,
          productName: productDetails.name,
          productType: productDetails.type,
          totalAmount: productDetails.totalAmount,
          remainingAmount: productDetails.remainingAmount,
          tenure: productDetails.tenure,
        },
      })

      if (result.success) {
        const updatedUser = { ...currentUser, balance: result.newBalance }
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)

        toast({
          title: "Payment Successful",
          description: `Your EMI of ₹${productDetails.emiAmount} has been paid.`,
        })
        setStep(2)
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
        <h1 className="text-xl font-bold">EMI Payment</h1>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Pay EMI</CardTitle>
            <CardDescription>Select a product to pay EMI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm">
                Your balance: <span className="font-bold">₹{currentUser?.balance}</span>
              </p>
            </div>
            <div className="space-y-2">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {emiProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ₹{product.emiAmount}/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {productDetails && (
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                    <CreditCard className="h-8 w-8 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">{productDetails.name}</h3>
                    <p className="text-sm text-gray-500">{productDetails.type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Total Amount</p>
                    <p className="font-medium">₹{productDetails.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">EMI Amount</p>
                    <p className="font-medium">₹{productDetails.emiAmount}/month</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Remaining Amount</p>
                    <p className="font-medium">₹{productDetails.remainingAmount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tenure</p>
                    <p className="font-medium">{productDetails.tenure}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Next Due Date</p>
                    <p className="font-medium">{productDetails.nextDueDate}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleContinue}
              disabled={
                !selectedProduct || (currentUser && productDetails && currentUser.balance < productDetails.emiAmount)
              }
            >
              Pay EMI
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && productDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Successful</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-1">EMI Payment Completed</h3>
            <p className="text-gray-500 text-center mb-4">Your EMI payment has been processed successfully.</p>
            <div className="bg-gray-50 w-full p-4 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Product</span>
                <span className="font-medium">{productDetails.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-medium">₹{productDetails.emiAmount}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Remaining EMIs</span>
                <span className="font-medium">
                  {Math.floor(productDetails.remainingAmount / productDetails.emiAmount) - 1}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Next Due Date</span>
                <span className="font-medium">
                  {new Date(
                    new Date(productDetails.nextDueDate).getTime() + 30 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-medium">EMI{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
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
