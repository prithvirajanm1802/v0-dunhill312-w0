"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Lock, User, Crown, Database, WifiOff, CheckCircle } from "lucide-react"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; checking: boolean }>({
    connected: false,
    checking: true,
  })
  const router = useRouter()

  // Check Neon DB connection status on mount
  useEffect(() => {
    checkDbStatus()
  }, [])

  const checkDbStatus = async () => {
    setDbStatus({ connected: false, checking: true })
    try {
      const response = await fetch("/api/admin/db-status")
      const result = await response.json()
      setDbStatus({ connected: result.connected, checking: false })
    } catch {
      setDbStatus({ connected: false, checking: false })
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const result = await response.json()

      if (result.success) {
        // Store admin session
        localStorage.setItem("honeydrew_admin_authenticated", "true")
        localStorage.setItem(
          "honeydrew_admin_session",
          JSON.stringify({
            ...result.admin,
            dbConnected: result.dbConnected,
          }),
        )

        router.push("/admin-dashboard")
      } else {
        setError(result.message || "Invalid credentials. Please check your username and password.")
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-emerald-200 dark:border-emerald-800 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-10 w-10 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-600">Honeydrew Mills Admin</CardTitle>
          <CardDescription>Access the administrative dashboard</CardDescription>

          {/* Neon DB Connection Status */}
          <div
            className={`mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border ${
              dbStatus.checking
                ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                : dbStatus.connected
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                  : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
            }`}
          >
            {dbStatus.checking ? (
              <>
                <Database className="h-4 w-4 text-yellow-600 dark:text-yellow-400 animate-pulse" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Checking Neon DB...</span>
              </>
            ) : dbStatus.connected ? (
              <>
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Neon DB Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Neon DB Disconnected</span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Display credentials for convenience */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin Credentials
              </h4>
              <div className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                <p>
                  <strong>Username:</strong> honeydrew_admin
                </p>
                <p>
                  <strong>Password:</strong> HoneydrewMills2024!
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 border-emerald-200 dark:border-emerald-700 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-emerald-200 dark:border-emerald-700 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Sign in to Admin Dashboard
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Secure access to Honeydrew Mills administrative functions</p>
            {dbStatus.connected && (
              <p className="mt-2 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <Database className="h-3 w-3" />
                All user data stored in Neon PostgreSQL
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
