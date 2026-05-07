"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Shield,
  Target,
  Award,
  AlertTriangle,
  Eye,
  EyeOff,
  Star,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { BiometricAuth } from "@/components/biometric-auth"

interface Investment {
  id: string
  name: string
  type: "stock" | "mutual_fund" | "bond"
  symbol: string
  price: number
  change: number
  changePercent: number
  marketCap?: string
  rating: number
  risk: "low" | "medium" | "high"
  returns1y: number
  holdings?: number
  value?: number
}

interface Portfolio {
  totalValue: number
  totalInvested: number
  totalReturns: number
  returnsPercent: number
}

const investments: Investment[] = [
  // Stocks
  {
    id: "reliance",
    name: "Reliance Industries",
    type: "stock",
    symbol: "RELIANCE",
    price: 2450,
    change: 45,
    changePercent: 1.87,
    marketCap: "₹16.5L Cr",
    rating: 4.2,
    risk: "medium",
    returns1y: 12.5,
    holdings: 10,
    value: 24500,
  },
  {
    id: "tcs",
    name: "Tata Consultancy Services",
    type: "stock",
    symbol: "TCS",
    price: 3680,
    change: -25,
    changePercent: -0.67,
    marketCap: "₹13.4L Cr",
    rating: 4.5,
    risk: "low",
    returns1y: 8.3,
    holdings: 5,
    value: 18400,
  },
  {
    id: "hdfc",
    name: "HDFC Bank",
    type: "stock",
    symbol: "HDFCBANK",
    price: 1580,
    change: 12,
    changePercent: 0.76,
    marketCap: "₹12.1L Cr",
    rating: 4.3,
    risk: "low",
    returns1y: 15.2,
  },

  // Mutual Funds
  {
    id: "sbi-bluechip",
    name: "SBI Bluechip Fund",
    type: "mutual_fund",
    symbol: "SBIBCF",
    price: 68.45,
    change: 0.85,
    changePercent: 1.26,
    rating: 4.1,
    risk: "medium",
    returns1y: 14.8,
    holdings: 500,
    value: 34225,
  },
  {
    id: "axis-midcap",
    name: "Axis Midcap Fund",
    type: "mutual_fund",
    symbol: "AXISMID",
    price: 89.32,
    change: -1.2,
    changePercent: -1.32,
    rating: 3.9,
    risk: "high",
    returns1y: 22.1,
  },
  {
    id: "icici-prudential",
    name: "ICICI Prudential Balanced Advantage Fund",
    type: "mutual_fund",
    symbol: "ICICIBAL",
    price: 45.67,
    change: 0.34,
    changePercent: 0.75,
    rating: 4.0,
    risk: "medium",
    returns1y: 11.5,
  },

  // Bonds
  {
    id: "govt-bond-10y",
    name: "Government Bond 10Y",
    type: "bond",
    symbol: "GOVTBOND10Y",
    price: 1000,
    change: 2,
    changePercent: 0.2,
    rating: 5.0,
    risk: "low",
    returns1y: 6.8,
  },
  {
    id: "corporate-bond",
    name: "AAA Corporate Bond",
    type: "bond",
    symbol: "CORPBOND",
    price: 1050,
    change: -5,
    changePercent: -0.47,
    rating: 4.2,
    risk: "low",
    returns1y: 8.2,
  },
]

const portfolio: Portfolio = {
  totalValue: 77125,
  totalInvested: 65000,
  totalReturns: 12125,
  returnsPercent: 18.65,
}

const riskProfiles = [
  {
    type: "Conservative",
    description: "Low risk, steady returns",
    allocation: { stocks: 20, bonds: 60, mutualFunds: 20 },
    expectedReturn: "6-8%",
    risk: "Low",
  },
  {
    type: "Moderate",
    description: "Balanced risk and returns",
    allocation: { stocks: 40, bonds: 30, mutualFunds: 30 },
    expectedReturn: "8-12%",
    risk: "Medium",
  },
  {
    type: "Aggressive",
    description: "High risk, high returns",
    allocation: { stocks: 60, bonds: 10, mutualFunds: 30 },
    expectedReturn: "12-18%",
    risk: "High",
  },
]

