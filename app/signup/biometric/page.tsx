"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Fingerprint } from "lucide-react"
import FingerprintPasskeySetup from "@/components/fingerprint-passkey-setup"

export default function BiometricSignupPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; phone: string } | null>(null)
  const [passkeyDone, setPasskeyDone] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pendingSignup")
      if (raw) setUser(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    if (!user?.email) return
    try {
      const pass = localStorage.getItem(`honeydrew_passkey_registered_${user.email}`) === "1"
      if (pass) setPasskeyDone(true)
    } catch {}
  }, [user])

  useEffect(() => {
    if (passkeyDone) {
      router.replace("/dashboard")
    }
  }, [passkeyDone, router])

  return (
    <main className="min-h-[70vh] p-4">
      <div className="mx-auto flex max-w-lg justify-center">
        <Card className="border-2 w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="size-5 text-primary animate-pulse" />
              Fingerprint / Passkey Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FingerprintPasskeySetup
              userId={user?.email || "pending_user"}
              userName={user?.name || user?.email || "user"}
              onRegistered={() => setPasskeyDone(true)}
            />
            <p className={`mt-2 text-sm ${passkeyDone ? "text-primary" : "text-muted-foreground"}`}>
              {passkeyDone ? "Passkey registered" : "Register your device's fingerprint/passkey"}
            </p>
            <Button
              variant="outline"
              className="mt-2 bg-transparent"
              onClick={() => setPasskeyDone(true)}
              disabled={passkeyDone}
            >
              I've completed passkey registration
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto mt-6 flex max-w-lg justify-end">
        <Button disabled={!passkeyDone} onClick={() => router.replace("/dashboard")}>
          Finish and go to dashboard
        </Button>
      </div>
    </main>
  )
}
