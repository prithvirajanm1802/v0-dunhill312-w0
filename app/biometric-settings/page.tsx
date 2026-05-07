"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Fingerprint, Shield, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BiometricAuth } from "@/components/biometric-auth"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

export default function BiometricSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [biometricData, setBiometricData] = useState<any>(null)
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false)
  const [securityLevel, setSecurityLevel] = useState<"low" | "medium" | "high">("medium")
  const [isReregistering, setIsReregistering] = useState<"fingerprint" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user data and biometric settings
  useEffect(() => {
    const loadUserData = () => {
      try {
        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem("currentUser") || "null")
        if (!user) {
          router.push("/login")
          return
        }
        setCurrentUser(user)

        // Get biometric data for the user
        const allBiometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")
        const userBiometricData = allBiometricData[user.id] || null

        if (userBiometricData) {
          setBiometricData(userBiometricData)
          setFingerprintEnabled(userBiometricData.fingerprint || false)
          setSecurityLevel(userBiometricData.securityLevel || "medium")
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        setError("Failed to load biometric settings. Please try again.")
      }
    }

    loadUserData()
  }, [router])

  // Handle toggling fingerprint authentication
  const handleToggleFingerprint = async (enabled: boolean) => {
    if (!currentUser) return

    if (enabled && !biometricData?.fingerprint) {
      // Need to register fingerprint
      setIsReregistering("fingerprint")
      return
    }

    setIsLoading(true)
    try {
      // Update biometric data
      const allBiometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")

      if (!allBiometricData[currentUser.id]) {
        allBiometricData[currentUser.id] = {
          userId: currentUser.id,
          fingerprint: enabled,
          securityLevel,
        }
      } else {
        allBiometricData[currentUser.id].fingerprint = enabled
      }

      localStorage.setItem("biometricData", JSON.stringify(allBiometricData))

      // Update state
      setBiometricData(allBiometricData[currentUser.id])
      setFingerprintEnabled(enabled)

      toast({
        title: enabled ? "Fingerprint Enabled" : "Fingerprint Disabled",
        description: enabled
          ? "You can now use fingerprint authentication to sign in"
          : "Fingerprint authentication has been disabled",
      })
    } catch (error) {
      console.error("Error updating fingerprint settings:", error)
      setError("Failed to update fingerprint settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle changing security level
  const handleChangeSecurityLevel = async (level: "low" | "medium" | "high") => {
    if (!currentUser) return

    setIsLoading(true)
    try {
      // Update biometric data
      const allBiometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")

      if (!allBiometricData[currentUser.id]) {
        allBiometricData[currentUser.id] = {
          userId: currentUser.id,
          fingerprint: fingerprintEnabled,
          securityLevel: level,
        }
      } else {
        allBiometricData[currentUser.id].securityLevel = level
      }

      localStorage.setItem("biometricData", JSON.stringify(allBiometricData))

      // Update state
      setBiometricData(allBiometricData[currentUser.id])
      setSecurityLevel(level)

      toast({
        title: "Security Level Updated",
        description: `Biometric security level set to ${level}`,
      })
    } catch (error) {
      console.error("Error updating security level:", error)
      setError("Failed to update security level. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle biometric registration completion
  const handleBiometricRegistered = (type: "fingerprint") => {
    setFingerprintEnabled(true)
    setIsReregistering(null)

    toast({
      title: "Fingerprint Registered",
      description: "Your fingerprint has been successfully registered",
    })
  }

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Biometric Settings</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isReregistering ? (
        <Card>
          <CardHeader>
            <CardTitle>Register Fingerprint</CardTitle>
            <CardDescription>Please complete the biometric registration process</CardDescription>
          </CardHeader>
          <CardContent>
            <BiometricAuth
              onFingerprint={() => handleBiometricRegistered("fingerprint")}
              isRegistration={true}
              userId={currentUser?.id}
              requireBoth={false}
            />
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full bg-transparent" onClick={() => setIsReregistering(null)}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" /> Biometric Authentication
              </CardTitle>
              <CardDescription>Manage your biometric authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Fingerprint Authentication</p>
                    <p className="text-sm text-gray-500">
                      {fingerprintEnabled
                        ? "Enabled - You can sign in with your fingerprint"
                        : "Disabled - Enable to sign in with your fingerprint"}
                    </p>
                  </div>
                </div>
                <Switch checked={fingerprintEnabled} onCheckedChange={handleToggleFingerprint} disabled={isLoading} />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" /> Security Level
              </CardTitle>
              <CardDescription>Adjust the security level for biometric authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Higher security levels provide more thorough verification but may take longer to process.
                </p>

                <div className="flex gap-2">
                  <Button
                    variant={securityLevel === "low" ? "default" : "outline"}
                    size="sm"
                    className={securityLevel === "low" ? "bg-green-600" : ""}
                    onClick={() => handleChangeSecurityLevel("low")}
                    disabled={isLoading}
                  >
                    Basic
                  </Button>
                  <Button
                    variant={securityLevel === "medium" ? "default" : "outline"}
                    size="sm"
                    className={securityLevel === "medium" ? "bg-blue-600" : ""}
                    onClick={() => handleChangeSecurityLevel("medium")}
                    disabled={isLoading}
                  >
                    Standard
                  </Button>
                  <Button
                    variant={securityLevel === "high" ? "default" : "outline"}
                    size="sm"
                    className={securityLevel === "high" ? "bg-purple-600" : ""}
                    onClick={() => handleChangeSecurityLevel("high")}
                    disabled={isLoading}
                  >
                    High
                  </Button>
                </div>

                <div className="text-sm text-gray-500 mt-2">
                  {securityLevel === "low"
                    ? "Basic: Faster verification with fewer scan points"
                    : securityLevel === "medium"
                      ? "Standard: Balanced security and convenience"
                      : "High: Maximum security with thorough scanning"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-orange-600" /> Re-register Biometrics
              </CardTitle>
              <CardDescription>Re-register your biometric data if you're having issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsReregistering("fingerprint")}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Fingerprint className="h-4 w-4" />
                  Re-register Fingerprint
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
