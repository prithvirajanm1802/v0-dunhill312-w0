"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Fingerprint, Loader2 } from "lucide-react"
import { registerPasskey } from "@/lib/fingerprint-auth"
import { toast } from "@/hooks/use-toast"

type Props = {
  userId: string
  userName: string
  className?: string
  onRegistered?: () => void
}

export default function FingerprintPasskeySetup({ userId, userName, className, onRegistered }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    try {
      const wasDone = localStorage.getItem(`honeydrew_passkey_registered_${userId}`) === "1"
      if (wasDone) setDone(true)
    } catch {}
  }, [userId])

  const onRegister = async () => {
    setIsLoading(true)
    try {
      const res = await registerPasskey(userId, userName)
      if (res.success) {
        setDone(true)
        try {
          localStorage.setItem(`honeydrew_passkey_registered_${userId}`, "1")
          const biometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")
          biometricData[userId] = { ...(biometricData[userId] || {}), passkey: true }
          localStorage.setItem("biometricData", JSON.stringify(biometricData))
        } catch {}
        onRegistered?.()
        toast({ title: "Passkey registered", description: "Your device passkey is now linked to your account." })
      } else {
        toast({ title: "Failed to register", description: res.message, variant: "destructive" })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Fingerprint className="h-6 w-6 text-emerald-600" />
          <div>
            <p className="font-medium">Fingerprint with Device Passkey</p>
            <p className="text-xs text-muted-foreground">
              Uses your device&apos;s secure biometric (Face/Touch ID, Windows Hello).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {done && <CheckCircle className="h-5 w-5 text-emerald-600" />}
          <Button onClick={onRegister} disabled={isLoading || done} className="bg-emerald-600 hover:bg-emerald-700">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" /> Registering...
              </>
            ) : done ? (
              "Registered"
            ) : (
              "Register"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
