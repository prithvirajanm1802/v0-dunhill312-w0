"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Fingerprint, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { FingerprintAuth } from "@/components/fingerprint-auth"

export default function FingerprintLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleFingerprintSuccess = async () => {
    setLoading(true)
    try {
      // Simulate biometric verification delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSuccess(true)

      // Log successful fingerprint login
      const adminLogs = JSON.parse(localStorage.getItem("adminLogs") || "[]")
      adminLogs.push({
        timestamp: Date.now(),
        type: "auth",
        action: "fingerprint_login_success",
        success: true,
        details: {
          method: "fingerprint",
          loginTime: new Date().toISOString(),
          platform: "Honeydrew Mills",
        },
      })
      localStorage.setItem("adminLogs", JSON.stringify(adminLogs))

      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (err: any) {
      setError(err?.message || "Fingerprint verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleFingerprintError = (message: string) => {
    setError(message)
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card dark:bg-slate-900 border-border dark:border-slate-800">
        <CardHeader>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="mb-4 w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
          <CardTitle className="text-2xl font-bold text-foreground dark:text-slate-100">Fingerprint Login</CardTitle>
          <CardDescription className="text-foreground/60 dark:text-slate-400">
            Authenticate using your registered fingerprint
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <div className="text-center py-8">
              <div className="rounded-full bg-green-100 dark:bg-green-900 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Fingerprint className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">Fingerprint Verified</h3>
              <p className="text-sm text-foreground/60 dark:text-slate-400">Logging you in...</p>
            </div>
          )}

          {!success && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Place your registered finger on the sensor and keep it steady until verification completes.
                </p>
              </div>

              <div className="border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg p-6 bg-green-50/50 dark:bg-slate-800 flex justify-center">
                <div className="text-center">
                  <Fingerprint className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4 animate-pulse" />
                  <p className="text-sm text-foreground/60 dark:text-slate-400">Waiting for fingerprint...</p>
                </div>
              </div>

              <FingerprintAuth
                onSuccess={handleFingerprintSuccess}
                onError={handleFingerprintError}
                userId="fingerprint_login_user"
                userName="Fingerprint Login"
                mode="verify"
              />

              <Button
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4 mr-2" />
                    Verify with Fingerprint
                  </>
                )}
              </Button>

              <Button variant="outline" className="w-full dark:border-slate-700 dark:text-slate-200 bg-transparent">
                <Link href="/login" className="w-full">
                  Use Password Instead
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
