"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Download, RefreshCw } from "lucide-react"

interface QRPaymentGeneratorProps {
  onPaymentGenerated?: (data: any) => void
}

export function QRPaymentGenerator({ onPaymentGenerated }: QRPaymentGeneratorProps) {
  const [amount, setAmount] = useState("100.00")
  const [merchant, setMerchant] = useState("Honeydrew Mills")
  const [paymentType, setPaymentType] = useState<"qr" | "gpay" | "phonepay" | "upi">("qr")
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateQR = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/qr-payment/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          merchant,
          merchantId: "merchant_honeydrew",
          paymentType,
          expiryMinutes: 30,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate QR code")
      }

      const data = await response.json()
      setQrImage(data.qrImage)
      setTransactionId(data.transactionId)
      setExpiresAt(data.expiresAt)

      onPaymentGenerated?.(data)

      console.log("[v0] QR code generated:", data.transactionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate QR code")
      console.error("[v0] QR generation error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadQR = () => {
    if (!qrImage) return

    const link = document.createElement("a")
    link.href = qrImage
    link.download = `payment-qr-${transactionId}.png`
    link.click()
  }

  const timeRemaining = expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000 / 60)) : 0

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate QR Payment</CardTitle>
        <CardDescription>Create a QR code for secure payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Amount (USD)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="qr">QR Code</option>
                <option value="gpay">Google Pay</option>
                <option value="phonepay">PhonePe</option>
                <option value="upi">UPI</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Merchant Name</label>
            <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Merchant Name" />
          </div>
        </div>

        {/* Generate Button */}
        <Button onClick={generateQR} disabled={isLoading || !amount} className="w-full">
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate QR Code"
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* QR Code Display */}
        {qrImage && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <img src={qrImage || "/placeholder.svg"} alt="Payment QR Code" className="w-48 h-48" />
              </div>

              <div className="w-full space-y-2">
                <div className="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-gray-900">
                  <span className="text-sm font-medium">Transaction ID:</span>
                  <span className="text-sm font-mono">{transactionId}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-gray-900">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="text-sm font-semibold">${amount}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-gray-900">
                  <span className="text-sm font-medium">Expires In:</span>
                  <Badge variant={timeRemaining > 5 ? "outline" : "secondary"}>{timeRemaining} minutes</Badge>
                </div>
              </div>
            </div>

            <Button onClick={downloadQR} variant="outline" className="w-full bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
