"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function CibilScorePage() {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState("")
  const [dob, setDob] = useState("")
  const [pan, setPan] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [score, setScore] = useState(0)

  const handleCheckScore = () => {
    if (!fullName || !dob || !pan) {
      toast({
        title: "Missing Information",
        description: "Please fill all the required fields.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Simulate API call to get CIBIL score
    setTimeout(() => {
      setIsLoading(false)
      // Generate a random score between 300 and 900
      const randomScore = Math.floor(Math.random() * (900 - 300 + 1)) + 300
      setScore(randomScore)
      setStep(2)
    }, 2000)
  }

  const getScoreColor = () => {
    if (score >= 750) return "text-green-600"
    if (score >= 650) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreCategory = () => {
    if (score >= 750) return "Excellent"
    if (score >= 650) return "Good"
    if (score >= 550) return "Fair"
    return "Poor"
  }

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">CIBIL Score</h1>
      </div>

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Check Your CIBIL Score</CardTitle>
            <CardDescription>Enter your details to check your credit score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan">PAN Number</Label>
              <Input
                id="pan"
                placeholder="Enter your PAN number"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleCheckScore} disabled={isLoading}>
              {isLoading ? "Checking..." : "Check Score"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your CIBIL Score</CardTitle>
            <CardDescription>Based on your credit history</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium mb-1">Credit Score</h3>
            <p className={`text-4xl font-bold mb-2 ${getScoreColor()}`}>{score}</p>
            <p className="text-gray-500 mb-4">Your score is {getScoreCategory()}</p>

            <div className="bg-gray-50 w-full p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">What does this mean?</span>
              </div>
              <p className="text-sm text-gray-500">
                Your CIBIL score is a three-digit number that represents your creditworthiness. A higher score indicates
                better credit health and increases your chances of loan approval.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button className="w-full" onClick={() => setStep(1)}>
              Check Again
            </Button>
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
