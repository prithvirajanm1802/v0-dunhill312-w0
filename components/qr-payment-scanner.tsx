"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Loader2, CheckCircle, XCircle } from "lucide-react"

interface QRPaymentScannerProps {
  userId: string
  onPaymentScanned?: (paymentData: any) => void
}

export function QRPaymentScanner({ userId, onPaymentScanned }: QRPaymentScannerProps) {
  const [qrData, setQrData] = useState<string>("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "success" | "failed">("idle")
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const verifyQRPayment = async (data: string) => {
    try {
      setIsVerifying(true)
      setError(null)
      setVerificationStatus("idle")

      const response = await fetch("/api/qr-payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrData: data,
          deviceId: `device_${Math.random().toString(36).substr(2, 9)}`,
          verificationMethod: "qr_scan",
        }),
      })

      if (!response.ok) {
        throw new Error("QR verification failed")
      }

      const result = await response.json()

      if (result.success) {
        setPaymentDetails(result)
        setVerificationStatus("success")
        onPaymentScanned?.(result)
        console.log("[v0] QR payment verified:", result.transactionId)
      } else {
        setVerificationStatus("failed")
        setError(result.error || "Verification failed")
      }
    } catch (err) {
      setVerificationStatus("failed")
      setError(err instanceof Error ? err.message : "Verification failed")
      console.error("[v0] QR verification error:", err)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleQRInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQrData(value)

    if (value.length > 50) {
      verifyQRPayment(value)
    }
  }

  const handleManualEntry = () => {
    if (qrData.trim()) {
      verifyQRPayment(qrData)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Scan QR Payment</CardTitle>
        <CardDescription>Scan or paste QR code to initiate payment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Paste QR Data</label>
          <input
            ref={fileInputRef}
            type="text"
            value={qrData}
            onChange={handleQRInput}
            placeholder="Scan QR code here..."
            className="w-full px-3 py-2 border rounded-md text-sm font-mono"
            autoFocus
          />
        </div>

        {/* Manual Verification Button */}
        <Button onClick={handleManualEntry} disabled={isVerifying || !qrData.trim()} className="w-full">
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify QR Code"
          )}
        </Button>

        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {verificationStatus === "success" && paymentDetails && (
          <div className="space-y-3 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                QR Code Verified Successfully
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span className="font-mono font-semibold">{paymentDetails.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-semibold">
                  ${paymentDetails.amount} {paymentDetails.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Merchant:</span>
                <span className="font-semibold">{paymentDetails.merchant}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Type:</span>
                <Badge className="capitalize">{paymentDetails.paymentType}</Badge>
              </div>
            </div>
          </div>
        )}

        {verificationStatus === "failed" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
            <XCircle className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-orange-600">QR code verification failed</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
