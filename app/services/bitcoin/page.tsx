"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { sessionManager } from "@/lib/session-manager"
import { crossDeviceSync } from "@/lib/cross-device-sync"
import { dbService } from "@/lib/db"
import { HoneydrewPaymentVerification } from "@/components/honeydrew-payment-verification"

export default function BitcoinPage() {
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [cryptoType, setCryptoType] = useState("bitcoin")
  const [transactions, setTransactions] = useState<any[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const cryptoPrices = {
    bitcoin: { symbol: "BTC", price: 45200, change: 2.5, trend: "up" },
    ethereum: { symbol: "ETH", price: 2400, change: 1.8, trend: "up" },
    ripple: { symbol: "XRP", price: 2.1, change: -0.5, trend: "down" },
  }

  const handleBuy = async () => {
    if (!amount) {
      toast({
        title: "Enter Amount",
        description: "Please specify the amount you want to invest",
        variant: "destructive",
      })
      return
    }
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async (result: { verified: boolean; method: string; transactionId: string }) => {
    try {
      const session = await sessionManager.getSession()

      const transaction = {
        id: `txn_${Date.now()}`,
        type: "crypto_buy",
        cryptoType,
        amount: Number(amount),
        paymentMethod: `honeydrew_${result.method}`,
        transactionId: result.transactionId,
        status: "completed",
        timestamp: new Date().toISOString(),
        deviceId: session?.deviceId,
        userId: session?.userId,
      }

      await dbService.addTransaction(transaction)
      await crossDeviceSync.syncData({ type: "transaction", data: transaction })

      setTransactions([transaction, ...transactions])
      setShowPaymentModal(false)
      setAmount("")

      toast({
        title: "Purchase Successful",
        description: `Successfully bought ${cryptoType.toUpperCase()} for Rs. ${amount}`,
      })
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const loadTransactions = async () => {
      const txns = await dbService.getTransactions("crypto_buy")
      setTransactions(txns)
    }
    loadTransactions()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="border-emerald-200 hover:bg-emerald-50 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">Bitcoin & Crypto Investment</h1>
            <p className="text-gray-600 dark:text-slate-400">Buy & sell cryptocurrencies securely</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(cryptoPrices).map(([key, data]: [string, any]) => (
            <Card
              key={key}
              className={`border-emerald-200 dark:border-slate-700 dark:bg-slate-900 cursor-pointer hover:shadow-lg transition-shadow ${cryptoType === key ? "ring-2 ring-emerald-500" : ""}`}
              onClick={() => setCryptoType(key)}
            >
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{data.symbol}</p>
                    <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-400">Rs. {data.price}</p>
                  </div>
                  <div
                    className={`p-2 rounded-full ${data.trend === "up" ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}
                  >
                    {data.trend === "up" ? (
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>
                <p
                  className={`text-sm font-medium ${data.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {data.trend === "up" ? "+" : ""}
                  {data.change}% today
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {showPaymentModal ? (
          <HoneydrewPaymentVerification
            paymentDetails={{
              amount: Number(amount),
              description: `Buy ${(Number(amount) / cryptoPrices[cryptoType as keyof typeof cryptoPrices].price).toFixed(4)} ${cryptoType.toUpperCase()}`,
              serviceName: "Crypto Investment",
            }}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowPaymentModal(false)}
          />
        ) : (
          <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                <DollarSign className="h-5 w-5" />
                Buy {cryptoType.toUpperCase()}
              </CardTitle>
              <CardDescription>Invest in cryptocurrency with Honeydrew biometric verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="dark:text-slate-300">
                  Investment Amount (Rs.)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="border-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              {amount && (
                <div className="bg-emerald-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    You will receive:{" "}
                    {(Number(amount) / cryptoPrices[cryptoType as keyof typeof cryptoPrices].price).toFixed(4)}{" "}
                    {cryptoType.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-500">
                    Processing fee: Rs. 49 | Rate: 1 {cryptoType.toUpperCase()} = Rs.{" "}
                    {cryptoPrices[cryptoType as keyof typeof cryptoPrices].price}
                  </p>
                </div>
              )}

              <Button onClick={handleBuy} className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={!amount}>
                Pay with Honeydrew
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="history" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-emerald-50 dark:bg-slate-800">
            <TabsTrigger value="portfolio" className="dark:text-slate-300">
              Holdings
            </TabsTrigger>
            <TabsTrigger value="history" className="dark:text-slate-300">
              History ({transactions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="dark:text-emerald-400">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-gray-500 dark:text-slate-400">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-emerald-800 dark:text-emerald-400">{txn.cryptoType}</p>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            {new Date(txn.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="font-bold text-emerald-800 dark:text-emerald-300">
                          Rs. {txn.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
              <CardContent className="pt-6 text-center">
                <Lock className="h-12 w-12 mx-auto text-emerald-600 mb-3" />
                <p className="text-gray-600 dark:text-slate-400">Your crypto portfolio will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
