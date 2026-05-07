"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, CreditCard, Wallet } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { PRODUCTS } from "@/lib/products"
import { syncUserData } from "@/lib/cross-device-sync"
import { getActiveSession } from "@/lib/session-manager"

export default function WalletTopupPage() {
  const { toast } = useToast()
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("currentUser") || "null")
      if (user) {
        setCurrentUser(user)
        const session = getActiveSession(user.id)
        if (!session) {
          toast({
            title: "Session Expired",
            description: "Please login again",
            variant: "destructive",
          })
        }
      } else {
        window.location.href = "/login"
      }
    }
  }, [toast])

  const walletProducts = PRODUCTS.filter((p) => p.category === "wallet")

  const handlePaymentSuccess = async () => {
    setIsLoading(true)
    try {
      if (currentUser && selectedProduct) {
        const product = PRODUCTS.find((p) => p.id === selectedProduct)
        if (product) {
          const topupAmount = Number.parseInt(product.name.split("₹")[1])
          const updatedUser = {
            ...currentUser,
            balance: currentUser.balance + topupAmount,
          }

          localStorage.setItem("currentUser", JSON.stringify(updatedUser))
          setCurrentUser(updatedUser)

          // Sync update across devices
          await syncUserData(currentUser.id, updatedUser)

          toast({
            title: "Wallet Topped Up!",
            description: `₹${topupAmount} has been added to your wallet`,
          })

          setSelectedProduct(null)
        }
      }
    } catch (error) {
      console.error("[v0] Payment success error:", error)
      toast({
        title: "Error",
        description: "Failed to update wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="container max-w-md mx-auto py-6 px-4 text-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Wallet Top-up</h1>
      </div>

      {/* Current Balance */}
      <Card className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Current Balance</p>
              <p className="text-3xl font-bold">₹{currentUser.balance.toLocaleString()}</p>
            </div>
            <Wallet className="h-12 w-12 opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Top-up Options */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Top-up Options</CardTitle>
          <CardDescription>Select an amount to add to your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {walletProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product.id)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedProduct === product.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-bold">{product.name.split(" - ")[1]}</div>
                <div className="text-xs text-gray-500">${(product.priceInCents / 100).toFixed(2)}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      {selectedProduct && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Simulate payment for testing</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handlePaymentSuccess}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Processing..." : "Complete Payment (Simulated)"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Secure Payment Info */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Secure Wallet</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Your wallet balance is securely stored locally on your device. All transactions are encrypted.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
