"use client"

import { DialogTrigger } from "@/components/ui/dialog"
import { Send } from "lucide-react" // Added import for Send icon

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Plus,
  TrendingUp,
  TrendingDown,
  Smartphone,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { BiometricVerificationModal } from "@/components/biometric-verification-modal"

interface Transaction {
  id: string
  type: "credit" | "debit"
  amount: number
  description: string
  timestamp: number
  category: string
  status: "completed" | "pending" | "failed"
}

interface User {
  id: string
  name: string
  fullName?: string
  email: string
  phone: string
  mobile?: string
  balance: number
  biometricEnabled: boolean
  faceRegistered: boolean
  fingerprintRegistered: boolean
}

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showBalance, setShowBalance] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [verificationPurpose, setVerificationPurpose] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState("")
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  const [processingTopUp, setProcessingTopUp] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const currentUser = localStorage.getItem("honeydrew_current_user")
      if (!currentUser) {
        window.location.href = "/login"
        return
      }

      const userData = JSON.parse(currentUser)
      setUser(userData)

      // Fetch transactions from API
      try {
        const response = await fetch(`/api/users/${userData.id}/transactions`)
        const data = await response.json()
        if (data.success && data.transactions) {
          setTransactions(
            data.transactions.map((t: any) => ({
              id: t.id,
              type: t.transaction_type === "received" || t.transaction_type === "deposit" ? "credit" : "debit",
              amount: Number(t.amount),
              description: t.category || t.transaction_type,
              timestamp: new Date(t.created_at).getTime(),
              category: t.category,
              status: t.status,
            })),
          )
        }
      } catch (err) {
        // Fallback to localStorage
        const userTransactions = JSON.parse(localStorage.getItem(`honeydrew_transactions_${userData.id}`) || "[]")
        setTransactions(userTransactions.sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp))
      }

      setLoading(false)
    } catch (error) {
      console.error("Error loading user data:", error)
      setError("Failed to load wallet data")
      setLoading(false)
    }
  }

  const handleViewBalance = () => {
    if (!user) return

    if (user.biometricEnabled) {
      setVerificationPurpose("balance_check")
      setShowVerification(true)
    } else {
      setShowBalance(true)
    }
  }

  const handleVerificationSuccess = () => {
    setShowVerification(false)
    setShowBalance(true)
  }

  const handleVerificationError = (error: string) => {
    setShowVerification(false)
    setError(`Biometric verification failed: ${error}`)
  }

  const handleVerificationCancel = () => {
    setShowVerification(false)
    setVerificationPurpose("")
  }

  const initiateTopUp = async () => {
    if (!topUpAmount || Number(topUpAmount) < 10) {
      toast({
        title: "Invalid amount",
        description: "Minimum top-up amount is ₹10",
        variant: "destructive",
      })
      return
    }

    setProcessingTopUp(true)

    try {
      const response = await fetch("/api/stripe/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          amount: Number(topUpAmount) * 100, // Convert to paise
          currency: "inr",
          description: `Add ₹${topUpAmount} to Honeydrew Mills wallet`,
        }),
      })

      const data = await response.json()

      if (data.success && data.clientSecret) {
        setStripeClientSecret(data.clientSecret)
      } else {
        throw new Error(data.message || "Failed to create payment session")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      })
    } finally {
      setProcessingTopUp(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTransactionIcon = (type: string) => {
    return type === "credit" ? (
      <ArrowDownLeft className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-red-600" />
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "pending":
        return <ArrowUpRight className="h-4 w-4 text-yellow-600" />
      case "failed":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Smartphone className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <ArrowUpRight className="h-12 w-12 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <TrendingDown className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">Please log in to access your wallet.</p>
            <Button onClick={() => (window.location.href = "/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-bold text-emerald-800 dark:text-emerald-400">My Wallet</h1>
            <p className="text-emerald-600 dark:text-emerald-500">Manage your Honeydrew Mills account</p>
          </div>
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {user.name || user.fullName}
          </Badge>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200">
            <ArrowDownLeft className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {/* Balance Card */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5 text-emerald-600" />
                Account Balance
              </div>
              {user.biometricEnabled && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Biometric Protected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Your current Honeydrew Mills wallet balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-emerald-600">
                    {showBalance ? formatCurrency(user.balance) : "••••••"}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={showBalance ? () => setShowBalance(false) : handleViewBalance}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Dialog open={showTopUp} onOpenChange={setShowTopUp}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Money
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Money to Wallet</DialogTitle>
                        <DialogDescription>Top up your Honeydrew Mills wallet using Stripe</DialogDescription>
                      </DialogHeader>

                      {stripeClientSecret ? (
                        <div className="mt-4">{/* EmbeddedCheckoutProvider and EmbeddedCheckout code removed */}</div>
                      ) : (
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Amount (₹)</Label>
                            <Input
                              type="number"
                              placeholder="Enter amount"
                              value={topUpAmount}
                              onChange={(e) => setTopUpAmount(e.target.value)}
                              min="10"
                            />
                            <p className="text-xs text-muted-foreground">Minimum: ₹10</p>
                          </div>

                          <div className="flex gap-2">
                            {[100, 500, 1000, 5000].map((amt) => (
                              <Button
                                key={amt}
                                variant="outline"
                                size="sm"
                                onClick={() => setTopUpAmount(String(amt))}
                                className="flex-1 bg-transparent"
                              >
                                ₹{amt}
                              </Button>
                            ))}
                          </div>

                          <Button
                            onClick={initiateTopUp}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            disabled={processingTopUp || !topUpAmount}
                          >
                            {processingTopUp ? (
                              <>
                                <ArrowUpRight className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Pay with Stripe
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Link href="/scan-qr">
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Scan & Pay
                    </Button>
                  </Link>

                  <Link href="/transfer">
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <Send className="h-4 w-4 mr-2" />
                      Send Money
                    </Button>
                  </Link>

                  <Link href="/self-qr">
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      My QR
                    </Button>
                  </Link>
                </div>
              </div>

              {!showBalance && user.biometricEnabled && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
                  <ArrowLeft className="h-4 w-4 mr-2 text-blue-600" />
                  Your balance is protected by biometric verification. Click the eye icon to verify and view.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {showBalance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-emerald-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold text-emerald-600">{transactions.length}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Money Received</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        transactions.filter((t) => t.type === "credit").reduce((sum, t) => sum + t.amount, 0),
                      )}
                    </p>
                  </div>
                  <ArrowDownLeft className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Money Sent</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(
                        Math.abs(transactions.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.amount, 0)),
                      )}
                    </p>
                  </div>
                  <ArrowUpRight className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transaction History */}
        {showBalance && (
          <Card className="border-emerald-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your recent Honeydrew Mills transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowLeft className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Start using your wallet to see transactions here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type)}
                          {getStatusIcon(transaction.status)}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(transaction.timestamp)}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {transaction.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${transaction.type === "credit" ? "text-green-600" : "text-red-600"}`}
                        >
                          {transaction.type === "credit" ? "+" : "-"}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <Badge
                          variant={
                            transaction.status === "completed"
                              ? "default"
                              : transaction.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Biometric Verification Modal */}
        {showVerification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-md w-full">
              <BiometricVerificationModal
                onSuccess={handleVerificationSuccess}
                onError={handleVerificationError}
                onCancel={handleVerificationCancel}
                userId={user.id}
                purpose={verificationPurpose}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
