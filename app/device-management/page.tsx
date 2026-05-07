"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Smartphone, Tablet, Monitor, Trash2, LogOut, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getUserDevices, registerDevice } from "@/lib/cross-device-sync"
import { getAllUserSessions, revokeSessionFromDevice } from "@/lib/session-manager"
import type { DeviceInfo } from "@/lib/cross-device-sync"
import type { Session } from "@/lib/session-manager"

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType) {
    case "mobile":
      return <Smartphone className="h-6 w-6 text-blue-500" />
    case "tablet":
      return <Tablet className="h-6 w-6 text-purple-500" />
    case "desktop":
      return <Monitor className="h-6 w-6 text-gray-600" />
    default:
      return <Monitor className="h-6 w-6 text-gray-400" />
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return "Now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString()
}

export default function DeviceManagementPage() {
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("")

  useEffect(() => {
    const initializeDevices = async () => {
      try {
        if (typeof window !== "undefined") {
          const user = JSON.parse(localStorage.getItem("currentUser") || "null")
          if (!user) {
            window.location.href = "/login"
            return
          }

          setCurrentUser(user)

          const deviceInfo = await registerDevice(user.id)
          setCurrentDeviceId(deviceInfo.deviceId)

          const userDevices = await getUserDevices(user.id)
          setDevices(userDevices)

          const userSessions = getAllUserSessions(user.id)
          setSessions(userSessions)
        }
      } catch (error) {
        console.error("[v0] Device initialization error:", error)
        toast({
          title: "Error",
          description: "Failed to load device information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeDevices()
  }, [toast])

  const handleRevokeSession = (sessionId: string) => {
    if (currentUser && revokeSessionFromDevice(currentUser.id, sessionId)) {
      setSessions(sessions.filter((s) => s.sessionId !== sessionId))
      toast({
        title: "Session Revoked",
        description: "The selected session has been logged out",
      })
    }
  }

  const handleLogoutAllOtherDevices = () => {
    sessions.forEach((session) => {
      if (session.deviceId !== currentDeviceId) {
        handleRevokeSession(session.sessionId)
      }
    })
    toast({
      title: "All other sessions logged out",
      description: "You are now only logged in on this device",
    })
  }

  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto py-6 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2">Loading devices...</p>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Device Management</h1>
      </div>

      {/* Active Sessions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            {sessions.length} device{sessions.length !== 1 ? "s" : ""} logged in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active sessions</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const device = devices.find((d) => d.deviceId === session.deviceId)
                const isCurrentDevice = session.deviceId === currentDeviceId

                return (
                  <div key={session.sessionId} className="border rounded-lg p-4 flex items-between justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{device && getDeviceIcon(device.deviceType)}</div>
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {device?.deviceName}
                          {isCurrentDevice && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">This device</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(session.lastActivity)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Session ID: {session.sessionId.slice(0, 12)}...
                        </div>
                      </div>
                    </div>
                    {!isCurrentDevice && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(session.sessionId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Registered Devices */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Registered Devices</CardTitle>
          <CardDescription>All devices registered to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No registered devices</p>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => {
                const isCurrentDevice = device.deviceId === currentDeviceId
                const lastSync = new Date(device.lastSyncTime).toLocaleDateString()

                return (
                  <div key={device.deviceId} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getDeviceIcon(device.deviceType)}</div>
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {device.deviceName}
                          {isCurrentDevice && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Current</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Last sync: {lastSync}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Device ID: {device.deviceId.slice(0, 12)}...</div>
                        <div className="text-xs text-gray-400">Type: {device.deviceType}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Actions */}
      {sessions.length > 1 && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-900">Security Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full" onClick={handleLogoutAllOtherDevices}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout All Other Devices
            </Button>
            <p className="text-xs text-yellow-700 mt-3 text-center">
              This will log you out from all other devices except this one
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cross-Device Sync Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <h3 className="font-semibold text-blue-900 mb-2">Cross-Device Sync</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Data synced across all devices</li>
            <li>✓ Transactions auto-synced</li>
            <li>✓ Session managed securely</li>
            <li>✓ Real-time updates</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
