"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, User, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { registerPasskey } from "@/lib/fingerprint-auth"
import { validatePassword, validatePasswordMatch } from "@/lib/password-validator"
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator"
import { HoneydrewLogo } from "@/components/honeydrew-logo"
import {
  getPasskeyCompatibility,
  formatPasskeyError,
  getBrowserPasskeyRecommendation,
} from "@/lib/google-passkey-utils"

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [passkeyDone, setPasskeyDone] = useState(false)
  const [passkeySupported, setPasskeySupported] = useState(true)

  const passwordStrength = validatePassword(password)
  const passwordMatchError = validatePasswordMatch(password, confirmPassword)
  const passkeyCompat = getPasskeyCompatibility()
  const browserRec = getBrowserPasskeyRecommendation()

  const checkDuplicates = async (emailToCheck: string, phoneToCheck: string): Promise<string | null> => {
    const normalizedEmail = emailToCheck.trim().toLowerCase()
    const normalizedPhone = phoneToCheck.trim()

    const existingUsers = JSON.parse(localStorage.getItem("honeydrew_users") || "[]")

    const emailExists = existingUsers.some((u: any) => u.email?.toLowerCase() === normalizedEmail)
    if (emailExists) {
      return "An account with this email already exists. Please use a different email or login."
    }

    const phoneExists = existingUsers.some((u: any) => u.phone === normalizedPhone || u.mobile === normalizedPhone)
    if (phoneExists) {
      return "An account with this phone number already exists. Please use a different number or login."
    }

    try {
      const response = await fetch("/api/users/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, mobile: normalizedPhone }),
      })
      const result = await response.json()

      if (result.emailExists) {
        return "An account with this email already exists. Please use a different email or login."
      }
      if (result.mobileExists) {
        return "An account with this phone number already exists. Please use a different number or login."
      }
    } catch (dbError) {
      console.warn("[v0] Database duplicate check failed, using local only:", dbError)
    }

    return null
  }

  const validate = () => {
    const e = email.trim().toLowerCase()
    const n = name.trim()
    const p = phone.trim()

    if (!e || !/^\S+@\S+\.\S+$/.test(e)) return "Please enter a valid email."
    if (!n || n.length < 2) return "Please enter your full name."
    if (!p || !/^[0-9]{10,15}$/.test(p)) return "Please enter a valid phone number."

    if (!passwordStrength.isValid) return "Please meet all password requirements."
    if (passwordMatchError) return passwordMatchError

    return null
  }

  const handleBegin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const v = validate()
    if (v) {
      setLoading(false)
      return setError(v)
    }

    const duplicateError = await checkDuplicates(email, phone)
    if (duplicateError) {
      setLoading(false)
      return setError(duplicateError)
    }

    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const pending = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: password,
    }
    try {
      localStorage.setItem("pendingSignup", JSON.stringify(pending))
    } catch {}

    setUserId(newUserId)
    setStep(2)
    setLoading(false)
  }

  const finalize = async () => {
    setLoading(true)
    setError(null)

    try {
      let fingerprintData = null

      if (userId) {
        const res = await registerPasskey(userId, name || email, true)

        if (!res.success) {
          const friendlyError = formatPasskeyError(res.message)
          setError(`${friendlyError} Please use a device with biometric authentication or try again.`)
          setLoading(false)
          return
        }

        fingerprintData = res.credential
          ? {
              credentialId: res.credential.id,
              publicKey: res.credential.publicKey,
              deviceType: passkeyCompat.browser,
            }
          : null
      }

      setPasskeyDone(true)

      try {
        const response = await fetch("/api/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: name.trim(),
            email: email.trim().toLowerCase(),
            mobile: phone.trim(),
            password: password,
            fingerprintData,
          }),
        })

        const result = await response.json()

        if (result.success && result.user) {
          const dbUser = result.user

          const newUser = {
            id: dbUser.id,
            name: dbUser.fullName,
            fullName: dbUser.fullName,
            email: dbUser.email,
            phone: dbUser.mobile,
            mobile: dbUser.mobile,
            balance: dbUser.balance || 10000,
            isActive: true,
            createdAt: Date.now().toString(),
            lastLogin: Date.now().toString(),
            biometricEnabled: true,
            fingerprintRegistered: true,
            password: password,
            passkeySupported,
          }

          const localUsers = JSON.parse(localStorage.getItem("honeydrew_users") || "[]")
          const existingIndex = localUsers.findIndex((u: any) => u.id === newUser.id)
          if (existingIndex >= 0) {
            localUsers[existingIndex] = newUser
          } else {
            localUsers.push(newUser)
          }
          localStorage.setItem("honeydrew_users", JSON.stringify(localUsers))
          localStorage.setItem("honeydrew_current_user", JSON.stringify(newUser))
          localStorage.setItem("currentUser", JSON.stringify(newUser))

          try {
            await fetch("/api/admin/logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                adminId: "system",
                actionType: "user_signup",
                resourceType: "user",
                resourceId: newUser.id,
                severity: "low",
                details: {
                  email: newUser.email,
                  name: newUser.name,
                  mobile: newUser.mobile,
                  fingerprint: true,
                  passkeyType: passkeyCompat.isGooglePasskey ? "Google Passkey" : "WebAuthn",
                  browser: passkeyCompat.browser,
                  platform: "Honeydrew Mills",
                  deviceInfo: navigator.userAgent,
                  signupTime: new Date().toISOString(),
                },
              }),
            })
          } catch (logError) {
            console.warn("[v0] Failed to log admin activity:", logError)
          }

          router.push("/dashboard")
        } else {
          setError(result.error || "Registration failed. Please try again.")
        }
      } catch (dbError: any) {
        console.error("[v0] Database registration failed:", dbError)
        setError("Registration failed. Please check your connection and try again.")
      }
    } catch (e: any) {
      const friendlyError = formatPasskeyError(e)
      setError(friendlyError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <HoneydrewLogo size="md" showAdminCrown={true} />
          </div>
          <CardTitle className="text-center text-foreground">Sign up to Honeydrew Mills</CardTitle>
          <CardDescription className="text-center">
            {step === 1 ? "Step 1: Create Account" : "Step 2: Register Passkey"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && !userId && (
            <form onSubmit={handleBegin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">
                  Full name
                </Label>
                <div className="relative">
                  <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-8 bg-background text-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">
                  Phone number
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    inputMode="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 15))}
                    className="bg-background text-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-8 bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 bg-background text-foreground"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <PasswordStrengthIndicator strength={passwordStrength} password={password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 bg-background text-foreground"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {confirmPassword && (
                  <p
                    className={`text-sm ${passwordMatchError ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                  >
                    {passwordMatchError ? passwordMatchError : "Passwords match"}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Next: Register Passkey"
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <a href="/login" className="text-emerald-600 hover:underline">
                  Login
                </a>
              </p>
            </form>
          )}

          {step === 2 && userId && !passkeyDone && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Your device will open Google Password Manager (Android) or iCloud Keychain (iPhone) to save your
                  passkey. Complete the biometric registration to continue.
                </AlertDescription>
              </Alert>

              <Button
                onClick={finalize}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering Passkey...
                  </>
                ) : (
                  "Start Biometric Registration"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                This step is required to secure your account. Passkeys are stored on your device only.
              </p>
            </div>
          )}

          {loading && passkeyDone && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">Creating your account...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
