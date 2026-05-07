"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Share2, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { QRCodeSVG } from "qrcode.react"

export default function SelfQrPage() {
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [user, setUser] = useState<any>(null)
  const [qrData, setQrData] = useState<string | null>(null)
  const [qrId, setQrId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  useEffect(() => {
    // Load user data
    const userData = localStorage.getItem("honeydrew_current_user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        // Generate initial QR code
        generateQR(parsedUser.id)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  const generateQR = async (userId?: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || user?.id,
          amount: amount ? Number.parseFloat(amount) : null,
          note: note || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setQrData(data.qrData)
        setQrId(data.qrId)
        setExpiresAt(data.expiresAt)
        toast({
          title: "QR Code Generated",
          description: "Your unique payment QR code is ready",
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      console.error("Error generating QR:", error)
      // Fallback to local QR generation
      const fallbackQrData = JSON.stringify({
        id: `QR_${Date.now()}`,
        userId: userId || user?.id,
        userName: user?.name || user?.fullName,
        mobile: user?.phone || user?.mobile,
        amount: amount ? Number.parseFloat(amount) : null,
        note: note || null,
        type: amount ? "payment" : "user",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      setQrData(fallbackQrData)
      setExpiresAt(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    const svg = document.getElementById("qr-code-svg")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL("image/png")

      const downloadLink = document.createElement("a")
      downloadLink.download = `honeydrew-qr-${user?.name || "payment"}.png`
      downloadLink.href = pngFile
      downloadLink.click()

      toast({
        title: "QR Code Downloaded",
        description: "Your QR code has been saved to your device.",
      })
    }

    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }

  const handleShare = async () => {
    if (navigator.share && qrData) {
      try {
        await navigator.share({
          title: "Pay " + (user?.name || "User"),
          text: `Scan this QR to pay ${user?.name || "me"}${amount ? ` ₹${amount}` : ""}`,
          url: window.location.href,
        })
      } catch (error) {
        toast({
          title: "Share",
          description: "Share dialog closed",
        })
      }
    } else {
      // Copy QR data to clipboard
      if (qrData) {
        navigator.clipboard.writeText(qrData)
        toast({
          title: "Copied",
          description: "QR data copied to clipboard",
        })
      }
    }
  }

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">My QR Code</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Generate Payment QR
            <Badge variant="outline" className="text-emerald-600">
              {expiresAt ? "Active" : "Ready"}
            </Badge>
          </CardTitle>
          <CardDescription>Create a unique QR code for receiving payments from other users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Optional)</Label>
            <Input
              id="amount"
              placeholder="Enter amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Leave empty for the payer to enter the amount</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Input id="note" placeholder="Payment description" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={() => generateQR()}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate QR Code
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your QR Code</CardTitle>
          <CardDescription>Other users can scan this to send you money</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg mb-4">
            {loading ? (
              <div className="w-48 h-48 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : qrData ? (
              <QRCodeSVG
                id="qr-code-svg"
                value={qrData}
                size={192}
                level="H"
                includeMargin
                imageSettings={{
                  src: "/honeydrew-logo.png",
                  height: 35,
                  width: 35,
                  excavate: true,
                }}
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                <p className="text-sm text-muted-foreground">Generate QR Code</p>
              </div>
            )}
          </div>
          <div className="text-center mb-4">
            <p className="font-medium text-lg">{user?.name || user?.fullName || "User"}</p>
            <p className="text-sm text-muted-foreground">{user?.phone || user?.mobile}</p>
            {amount && <p className="font-bold text-emerald-600 text-xl mt-2">₹{amount}</p>}
            {note && <p className="text-sm text-muted-foreground mt-1">{note}</p>}
          </div>
          {expiresAt && (
            <p className="text-xs text-muted-foreground">Expires: {new Date(expiresAt).toLocaleString()}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" className="flex-1 mr-2 bg-transparent" onClick={handleDownload} disabled={!qrData}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handleShare} disabled={!qrData}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
