"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  EyeOff,
  Smartphone,
  Tv,
  Send,
  CreditCard,
  Wallet,
  QrCode,
  ScanLine,
  Plus,
  ArrowUpRight,
  Zap,
  Shield,
  TrendingUp,
  Bell,
  Settings,
  LogOut,
  User,
  Gift,
} from "lucide-react"
import { BiometricVerificationModal } from "@/components/biometric-verification-modal"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { logAdminEvent } from "@/lib/admin-logger"
import { serviceIntegrations } from "@/lib/service-integrations"
import { BrandLogoGrid } from "@/components/brand-logo-grid"
import { HoneydrewLogo } from "@/components/honeydrew-logo"
import { TransactionHistory } from "@/components/transaction-history"

export default function Dashboard() {
  const [balance, setBalance] = useState(10000)
  const [showBalance, setShowBalance] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [hasBiometrics, setHasBiometrics] = useState(false)
  const [biometricChecked, setBiometricChecked] = useState(false)

  useEffect(() => {
    // Load user data and set session
    const userData = localStorage.getItem("honeydrew_current_user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setBalance(parsedUser.balance || 10000)

        // Set current user session for security verification
        localStorage.setItem("honeydrew_current_user_session", parsedUser.id || "current_user")

        checkBiometricStatus(parsedUser)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timeInterval)
  }, [])

  const checkBiometricStatus = async (userData: any) => {
    const hasLocalBiometrics = userData?.fingerprintRegistered || userData?.biometricEnabled

    if (hasLocalBiometrics) {
      setHasBiometrics(true)
      setBiometricChecked(true)
      return
    }

    // Also check Neon DB for passkeys
    try {
      const userId = userData?.id
      if (userId) {
        const response = await fetch(`/api/passkeys/get/${userId}`)
        const result = await response.json()
        if (result.success && result.passkeys && result.passkeys.length > 0) {
          setHasBiometrics(true)
          // Update local user object
          const updatedUser = { ...userData, fingerprintRegistered: true, biometricEnabled: true }
          localStorage.setItem("honeydrew_current_user", JSON.JSON.stringify(updatedUser))
          setUser(updatedUser)
        }
      }
    } catch (error) {
      console.error("[v0] Error checking passkey status:", error)
    }

    setBiometricChecked(true)
  }

  const handleBalanceToggle = async () => {
    if (showBalance) {
      setShowBalance(false)
      await logAdminEvent({
        userId: user?.id || "unknown",
        action: "balance_hidden",
        details: { timestamp: new Date().toISOString() },
        success: true,
      })
    } else {
      if (!hasBiometrics) {
        toast({
          title: "Biometric Verification Required",
          description: "Please complete biometric verification to view your balance.",
          variant: "destructive",
        })
        return
      }
      setPendingAction("view_balance")
      setShowVerificationModal(true)
    }
  }

  const handleSecureAction = async (action: string) => {
    if (!hasBiometrics) {
      toast({
        title: "Biometric Verification Required",
        description: "Please complete biometric verification to access this feature.",
        variant: "destructive",
      })
      return
    }

    setPendingAction(action)
    setShowVerificationModal(true)
  }

  const handleVerificationSuccess = async () => {
    setShowVerificationModal(false)

    if (pendingAction === "view_balance") {
      setShowBalance(true)
      toast({
        title: "Balance Revealed",
        description: "Identity verified successfully",
      })

      await logAdminEvent({
        userId: user?.id || "unknown",
        action: "balance_viewed",
        details: {
          balance: balance,
          timestamp: new Date().toISOString(),
          verificationMethod: "biometric",
        },
        success: true,
      })
    } else if (pendingAction?.startsWith("navigate_")) {
      const path = pendingAction.replace("navigate_", "")

      await logAdminEvent({
        userId: user?.id || "unknown",
        action: "secure_navigation",
        details: {
          destination: path,
          timestamp: new Date().toISOString(),
          verificationMethod: "biometric",
        },
        success: true,
      })

      toast({
        title: "Access Granted",
        description: "Identity verified. Redirecting...",
      })

      setTimeout(() => {
        window.location.href = path
      }, 1000)
    }

    setPendingAction(null)
  }

  const handleVerificationClose = () => {
    setShowVerificationModal(false)
    setPendingAction(null)
  }

  const handleLogout = async () => {
    await logAdminEvent({
      userId: user?.id || "unknown",
      action: "user_logout",
      details: { timestamp: new Date().toISOString() },
      success: true,
    })

    // Clear all session data
    localStorage.removeItem("honeydrew_current_user")
    localStorage.removeItem("honeydrew_user_authenticated")
    localStorage.removeItem("honeydrew_current_user_session")

    toast({
      title: "Logged Out Successfully",
      description: "Thank you for using Honeydrew Mills",
    })

    setTimeout(() => {
      window.location.href = "/login"
    }, 1000)
  }

  const getVerificationTitle = () => {
    switch (pendingAction) {
      case "view_balance":
        return "Verify Identity to View Balance"
      case "navigate_/send-money":
        return "Verify Identity for Send Money"
      case "navigate_/mobile-recharge":
        return "Verify Identity for Mobile Recharge"
      case "navigate_/dth-recharge":
        return "Verify Identity for DTH Recharge"
      case "navigate_/wallet":
        return "Verify Identity for Wallet Access"
      case "navigate_/scan-qr":
        return "Verify Identity for QR Scanner"
      case "navigate_/self-qr":
        return "Verify Identity for My QR Code"
      case "navigate_/bill-payments":
        return "Verify Identity for Bill Payments"
      case "navigate_/gaming":
        return "Verify Identity for Gaming"
      case "navigate_/loans":
        return "Verify Identity for Loans"
      case "navigate_/cibil-score":
        return "Verify Identity for CIBIL Score"
      case "navigate_/healthcare":
        return "Verify Identity for Healthcare"
      case "navigate_/payments":
        return "Verify Identity for Payments"
      case "navigate_/stripe-payment":
        return "Verify Identity for Stripe Payment"
      case "navigate_/transfer":
        return "Verify Identity for P2P Transfer"
      default:
        return "Honeydrew Mills Security Verification"
    }
  }

  const getVerificationDescription = () => {
    return "Please verify your identity using your registered fingerprint biometric data to continue with this secure action on Honeydrew Mills platform."
  }

  const quickActions = [
    {
      title: "Send Money",
      icon: Send,
      color: "bg-blue-500",
      action: () => handleSecureAction("navigate_/send-money"),
      description: "Transfer funds securely",
    },
    {
      title: "Mobile Recharge",
      icon: Smartphone,
      color: "bg-green-500",
      action: () => handleSecureAction("navigate_/mobile-recharge"),
      description: "Recharge your mobile",
    },
    {
      title: "DTH Recharge",
      icon: Tv,
      color: "bg-purple-500",
      action: () => handleSecureAction("navigate_/dth-recharge"),
      description: "Recharge DTH connection",
    },
    {
      title: "Scan QR",
      icon: ScanLine,
      color: "bg-orange-500",
      action: () => handleSecureAction("navigate_/scan-qr"),
      description: "Scan to pay instantly",
    },
  ]

  const services = [
    {
      title: "My Wallet",
      icon: Wallet,
      path: "/wallet",
      secure: true,
      description: "Manage your wallet",
    },
    {
      title: "My QR Code",
      icon: QrCode,
      path: "/self-qr",
      secure: true,
      description: "Show your QR",
    },
    {
      title: "Add Money",
      icon: CreditCard,
      path: "/stripe-payment",
      secure: false,
      description: "Add via Stripe",
    },
    {
      title: "P2P Transfer",
      icon: Send,
      path: "/transfer",
      secure: true,
      description: "Transfer to users",
    },
    {
      title: "Bill Payments",
      icon: CreditCard,
      path: "/bill-payments",
      secure: true,
      description: "Pay utility bills",
    },
    {
      title: "Gaming",
      icon: Plus,
      path: "/gaming",
      secure: true,
      description: "Gaming services",
    },
    {
      title: "Loans",
      icon: TrendingUp,
      path: "/loans",
      secure: true,
      description: "Apply for loans",
    },
    {
      title: "CIBIL Score",
      icon: Shield,
      path: "/cibil-score",
      secure: true,
      description: "Check credit score",
    },
    {
      title: "Healthcare",
      icon: Plus,
      path: "/healthcare",
      secure: true,
      description: "Health services",
    },
    {
      title: "Payments",
      icon: CreditCard,
      path: "/payments",
      secure: true,
      description: "Make payments",
    },
    {
      title: "More Services",
      icon: Plus,
      path: "/more-services",
      secure: false,
      description: "Explore all services",
    },
  ]

  const recentTransactions = [
    {
      id: 1,
      type: "credit",
      description: "Honeydrew Mills Welcome Bonus",
      amount: 10000,
      date: new Date().toLocaleDateString(),
      icon: Gift,
      category: "bonus",
    },
    {
      id: 2,
      type: "debit",
      description: "Mobile Recharge - Jio",
      amount: 299,
      date: new Date(Date.now() - 86400000).toLocaleDateString(),
      icon: Smartphone,
      category: "recharge",
    },
    {
      id: 3,
      type: "credit",
      description: "Cashback Reward",
      amount: 50,
      date: new Date(Date.now() - 172800000).toLocaleDateString(),
      icon: TrendingUp,
      category: "cashback",
    },
  ]

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const popularServices = [
    serviceIntegrations.jio,
    serviceIntegrations.airtel,
    serviceIntegrations.vi,
    serviceIntegrations.irctc,
    serviceIntegrations.bookmyshow,
    serviceIntegrations.bitcoin,
    serviceIntegrations.groww,
    serviceIntegrations.googleplay,
  ].filter(Boolean)

  const safeQuickActions = quickActions || []
  const safeServices = services || []
  const safeRecentTransactions = recentTransactions || []
  const safePopularServices = popularServices || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-emerald-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <HoneydrewLogo size="md" showSubtitle />
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right mr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{formatTime(currentTime)}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{formatDate(currentTime).split(",")[0]}</p>
              </div>

              <Link href="/system-status">
                <Button variant="ghost" size="icon" className="hover:bg-emerald-50 dark:hover:bg-slate-800">
                  <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </Button>
              </Link>

              <Button variant="ghost" size="icon" className="hover:bg-emerald-50 dark:hover:bg-slate-800">
                <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </Button>

              <Link href="/biometric-settings">
                <Button variant="ghost" size="icon" className="hover:bg-emerald-50 dark:hover:bg-slate-800">
                  <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="hover:bg-red-50 dark:hover:bg-slate-800"
              >
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <User className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Welcome back, {user?.name || "User"}!
            </h2>
          </div>
          <p className="text-gray-600 dark:text-slate-400">
            Manage your finances securely with Honeydrew Mills digital payment platform
          </p>
        </div>

        {/* Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg dark:from-emerald-700 dark:to-emerald-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-emerald-100 mb-2 flex items-center gap-2 dark:text-emerald-200">
                  <Wallet className="h-4 w-4" />
                  Total Balance
                </p>
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-bold text-white">
                    ₹{showBalance ? balance.toLocaleString("en-IN") : "••••••"}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBalanceToggle}
                    className="text-white hover:bg-emerald-400 dark:hover:bg-emerald-600 h-8 w-8"
                  >
                    {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-emerald-200 dark:text-emerald-300" />
                  <span className="text-sm text-emerald-100 dark:text-emerald-200">Secured by Biometrics</span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-emerald-400 text-emerald-900 dark:bg-emerald-600 dark:text-white"
                >
                  Premium Account
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-emerald-100 dark:text-emerald-200">
              <div className="flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" />
                <span>+₹2,500 this week</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>Instant transfers</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Bank-level security</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-8 border-emerald-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {safeQuickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-24 flex-col gap-2 hover:bg-emerald-50 dark:hover:bg-slate-800 border-emerald-200 dark:border-slate-700 bg-transparent dark:text-slate-200 group"
                  onClick={action.action}
                >
                  <div className={`p-2 rounded-full ${action.color} group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium">{action.title}</span>
                    <p className="text-xs text-muted-foreground mt-1 dark:text-slate-400">{action.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Services */}
        <Card className="mb-8 border-emerald-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
              <Zap className="h-5 w-5" />
              Popular Services
            </CardTitle>
            <CardDescription>Quick access to popular payment & booking services</CardDescription>
          </CardHeader>
          <CardContent>
            <BrandLogoGrid brands={safePopularServices} />
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Services Grid */}
          <div className="lg:col-span-2">
            <Card className="border-emerald-200 dark:border-slate-800 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-400">All Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {safeServices.map((service, index) =>
                    service.secure ? (
                      <Button
                        key={index}
                        variant="ghost"
                        className="h-20 flex-col gap-2 hover:bg-emerald-50 dark:hover:bg-slate-800 dark:text-slate-200 group"
                        onClick={() => handleSecureAction(`navigate_${service.path}`)}
                      >
                        <service.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                        <div className="text-center">
                          <span className="text-sm font-medium">{service.title}</span>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{service.description}</p>
                        </div>
                      </Button>
                    ) : (
                      <Link key={index} href={service.path}>
                        <Button
                          variant="ghost"
                          className="h-20 flex-col gap-2 hover:bg-emerald-50 dark:hover:bg-slate-800 w-full dark:text-slate-200 group"
                        >
                          <service.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                          <div className="text-center">
                            <span className="text-sm font-medium">{service.title}</span>
                            <p className="text-xs text-muted-foreground dark:text-slate-400">{service.description}</p>
                          </div>
                        </Button>
                      </Link>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions & Stats */}
          <div className="space-y-6">
            {/* Recent Transactions */}
            <Card className="border-emerald-200 dark:border-slate-800 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-emerald-800 dark:text-emerald-400">
                  Recent Transactions
                  <Link href="/transaction-history">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800"
                    >
                      View All
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {safeRecentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === "credit"
                              ? "bg-emerald-100 dark:bg-emerald-900"
                              : "bg-red-100 dark:bg-red-900"
                          }`}
                        >
                          <transaction.icon
                            className={`h-4 w-4 ${transaction.type === "credit" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm dark:text-slate-200">{transaction.description}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500 dark:text-slate-400">{transaction.date}</p>
                            <Badge variant="outline" className="text-xs dark:border-slate-600 dark:text-slate-300">
                              {transaction.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            transaction.type === "credit"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {transaction.type === "credit" ? "+" : "-"}₹{transaction.amount.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Status Card - Updated to remove face reference */}
            <Card className="border-emerald-200 dark:border-slate-800 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                  <Shield className="h-5 w-5" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between dark:text-slate-200">
                    <span className="text-sm">Biometric Authentication</span>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700">
                      {hasBiometrics ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between dark:text-slate-200">
                    <span className="text-sm">Fingerprint</span>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700">
                      {user?.fingerprintRegistered ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between dark:text-slate-200">
                    <span className="text-sm">Account Status</span>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700">
                      Verified
                    </Badge>
                  </div>
                </div>
                <Link href="/biometric-settings">
                  <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600">
                    Manage Security Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction History */}
        <section className="mt-8">
          <TransactionHistory userId={user?.id || ""} />
        </section>

        <div className="mt-12 text-center">
          <Card className="border-emerald-200 dark:border-slate-800 bg-emerald-50 dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <HoneydrewLogo className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">Honeydrew Mills</h3>
              </div>
              <p className="text-gray-600 dark:text-slate-400 mb-4">
                Your trusted partner for secure digital payments and financial services
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Bank-level Security
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  10M+ Users
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Instant Transfers
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Biometric Verification Modal */}
      <BiometricVerificationModal
        isOpen={showVerificationModal}
        onClose={handleVerificationClose}
        onSuccess={handleVerificationSuccess}
        title={getVerificationTitle()}
        description={getVerificationDescription()}
        userId={user?.id || "current_user"}
      />
    </div>
  )
}