export default function InvestmentPlatformPage() {
  const [showBiometric, setShowBiometric] = useState(false)
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null)
  const [investmentAmount, setInvestmentAmount] = useState("")
  const [hideBalances, setHideBalances] = useState(false)
  const [selectedRiskProfile, setSelectedRiskProfile] = useState("Moderate")
  const { toast } = useToast()

  const handleInvest = (investment: Investment) => {
    setSelectedInvestment(investment)
    setShowBiometric(true)
  }

  const handleBiometricSuccess = () => {
    if (selectedInvestment && investmentAmount) {
      const amount = Number.parseFloat(investmentAmount)

      toast({
        title: "Investment Successful",
        description: `Invested ₹${amount.toLocaleString()} in ${selectedInvestment.name}`,
        variant: "default",
      })

      setShowBiometric(false)
      setSelectedInvestment(null)
      setInvestmentAmount("")
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "stock":
        return <BarChart3 className="h-4 w-4" />
      case "mutual_fund":
        return <PieChart className="h-4 w-4" />
      case "bond":
        return <Shield className="h-4 w-4" />
      default:
        return <TrendingUp className="h-4 w-4" />
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-600 bg-green-100 border-green-200"
      case "medium":
        return "text-yellow-600 bg-yellow-100 border-yellow-200"
      case "high":
        return "text-red-600 bg-red-100 border-red-200"
      default:
        return "text-gray-600 bg-gray-100 border-gray-200"
    }
  }

  if (showBiometric) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">Confirm Investment</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Investing ₹{investmentAmount} in {selectedInvestment?.name}
              </p>
            </div>

            <BiometricAuth
              userId="current-user"
              mode="verify"
              onFingerprint={handleBiometricSuccess}
              onFaceId={handleBiometricSuccess}
              onError={(error) => {
                toast({
                  title: "Authentication Failed",
                  description: error,
                  variant: "destructive",
                })
                setShowBiometric(false)
              }}
            />

            <Button
              variant="outline"
              onClick={() => setShowBiometric(false)}
              className="w-full mt-4 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/integrations">
            <Button variant="outline" size="icon" className="border-emerald-200 hover:bg-emerald-50 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">Investment Platform</h1>
            <p className="text-gray-600 dark:text-gray-400">Stocks, mutual funds, and bonds</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHideBalances(!hideBalances)}
            className="text-gray-500 hover:text-emerald-600"
          >
            {hideBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {/* Portfolio Overview */}
        <Card className="border-emerald-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <PieChart className="h-5 w-5" />
              Portfolio Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-3xl font-bold text-emerald-800">
                  {hideBalances ? "••••••" : `₹${portfolio.totalValue.toLocaleString()}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Invested</p>
                <p className="text-2xl font-semibold text-gray-700">
                  {hideBalances ? "••••••" : `₹${portfolio.totalInvested.toLocaleString()}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Returns</p>
                <p className="text-2xl font-semibold text-green-600">
                  {hideBalances ? "••••••" : `+₹${portfolio.totalReturns.toLocaleString()}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Returns %</p>
                <p className="text-2xl font-semibold text-green-600">
                  {hideBalances ? "••••••" : `+${portfolio.returnsPercent}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="explore" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="risk-profile">Risk Profile</TabsTrigger>
          </TabsList>

          {/* Explore Tab */}
          <TabsContent value="explore">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {["stock", "mutual_fund", "bond"].map((type) => (
                <Card key={type} className="border-emerald-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-800 capitalize">
                      {getTypeIcon(type)}
                      {type.replace("_", " ")}s
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {investments
                        .filter((inv) => inv.type === type)
                        .map((investment) => (
                          <div key={investment.id} className="border border-emerald-100 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-emerald-800">{investment.name}</h3>
                                <p className="text-sm text-gray-600">{investment.symbol}</p>
                              </div>
                              <Badge className={getRiskColor(investment.risk)}>{investment.risk}</Badge>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-lg font-semibold text-emerald-800">₹{investment.price}</p>
                                <p
                                  className={`text-sm flex items-center gap-1 ${investment.change >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {investment.change >= 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3" />
                                  )}
                                  {investment.change >= 0 ? "+" : ""}₹{investment.change} (
                                  {investment.changePercent >= 0 ? "+" : ""}
                                  {investment.changePercent}%)
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 mb-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm">{investment.rating}</span>
                                </div>
                                <p className="text-sm text-green-600">+{investment.returns1y}% (1Y)</p>
                              </div>
                            </div>

                            <Button
                              onClick={() => handleInvest(investment)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700"
                              size="sm"
                            >
                              Invest Now
                            </Button>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800">Your Holdings</CardTitle>
                <CardDescription>Investments in your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {investments
                    .filter((inv) => inv.holdings && inv.holdings > 0)
                    .map((investment) => (
                      <div
                        key={investment.id}
                        className="flex items-center justify-between p-4 border border-emerald-100 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            {getTypeIcon(investment.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-emerald-800">{investment.name}</h3>
                            <p className="text-sm text-gray-600">
                              {hideBalances ? "••••••" : `${investment.holdings} units`}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-emerald-800">
                            {hideBalances ? "••••••" : `₹${investment.value?.toLocaleString()}`}
                          </p>
                          <p className={`text-sm ${investment.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {investment.change >= 0 ? "+" : ""}
                            {investment.changePercent}%
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInvest(investment)}
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          Add More
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-emerald-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <Award className="h-5 w-5" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>Best performing investments this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investments
                      .sort((a, b) => b.returns1y - a.returns1y)
                      .slice(0, 3)
                      .map((investment) => (
                        <div
                          key={investment.id}
                          className="flex items-center justify-between p-3 border border-emerald-100 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-emerald-800">{investment.name}</h4>
                            <p className="text-sm text-gray-600">{investment.type.replace("_", " ")}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">+{investment.returns1y}%</p>
                            <Badge className={getRiskColor(investment.risk)} size="sm">
                              {investment.risk}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <Target className="h-5 w-5" />
                    Recommended for You
                  </CardTitle>
                  <CardDescription>Based on your risk profile and goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investments
                      .filter((inv) => inv.risk === "medium")
                      .slice(0, 3)
                      .map((investment) => (
                        <div
                          key={investment.id}
                          className="flex items-center justify-between p-3 border border-emerald-100 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-emerald-800">{investment.name}</h4>
                            <div className="flex items-center gap-2">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600">{investment.rating}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleInvest(investment)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Invest
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Profile Tab */}
          <TabsContent value="risk-profile">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800">Investment Risk Profile</CardTitle>
                <CardDescription>Choose your investment strategy based on risk tolerance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {riskProfiles.map((profile) => (
                    <Card
                      key={profile.type}
                      className={`cursor-pointer transition-all ${
                        selectedRiskProfile === profile.type
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-emerald-200 hover:border-emerald-300"
                      }`}
                      onClick={() => setSelectedRiskProfile(profile.type)}
                    >
                      <CardHeader>
                        <CardTitle className="text-emerald-800">{profile.type}</CardTitle>
                        <CardDescription>{profile.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-2">Asset Allocation</p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Stocks</span>
                                <span>{profile.allocation.stocks}%</span>
                              </div>
                              <Progress value={profile.allocation.stocks} className="h-2" />

                              <div className="flex justify-between text-sm">
                                <span>Bonds</span>
                                <span>{profile.allocation.bonds}%</span>
                              </div>
                              <Progress value={profile.allocation.bonds} className="h-2" />

                              <div className="flex justify-between text-sm">
                                <span>Mutual Funds</span>
                                <span>{profile.allocation.mutualFunds}%</span>
                              </div>
                              <Progress value={profile.allocation.mutualFunds} className="h-2" />
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-gray-600">Expected Return</p>
                              <p className="font-semibold text-emerald-600">{profile.expectedReturn}</p>
                            </div>
                            <Badge className={getRiskColor(profile.risk.toLowerCase())}>{profile.risk} Risk</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-emerald-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-emerald-800 mb-2">Investment Disclaimer</h3>
                      <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                        <li>• Mutual fund investments are subject to market risks</li>
                        <li>• Past performance is not indicative of future results</li>
                        <li>• Please read all scheme related documents carefully</li>
                        <li>• Diversification does not guarantee profits or protect against losses</li>
                        <li>• Consider your financial goals and risk tolerance before investing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Investment Modal */}
      {selectedInvestment && !showBiometric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-800">Invest in {selectedInvestment.name}</CardTitle>
              <CardDescription>Current price: ₹{selectedInvestment.price.toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Investment Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Enter amount to invest"
                  className="border-emerald-200"
                />
              </div>

              {investmentAmount && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Investment Amount:</span>
                    <span className="font-semibold text-emerald-800">
                      ₹{Number.parseFloat(investmentAmount).toLocaleString()}
                    </span>
                  </div>
                  {selectedInvestment.type !== "mutual_fund" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Units:</span>
                      <span className="font-semibold text-emerald-800">
                        {(Number.parseFloat(investmentAmount) / selectedInvestment.price).toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedInvestment(null)}
                  className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowBiometric(true)}
                  disabled={!investmentAmount || Number.parseFloat(investmentAmount) <= 0}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
