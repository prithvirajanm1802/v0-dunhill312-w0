"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Smartphone, Laptop, Tablet, ShieldAlert, Trash2, Check } from "lucide-react"
import { deviceSync, type DeviceInfo } from "@/lib/device-sync"
import { useToast } from "@/hooks/use-toast"

interface DeviceManagementProps {
  userId: string
}

export function DeviceManagement({ userId }: DeviceManagementProps) {
  const { toast } = useToast()
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDevices()
  }, [userId])

  const loadDevices = () => {
    const allDevices = deviceSync.getDevices(userId)
    setDevices(allDevices.sort((a, b) => b.lastActive - a.lastActive))
  }

  const handleTrustDevice = (deviceId: string) => {
    setLoading(true)
    try {
      deviceSync.trustDevice(userId, deviceId)
      loadDevices()
      toast({
        title: "Device Trusted",
        description: "This device is now marked as trusted",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveDevice = (deviceId: string) => {
    if (window.confirm("Are you sure you want to remove this device? You'll need to log in again.")) {
      setLoading(true)
      try {
        deviceSync.revokeSession(userId, deviceId)
        loadDevices()
        toast({
          title: "Device Removed",
          description: "This device has been removed from your account",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />
      case "tablet":
        return <Tablet className="h-5 w-5" />
      default:
        return <Laptop className="h-5 w-5" />
    }
  }

  const formatLastActive = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (devices.length === 0) {
    return (
      <Card className="border-emerald-200 dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-emerald-800 dark:text-emerald-400">Connected Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/60 dark:text-slate-400">No devices registered yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-emerald-200 dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-emerald-800 dark:text-emerald-400">Connected Devices</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <ShieldAlert className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Manage your devices for secure cross-device access to your Honeydrew Mills account
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">{getDeviceIcon(device.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground dark:text-slate-200">{device.name}</h4>
                    {device.isTrusted && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        Trusted
                      </Badge>
                    )}
                    {device.isVerified && !device.isTrusted && (
                      <Badge variant="outline" className="dark:border-slate-600 dark:text-slate-300">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground/60 dark:text-slate-400 capitalize">
                    {device.type} • Last active {formatLastActive(device.lastActive)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!device.isTrusted && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTrustDevice(device.id)}
                    disabled={loading}
                    className="dark:border-slate-600 dark:text-slate-300"
                  >
                    Trust
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemoveDevice(device.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            className="w-full dark:border-slate-600 dark:text-slate-300 bg-transparent"
            onClick={() => {
              deviceSync.revokeAllSessions(userId)
              toast({
                title: "All Sessions Revoked",
                description: "You've been logged out from all devices",
              })
              setDevices([])
            }}
          >
            Logout from All Devices
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
