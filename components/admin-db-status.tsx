"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database, CheckCircle2, XCircle, RefreshCw, Loader2, Server, Clock, HardDrive } from "lucide-react"

interface DbStatus {
  connected: boolean
  status: string
  message: string
  details: {
    hasEnvVar: boolean
    provider: string | null
    serverTime?: string
    database?: string
    latency?: string
    tables?: {
      users: number
      passkeys: number
      transactions: number
      adminLogs: number
      qrCodes: number
    }
    error?: string
  }
}

export function AdminDbStatus() {
  const [status, setStatus] = useState<DbStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/db-status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        connected: false,
        status: "error",
        message: "Failed to check database status",
        details: { hasEnvVar: false, provider: null },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600" />
            Database Connection
          </span>
          <Button variant="ghost" size="sm" onClick={fetchStatus} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
        </CardTitle>
        <CardDescription>Neon PostgreSQL Status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !status ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Badge
                variant={status?.connected ? "default" : "destructive"}
                className={status?.connected ? "bg-emerald-600" : ""}
              >
                {status?.connected ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                {status?.status || "Unknown"}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">{status?.message}</p>

            {status?.details && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <Server className="h-3 w-3" />
                    Provider
                  </span>
                  <span className="font-medium">{status.details.provider || "None"}</span>
                </div>

                {status.details.latency && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Latency
                    </span>
                    <span className="font-medium">{status.details.latency}</span>
                  </div>
                )}

                {status.details.tables && (
                  <div className="pt-2 space-y-1">
                    <p className="text-xs font-medium flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      Table Records
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="flex justify-between px-2 py-1 bg-muted rounded">
                        <span>Users</span>
                        <span className="font-medium">{status.details.tables.users}</span>
                      </div>
                      <div className="flex justify-between px-2 py-1 bg-muted rounded">
                        <span>Passkeys</span>
                        <span className="font-medium">{status.details.tables.passkeys}</span>
                      </div>
                      <div className="flex justify-between px-2 py-1 bg-muted rounded">
                        <span>Transactions</span>
                        <span className="font-medium">{status.details.tables.transactions}</span>
                      </div>
                      <div className="flex justify-between px-2 py-1 bg-muted rounded">
                        <span>Admin Logs</span>
                        <span className="font-medium">{status.details.tables.adminLogs}</span>
                      </div>
                      <div className="flex justify-between px-2 py-1 bg-muted rounded col-span-2">
                        <span>QR Codes</span>
                        <span className="font-medium">{status.details.tables.qrCodes}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
