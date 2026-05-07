"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Search, User, Loader2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BiometricAuth } from "@/components/biometric-auth"
import { PaymentReceipt } from "@/components/payment-receipt"
import { useToast } from "@/hooks/use-toast"
import { processPayment } from "@/lib/payment-service"

interface UserResult {
  id: string
  fullName: string
  mobile: string
  username: string
}

export default function SendMoneyPage() {
  const { toast } = useToast()
  const [step, setStep] = useState(1) // 1: select user, 2: enter amount, 3: verify, 4: receipt
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null)
  const [mobileNumber, setMobileNumber] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [authMethod, setAuthMethod] = useState<"face" | "fingerprint">("fingerprint")

  // Receipt data
  const [transactionId, setTransactionId] = useState("")
  const [transactionTimestamp, setTransactionTimestamp] = useState("")
  const [previousBalance, setPreviousBalance] = useState(0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("currentUser")
      if (user) {
        setCurrentUser(JSON.parse(user))
      }
    }
  }, [])

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()

        if (data.success) {
          setSearchResults(data.users.filter((u: UserResult) => u.id !== currentUser?.id))
        }
      } catch (error) {
        console.error("[v0] Search error:", error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, currentUser?.id])

  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user)
    setMobileNumber(user.mobile)
    setStep(2)
  }

  const handleContinueWithMobile = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${mobileNumber}`)
      const data = await response.json()

      if (data.success && data.users.length > 0) {
        const foundUser = data.users.find((u: UserResult) => u.mobile === mobileNumber)
        if (foundUser) {
          if (foundUser.id === currentUser?.id) {
            toast({
              title: "Invalid Recipient",
              description: "You cannot send money to yourself",
              variant: "destructive",
            })
            return
          }
          setSelectedUser(foundUser)
          setStep(2)
          return
        }
      }

      toast({
        title: "User Not Found",
        description: "This mobile number is not registered with Honeydrew Mills.",
        variant: "destructive",
      })
    } catch (error) {
      console.error("[v0] Mobile search error:", error)
      toast({
        title: "Error",
        description: "Failed to search for user",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleProceedToPayment = () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (Number(amount) > (currentUser?.balance || 0)) {
      toast({
        title: "Insufficient Balance",
        description: `Your balance is ${formatCurrency(currentUser?.balance || 0)}`,
        variant: "destructive",
      })
      return
    }

    setPreviousBalance(currentUser?.balance || 0)
    setStep(3) // Go to biometric verification step
  }

  const handleBiometricSuccess = async (method: "face" | "fingerprint" = "fingerprint") => {
    setAuthMethod(method)
    setIsLoading(true)

    try {
      if (!currentUser || !selectedUser) {
        throw new Error("User not logged in or recipient not selected")
      }

      const deviceId = localStorage.getItem("deviceId") || `device_${Date.now()}`
      if (!localStorage.getItem("deviceId")) {
        localStorage.setItem("deviceId", deviceId)
      }

      const result = await processPayment({
        userId: currentUser.id,
        amount: Number(amount),
        recipient: selectedUser.fullName,
        category: "transfer",
        authMethod: method,
        verificationScore: 90,
        deviceId,
        metadata: {
          recipientId: selectedUser.id,
          recipientMobile: selectedUser.mobile,
          note,
        },
      })

      if (result.success) {
        const updatedUser = { ...currentUser, balance: result.newBalance }
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        localStorage.setItem("honeydrew_current_user", JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)

        setTransactionId(result.transactionId || `TXN${Date.now()}`)
        setTransactionTimestamp(result.timestamp || new Date().toISOString())

        toast({
          title: "Payment Successful!",
          description: `${formatCurrency(Number(amount))} sent to ${selectedUser.fullName}`,
        })
        setStep(4) // Go to receipt
      } else {
        throw new Error(result.error || "Transfer failed")
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const resetForm = () => {
    setStep(1)
    setSelectedUser(null)
    setAmount("")
    setNote("")
    setSearchQuery("")
    setMobileNumber("")
  }

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Send Money</h1>
          {currentUser && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              Balance: {formatCurrency(currentUser.balance)}
            </p>
          )}
        </div>
      </div>

      {/* Step 1: Select User */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Send to</CardTitle>
            <CardDescription>Search for a registered user or enter mobile number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="search">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="search">Search Users</TabsTrigger>
                <TabsTrigger value="mobile">Mobile Number</TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or mobile..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {isSearching && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center p-3 rounded-lg hover:bg-muted cursor-pointer border"
                        onClick={() => handleSelectUser(user)}
                      >
                        <div className="bg-primary/10 h-10 w-10 rounded-full flex items-center justify-center mr-3">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{user.mobile}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">No users found</div>
                )}

                {searchQuery.length < 2 && (
                  <div className="text-center py-6 text-muted-foreground">Type at least 2 characters to search</div>
                )}
              </TabsContent>

              <TabsContent value="mobile" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    placeholder="Enter 10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  />
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleContinueWithMobile}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Enter Amount */}
      {step === 2 && selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Amount</CardTitle>
            <CardDescription>
              Sending money to {selectedUser.fullName} ({selectedUser.mobile})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (INR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">₹</span>
                <Input
                  id="amount"
                  placeholder="Enter amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-2xl h-14 font-bold"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Available Balance: {formatCurrency(currentUser?.balance || 0)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Add a Note (Optional)</Label>
              <Input id="note" placeholder="What's this for?" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[100, 500, 1000, 2000].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={() => setAmount(quickAmount.toString())}
                >
                  ₹{quickAmount}
                </Button>
              ))}
            </div>
          </CardContent>
          <div className="p-6 pt-0 flex flex-col space-y-2">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleProceedToPayment}
              disabled={!amount || Number(amount) <= 0}
            >
              Continue to Verify - {amount ? formatCurrency(Number(amount)) : "₹0"}
            </Button>
            <Button variant="outline" className="w-full bg-transparent" onClick={() => setStep(1)}>
              Back
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Biometric Verification */}
      {step === 3 && selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Verify Payment</CardTitle>
            <CardDescription>
              Confirm payment of {formatCurrency(Number(amount))} to {selectedUser.fullName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-emerald-50 dark:bg-slate-800 p-4 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-lg">{formatCurrency(Number(amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{selectedUser.fullName}</span>
              </div>
            </div>

            <BiometricAuth
              onFingerprint={() => handleBiometricSuccess("fingerprint")}
              onFaceId={() => handleBiometricSuccess("face")}
              userId={currentUser?.id || ""}
              mode="verify"
            />

            <Button
              variant="outline"
              className="w-full mt-4 bg-transparent"
              onClick={() => setStep(2)}
              disabled={isLoading}
            >
              Back to Amount
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Receipt */}
      {step === 4 && selectedUser && (
        <PaymentReceipt
          transactionId={transactionId}
          amount={Number(amount)}
          recipient={selectedUser.fullName}
          service="Money Transfer"
          timestamp={transactionTimestamp}
          previousBalance={previousBalance}
          newBalance={currentUser?.balance || 0}
          authMethod={authMethod}
          metadata={{
            "Recipient Mobile": selectedUser.mobile,
            ...(note && { Note: note }),
          }}
          onNewPayment={resetForm}
        />
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[300px]">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mb-4" />
              <p className="text-center font-medium">Processing your payment...</p>
              <p className="text-sm text-muted-foreground">Please wait</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
