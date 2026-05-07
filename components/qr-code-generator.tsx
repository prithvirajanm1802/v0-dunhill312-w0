"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download, RefreshCw, Copy, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface QRCodeGeneratorProps {
  userId: string
  userName?: string
  showAmountInput?: boolean
}

export function QRCodeGenerator({ userId, userName, showAmountInput = false }: QRCodeGeneratorProps) {
  const [qrData, setQrData] = useState<string | null>(null)
  const [qrId, setQrId] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  const generateQR = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
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
          description: "Your unique QR code is ready to use",
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate QR code",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    generateQR()
  }, [userId])

  const downloadQR = () => {
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
      downloadLink.download = `honeydrew-qr-${userName || userId}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }

  const copyQrData = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: "Copied", description: "QR data copied to clipboard" })
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Your Payment QR Code
          <Badge variant="outline" className="text-emerald-600">
            Active
          </Badge>
        </CardTitle>
        <CardDescription>Share this QR code to receive payments instantly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAmountInput && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Optional)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Input
                id="note"
                placeholder="Payment description"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Button onClick={generateQR} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Regenerate QR
            </Button>
          </div>
        )}

        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
          {loading ? (
            <div className="h-48 w-48 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : qrData ? (
            <QRCodeSVG
              id="qr-code-svg"
              value={qrData}
              size={200}
              level="H"
              includeMargin
              imageSettings={{
                src: "/honeydrew-logo.png",
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          ) : (
            <div className="h-48 w-48 flex items-center justify-center text-muted-foreground">No QR Generated</div>
          )}
        </div>

        {userName && <p className="text-center font-medium text-lg">{userName}</p>}

        {expiresAt && (
          <p className="text-center text-xs text-muted-foreground">Expires: {new Date(expiresAt).toLocaleString()}</p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadQR} disabled={!qrData} className="flex-1 bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={copyQrData} disabled={!qrData} className="flex-1 bg-transparent">
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        {!showAmountInput && (
          <Button onClick={generateQR} disabled={loading} variant="ghost" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh QR
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
