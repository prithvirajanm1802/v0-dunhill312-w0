"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp, BarChart3, PieChart, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { BiometricAuth } from "@/components/biometric-auth"
import { PaymentReceipt } from "@/components/payment-receipt"
import { processPayment } from "@/lib/payment-service"

const investmentOptions = [
  { id: "stocks", name: "Stocks", description: "Direct stock investments", icon: BarChart3 },
  { id: "mutual-fund", name: "Mutual Funds", description: "Professional fund management", icon: PieChart },
  { id: "etf", name: "ETF", description: "Exchange-traded funds", icon: TrendingUp },
]

const topFunds = [
  { name: "Axis Small Cap Fund", returns: "+28.5%", risk: "High", minInvestment: 500 },
  { name: "Motilal Oswal Midcap", returns: "+24.2%", risk: "High", minInvestment: 500 },
  { name: "ICICI Prudential Bluechip", returns: "+18.7%", risk: "Moderate", minInvestment: 100 },
  { name: "HDFC Index Fund Nifty 50", returns: "+15.3%", risk: "Low", minInvestment: 100 },
  { name: "SBI Equity Hybrid Fund", returns: "+12.8%", risk: "Moderate", minInvestment: 500 },
]

export default function GrowwPage() {
  const { toast } = useToast()
  const [step, setStep] = useState(1) // 1: select, 2: amount, 3: verify, 4: receipt
  const [amount, setAmount] = useState("")
  const [investmentType, setInvestmentType] = useState("mutual-fund")
  const [selectedFund, setSelectedFund] = useState<any>(null)
  const [authMethod, setAuthMethod] = useState<"face" | "fingerprint">("fingerprint")
  const [transactionId, setTransactionId] = useState("")
  const [transactionTimestamp, setTransactionTimestamp] = useState("")
  const [previousBalance, setPreviousBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("currentUser")
      if (user) setCurrentUser(JSON.parse(user))
    }
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleSelectFund = (fund: any) => {
    setSelectedFund(fund)
    setStep(2)
  }

  const handleProceedToVerify = () => {
    if (!amount || Number(amount) < (selectedFund?.minInvestment || 100)) {
      toast({
        title: "Invalid Amount",
        description: `Minimum investment is ${formatCurrency(selectedFund?.minInvestment || 100)}`,
        variant: "destructive",
      })
      return
    }

    if (currentUser && Number(amount) > currentUser.balance) {
      toast({
        title: "Insufficient Balance",
        description: `Your balance is ${formatCurrency(currentUser.balance)}`,
        variant: "destructive",
      })
      return
    }

    setPreviousBalance(currentUser?.balance || 0)
    setStep(3)
  }

  const handleBiometricSuccess = async (method: "face" | "fingerprint" = "fingerprint") => {
    setAuthMethod(method)
    setIsLoading(true)

    try {
      const deviceId = localStorage.getItem("deviceId") || `device_${Date.now()}`

      const result = await processPayment({
        userId: currentUser.id,
        amount: Number(amount),
        recipient: `Groww - ${selectedFund?.name || investmentType}`,
        category: "investment",
        authMethod: method,
        verificationScore: 90,
        deviceId,
        metadata: {
          investmentType,
          fundName: selectedFund?.name,
          expectedReturns: selectedFund?.returns,
          riskLevel: selectedFund?.risk,
        },
      })

      if (result.success) {
        const updatedUser = { ...currentUser, balance: result.newBalance }
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)

        setTransactionId(result.transactionId || `TXN${Date.now()}`)
        setTransactionTimestamp(result.timestamp || new Date().toISOString())

        toast({
          title: "Investment Successful!",
          description: `Invested ${formatCurrency(Number(amount))} in ${selectedFund?.name || investmentType}`,
        })
        setStep(4)
      } else {
        throw new Error(result.error || "Investment failed")
      }
    } catch (error: any) {
      toast({
        title: "Investment Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setAmount("")
    setSelectedFund(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="border-emerald-200 hover:bg-emerald-50 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Groww Investments</h1>
            {currentUser && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                Balance: {formatCurrency(currentUser.balance)}
              </p>
            )}
          </div>
        </div>

        {/* Step 1: Select Investment */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {investmentOptions.map((option) => {
                const Icon = option.icon
                return (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all dark:bg-slate-900 ${
                      investmentType === option.id
                        ? "border-emerald-600 bg-emerald-50 dark:bg-slate-800"
                        : "border-emerald-200 dark:border-slate-700 hover:border-emerald-400"
                    }`}
                    onClick={() => setInvestmentType(option.id)}
                  >
                    <CardContent className="pt-4 flex flex-col items-center text-center p-3">
                      <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-1" />
                      <h3 className="font-semibold text-xs text-emerald-900 dark:text-emerald-300">{option.name}</h3>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-400">Top Performing Funds</CardTitle>
                <CardDescription>Select a fund to invest</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topFunds.map((fund, i) => (
                  <Card
                    key={i}
                    className="cursor-pointer hover:border-emerald-500 transition-colors"
                    onClick={() => handleSelectFund(fund)}
                  >
                    <CardContent className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{fund.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Min: {formatCurrency(fund.minInvestment)} | {fund.risk} Risk
                        </p>
                      </div>
                      <span className="text-green-600 font-semibold">{fund.returns}</span>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 2: Enter Amount */}
        {step === 2 && selectedFund && (
          <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-emerald-800 dark:text-emerald-400">Investment Amount</CardTitle>
              <CardDescription>{selectedFund.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-emerald-50 dark:bg-slate-800 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Expected Returns:</span>
                  <span className="text-green-600 font-semibold">{selectedFund.returns}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Risk Level:</span>
                  <span>{selectedFund.risk}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Investment Amount (INR)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">₹</span>
                  <Input
                    type="number"
                    placeholder={`Min ${formatCurrency(selectedFund.minInvestment)}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 text-xl h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 5000, 10000].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                    onClick={() => setAmount(quickAmount.toString())}
                  >
                    ₹{quickAmount >= 1000 ? `${quickAmount / 1000}K` : quickAmount}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleProceedToVerify}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={!amount || Number(amount) < selectedFund.minInvestment}
              >
                Invest {amount ? formatCurrency(Number(amount)) : ""}
              </Button>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => setStep(1)}>
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Biometric Verification */}
        {step === 3 && (
          <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-emerald-800 dark:text-emerald-400">Verify Investment</CardTitle>
              <CardDescription>Confirm investment of {formatCurrency(Number(amount))}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-emerald-50 dark:bg-slate-800 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span>Fund:</span>
                  <span className="font-medium">{selectedFund?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-bold">{formatCurrency(Number(amount))}</span>
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
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Receipt */}
        {step === 4 && (
          <PaymentReceipt
            transactionId={transactionId}
            amount={Number(amount)}
            recipient={`Groww - ${selectedFund?.name}`}
            service="Investment"
            timestamp={transactionTimestamp}
            previousBalance={previousBalance}
            newBalance={currentUser?.balance || 0}
            authMethod={authMethod}
            metadata={{
              "Fund Name": selectedFund?.name,
              "Expected Returns": selectedFund?.returns,
              "Risk Level": selectedFund?.risk,
            }}
            onNewPayment={resetForm}
          />
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-[300px]">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                <p className="text-center font-medium">Processing investment...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
