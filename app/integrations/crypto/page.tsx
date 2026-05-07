"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Shield, RefreshCw, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { BiometricAuth } from "@/components/biometric-auth"

interface Cryptocurrency {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap: string
  volume: string
  holdings?: number
  value?: number
}

interface Transaction {
  id: string
  type: "buy" | "sell"
  crypto: string
  amount: number
  price: number
  total: number
  date: string
  status: "completed" | "pending" | "failed"
}

const cryptocurrencies: Cryptocurrency[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    price: 4250000, // ₹42,50,000
    change24h: 2.5,
    marketCap: "₹83.2L Cr",
    volume: "₹2.1L Cr",
    holdings: 0.025,
    value: 106250,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    price: 280000, // ₹2,80,000
    change24h: -1.2,
    marketCap: "₹33.6L Cr",
    volume: "₹1.8L Cr",
    holdings: 0.5,
    value: 140000,
  },
  {
    id: "cardano",
    name: "Cardano",
    symbol: "ADA",
    price: 45, // ₹45
    change24h: 5.8,
    marketCap: "₹1.5L Cr",
    volume: "₹8,500 Cr",
    holdings: 1000,
    value: 45000,
  },
  {
    id: "polygon",
    name: "Polygon",
    symbol: "MATIC",
    price: 85, // ₹85
    change24h: -3.1,
    marketCap: "₹78,000 Cr",
    volume: "₹4,200 Cr",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    price: 12500, // ₹12,500
    change24h: 8.2,
    marketCap: "₹5.4L Cr",
    volume: "₹1.2L Cr",
  },
  {
    id: "chainlink",
    name: "Chainlink",
    symbol: "LINK",
    price: 1850, // ₹1,850
    change24h: 1.7,
    marketCap: "₹1.1L Cr",
    volume: "₹6,800 Cr",
  },
]

const recentTransactions: Transaction[] = [
  {
    id: "1",
    type: "buy",
    crypto: "BTC",
    amount: 0.005,
    price: 4250000,
    total: 21250,
    date: "2024-01-15",
    status: "completed",
  },
  {
    id: "2",
    type: "sell",
    crypto: "ETH",
    amount: 0.1,
    price: 280000,
    total: 28000,
    date: "2024-01-14",
    status: "completed",
  },
  {
    id: "3",
    type: "buy",
    crypto: "ADA",
    amount: 500,
    price: 45,
    total: 22500,
    date: "2024-01-13",
    status: "pending",
  },
]

