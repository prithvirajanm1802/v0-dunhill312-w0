"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

// Mock loan products
const loanProducts = [
  {
    id: "personal",
    name: "Personal Loan",
    interestRate: "10.99%",
    maxAmount: 500000,
    tenure: "Up to 5 years",
    description: "Quick personal loans for your needs with minimal documentation",
    eligibility: "Salaried individuals with minimum income of ₹25,000 per month",
  },
  {
    id: "business",
    name: "Business Loan",
    interestRate: "12.50%",
    maxAmount: 2000000,
    tenure: "Up to 7 years",
    description: "Grow your business with flexible business loans",
    eligibility: "Business owners with 2+ years of business operation",
  },
  {
    id: "education",
    name: "Education Loan",
    interestRate: "8.75%",
    maxAmount: 1000000,
    tenure: "Up to 10 years",
    description: "Fund your education with affordable education loans",
    eligibility: "Students admitted to recognized institutions",
  },
  {
    id: "home",
    name: "Home Loan",
    interestRate: "7.50%",
    maxAmount: 5000000,
    tenure: "Up to 20 years",
    description: "Realize your dream of owning a home",
    eligibility: "Salaried individuals with minimum income of ₹40,000 per month",
  },
]

export default function LoansPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("explore")
  const [selectedLoan, setSelectedLoan] = useState<any>(null)
  const [loanAmount, setLoanAmount] = useState(100000)
  const [loanTenure, setLoanTenure] = useState(24)
  const [step, setStep] = useState(1)

  const handleSelectLoan = (loan: any) => {
    setSelectedLoan(loan)
    setActiveTab("calculator")
  }

  const handleApplyLoan = () => {
    toast({
      title: "Loan Application Submitted",
      description: "We'll review your application and get back to you soon.",
    })
    setStep(2)
  }

  // Calculate EMI
  const calculateEMI = () => {
    const principal = loanAmount
    const ratePerMonth = Number.parseFloat(selectedLoan?.interestRate) / 12 / 100
    const tenureInMonths = loanTenure

    const emi =
      (principal * ratePerMonth * Math.pow(1 + ratePerMonth, tenureInMonths)) /
      (Math.pow(1 + ratePerMonth, tenureInMonths) - 1)

    return Math.round(emi)
  }

  const emi = selectedLoan ? calculateEMI() : 0
  const totalAmount = emi * loanTenure
  const interestAmount = totalAmount - loanAmount

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Loans</h1>
      </div>

      {step === 1 ? (
        <Tabs defaultValue="explore" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="explore">Explore Loans</TabsTrigger>
            <TabsTrigger value="calculator" disabled={!selectedLoan}>
              Loan Calculator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explore">
            <div className="space-y-4">
              {loanProducts.map((loan) => (
                <Card key={loan.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4" onClick={() => handleSelectLoan(loan)}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{loan.name}</h3>
                        <p className="text-sm text-gray-500">{loan.description}</p>
                      </div>
                      <div className="bg-green-100 p-2 rounded-full">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                      <div>
                        <p className="text-gray-500">Interest Rate</p>
                        <p className="font-medium">{loan.interestRate}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Max Amount</p>
                        <p className="font-medium">₹{loan.maxAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tenure</p>
                        <p className="font-medium">{loan.tenure}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Eligibility</p>
                        <p className="font-medium truncate">{loan.eligibility.substring(0, 20)}...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calculator">
            {selectedLoan && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedLoan.name} Calculator</CardTitle>
                  <CardDescription>Calculate your EMI and apply for a loan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="loan-amount">Loan Amount</Label>
                      <span className="text-sm font-medium">₹{loanAmount.toLocaleString()}</span>
                    </div>
                    <Slider
                      id="loan-amount"
                      min={10000}
                      max={selectedLoan.maxAmount}
                      step={10000}
                      value={[loanAmount]}
                      onValueChange={(value) => setLoanAmount(value[0])}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>₹10,000</span>
                      <span>₹{selectedLoan.maxAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="loan-tenure">Loan Tenure (months)</Label>
                      <span className="text-sm font-medium">{loanTenure} months</span>
                    </div>
                    <Slider
                      id="loan-tenure"
                      min={6}
                      max={60}
                      step={6}
                      value={[loanTenure]}
                      onValueChange={(value) => setLoanTenure(value[0])}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>6 months</span>
                      <span>60 months</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-500">Monthly EMI</span>
                      <span className="text-xl font-bold">₹{emi.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Principal</p>
                        <p className="font-medium">₹{loanAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Interest Amount</p>
                        <p className="font-medium">₹{interestAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Amount</p>
                        <p className="font-medium">₹{totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Interest Rate</p>
                        <p className="font-medium">{selectedLoan.interestRate}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={handleApplyLoan}>
                    Apply for Loan
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Application Submitted</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-1">Loan Application Received</h3>
            <p className="text-gray-500 text-center mb-4">
              We've received your application for a {selectedLoan?.name}. Our team will review it and get back to you
              within 24-48 hours.
            </p>
            <div className="bg-gray-50 w-full p-4 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Loan Type</span>
                <span className="font-medium">{selectedLoan?.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Loan Amount</span>
                <span className="font-medium">₹{loanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Tenure</span>
                <span className="font-medium">{loanTenure} months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly EMI</span>
                <span className="font-medium">₹{emi.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard" className="w-full">
              <Button className="w-full">Back to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
