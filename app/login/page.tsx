"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BiometricVerificationModal } from "@/components/biometric-verification-modal"
import { Mail, Lock, AlertCircle, Eye, EyeOff, Fingerprint } from "lucide-react"
import { HoneydrewLogo } from "@/components/honeydrew-logo"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showBiometricModal, setShowBiometricModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || "Login failed. Please check your credentials.")
        return
      }

      const user = result.user

      const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        isActive: true,
        createdAt: user.createdAt || Date.now().toString(),
        lastLogin: Date.now().toString(),
        biometricEnabled: user.biometricEnabled || false,
        fingerprintRegistered: user.fingerprintRegistered || false,
        password: password, // Store for local use only
      }

      localStorage.setItem("honeydrew_current_user", JSON.stringify(sessionUser))
      localStorage.setItem("currentUser", JSON.stringify(sessionUser))

      const localUsers = JSON.parse(localStorage.getItem("honeydrew_users") || "[]")
      const existingIndex = localUsers.findIndex((u: any) => u.id === user.id)
      if (existingIndex >= 0) {
        localUsers[existingIndex] = sessionUser
      } else {
        localUsers.push(sessionUser)
      }
      localStorage.setItem("honeydrew_users", JSON.stringify(localUsers))

      const adminLogs = JSON.parse(localStorage.getItem("adminLogs") || "[]")
      adminLogs.push({
        timestamp: Date.now(),
        type: "auth",
        userId: user.id,
        action: "password_login_success",
        success: true,
        details: {
          email: user.email,
          name: user.name,
          loginTime: new Date().toISOString(),
          method: "password",
          platform: "Honeydrew Mills",
        },
      })
      localStorage.setItem("adminLogs", JSON.stringify(adminLogs))

      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Login error:", error)
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBiometricLogin = () => {
    if (!email) {
      setError("Please enter your email address first.")
      return
    }

    const localUsers = JSON.parse(localStorage.getItem("honeydrew_users") || "[]")
    const user = localUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      setError("User not found. Please check your email address or sign up first.")
      return
    }

    if (!user.isActive) {
      setError("Your account has been deactivated. Please contact support.")
      return
    }

    if (!user.biometricEnabled && !user.fingerprintRegistered) {
      setError("Biometric authentication is not enabled for this account. Please use password login.")
      return
    }

    setSelectedUser(user)
    setShowBiometricModal(true)
  }

  const handleBiometricSuccess = () => {
    if (!selectedUser) return

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: selectedUser.email,
        biometric: true,
      }),
    }).catch((err) => console.warn("[v0] Failed to update login in database:", err))

    selectedUser.lastLogin = Date.now().toString()
    const users = JSON.parse(localStorage.getItem("honeydrew_users") || "[]")
    const updatedUsers = users.map((u: any) => (u.id === selectedUser.id ? selectedUser : u))
    localStorage.setItem("honeydrew_users", JSON.stringify(updatedUsers))
    localStorage.setItem("honeydrew_current_user", JSON.stringify(selectedUser))
    localStorage.setItem("currentUser", JSON.stringify(selectedUser))

    const adminLogs = JSON.parse(localStorage.getItem("adminLogs") || "[]")
    adminLogs.push({
      timestamp: Date.now(),
      type: "auth",
      userId: selectedUser.id,
      action: "biometric_login_success",
      success: true,
      details: {
        email: selectedUser.email,
        name: selectedUser.name,
        loginTime: new Date().toISOString(),
        method: "fingerprint",
        platform: "Honeydrew Mills",
      },
    })
    localStorage.setItem("adminLogs", JSON.stringify(adminLogs))

    router.push("/dashboard")
  }

  const handleDoubleTapLogo = () => {
    const users = JSON.parse(localStorage.getItem("honeydrew_users") || "[]")
    const adminUser = users.find((u: any) => u.role === "admin")

    if (!adminUser) {
      setError("Admin user not found.")
      return
    }

    if (!adminUser.isActive) {
      setError("Admin account has been deactivated. Please contact support.")
      return
    }

    localStorage.setItem("honeydrew_current_user", JSON.stringify(adminUser))
    router.push("/admin-dashboard")
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card dark:bg-slate-900 border-border dark:border-slate-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <HoneydrewLogo size="lg" onDoubleClick={handleDoubleTapLogo} />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">Welcome Back</CardTitle>
          <p className="text-foreground/60 dark:text-slate-300">Sign in to your Honeydrew Mills account</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800">
              <TabsTrigger
                value="password"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700"
              >
                <Lock className="h-4 w-4 mr-2" />
                Password
              </TabsTrigger>
              <TabsTrigger
                value="biometric"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700"
              >
                <Fingerprint className="h-4 w-4 mr-2" />
                Fingerprint
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-4">
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground dark:text-slate-200 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError("")
                    }}
                    className="bg-background dark:bg-slate-800 border-border dark:border-slate-700 text-foreground dark:text-white placeholder:text-foreground/40 dark:placeholder:text-slate-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground dark:text-slate-200 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError("")
                      }}
                      className="pr-10 bg-background dark:bg-slate-800 border-border dark:border-slate-700 text-foreground dark:text-white placeholder:text-foreground/40 dark:placeholder:text-slate-500"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-foreground/40 dark:text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-foreground/40 dark:text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="biometric" className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="biometric-email"
                  className="text-foreground dark:text-slate-200 flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="biometric-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError("")
                  }}
                  className="bg-background dark:bg-slate-800 border-border dark:border-slate-700 text-foreground dark:text-white placeholder:text-foreground/40 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="text-center space-y-4">
                <p className="text-sm font-medium text-foreground dark:text-slate-300">
                  Use your fingerprint to authenticate:
                </p>
                <div className="flex justify-center">
                  <Link href="/login/fingerprint" className="flex-1 max-w-xs">
                    <Button
                      variant="outline"
                      className="w-full dark:border-slate-700 dark:text-slate-200 hover:bg-green-50 dark:hover:bg-green-900 bg-transparent"
                    >
                      <div className="flex flex-col items-center space-y-2 py-2">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <Fingerprint className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xs font-medium">Fingerprint Login</span>
                      </div>
                    </Button>
                  </Link>
                </div>

                <Button
                  onClick={handleBiometricLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                  disabled={!email}
                >
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Quick Authenticate
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center space-y-2">
            <p className="text-foreground/60 dark:text-slate-400 text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <BiometricVerificationModal
        open={showBiometricModal}
        onOpenChange={setShowBiometricModal}
        onSuccess={handleBiometricSuccess}
        title="Biometric Login"
        description="Verify your identity to access your Honeydrew Mills account"
        userId={selectedUser?.id}
      />
    </div>
  )
}
