"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Database, Users, CreditCard, Activity, RefreshCw, ArrowLeftRight } from "lucide-react"
import Link from "next/link"

export default function SystemStatusPage() {
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [usersData, setUsersData] = useState<any>(null)
  const [logsData, setLogsData] = useState<any>(null)

  const loadStatus = async () => {
    setLoading(true)
    try {
      const [dbRes, usersRes, logsRes] = await Promise.all([
        fetch("/api/admin/db-status"),
        fetch("/api/users/all"),
        fetch("/api/admin/logs?limit=10"),
      ])

      const [db, users, logs] = await Promise.all([dbRes.json(), usersRes.json(), logsRes.json()])

      setDbStatus(db)
      setUsersData(users)
      setLogsData(logs)
    } catch (error) {
      console.error("[v0] Error loading status:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Status</h1>
            <p className="text-gray-600 dark:text-gray-400">Honeydrew Mills - Neon DB Integration</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={loadStatus} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/admin-dashboard">
              <Button variant="default">Admin Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Database Connection Status */}
        <Card className={dbStatus?.connected ? "border-emerald-200" : "border-red-200"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Neon PostgreSQL Database
            </CardTitle>
            <CardDescription>Public database accessible from all devices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              {dbStatus?.connected ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>

            {dbStatus?.connected && dbStatus?.details && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Database:</span>
                    <div className="font-medium">{dbStatus.details.database}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Latency:</span>
                    <div className="font-medium">{dbStatus.details.latency}</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-3">Database Tables</div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4 text-center">
                        <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                        <div className="text-2xl font-bold text-blue-600">{dbStatus.details.tables.users}</div>
                        <div className="text-xs text-gray-600">Users</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="pt-4 text-center">
                        <Database className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                        <div className="text-2xl font-bold text-purple-600">{dbStatus.details.tables.passkeys}</div>
                        <div className="text-xs text-gray-600">Passkeys</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-emerald-50 border-emerald-200">
                      <CardContent className="pt-4 text-center">
                        <CreditCard className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                        <div className="text-2xl font-bold text-emerald-600">
                          {dbStatus.details.tables.transactions}
                        </div>
                        <div className="text-xs text-gray-600">Transactions</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="pt-4 text-center">
                        <Activity className="h-5 w-5 mx-auto text-orange-600 mb-1" />
                        <div className="text-2xl font-bold text-orange-600">{dbStatus.details.tables.adminLogs}</div>
                        <div className="text-xs text-gray-600">Admin Logs</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-cyan-50 border-cyan-200">
                      <CardContent className="pt-4 text-center">
                        <Database className="h-5 w-5 mx-auto text-cyan-600 mb-1" />
                        <div className="text-2xl font-bold text-cyan-600">{dbStatus.details.tables.qrCodes}</div>
                        <div className="text-xs text-gray-600">QR Codes</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Users Statistics */}
        {usersData?.success && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Registered Users (All Devices)
              </CardTitle>
              <CardDescription>Users signed in from phones, laptops, and other devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{usersData.stats?.users?.total_users || 0}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{usersData.stats?.users?.active_users || 0}</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {usersData.stats?.users?.fingerprint_registered || 0}
                  </div>
                  <div className="text-sm text-gray-600">Biometric Enabled</div>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <div className="text-3xl font-bold text-emerald-600">
                    ₹{(usersData.stats?.users?.total_balance || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Balance</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Status */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Integrated Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <FeatureItem
                  name="User Registration & Login"
                  status="active"
                  description="Stored in Neon DB with biometric support"
                />
                <FeatureItem
                  name="Admin Logging"
                  status="active"
                  description="All activities logged to Neon admin_logs"
                />
                <FeatureItem
                  name="P2P Transfers"
                  status="active"
                  description="User-to-user money transfer with balance updates"
                />
                <FeatureItem
                  name="Stripe Payments"
                  status="active"
                  description="Add money feature with webhook integration"
                />
                <FeatureItem
                  name="Telecom Recharge"
                  status="active"
                  description="Jio, Airtel, Vi plans with balance deduction"
                />
                <FeatureItem
                  name="Payment Receipts"
                  status="active"
                  description="Detailed receipts for all transactions"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Recent Admin Logs
              </CardTitle>
              <CardDescription>Latest {logsData?.count || 0} activities from Neon DB</CardDescription>
            </CardHeader>
            <CardContent>
              {logsData?.logs && logsData.logs.length > 0 ? (
                <div className="space-y-2">
                  {logsData.logs.slice(0, 5).map((log: any, idx: number) => (
                    <div key={idx} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">{log.type || log.action}</span>
                        <Badge variant="outline" className="text-xs">
                          {new Date(log.timestamp || log.created_at).toLocaleString()}
                        </Badge>
                      </div>
                      {log.details && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {JSON.stringify(log.details).slice(0, 100)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">No logs available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-3">
              <Link href="/admin-dashboard">
                <Button className="w-full bg-transparent" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  View All Users
                </Button>
              </Link>
              <Link href="/transfer">
                <Button className="w-full bg-transparent" variant="outline">
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  P2P Transfer
                </Button>
              </Link>
              <Link href="/stripe-payment">
                <Button className="w-full bg-transparent" variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Money (Stripe)
                </Button>
              </Link>
              <Link href="/telecom-recharge">
                <Button className="w-full bg-transparent" variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  Telecom Recharge
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FeatureItem({ name, status, description }: { name: string; status: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200">
      <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-white">{name}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>
      </div>
    </div>
  )
}
