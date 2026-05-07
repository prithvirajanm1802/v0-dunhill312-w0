"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, CreditCard, TrendingUp, Send, Gift } from "lucide-react"

interface Transaction {
  id: string
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  recipient?: string
  description: string
  status: string
  timestamp: string
}

export function TransactionHistory({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`/api/transactions/history?userId=${userId}`)
        const data = await response.json()
        if (data.success) {
          setTransactions(data.transactions)
        }
      } catch (error) {
        console.error("[v0] Error fetching transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [userId])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "send_money":
        return <Send className="h-4 w-4 text-red-500" />
      case "receive_money":
        return <Gift className="h-4 w-4 text-green-500" />
      case "investment":
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case "mobile_recharge":
        return <CreditCard className="h-4 w-4 text-purple-500" />
      default:
        return <ArrowDown className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    })
  }

  if (loading) {
    return <div className="text-center py-4">Loading transactions...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Your recent transactions from Neon Database</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">{getTransactionIcon(tx.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium capitalize">{tx.type.replace("_", " ")}</div>
                    <div className="text-sm text-muted-foreground truncate">{tx.description}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(tx.timestamp)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {tx.type === "receive_money" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(tx.balanceAfter)} balance</div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
