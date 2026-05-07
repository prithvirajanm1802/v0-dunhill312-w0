"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import {
  Users,
  Shield,
  Activity,
  Database,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Camera,
  X,
  Smartphone,
  Key,
  CreditCard,
  ArrowLeft,
  Loader2,
  DollarSign,
  FileText,
  QrCode,
  Info,
} from "lucide-react"

interface AdminUser {
  id: string
  name: string
  email: string
  phone: string
  balance: number
  isActive: boolean
  createdAt: string
  lastLogin: string
  biometricEnabled: boolean
  faceRegistered: boolean
  fingerprintRegistered: boolean
  faceImage?: string
  activeSessions: number
}

interface BiometricData {
  face?: any
  fingerprint?: any
}

interface AdminLog {
  timestamp: number
  type: string
  userId: string
  action: string
  success: boolean
  details: any
  adminId?: string // Added adminId for logs
}

interface DbStatus {
  connected: boolean
  status: string
  message: string
  details?: {
    provider?: string
    latency?: string
    tables?: {
      users: number
      passkeys: number
      transactions: number
      adminLogs: number
      qrCodes: number
    }
  }
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([])
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [selectedUserBiometrics, setSelectedUserBiometrics] = useState<BiometricData | null>(null)
  const [showBiometricModal, setShowBiometricModal] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    biometricUsers: 0,
    totalTransactions: 0,
    totalBalance: 0,
    activeSessions: 0,
  })
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrUser, setQrUser] = useState<AdminUser | null>(null)
  const [qrValue, setQrValue] = useState<string>("")
  const [dbStatus, setDbStatus] = useState<DbStatus>({
    connected: false,
    status: "checking",
    message: "Checking connection...",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ name: string } | null>({ name: "admin" })
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false)
  const [addMoneyUser, setAddMoneyUser] = useState<AdminUser | null>(null)
  const [addMoneyAmount, setAddMoneyAmount] = useState("")
  const [addMoneyNote, setAddMoneyNote] = useState("")
  const [isAddingMoney, setIsAddingMoney] = useState(false)
  const [adminBalance, setAdminBalance] = useState<string>("∞")
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [deleteTargetUser, setDeleteTargetUser] = useState<AdminUser | null>(null)
  const [isDeletingUser, setIsDeletingUser] = useState(false)

  useEffect(() => {
    loadDashboardData()
    checkDbStatus()
    loadAdminBalance()
    const interval = setInterval(() => {
      loadDashboardData()
      checkDbStatus()
    }, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadAdminBalance = async () => {
    try {
      const response = await fetch("/api/admin/balance")
      const result = await response.json()
      if (result.success) {
        setAdminBalance(result.displayBalance)
      }
    } catch (error) {
      console.error("[v0] Error loading admin balance:", error)
    }
  }

  const checkDbStatus = async () => {
    try {
      const response = await fetch("/api/admin/db-status")
      const result = await response.json()
      setDbStatus(result)
    } catch (error) {
      console.error("[v0] Error checking DB status:", error)
      setDbStatus({
        connected: false,
        status: "error",
        message: "Failed to check database status",
      })
    }
  }

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const usersResponse = await fetch("/api/users/all")
      const usersResult = await usersResponse.json()

      if (usersResult.success && usersResult.users) {
        const dbUsers = usersResult.users.map((u: any) => ({
          id: u.id,
          name: u.fullName || u.name || "Unknown",
          email: u.email,
          phone: u.mobile || u.phone || "",
          balance: Number(u.balance) || 0,
          isActive: u.isActive !== false,
          createdAt: u.createdAt || new Date().toISOString(),
          lastLogin: u.lastLoginAt || "",
          biometricEnabled: u.biometricEnabled || u.fingerprintRegistered || false,
          faceRegistered: u.faceRegistered || !!u.faceImage,
          fingerprintRegistered: u.fingerprintRegistered || false,
          faceImage: u.faceImage,
          activeSessions: u.activeSessions || 0,
        }))
        setUsers(dbUsers)

        const activeUsers = dbUsers.filter((u: AdminUser) => u.isActive).length
        const biometricUsers = dbUsers.filter((u: AdminUser) => u.biometricEnabled || u.fingerprintRegistered).length
        const totalBalance = dbUsers.reduce((sum: number, u: AdminUser) => sum + u.balance, 0)
        const totalSessions = dbUsers.reduce((sum: number, u: AdminUser) => sum + u.activeSessions, 0)

        const logsResponse = await fetch("/api/admin/logs")
        const logsResult = await logsResponse.json()
        const logsData = logsResult.success ? logsResult.logs : []
        // Ensure logsData is treated as AdminLog[]
        setAdminLogs(
          logsData.slice(-100).map((log: AdminLog) => ({
            ...log,
            adminId: log.adminId || "admin", // Default adminId if not present
          })),
        )

        setStats({
          totalUsers: dbUsers.length,
          activeUsers,
          biometricUsers,
          totalTransactions: logsData.filter(
            (log: AdminLog) => log.type === "transaction" || log.type === "payment" || log.action?.includes("transfer"),
          ).length,
          totalBalance,
          activeSessions: totalSessions,
        })
      }
    } catch (error) {
      console.error("[v0] Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const viewUserBiometrics = async (user: AdminUser) => {
    let passkeyData = null
    try {
      const response = await fetch(`/api/passkeys/get/${user.id}`)
      const result = await response.json()
      if (result.success && result.passkeys) {
        passkeyData = result.passkeys
      }
    } catch (error) {
      console.error("[v0] Error fetching passkey data:", error)
    }

    setSelectedUserBiometrics({
      face: user.faceImage ? { image: user.faceImage } : null,
      fingerprint: passkeyData,
    })

    setSelectedUser(user)
    setShowBiometricModal(true)
  }

  const openAddMoneyModal = (user: AdminUser) => {
    setAddMoneyUser(user)
    setAddMoneyAmount("")
    setAddMoneyNote("")
    setShowAddMoneyModal(true)
  }

  const handleAddMoney = async () => {
    if (!addMoneyUser || !addMoneyAmount || Number(addMoneyAmount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    setIsAddingMoney(true)
    try {
      const response = await fetch("/api/admin/add-money", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: addMoneyUser.id,
          amount: Number(addMoneyAmount),
          adminId: "admin", // Assuming 'admin' is the current admin ID
          note: addMoneyNote || "Admin added funds",
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(
          `Successfully added $${addMoneyAmount} to ${addMoneyUser.name}\nPrevious Balance: $${result.previousBalance}\nNew Balance: $${result.newBalance}`,
        )
        setShowAddMoneyModal(false)
        loadDashboardData() // Refresh the dashboard
      } else {
        alert(`Failed to add money: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] Error adding money:", error)
      alert("An error occurred while adding money")
    } finally {
      setIsAddingMoney(false)
    }
  }

  const formatDate = (timestamp: string | number | null | undefined) => {
    if (!timestamp) return "N/A"
    // Attempt to parse as a number first (Unix timestamp)
    const numTimestamp = typeof timestamp === "string" ? Number.parseInt(timestamp, 10) : timestamp
    if (!isNaN(numTimestamp)) {
      const date = new Date(numTimestamp)
      if (!isNaN(date.getTime())) {
        return date.toLocaleString()
      }
    }
    // If parsing as number fails or it's already a string that might be ISO format
    try {
      const date = new Date(timestamp)
      if (!isNaN(date.getTime())) {
        return date.toLocaleString()
      }
    } catch (e) {
      // Ignore parsing errors and return N/A
    }
    return "N/A"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0)
  }

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return

    setIsDeletingUser(true)
    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: deleteTargetUser.id,
          adminId: "admin",
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`User "${deleteTargetUser.name}" has been permanently deleted from the Neon database`)
        setShowDeleteConfirmModal(false)
        setDeleteTargetUser(null)
        loadDashboardData() // Refresh the dashboard
      } else {
        alert(`Failed to delete user: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      alert("An error occurred while deleting the user")
    } finally {
      setIsDeletingUser(false)
    }
  }

  const openDeleteConfirmModal = (user: AdminUser) => {
    setDeleteTargetUser(user)
    setShowDeleteConfirmModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin-login">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-emerald-800 dark:text-white">Admin Dashboard</h1>
              <p className="text-emerald-600 dark:text-emerald-400">Honeydrew Mills - System Management</p>
            </div>
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="text-xs text-gray-500">Admin Balance</div>
                    <div className="text-xl font-bold text-emerald-600">{adminBalance}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Link href="/system-status">
              <Button variant="outline" className="bg-transparent">
                <Database className="h-4 w-4 mr-2" />
                System Status
              </Button>
            </Link>
            <Button
              onClick={() => loadDashboardData()}
              variant="outline"
              disabled={isLoading}
              className="bg-transparent"
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh Data
            </Button>
          </div>
        </div>

        {dbStatus.connected && dbStatus.details?.tables && (
          <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
            <CardContent className="py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75" />
                    </div>
                    <Database className="h-6 w-6 text-emerald-600" />
                    <div>
                      <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                        Neon PostgreSQL Database - Connected & Public
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400">
                        Real-time sync enabled across all devices • Multi-device support active
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Live & Synced
                    </Badge>
                    {dbStatus.details.latency && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        <Activity className="h-3 w-3 mr-1" />
                        {dbStatus.details.latency}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-emerald-600 dark:text-emerald-400 pl-12">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <Users className="h-4 w-4" />
                    <span className="font-bold text-lg">{dbStatus.details.tables.users}</span>
                    <span className="text-gray-600 dark:text-gray-400">Users</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <Key className="h-4 w-4" />
                    <span className="font-bold text-lg">{dbStatus.details.tables.passkeys}</span>
                    <span className="text-gray-600 dark:text-gray-400">Passkeys</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-bold text-lg">{dbStatus.details.tables.transactions}</span>
                    <span className="text-gray-600 dark:text-gray-400">Transactions</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <FileText className="h-4 w-4" />
                    <span className="font-bold text-lg">{dbStatus.details.tables.adminLogs}</span>
                    <span className="text-gray-600 dark:text-gray-400">Admin Logs</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <QrCode className="h-4 w-4" />
                    <span className="font-bold text-lg">{dbStatus.details.tables.qrCodes}</span>
                    <span className="text-gray-600 dark:text-gray-400">QR Codes</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-emerald-100/50 dark:bg-emerald-900/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-700 ml-12">
                  <Info className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                    <div className="font-semibold">Multi-Device Real-Time Synchronization Active:</div>
                    <div>
                      • Users registered from mobile phones, laptops, or desktop computers are all stored in the same
                      public Neon PostgreSQL database
                    </div>
                    <div>• All transactions, balances, and user data sync instantly across all devices</div>
                    <div>• Admin logs track every action from every device in real-time</div>
                    <div>
                      • Database connection:{" "}
                      <span className="font-mono bg-emerald-200 dark:bg-emerald-800 px-2 py-0.5 rounded">
                        {dbStatus.details.provider}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!dbStatus.connected && (
          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-base font-bold text-red-700 dark:text-red-300">Database Connection Failed</div>
                  <div className="text-sm text-red-600 dark:text-red-400 mt-1">{dbStatus.message}</div>
                  <div className="text-xs text-red-500 dark:text-red-500 mt-2">
                    Cannot sync user data across devices. Please check your Neon DATABASE_URL in the Vars section.
                  </div>
                </div>
                <Button
                  onClick={checkDbStatus}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100 bg-transparent"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">All devices</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Biometric Users</CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.biometricUsers}</div>
              <p className="text-xs text-muted-foreground">With biometric auth</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Database className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalBalance)}</div>
              <p className="text-xs text-muted-foreground">All users</p>
            </CardContent>
          </Card>

          <Card className="border-cyan-200 dark:border-cyan-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Smartphone className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">{stats.activeSessions}</div>
              <p className="text-xs text-muted-foreground">All devices</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              User Management ({stats.totalUsers})
            </TabsTrigger>
            <TabsTrigger value="biometrics">
              <Shield className="h-4 w-4 mr-2" />
              Biometric Data ({stats.biometricUsers})
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Database className="h-4 w-4 mr-2" />
              Neon DB Logs ({adminLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Registered Users - Neon Database
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                    <Database className="h-3 w-3 mr-1" />
                    {stats.totalUsers} users • {stats.activeSessions} active sessions
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Sessions</TableHead>
                        <TableHead>Biometric Status</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                                <Users className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-gray-500">ID: {user.id?.slice(-8)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{user.email || "-"}</div>
                              <div className="text-gray-500">{user.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-emerald-600">{formatCurrency(user.balance)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              <Smartphone className="h-3 w-3 mr-1" />
                              {user.activeSessions}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {user.faceRegistered && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  <Camera className="h-3 w-3 mr-1" />
                                  Face
                                </Badge>
                              )}
                              {user.fingerprintRegistered && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <Key className="h-3 w-3 mr-1" />
                                  Passkey
                                </Badge>
                              )}
                              {!user.biometricEnabled && !user.fingerprintRegistered && !user.faceRegistered && (
                                <Badge variant="outline" className="bg-gray-50 text-gray-500">
                                  None
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => openAddMoneyModal(user)}
                                size="sm"
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Add Money
                              </Button>
                              <Button
                                onClick={() => viewUserBiometrics(user)}
                                size="sm"
                                variant="outline"
                                className="bg-white dark:bg-slate-800"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              {/* Update the Actions column in the Users Tab to include Delete button */}
                              <Button
                                onClick={() => openDeleteConfirmModal(user)}
                                size="sm"
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Biometrics Tab */}
          <TabsContent value="biometrics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Biometric Registration Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {user.faceRegistered ? (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Face Registered
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            <XCircle className="h-3 w-3 mr-1" />
                            No Face
                          </Badge>
                        )}
                        {user.fingerprintRegistered ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Passkey Registered
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            <XCircle className="h-3 w-3 mr-1" />
                            No Passkey
                          </Badge>
                        )}
                        <Button onClick={() => viewUserBiometrics(user)} size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-emerald-600" />
                    System Activity Logs - Stored in Neon DB
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                      <Activity className="h-3 w-3 mr-1 animate-pulse" />
                      Real-time Logging Active
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                      {adminLogs.length} logs loaded
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold mb-1">Admin Activity Tracking via Neon PostgreSQL:</div>
                      <div className="text-xs space-y-0.5">
                        <div>
                          • All admin actions (user management, balance changes, system access) are logged to the{" "}
                          <span className="font-mono bg-emerald-100 dark:bg-emerald-900 px-1 rounded">admin_logs</span>{" "}
                          table
                        </div>
                        <div>• Logs include timestamps, admin ID, action type, target user, and detailed metadata</div>
                        <div>• Activity from all devices is centralized in the Neon database for audit purposes</div>
                        <div>
                          • Current storage:{" "}
                          <span className="font-semibold">{dbStatus.details?.tables?.adminLogs || 0}</span> admin log
                          entries in Neon DB
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action Type</TableHead>
                        <TableHead>Admin ID</TableHead>
                        <TableHead>Target User</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <div>No admin logs yet. All actions will be logged to Neon DB.</div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        adminLogs.map((log) => (
                          <TableRow key={log.timestamp}>
                            <TableCell className="font-mono text-xs">{formatDate(log.timestamp)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {log.type || log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{log.adminId?.slice(0, 8) || "admin"}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.userId?.slice(0, 8) || log.details?.userId?.slice(0, 8) || "N/A"}
                            </TableCell>
                            <TableCell className="max-w-md">
                              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {typeof log.details === "string" ? log.details : JSON.stringify(log.details)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {log.success !== false ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Success
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <Dialog open={showAddMoneyModal} onOpenChange={setShowAddMoneyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Add Money to User
            </DialogTitle>
          </DialogHeader>
          {addMoneyUser && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold">{addMoneyUser.name}</div>
                    <div className="text-sm text-gray-500">{addMoneyUser.phone}</div>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Current Balance: </span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(addMoneyUser.balance)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount to Add</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={addMoneyAmount}
                    onChange={(e) => setAddMoneyAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Note (Optional)</label>
                <textarea
                  value={addMoneyNote}
                  onChange={(e) => setAddMoneyNote(e.target.value)}
                  placeholder="Reason for adding funds..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  rows={3}
                />
              </div>

              {addMoneyAmount && Number(addMoneyAmount) > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Balance:</span>
                      <span className="font-medium">{formatCurrency(addMoneyUser.balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount to Add:</span>
                      <span className="font-medium text-emerald-600">+{formatCurrency(Number(addMoneyAmount))}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-emerald-200">
                      <span className="font-semibold">New Balance:</span>
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(addMoneyUser.balance + Number(addMoneyAmount))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Info className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Admin has unlimited funds (∞). This action will be logged in the system.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setShowAddMoneyModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isAddingMoney}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMoney}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={isAddingMoney || !addMoneyAmount || Number(addMoneyAmount) <= 0}
                >
                  {isAddingMoney ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Add Money
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Biometric Modal */}
      <Dialog open={showBiometricModal} onOpenChange={setShowBiometricModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Biometric Data - {selectedUser?.name}</span>
              <Button variant="ghost" size="icon" onClick={() => setShowBiometricModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Face Recognition
                </h4>
                {selectedUserBiometrics?.face ? (
                  <div className="text-sm text-green-600">Registered</div>
                ) : (
                  <div className="text-sm text-gray-500">Not Registered</div>
                )}
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Passkey / WebAuthn
                </h4>
                {selectedUserBiometrics?.fingerprint ? (
                  <div className="text-sm text-green-600">Registered</div>
                ) : (
                  <div className="text-sm text-gray-500">Not Registered</div>
                )}
              </div>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-sm">
                <strong>Balance:</strong> {formatCurrency(selectedUser?.balance || 0)}
              </p>
              <p className="text-sm">
                <strong>Active Sessions:</strong> {selectedUser?.activeSessions || 0}
              </p>
              <p className="text-sm">
                <strong>Last Login:</strong> {formatDate(selectedUser?.lastLogin || "")}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Delete Confirmation Modal after the Add Money Modal */}
      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="h-5 w-5" />
              Delete User Permanently
            </DialogTitle>
          </DialogHeader>
          {deleteTargetUser && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold">{deleteTargetUser.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{deleteTargetUser.phone}</div>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-gray-600">Email: </span>
                    <span className="font-medium">{deleteTargetUser.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Balance: </span>
                    <span className="font-medium text-red-600">{formatCurrency(deleteTargetUser.balance)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-red-100/50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
                <p className="text-sm text-red-700 dark:text-red-300 font-semibold mb-2">
                  Warning: This action cannot be undone!
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 space-y-1">
                  <div>• User will be permanently deleted from Neon database</div>
                  <div>• All user transactions will be deleted</div>
                  <div>• All biometric data will be deleted</div>
                  <div>• All passkeys will be deleted</div>
                  <div>• This action will be logged in admin logs</div>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isDeletingUser}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteUser}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isDeletingUser}
                >
                  {isDeletingUser ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Delete Permanently
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
