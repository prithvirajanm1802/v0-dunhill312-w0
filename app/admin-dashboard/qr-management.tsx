"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QrCode, Plus, Trash2, Copy, AlertCircle } from "lucide-react"
import { qrManagement, type StoredQRCode } from "@/lib/qr-management"
import { useToast } from "@/hooks/use-toast"

export function QRManagement() {
  const { toast } = useToast()
  const [qrCodes, setQRCodes] = useState<StoredQRCode[]>([])
  const [loading, setLoading] = useState(false)
  const [merchantName, setMerchantName] = useState("")
  const [upiId, setUpiId] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<"upi" | "payment" | "billing" | "subscription" | "donation" | "other">(
    "payment",
  )

  useEffect(() => {
    loadQRCodes()
  }, [])

  const loadQRCodes = () => {
    const codes = qrManagement.getAllQRCodes()
    setQRCodes(codes.sort((a, b) => b.createdAt - a.createdAt))
  }

  const handleCreateQR = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!merchantName.trim()) throw new Error("Merchant name is required")
      if (!upiId.trim()) throw new Error("UPI ID is required")
      if (!/^[\w.-]+@[\w.-]+$/.test(upiId)) throw new Error("Invalid UPI ID format")

      const newQR = qrManagement.createQRCode("admin_user", merchantName, upiId, {
        amount: amount ? Number.parseInt(amount) : undefined,
        description: description || undefined,
        category,
      })

      setQRCodes((prev) => [newQR, ...prev])

      // Reset form
      setMerchantName("")
      setUpiId("")
      setAmount("")
      setDescription("")
      setCategory("payment")

      toast({
        title: "QR Code Created",
        description: `QR code for ${merchantName} created successfully`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQR = (qrId: string, merchantName: string) => {
    if (window.confirm(`Delete QR code for ${merchantName}?`)) {
      qrManagement.deleteQRCode(qrId)
      loadQRCodes()
      toast({
        title: "QR Code Deleted",
        description: "The QR code has been removed",
      })
    }
  }

  const handleToggleActive = (qrId: string, isActive: boolean) => {
    if (!isActive) {
      qrManagement.updateQRCode(qrId, { isActive: true })
      toast({ title: "QR Code Activated" })
    } else {
      qrManagement.deactivateQRCode(qrId)
      toast({ title: "QR Code Deactivated" })
    }
    loadQRCodes()
  }

  const handleCopyQRData = (qrData: string) => {
    navigator.clipboard.writeText(qrData)
    toast({
      title: "Copied",
      description: "QR code data copied to clipboard",
    })
  }

  const getStats = (qrId: string) => {
    return qrManagement.getQRStatistics(qrId)
  }

  return (
    <div className="space-y-6">
      {/* Create QR Code Form */}
      <Card className="border-blue-200 dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
            <Plus className="h-5 w-5" />
            Create New QR Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateQR} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="merchant-name" className="dark:text-slate-200">
                  Merchant Name
                </Label>
                <Input
                  id="merchant-name"
                  placeholder="e.g., Coffee Shop XYZ"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upi-id" className="dark:text-slate-200">
                  UPI ID
                </Label>
                <Input
                  id="upi-id"
                  placeholder="merchant@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="dark:text-slate-200">
                  Amount (Optional)
                </Label>
                <Input
                  id="amount"
                  placeholder="e.g., 500"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="dark:text-slate-200">
                  Category
                </Label>
                <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                  <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                    <SelectItem value="upi">UPI Transfer</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="donation">Donation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="dark:text-slate-200">
                Description (Optional)
              </Label>
              <Input
                id="description"
                placeholder="e.g., Payment for services"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700" disabled={loading}>
              {loading ? "Creating..." : "Create QR Code"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* QR Codes List */}
      <Card className="border-blue-200 dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
            <QrCode className="h-5 w-5" />
            Stored QR Codes ({qrCodes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {qrCodes.length === 0 ? (
            <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                No QR codes created yet. Create one above to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {qrCodes.map((qr) => {
                const stats = getStats(qr.id)
                return (
                  <div
                    key={qr.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground dark:text-slate-200">{qr.merchantName}</h3>
                          <Badge
                            className={
                              qr.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }
                          >
                            {qr.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline" className="dark:border-slate-600 dark:text-slate-300">
                            {qr.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground/60 dark:text-slate-400">{qr.upiId}</p>
                        {qr.amount && (
                          <p className="text-sm font-medium text-foreground dark:text-slate-200">₹{qr.amount}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyQRData(qr.qrData)}
                          className="dark:border-slate-600 dark:text-slate-300"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(qr.id, qr.isActive)}
                          className="dark:border-slate-600 dark:text-slate-300"
                        >
                          {qr.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteQR(qr.id, qr.merchantName)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {stats && (
                      <div className="grid grid-cols-4 gap-2 text-sm p-3 bg-slate-100 dark:bg-slate-700 rounded">
                        <div>
                          <p className="text-foreground/60 dark:text-slate-400">Scans</p>
                          <p className="font-semibold text-foreground dark:text-slate-200">{stats.totalScans}</p>
                        </div>
                        <div>
                          <p className="text-foreground/60 dark:text-slate-400">Transactions</p>
                          <p className="font-semibold text-foreground dark:text-slate-200">
                            {stats.successfulTransactions}
                          </p>
                        </div>
                        <div>
                          <p className="text-foreground/60 dark:text-slate-400">Conversion</p>
                          <p className="font-semibold text-foreground dark:text-slate-200">
                            {stats.conversionRate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-foreground/60 dark:text-slate-400">Amount</p>
                          <p className="font-semibold text-foreground dark:text-slate-200">
                            ₹{stats.totalAmountCollected}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
