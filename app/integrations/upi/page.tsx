"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Smartphone, Shield, CheckCircle, QrCode, Copy, Zap, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { BiometricAuth } from "@/components/biometric-auth"

interface UPIApp {
  id: string
  name: string
  icon: string
  connected: boolean
  users: string
  rating: number
}

const upiApps: UPIApp[] = [
  {
    id: "googlepay",
    name: "Google Pay",
    icon: "🟢",
    connected: false,
    users: "150M+",
    rating: 4.6,
  },
  {
    id: "phonepe",
    name: "PhonePe",
    icon: "🟣",
    connected: true,
    users: "400M+",
    rating: 4.7,
  },
  {
    id: "paytm",
    name: "Paytm",
    icon: "🔵",
    connected: false,
    users: "350M+",
    rating: 4.5,
  },
  {
    id: "bhim",
    name: "BHIM UPI",
    icon: "🇮🇳",
    connected: false,
    users: "50M+",
    rating: 4.2,
  },
  {
    id: "amazonpay",
    name: "Amazon Pay",
    icon: "🟠",
    connected: false,
    users: "100M+",
    rating: 4.4,
  },
  {
    id: "mobikwik",
    name: "MobiKwik",
    icon: "🔴",
    connected: false,
    users: "120M+",
    rating: 4.3,
  },
]

export default function UPIIntegrationPage() {
  const [apps, setApps] = useState(upiApps)
  const [showBiometric, setShowBiometric] = useState(false)
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [upiId, setUpiId] = useState("user@honeydrew")
  const [autoAccept, setAutoAccept] = useState(true)
  const [dailyLimit, setDailyLimit] = useState("100000")
  const { toast } = useToast()

  const handleConnect = (appId: string) => {
    setSelectedApp(appId)
    setShowBiometric(true)
  }

  const handleBiometricSuccess = () => {
    if (selectedApp) {
      setApps(apps.map((app) => (app.id === selectedApp ? { ...app, connected: true } : app)))

      toast({
        title: "UPI App Connected",
        description: `Successfully connected ${apps.find((a) => a.id === selectedApp)?.name}`,
        variant: "default",
      })

      setShowBiometric(false)
      setSelectedApp(null)
    }
  }

  const handleDisconnect = (appId: string) => {
    setApps(apps.map((app) => (app.id === appId ? { ...app, connected: false } : app)))

    toast({
      title: "UPI App Disconnected",
      description: `Disconnected ${apps.find((a) => a.id === appId)?.name}`,
      variant: "default",
    })
  }

  const copyUpiId = () => {
    navigator.clipboard.writeText(`${upiId}@honeydrew`)
    toast({
      title: "UPI ID Copied",
      description: "Your Honeydrew Mills UPI ID has been copied to clipboard",
      variant: "default",
    })
  }

  const generateQR = () => {
    toast({
      title: "QR Code Generated",
      description: "Your payment QR code has been generated",
      variant: "default",
    })
  }

  if (showBiometric) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">Verify Your Identity</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please authenticate to connect {apps.find((a) => a.id === selectedApp)?.name}
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
          <div>
            <h1 className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">UPI Integration</h1>
            <p className="text-gray-600 dark:text-gray-400">Connect and manage your UPI applications</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-800">{apps.filter((a) => a.connected).length}</p>
                  <p className="text-sm text-gray-600">Connected Apps</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-800">₹{dailyLimit}</p>
                  <p className="text-sm text-gray-600">Daily Limit</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-800">24/7</p>
                  <p className="text-sm text-gray-600">Availability</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* UPI ID Management */}
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <QrCode className="h-5 w-5" />
                Your Honeydrew Mills UPI ID
              </CardTitle>
              <CardDescription>Use this UPI ID to receive payments from any UPI app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upi-id">UPI ID</Label>
                <div className="flex gap-2">
                  <Input id="upi-id" value={`${upiId}@honeydrew`} readOnly className="border-emerald-200" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyUpiId}
                    className="border-emerald-200 hover:bg-emerald-50 bg-transparent"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-upi">Customize UPI ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="Enter custom ID"
                    className="border-emerald-200"
                  />
                  <span className="flex items-center text-gray-500">@honeydrew</span>
                </div>
              </div>

              <Button onClick={generateQR} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Shield className="h-5 w-5" />
                UPI Settings
              </CardTitle>
              <CardDescription>Configure your UPI payment preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto Accept Payments</Label>
                  <p className="text-sm text-gray-600">Automatically accept incoming payments</p>
                </div>
                <Switch checked={autoAccept} onCheckedChange={setAutoAccept} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily-limit">Daily Transaction Limit</Label>
                <Input
                  id="daily-limit"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  placeholder="Enter daily limit"
                  className="border-emerald-200"
                />
                <p className="text-sm text-gray-600">Maximum amount you can transact per day</p>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-emerald-800 dark:text-emerald-200">Security Features</h4>
                    <ul className="text-sm text-emerald-700 dark:text-emerald-300 mt-1 space-y-1">
                      <li>• Biometric authentication for all transactions</li>
                      <li>• Real-time fraud detection</li>
                      <li>• 256-bit encryption for all data</li>
                      <li>• Instant transaction alerts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connected UPI Apps */}
        <Card className="border-emerald-200 mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Smartphone className="h-5 w-5" />
              UPI Applications
            </CardTitle>
            <CardDescription>Connect your favorite UPI apps for seamless payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => (
                <Card key={app.id} className="border-emerald-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{app.icon}</span>
                        <div>
                          <h3 className="font-medium text-emerald-800">{app.name}</h3>
                          <p className="text-sm text-gray-600">{app.users} users</p>
                        </div>
                      </div>
                      {app.connected ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-200">
                          Not Connected
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-gray-600">{app.rating}</span>
                      </div>

                      {app.connected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(app.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConnect(app.id)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="border-emerald-200 mt-8">
          <CardHeader>
            <CardTitle className="text-emerald-800">Why Use Honeydrew Mills UPI?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-medium text-emerald-800 mb-2">Instant Transfers</h3>
                <p className="text-sm text-gray-600">Send and receive money instantly 24/7</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-medium text-emerald-800 mb-2">Bank-Level Security</h3>
                <p className="text-sm text-gray-600">Protected by advanced encryption and biometrics</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-medium text-emerald-800 mb-2">Universal Acceptance</h3>
                <p className="text-sm text-gray-600">Works with all UPI-enabled apps and merchants</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-medium text-emerald-800 mb-2">Smart Analytics</h3>
                <p className="text-sm text-gray-600">Track spending patterns and get insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
