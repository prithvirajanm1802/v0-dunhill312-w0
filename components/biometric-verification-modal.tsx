"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { verifyPasskey } from "@/lib/fingerprint-auth"

export type BiometricVerificationModalProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  isOpen?: boolean
  onClose?: () => void
  userId: string
  title?: string
  description?: string
  onSuccess?: () => void // new
}

export function BiometricVerificationModal({
  open,
  onOpenChange,
  isOpen,
  onClose,
  userId,
  title = "Confirm it’s you",
  description = "For your security, verify with your device passkey.",
  onSuccess,
}: BiometricVerificationModalProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)

  const onVerify = async () => {
    setLoading(true)
    setStatus("idle")
    setMessage(null)
    try {
      const res = await verifyPasskey(userId)
      if (res.success) {
        setStatus("ok")
        setMessage("Verified successfully.")
        setTimeout(() => {
          onOpenChange?.(false)
          onSuccess?.()
        }, 400)
      } else {
        setStatus("error")
        setMessage(res.message || "Verification failed.")
      }
    } catch (e: any) {
      setStatus("error")
      setMessage(e?.message || "Verification failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open ?? isOpen ?? false}
      onOpenChange={(v) => {
        onOpenChange?.(v)
        if (!v) onClose?.()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Button onClick={onVerify} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {"Verifying..."}
              </>
            ) : (
              "Verify with Passkey"
            )}
          </Button>

          {status === "ok" && (
            <p className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </p>
          )}
          {status === "error" && (
            <p className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="h-4 w-4" />
              {message}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BiometricVerificationModal
