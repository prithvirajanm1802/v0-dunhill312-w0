"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Fingerprint, Shield, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BiometricAuth } from "@/components/biometric-auth"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

export default function BiometricRecoveryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [mobile, setMobile] = useState("")
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [recoverySuccess, setRecoverySuccess] = useState(false)

  // Handle verification of user credentials
  const handleVerifyCredentials = () => {
    if (!username || !password || !mobile) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]")

      // Find user by username, password and mobile
      const user = users.find((u: any) => u.username === username && u.password === password && u.mobile === mobile)

      if (user) {
        setUserId(user.id)
        setStep(2)

        toast({
          title: "Verification Successful",
          description: "Please register your biometric data",
        })
      } else {
        setError("Invalid credentials. Please check and try again.")
      }
    } catch (error) {
      console.error("Error verifying credentials:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle biometric registration completion
  const handleBiometricRegistered = () => {
    setIsLoading(true)

    try {
      // Update biometric data in localStorage
      const allBiometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")

      if (userId && allBiometricData[userId]) {
        // Update existing biometric data
        allBiometricData[userId].fingerprint = true
        allBiometricData[userId].face = true
      } else if (userId) {
        // Create new biometric data
        allBiometricData[userId] = {
          userId,
          fingerprint: true,
          face: true,
          securityLevel: "medium",
          fingerprintData: `fp_${userId}_${Date.now()}_secure`,
          faceData: `face_${userId}_${Date.now()}_secure`,
        }
      }

      localStorage.setItem("biometricData", JSON.stringify(allBiometricData))

      // Show success message
      toast({
        title: "Biometric Recovery Successful",
        description: "Your biometric data has been successfully registered",
      })

      setRecoverySuccess(true)

      // Redirect to login page after a delay
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error) {
      console.error("Error registering biometric data:", error)
      setError("Failed to register biometric data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link href="/login">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Biometric Recovery</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {recoverySuccess ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" /> Recovery Successful
              </CardTitle>
              <CardDescription>Your biometric data has been successfully recovered</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Recovery Complete!</h3>
              <p className="text-center text-gray-500 mb-4">
                You can now use biometric authentication to sign in to your account.
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                  className="bg-green-600 h-2 rounded-full"
                ></motion.div>
              </div>
              <p className="text-sm text-gray-500">Redirecting to login page...</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" /> Verify Your Identity
            </CardTitle>
            <CardDescription>Enter your account details to recover biometric access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleVerifyCredentials} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                "Verify Identity"
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-blue-600" /> Register Biometrics
            </CardTitle>
            <CardDescription>Register your biometric data to recover access</CardDescription>
          </CardHeader>
          <CardContent>
            <BiometricAuth
              onFingerprint={handleBiometricRegistered}
              onFaceId={handleBiometricRegistered}
              isRegistration={true}
              userId={userId || undefined}
              requireBoth={true}
              onBothComplete={handleBiometricRegistered}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
