"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  Fingerprint,
  ScanFace,
  Smartphone,
  TrendingUp,
  Clock,
  QrCode,
  Key,
} from "lucide-react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"

interface User {
  id: string
  fullName: string
  email: string
  mobile: string
  username: string
  balance: number
  isActive: boolean
  fingerprintRegistered: boolean
  activeSessions: number
  createdAt: string
  lastLoginAt: string
}

interface UserDetails {
  id: string
  fullName: string
  email: string
  mobile: string
  username: string
  balance: number
  isActive: boolean
  fingerprintRegistered: boolean
  createdAt: string
  lastLoginAt: string
  passkey?: {
    credentialId: string
    deviceType: string
    createdAt: string
    lastUsed?: string
  }
  biometrics: Array<{
    biometric_type: string
    biometric_features?: any
    image_hash: string
    model_version: string
    created_at: string
    updated_at: string
  }>
  sessions: Array<{
    device_id: string
    device_name: string
    device_type: string
    ip_address: string
    created_at: string
    last_activity_at: string
  }>
}

interface Stats {
  users: {
    total_users: number
    fingerprint_registered: number
    qr_codes_generated: number
    active_sessions: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/users/all")
      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const viewUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()

      if (data.success) {
        setSelectedUser(data.user)
        setShowUserDialog(true)
      }
    } catch (error) {
      console.error("[v0] Error fetching user details:", error)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.mobile.includes(searchQuery) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  const generateUserQRData = (user: UserDetails) => {
    return JSON.stringify({
      id: `QR_${user.id}`,
      userId: user.id,
      userName: user.fullName,
      mobile: user.mobile,
      type: "user",
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">View all users with face images, passkeys, and QR codes</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button onClick={fetchUsers} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.total_users}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ScanFace className="h-4 w-4 text-emerald-500" />
                  Face Registered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-purple-500" />
                  Passkey Registered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.fingerprint_registered}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-orange-500" />
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.active_sessions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-green-500" />
                  QR Codes Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.qr_codes_generated}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-500" />
                  Today Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, mobile, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Registered Users</CardTitle>
            <CardDescription>
              Showing {filteredUsers.length} of {users.length} users from Neon database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Biometrics</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                                {user.fullName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-sm text-muted-foreground">{user.email || "-"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.mobile}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(user.balance)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {user.fingerprintRegistered && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                <Key className="h-3 w-3 mr-1" />
                                Passkey
                              </Badge>
                            )}
                            {!user.fingerprintRegistered && (
                              <Badge variant="outline" className="text-muted-foreground">
                                None
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <Smartphone className="h-3 w-3 mr-1" />
                            {user.activeSessions}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(user.lastLoginAt)}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "destructive"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => viewUserDetails(user.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg">
                    {selectedUser?.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {selectedUser?.fullName}
              </DialogTitle>
              <DialogDescription>Complete user profile including biometrics and QR code</DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="biometrics">Biometrics</TabsTrigger>
                  <TabsTrigger value="qrcode">QR Code</TabsTrigger>
                  <TabsTrigger value="sessions">Sessions</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{selectedUser.fullName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Mobile</p>
                      <p className="font-medium">{selectedUser.mobile}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.email || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="font-mono text-xs">{selectedUser.id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="font-medium text-lg text-emerald-600">{formatCurrency(selectedUser.balance)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={selectedUser.isActive ? "default" : "destructive"}>
                        {selectedUser.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Created At</p>
                      <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Last Login</p>
                      <p className="font-medium">{formatDate(selectedUser.lastLoginAt)}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="biometrics" className="space-y-4">
                  <div className="grid gap-4">
                    {/* Passkey Info */}
                    <Card className={selectedUser.fingerprintRegistered ? "border-purple-200 bg-purple-50/50" : ""}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Key className="h-5 w-5" />
                          Passkey / WebAuthn
                          {selectedUser.fingerprintRegistered && (
                            <Badge className="bg-purple-600 ml-auto">Registered</Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedUser.fingerprintRegistered ? (
                          <div className="space-y-3">
                            {selectedUser.passkey && (
                              <div className="p-3 bg-purple-100/50 rounded-lg space-y-2">
                                <div className="flex items-center gap-2">
                                  <Fingerprint className="h-4 w-4 text-purple-600" />
                                  <span className="text-sm font-medium">Credential ID</span>
                                </div>
                                <p className="text-xs font-mono bg-white p-2 rounded break-all">
                                  {selectedUser.passkey.credentialId?.substring(0, 50)}...
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Device: {selectedUser.passkey.deviceType || "Unknown"}
                                </p>
                              </div>
                            )}
                            {selectedUser.biometrics
                              .filter((b) => b.biometric_type === "fingerprint")
                              .map((bio, i) => (
                                <div key={i} className="text-sm text-muted-foreground space-y-1">
                                  <p>Type: {bio.model_version}</p>
                                  <p>Registered: {formatDate(bio.created_at)}</p>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <Badge variant="outline">Not Registered</Badge>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="qrcode" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        User Payment QR Code
                      </CardTitle>
                      <CardDescription>Unique QR code for receiving payments to this user</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <QRCodeSVG value={generateUserQRData(selectedUser)} size={200} level="H" includeMargin />
                      </div>
                      <div className="mt-4 text-center">
                        <p className="font-medium text-lg">{selectedUser.fullName}</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.mobile}</p>
                        <Badge variant="outline" className="mt-2">
                          ID: {selectedUser.id.substring(0, 8)}...
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sessions" className="space-y-4">
                  <div className="space-y-3">
                    {selectedUser.sessions && selectedUser.sessions.length > 0 ? (
                      selectedUser.sessions.map((session, i) => (
                        <Card key={i}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full">
                                  <Smartphone className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{session.device_name || "Unknown Device"}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {session.device_type} - {session.ip_address || "Unknown IP"}
                                  </p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3" />
                                    Last active: {formatDate(session.last_activity_at)}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                                Active
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                          <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No active sessions</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
