"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Smartphone, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const operators = [
  { id: "jio", name: "Jio", color: "#0066FF", icon: "📱" },
  { id: "airtel", name: "Airtel", color: "#EF1D25", icon: "📡" },
  { id: "vi", name: "VI", color: "#E60000", icon: "📲" },
  { id: "bsnl", name: "BSNL", color: "#FF6B00", icon: "📞" },
]

const plans: Record<string, any[]> = {
  jio: [
    { name: "JIO 50 (1.5 GB/day)", price: 249, validity: "28 days" },
    { name: "JIO 100 (2 GB/day)", price: 599, validity: "28 days" },
    { name: "JIO 150 (3 GB/day)", price: 899, validity: "28 days" },
  ],
  airtel: [
    { name: "Basic 50", price: 249, validity: "28 days" },
    { name: "Plus 99", price: 599, validity: "28 days" },
    { name: "Premium 199", price: 899, validity: "28 days" },
  ],
  vi: [
    { name: "Starting 49", price: 249, validity: "28 days" },
    { name: "Core 79", price: 599, validity: "28 days" },
    { name: "Prime 129", price: 899, validity: "28 days" },
  ],
  bsnl: [
    { name: "BSNL 50", price: 249, validity: "28 days" },
    { name: "BSNL 100", price: 599, validity: "28 days" },
    { name: "BSNL 200", price: 899, validity: "28 days" },
  ],
}

export default function MobileOperatorsPage() {
  const { toast } = useToast()
  const [selectedOperator, setSelectedOperator] = useState("jio")
  const [selectedPlan, setSelectedPlan] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")

  const handleRecharge = () => {
    if (!mobileNumber || !selectedPlan) {
      toast({
        title: "Missing Information",
        description: "Please enter mobile number and select a plan",
        variant: "destructive",
      })
      return
    }

    const plan = plans[selectedOperator].find((p) => p.name === selectedPlan)

    toast({
      title: "Recharge Initiated",
      description: `${selectedPlan} for ${mobileNumber} - Rs. ${plan?.price}`,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="border-emerald-200 hover:bg-emerald-50 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">Mobile Recharge</h1>
            <p className="text-gray-600 dark:text-slate-400">Recharge all operators instantly</p>
          </div>
        </div>

        <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
              <Smartphone className="h-5 w-5" />
              Select Operator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {operators.map((op) => (
                <div
                  key={op.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                    selectedOperator === op.id
                      ? "border-emerald-600 bg-emerald-50 dark:bg-slate-800"
                      : "border-emerald-200 dark:border-slate-700 hover:border-emerald-400"
                  }`}
                  onClick={() => setSelectedOperator(op.id)}
                >
                  <div className="text-3xl mb-2">{op.icon}</div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-300">{op.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
              <Zap className="h-5 w-5" />
              Mobile Number
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile" className="dark:text-slate-300">
                10-digit Mobile Number
              </Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="98765 43210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength="10"
                className="border-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
              <Smartphone className="h-5 w-5" />
              Available Plans
            </CardTitle>
            <CardDescription>
              Popular recharge plans for {operators.find((o) => o.id === selectedOperator)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {plans[selectedOperator]?.map((plan, idx) => (
              <div
                key={idx}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPlan === plan.name
                    ? "border-emerald-600 bg-emerald-50 dark:bg-slate-800"
                    : "border-emerald-200 dark:border-slate-700 hover:border-emerald-400"
                }`}
                onClick={() => setSelectedPlan(plan.name)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">{plan.name}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Validity: {plan.validity}</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Rs. {plan.price}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button
          onClick={handleRecharge}
          className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          disabled={!mobileNumber || !selectedPlan}
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  )
}
