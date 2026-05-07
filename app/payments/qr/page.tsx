"use client"

import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { QRPaymentGenerator } from "@/components/qr-payment-generator"
import { QRPaymentScanner } from "@/components/qr-payment-scanner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function QRPaymentPage() {
  const [activeTab, setActiveTab] = useState<"generate" | "scan">("generate")
  const userId = "user_demo" // In production, get from session

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="text-lg font-bold">QR Payment System</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="container max-w-2xl py-8 px-4">
        {/* Tab Buttons */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={activeTab === "generate" ? "default" : "outline"}
            onClick={() => setActiveTab("generate")}
            className="flex-1"
          >
            Generate QR
          </Button>
          <Button
            variant={activeTab === "scan" ? "default" : "outline"}
            onClick={() => setActiveTab("scan")}
            className="flex-1"
          >
            Scan QR
          </Button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "generate" ? (
            <>
              <QRPaymentGenerator
                onPaymentGenerated={(data) => {
                  console.log("[v0] Payment generated:", data)
                }}
              />
            </>
          ) : (
            <>
              <QRPaymentScanner
                userId={userId}
                onPaymentScanned={(data) => {
                  console.log("[v0] Payment scanned:", data)
                }}
              />
            </>
          )}

          {/* Info Card */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">About QR Payments</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Generate secure QR codes for payments</li>
              <li>• Scan codes from other payment apps (GPay, PhonePe, UPI)</li>
              <li>• QR codes expire after 30 minutes</li>
              <li>• Cross-device payment sync supported</li>
              <li>• Biometric verification required</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  )
}
