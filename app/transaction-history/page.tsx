"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  CreditCard,
  Smartphone,
  Gamepad,
  Heart,
  Fingerprint,
  Scan,
  Tv,
  TrendingUp,
  Train,
  Film,
  RefreshCw,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getTransactionHistory } from "@/lib/payment-service"

export default function TransactionHistoryPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [transactions, setTransactions] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadTransactions = async () => {
    setIsLoading(true)
    const user = JSON.parse(localStorage.getItem("currentUser") || "null")
    setCurrentUser(user)

    if (user) {
      try {
        // Fetch from payment service (tries DB first, then localStorage)
        const txns = await getTransactionHistory(user.id, 100)
        if (txns.length > 0) {
          setTransactions(txns)
        } else {
          // Fallback to localStorage transactions
          const localTxns = JSON.parse(localStorage.getItem("transactions") || "[]")
          setTransactions(localTxns.filter((t: any) => t.userId === user.id))
        }
      } catch (error) {
        console.error("[v0] Error loading transactions:", error)
        const localTxns = JSON.parse(localStorage.getItem("transactions") || "[]")
        setTransactions(localTxns.filter((t: any) => t.userId === user.id))
      }
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return `Today, ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
    if (diffDays === 1) return `Yesterday, ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
    return date.toLocaleDateString("en-IN", { dateStyle: "medium" })
  }

  // Filter transactions based on active tab
  const filteredTransactions = transactions.filter((transaction) => {
    if (activeTab === "all") return true
    if (activeTab === "sent") return transaction.type === "sent" || transaction.category === "transfer"
    if (activeTab === "received") return transaction.type === "received"
    if (activeTab === "bills")
      return ["recharge", "bill", "dth_recharge", "mobile_recharge"].includes(transaction.category)
    return true
  })

  const getIconForCategory = (category: string, type: string) => {
    const iconMap: Record<string, any> = {
      transfer: type === "received" ? ArrowDown : ArrowUp,
      sent: ArrowUp,
      received: ArrowDown,
      recharge: Smartphone,
      mobile_recharge: Smartphone,
      dth_recharge: Tv,
      investment: TrendingUp,
      gift_card: Smartphone,
      train_booking: Train,
      movie_booking: Film,
      bill: CreditCard,
      gaming: Gamepad,
      healthcare: Heart,
    }
    return iconMap[category] || iconMap[type] || CreditCard
  }

  const getIconBackground = (category: string, type: string) => {
    if (type === "received") return "bg-green-100 dark:bg-green-900"
    const bgMap: Record<string, string> = {
      transfer: "bg-red-100 dark:bg-red-900",
      sent: "bg-red-100 dark:bg-red-900",
      recharge: "bg-blue-100 dark:bg-blue-900",
      mobile_recharge: "bg-blue-100 dark:bg-blue-900",
      dth_recharge: "bg-purple-100 dark:bg-purple-900",
      investment: "bg-emerald-100 dark:bg-emerald-900",
      gift_card: "bg-orange-100 dark:bg-orange-900",
      train_booking: "bg-indigo-100 dark:bg-indigo-900",
      movie_booking: "bg-pink-100 dark:bg-pink-900",
    }
    return bgMap[category] || "bg-gray-100 dark:bg-gray-800"
  }

  const getIconColor = (category: string, type: string) => {
    if (type === "received") return "text-green-600 dark:text-green-400"
    const colorMap: Record<string, string> = {
      transfer: "text-red-600 dark:text-red-400",
      sent: "text-red-600 dark:text-red-400",
      recharge: "text-blue-600 dark:text-blue-400",
      mobile_recharge: "text-blue-600 dark:text-blue-400",
      dth_recharge: "text-purple-600 dark:text-purple-400",
      investment: "text-emerald-600 dark:text-emerald-400",
      gift_card: "text-orange-600 dark:text-orange-400",
    }
    return colorMap[category] || "text-gray-600 dark:text-gray-400"
  }

  return (
    <div className="container max-w-md mx-auto py-6 px-4 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Transaction History</h1>
            {currentUser && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                Balance: {formatCurrency(currentUser.balance)}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={loadTransactions} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Transactions</CardTitle>
              <Badge variant="outline">{filteredTransactions.length} total</Badge>
            </div>
            <CardDescription>Your transaction history across all devices</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading transactions...
                </div>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => {
                  const Icon = getIconForCategory(transaction.category, transaction.type)
                  const isDebit = transaction.type !== "received"

                  return (
                    <div key={transaction.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${getIconBackground(transaction.category, transaction.type)}`}
                          >
                            <Icon className={`h-4 w-4 ${getIconColor(transaction.category, transaction.type)}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.recipient}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {transaction.category?.replace(/_/g, " ") || transaction.type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${isDebit ? "text-red-600" : "text-green-600"}`}>
                            {isDebit ? "-" : "+"}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.date || transaction.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Balance info */}
                      {(transaction.balanceBefore !== null || transaction.balanceAfter !== null) && (
                        <div className="bg-muted/50 p-2 rounded-lg text-xs mt-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">Balance before:</span>
                            <span>{formatCurrency(transaction.balanceBefore || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Balance after:</span>
                            <span className="font-medium">{formatCurrency(transaction.balanceAfter || 0)}</span>
                          </div>
                        </div>
                      )}

                      {/* Auth method badge */}
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          {transaction.authMethod === "fingerprint" ? (
                            <>
                              <Fingerprint className="h-3 w-3" /> Fingerprint
                            </>
                          ) : transaction.authMethod === "face" ? (
                            <>
                              <Scan className="h-3 w-3" /> Face ID
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-3 w-3" /> {transaction.authMethod || "System"}
                            </>
                          )}
                        </Badge>
                        <span className="text-xs text-muted-foreground">ID: {transaction.id?.slice(-8) || "N/A"}</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-8 text-center text-muted-foreground">No transactions found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