export default function CryptoTradingPage() {
  const [cryptos, setCryptos] = useState(cryptocurrencies)
  const [showBiometric, setShowBiometric] = useState(false)
  const [selectedCrypto, setSelectedCrypto] = useState<Cryptocurrency | null>(null)
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy")
  const [tradeAmount, setTradeAmount] = useState("")
  const [hideBalances, setHideBalances] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const totalPortfolioValue = cryptos.reduce((sum, crypto) => sum + (crypto.value || 0), 0)
  const totalChange24h = cryptos.reduce((sum, crypto) => {
    if (crypto.value) {
      return sum + (crypto.value * crypto.change24h) / 100
    }
    return sum
  }, 0)

  const handleTrade = (crypto: Cryptocurrency, type: "buy" | "sell") => {
    setSelectedCrypto(crypto)
    setTradeType(type)
    setShowBiometric(true)
  }

  const handleBiometricSuccess = () => {
    if (selectedCrypto && tradeAmount) {
      const amount = Number.parseFloat(tradeAmount)
      const total = amount * selectedCrypto.price

      toast({
        title: `${tradeType === "buy" ? "Purchase" : "Sale"} Successful`,
        description: `${tradeType === "buy" ? "Bought" : "Sold"} ${amount} ${selectedCrypto.symbol} for ₹${total.toLocaleString()}`,
        variant: "default",
      })

      // Update holdings
      if (tradeType === "buy") {
        setCryptos(
          cryptos.map((crypto) =>
            crypto.id === selectedCrypto.id
              ? {
                  ...crypto,
                  holdings: (crypto.holdings || 0) + amount,
                  value: ((crypto.holdings || 0) + amount) * crypto.price,
                }
              : crypto,
          ),
        )
      } else {
        setCryptos(
          cryptos.map((crypto) =>
            crypto.id === selectedCrypto.id
              ? {
                  ...crypto,
                  holdings: Math.max(0, (crypto.holdings || 0) - amount),
                  value: Math.max(0, (crypto.holdings || 0) - amount) * crypto.price,
                }
              : crypto,
          ),
        )
      }

      setShowBiometric(false)
      setSelectedCrypto(null)
      setTradeAmount("")
    }
  }

  const refreshPrices = async () => {
    setRefreshing(true)
    // Simulate price refresh
    setTimeout(() => {
      setCryptos(
        cryptos.map((crypto) => ({
          ...crypto,
          price: crypto.price * (1 + (Math.random() - 0.5) * 0.02), // ±1% random change
          change24h: crypto.change24h + (Math.random() - 0.5) * 2, // ±1% change in 24h change
        })),
      )
      setRefreshing(false)
      toast({
        title: "Prices Updated",
        description: "Cryptocurrency prices have been refreshed",
        variant: "default",
      })
    }, 2000)
  }

  if (showBiometric) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">Confirm Transaction</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {tradeType === "buy" ? "Buying" : "Selling"} {tradeAmount} {selectedCrypto?.symbol}
              </p>
              <p className="text-lg font-semibold text-emerald-600">
                Total: ₹{(Number.parseFloat(tradeAmount || "0") * (selectedCrypto?.price || 0)).toLocaleString()}
              </p>
            </div>

            <BiometricAuth
              userId="current-user"
              mode="verify"
              onFingerprint={handleBiometricSuccess}
              onFaceId={handleBiometricSuccess}
              onError={(error) => {
                toast({
                  title: "Authentication Failed",
                  description: error,
                  variant: "destructive",
                })
                setShowBiometric(false)
              }}
            />

            <Button
              variant="outline"
              onClick={() => setShowBiometric(false)}
              className="w-full mt-4 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/integrations">
            <Button variant="outline" size="icon" className="border-emerald-200 hover:bg-emerald-50 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">Cryptocurrency Trading</h1>
            <p className="text-gray-600 dark:text-gray-400">Buy, sell and manage your crypto portfolio</p>
          </div>
          <Button
            variant="outline"
            onClick={refreshPrices}
            disabled={refreshing}
            className="border-emerald-200 hover:bg-emerald-50 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Portfolio Overview */}
        <Card className="border-emerald-200 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Wallet className="h-5 w-5" />
                Portfolio Overview
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideBalances(!hideBalances)}
                className="text-gray-500 hover:text-emerald-600"
              >
                {hideBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Portfolio Value</p>
                <p className="text-3xl font-bold text-emerald-800">
                  {hideBalances ? "••••••" : `₹${totalPortfolioValue.toLocaleString()}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">24h Change</p>
                <p className={`text-2xl font-semibold ${totalChange24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {hideBalances ? (
                    "••••••"
                  ) : (
                    <>
                      {totalChange24h >= 0 ? "+" : ""}₹{totalChange24h.toLocaleString()}
                      <span className="text-sm ml-2">
                        ({totalChange24h >= 0 ? "+" : ""}
                        {((totalChange24h / totalPortfolioValue) * 100).toFixed(2)}%)
                      </span>
                    </>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                <p className="text-2xl font-semibold text-emerald-800">{hideBalances ? "••••••" : "₹50,000"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="markets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Markets Tab */}
          <TabsContent value="markets">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800">Cryptocurrency Markets</CardTitle>
                <CardDescription>Live prices and market data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cryptos.map((crypto) => (
                    <div
                      key={crypto.id}
                      className="flex items-center justify-between p-4 border border-emerald-100 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="font-bold text-emerald-600">{crypto.symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-emerald-800">{crypto.name}</h3>
                          <p className="text-sm text-gray-600">{crypto.symbol}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-emerald-800">₹{crypto.price.toLocaleString()}</p>
                        <p
                          className={`text-sm flex items-center gap-1 ${crypto.change24h >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {crypto.change24h >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {crypto.change24h >= 0 ? "+" : ""}
                          {crypto.change24h.toFixed(2)}%
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleTrade(crypto, "buy")}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Buy
                        </Button>
                        {crypto.holdings && crypto.holdings > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTrade(crypto, "sell")}
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            Sell
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800">Your Holdings</CardTitle>
                <CardDescription>Cryptocurrencies in your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cryptos
                    .filter((crypto) => crypto.holdings && crypto.holdings > 0)
                    .map((crypto) => (
                      <div
                        key={crypto.id}
                        className="flex items-center justify-between p-4 border border-emerald-100 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="font-bold text-emerald-600">{crypto.symbol.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-emerald-800">{crypto.name}</h3>
                            <p className="text-sm text-gray-600">
                              {hideBalances ? "••••••" : `${crypto.holdings} ${crypto.symbol}`}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-emerald-800">
                            {hideBalances ? "••••••" : `₹${crypto.value?.toLocaleString()}`}
                          </p>
                          <p className="text-sm text-gray-600">@ ₹{crypto.price.toLocaleString()}</p>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTrade(crypto, "sell")}
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          Sell
                        </Button>
                      </div>
                    ))}

                  {cryptos.filter((crypto) => crypto.holdings && crypto.holdings > 0).length === 0 && (
                    <div className="text-center py-8">
                      <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Holdings Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Start building your crypto portfolio</p>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">Explore Markets</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800">Recent Transactions</CardTitle>
                <CardDescription>Your crypto trading history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border border-emerald-100 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === "buy" ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          {transaction.type === "buy" ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-emerald-800">
                            {transaction.type === "buy" ? "Bought" : "Sold"} {transaction.crypto}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {transaction.amount} {transaction.crypto} @ ₹{transaction.price.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-emerald-800">₹{transaction.total.toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              transaction.status === "completed"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : transaction.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Security Notice */}
        <Card className="border-emerald-200 mt-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-emerald-600 mt-1" />
              <div>
                <h3 className="font-semibold text-emerald-800 mb-2">Security & Risk Notice</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All transactions require biometric authentication</li>
                  <li>• Cryptocurrency investments are subject to market risks</li>
                  <li>• Your private keys are encrypted and stored securely</li>
                  <li>• Enable 2FA for additional account security</li>
                  <li>• Never share your login credentials with anyone</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade Modal */}
      {selectedCrypto && !showBiometric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-800">
                {tradeType === "buy" ? "Buy" : "Sell"} {selectedCrypto.name}
              </CardTitle>
              <CardDescription>Current price: ₹{selectedCrypto.price.toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({selectedCrypto.symbol})</Label>
                <Input
                  id="amount"
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  placeholder={`Enter ${selectedCrypto.symbol} amount`}
                  className="border-emerald-200"
                />
              </div>

              {tradeAmount && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="font-semibold text-emerald-800">
                      ₹{(Number.parseFloat(tradeAmount) * selectedCrypto.price).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCrypto(null)}
                  className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowBiometric(true)}
                  disabled={!tradeAmount || Number.parseFloat(tradeAmount) <= 0}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
