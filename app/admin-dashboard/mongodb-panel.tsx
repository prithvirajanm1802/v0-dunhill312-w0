"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, RefreshCw, CheckCircle, XCircle } from "lucide-react"

export function MongoDBPanel() {
  const [stats, setStats] = useState({
    success: false,
    collections: [],
    totalCollections: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "unknown">("unknown")
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/mongodb-stats")
        const data = await response.json()
        setStats(data)
        setError(null)
      } catch (err) {
        setError("Failed to fetch MongoDB stats")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const showNotification = (message: string, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-mongodb-connection")
      const result = await response.json()
      setConnectionStatus(result.success ? "connected" : "disconnected")
      showNotification(
        result.success ? "MongoDB connected successfully" : "MongoDB connection failed",
        result.success ? "success" : "error",
      )
    } catch (error) {
      setConnectionStatus("disconnected")
      showNotification("MongoDB connection failed", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`p-3 rounded-md ${
            notification.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
          <CardDescription>Monitor database connection and statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Connection Status:</span>
            <Badge variant={connectionStatus === "connected" ? "default" : "destructive"}>
              {connectionStatus === "connected" && <CheckCircle className="h-3 w-3 mr-1" />}
              {connectionStatus === "disconnected" && <XCircle className="h-3 w-3 mr-1" />}
              {connectionStatus === "connected" ? "Connected" : "Using localStorage"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">QR Codes</div>
            </div>
          </div>

          <Button onClick={testConnection} disabled={loading} className="w-full">
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            Test Connection
          </Button>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Database Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Total Collections</div>
                  <div className="text-2xl font-bold">{stats.totalCollections}</div>
                </div>
              </div>
              <div className="space-y-2">
                {stats.collections?.map((collection: any) => (
                  <div key={collection.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{collection.name}</span>
                    <span className="text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded">
                      {collection.count} documents
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MongoDBPanel
