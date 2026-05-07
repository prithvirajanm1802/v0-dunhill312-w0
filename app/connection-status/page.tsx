"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, RefreshCw, Database, CreditCard } from "lucide-react"

interface ConnectionStatus {
  neon: {
    connected: boolean
    message: string
    tables: string[]
  }
  stripe: {
    connected: boolean
    message: string
  }
  timestamp: string
}

export default function ConnectionStatusPage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const checkConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/connection-test")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Failed to check connection:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Integration Status</h1>
            <p className="text-slate-600">Neon Database & Stripe Payment Gateway</p>
          </div>
          <Button onClick={checkConnection} disabled={loading} size="lg">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {status && (
          <>
            {/* Neon Database Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 text-emerald-600" />
                    <CardTitle>Neon Database</CardTitle>
                  </div>
                  <Badge variant={status.neon.connected ? "default" : "destructive"} className="text-sm">
                    {status.neon.connected ? (
                      <>
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-1 h-4 w-4" /> Disconnected
                      </>
                    )}
                  </Badge>
                </div>
                <CardDescription>{status.neon.message}</CardDescription>
              </CardHeader>
              {status.neon.tables.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Database Tables:</p>
                    <div className="flex flex-wrap gap-2">
                      {status.neon.tables.map((table) => (
                        <Badge key={table} variant="secondary">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Stripe Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                    <CardTitle>Stripe Payment Gateway</CardTitle>
                  </div>
                  <Badge variant={status.stripe.connected ? "default" : "destructive"} className="text-sm">
                    {status.stripe.connected ? (
                      <>
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-1 h-4 w-4" /> Disconnected
                      </>
                    )}
                  </Badge>
                </div>
                <CardDescription>{status.stripe.message}</CardDescription>
              </CardHeader>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Last Checked:</span>
                  <span className="font-mono">{new Date(status.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Overall Status:</span>
                  <Badge variant={status.neon.connected && status.stripe.connected ? "default" : "destructive"}>
                    {status.neon.connected && status.stripe.connected ? "All Systems Operational" : "Issues Detected"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {loading && !status && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <RefreshCw className="mr-2 h-6 w-6 animate-spin text-slate-600" />
              <p className="text-slate-600">Checking connections...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
