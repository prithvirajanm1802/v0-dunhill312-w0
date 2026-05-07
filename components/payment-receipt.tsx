"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, Home, ArrowRight, Wallet, Receipt, Clock, Shield } from "lucide-react"
import Link from "next/link"

interface PaymentReceiptProps {
  transactionId: string
  amount: number
  recipient: string
  service: string
  timestamp: string
  previousBalance: number
  newBalance: number
  authMethod: "face" | "fingerprint"
  metadata?: Record<string, any>
  onNewPayment?: () => void
}

export function PaymentReceipt({
  transactionId,
  amount,
  recipient,
  service,
  timestamp,
  previousBalance,
  newBalance,
  authMethod,
  metadata,
  onNewPayment,
}: PaymentReceiptProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  return (
    <Card className="border-emerald-200 dark:border-slate-700 overflow-hidden">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-center text-white">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold">Payment Successful!</h2>
        <p className="text-3xl font-bold mt-2">{formatCurrency(amount)}</p>
        <p className="text-emerald-100 text-sm mt-1">{service}</p>
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Transaction Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Transaction ID
            </span>
            <span className="font-mono text-sm font-medium">{transactionId}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Date & Time
            </span>
            <span className="font-medium">{formatDate(timestamp)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="text-muted-foreground">To</span>
            <span className="font-medium">{recipient}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
            <span className="text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Verified By
            </span>
            <span className="font-medium capitalize">{authMethod} Authentication</span>
          </div>

          {/* Additional Metadata */}
          {metadata &&
            Object.entries(metadata).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700"
              >
                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
        </div>

        {/* Wallet Balance Summary */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold text-emerald-800 dark:text-emerald-400">Wallet Balance</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Previous Balance</span>
              <span>{formatCurrency(previousBalance)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Amount Deducted</span>
              <span>- {formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-emerald-200 dark:border-slate-600 font-bold text-lg">
              <span className="text-emerald-800 dark:text-emerald-400">New Balance</span>
              <span className="text-emerald-600">{formatCurrency(newBalance)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <Button variant="outline" className="w-full bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full bg-transparent">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            {onNewPayment && (
              <Button onClick={onNewPayment} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <ArrowRight className="h-4 w-4 mr-2" />
                New Payment
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">Secured by Honeydrew Mills Biometric Payment System</p>
      </CardContent>
    </Card>
  )
}
