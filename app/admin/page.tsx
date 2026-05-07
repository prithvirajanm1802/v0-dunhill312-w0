"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  TrendingUp,
  Users,
  CreditCard,
  Shield,
  Fingerprint,
  RefreshCw,
  ArrowRight,
  Plus,
  Minus,
} from "lucide-react"
import { AdminDbStatus } from "@/components/admin-db-status"
import { toast } from "@/hooks/use-toast"

interface AdminStats {
  totalLogs: number
  todayLogs: number
  weekLogs: number
  suspiciousActivityCount: number
  actionCounts: Record<string, number>
  severityCounts: Record<string, number>
}

interface NeonStats {
  users: {
    total_users: number
    fingerprint_registered: number
    active_users: number
    total_balance: number
  }
  transactions: {
    total_transactions: number
    total_sent: number
    today_transactions: number
  }
  sessions: {
    active_sessions: number
  }
}

interface SuspiciousActivity {
  id: string
  adminId: string
  actionType: string
  resourceType: string
  timestamp: number
  severity: string
}

interface User {
  id: string
  fullName: string
  email: string
  mobile: string
  balance: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [neonStats, setNeonStats] = useState<NeonStats | null>(null)
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [depositNote, setDepositNote] = useState("")
  const [withdrawNote, setWithdrawNote] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchStatistics()
    const interval = setInterval(fetchStatistics, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await fetch("/api/admin/statistics")
      const data = await response.json()

      if (data.success) {
        setStats(data.statistics)
        setSuspiciousActivities(data.recentSuspiciousActivities)
      }

      const usersResponse = await fetch("/api/users/all")
      const usersData = await usersResponse.json()

      if (usersData.success) {
        setNeonStats(usersData.stats)
        setUsers(usersData.users || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching statistics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!selectedUser || !depositAmount) return
    setProcessing(true)

    try {
      const response = await fetch("/api/banking/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: Number.parseFloat(depositAmount),
          adminId: "admin",
          note: depositNote,
          source: "admin_deposit",
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Deposit Successful",
          description: `₹${depositAmount} deposited to ${selectedUser.fullName}'s account`,
        })
        setDepositAmount("")
        setDepositNote("")
        fetchStatistics()
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Deposit Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!selectedUser || !withdrawAmount) return
    setProcessing(true)

    try {
      const response = await fetch("/api/banking/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: Number.parseFloat(withdrawAmount),
          adminId: "admin",
          note: withdrawNote,
          destination: "bank_withdrawal",
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Withdrawal Successful",
          description: `₹${withdrawAmount} withdrawn from ${selectedUser.fullName}'s account`,
        })
        setWithdrawAmount("")
        setWithdrawNote("")
        fetchStatistics()
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "secondary"
      case "medium":
        return "outline"
      default:
        return "default"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Link href="/admin/users">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Users className="h-4 w-4 mr-2" />
                View All Users
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Button onClick={fetchStatistics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            {neonStats && (
              <>
                <h2 className="text-xl font-semibold mb-4">Database Overview (Neon)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" /> Total Registered Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{neonStats.users.total_users}</div>
                      <p className="text-xs text-muted-foreground mt-1">From all devices</p>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Fingerprint className="h-4 w-4 text-purple-600" /> Fingerprint Registered
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{neonStats.users.fingerprint_registered}</div>
                      <p className="text-xs text-muted-foreground mt-1">Passkey enabled</p>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-green-600" /> Total Balance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{formatCurrency(Number(neonStats.users.total_balance))}</div>
                      <p className="text-xs text-muted-foreground mt-1">All users combined</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <AdminDbStatus />
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Banking Management
            </CardTitle>
            <CardDescription>Deposit or withdraw funds from user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.slice(0, 6).map((user) => (
                <Card key={user.id} className="cursor-pointer hover:border-emerald-500 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{user.fullName}</p>
                      <Badge variant="outline">{formatCurrency(user.balance)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{user.mobile}</p>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Deposit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Deposit to {user.fullName}</DialogTitle>
                            <DialogDescription>Current Balance: {formatCurrency(user.balance)}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Amount</Label>
                              <Input
                                type="number"
                                placeholder="Enter amount"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Note (Optional)</Label>
                              <Input
                                placeholder="Reason for deposit"
                                value={depositNote}
                                onChange={(e) => setDepositNote(e.target.value)}
                              />
                            </div>
                            <Button
                              onClick={handleDeposit}
                              disabled={processing || !depositAmount}
                              className="w-full bg-emerald-600 hover:bg-emerald-700"
                            >
                              {processing ? "Processing..." : "Confirm Deposit"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Minus className="h-3 w-3 mr-1" />
                            Withdraw
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Withdraw from {user.fullName}</DialogTitle>
                            <DialogDescription>Current Balance: {formatCurrency(user.balance)}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Amount</Label>
                              <Input
                                type="number"
                                placeholder="Enter amount"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Note (Optional)</Label>
                              <Input
                                placeholder="Reason for withdrawal"
                                value={withdrawNote}
                                onChange={(e) => setWithdrawNote(e.target.value)}
                              />
                            </div>
                            <Button
                              onClick={handleWithdraw}
                              disabled={processing || !withdrawAmount}
                              className="w-full"
                              variant="destructive"
                            >
                              {processing ? "Processing..." : "Confirm Withdrawal"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats Grid */}
        <h2 className="text-xl font-semibold mb-4">Activity Logs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Total Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalLogs || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">All-time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayLogs || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" /> This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.weekLogs || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" /> Suspicious Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.suspiciousActivityCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">High/Critical</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Counts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Action Types</CardTitle>
              <CardDescription>Breakdown of admin actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats?.actionCounts || {}).map(([action, count]) => (
                  <div key={action} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{action.replace(/_/g, " ")}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
                {Object.keys(stats?.actionCounts || {}).length === 0 && (
                  <p className="text-sm text-muted-foreground">No actions recorded</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Severity Levels</CardTitle>
              <CardDescription>Distribution of severity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats?.severityCounts || {}).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{severity}</span>
                    <Badge variant={getSeverityColor(severity)}>{count}</Badge>
                  </div>
                ))}
                {Object.keys(stats?.severityCounts || {}).length === 0 && (
                  <p className="text-sm text-muted-foreground">No severity data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Suspicious Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Suspicious Activities</CardTitle>
            <CardDescription>Last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suspiciousActivities.length > 0 ? (
                suspiciousActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="font-medium text-sm capitalize">{activity.actionType.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">Resource: {activity.resourceType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getSeverityColor(activity.severity)}>{activity.severity}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No suspicious activities detected</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
