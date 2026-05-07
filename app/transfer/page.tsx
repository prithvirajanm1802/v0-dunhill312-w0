"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Send, User, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { BiometricVerificationModal } from "@/components/biometric-verification-modal"

interface SearchedUser {
  id: string
  name: string
  email?: string
  mobile: string
  username?: string
}

interface CurrentUser {
  id: string
  name: string
  fullName?: string
  balance: number
  biometricEnabled?: boolean
  fingerprintRegistered?: boolean
}

export default function TransferPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([])
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [searching, setSearching] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [transferComplete, setTransferComplete] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("honeydrew_current_user")
    if (!userData) {
      window.location.href = "/login"
      return
    }
    setCurrentUser(JSON.parse(userData))
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers()
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const searchUsers = async () => {
    setSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.success) {
        // Filter out current user
        const filtered = data.users.filter((u: SearchedUser) => u.id !== currentUser?.id)
        setSearchResults(filtered)
      }
    } catch (error) {
      console.error("[v0] Error searching users:", error)
      toast({
        title: "Search Error",
        description: "Failed to search users",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  const selectUser = (user: SearchedUser) => {
    setSelectedUser(user)
    setSearchQuery("")
    setSearchResults([])
  }

  const handleTransferClick = () => {
    // Validate amount
    if (!amount || Number(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (!selectedUser) {
      toast({
        title: "No Recipient",
        description: "Please select a recipient",
        variant: "destructive",
      })
      return
    }

    if (Number(amount) > (currentUser?.balance || 0)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this transfer",
        variant: "destructive",
      })
      return
    }

    // Show biometric verification if enabled
    if (currentUser?.fingerprintRegistered || currentUser?.biometricEnabled) {
      setShowVerification(true)
    } else {
      processTransfer()
    }
  }

  const handleVerificationSuccess = () => {
    setShowVerification(false)
    processTransfer()
  }

  const handleVerificationError = (error: string) => {
    setShowVerification(false)
    toast({
      title: "Verification Failed",
      description: error,
      variant: "destructive",
    })
  }

  const handleVerificationCancel = () => {
    setShowVerification(false)
  }

  const processTransfer = async () => {
    if (!currentUser || !selectedUser) return

    setTransferring(true)

    try {
      const response = await fetch("/api/transfer/p2p", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          recipientId: selectedUser.id,
          amount: Number(amount),
          authMethod: "fingerprint",
          note,
          deviceId: localStorage.getItem("honeydrew_device_id"),
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update current user balance
        const updatedUser = { ...currentUser, balance: data.senderNewBalance }
        setCurrentUser(updatedUser)
        localStorage.setItem("honeydrew_current_user", JSON.stringify(updatedUser))

        setTransferComplete(true)

        toast({
          title: "Transfer Successful",
          description: `₹${amount} sent to ${selectedUser.name}`,
        })

        // Reset form after 2 seconds
        setTimeout(() => {
          setSelectedUser(null)
          setAmount("")
          setNote("")
          setTransferComplete(false)
        }, 3000)
      } else {
        toast({
          title: "Transfer Failed",
          description: data.error || "Failed to complete transfer",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Transfer error:", error)
      toast({
        title: "Error",
        description: "An error occurred during transfer",
        variant: "destructive",
      })
    } finally {
      setTransferring(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/wallet">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-emerald-800 dark:text-emerald-400">Send Money</h1>
            <p className="text-emerald-600 dark:text-emerald-500">Transfer to other Honeydrew Mills users</p>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(currentUser.balance)}</p>
              </div>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                {currentUser.name || currentUser.fullName}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Transfer Form */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>Send money to any registered Honeydrew Mills user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Recipients */}
            <div className="space-y-2">
              <Label>Search Recipient</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, mobile, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={!!selectedUser}
                />
                {searching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-emerald-600" />}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Card className="mt-2">
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => selectUser(user)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                        >
                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{user.mobile}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Selected Recipient */}
            {selectedUser && (
              <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedUser.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.mobile}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                max={currentUser.balance}
              />
              <div className="flex gap-2 flex-wrap">
                {[100, 500, 1000, 2000].map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(amt))}
                    className="bg-transparent"
                    disabled={amt > currentUser.balance}
                  >
                    ₹{amt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Input
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Transfer Button */}
            <Button
              onClick={handleTransferClick}
              disabled={!selectedUser || !amount || transferring || transferComplete}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {transferring ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : transferComplete ? (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Transfer Complete
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Send {amount ? formatCurrency(Number(amount)) : "Money"}
                </>
              )}
            </Button>

            {currentUser.fingerprintRegistered && (
              <p className="text-xs text-center text-muted-foreground">
                Fingerprint verification required for transfer
              </p>
            )}
          </CardContent>
        </Card>

        {/* Biometric Verification Modal */}
        {showVerification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-md w-full">
              <BiometricVerificationModal
                onSuccess={handleVerificationSuccess}
                onError={handleVerificationError}
                onCancel={handleVerificationCancel}
                userId={currentUser.id}
                purpose="transfer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
