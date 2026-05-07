"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Fingerprint, Camera, ShieldCheck, ShieldAlert, Info, CheckCircle2, XCircle } from "lucide-react"
import { checkDeviceCompatibility, getCompatibilityMessage } from "@/lib/device-compatibility"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { EducationalTooltip } from "./educational-tooltip"

interface DeviceCompatibilityCheckerProps {
  onCompatibilityCheck?: (isCompatible: boolean) => void
  showDetailed?: boolean
}

export function DeviceCompatibilityChecker({
  onCompatibilityCheck,
  showDetailed = false,
}: DeviceCompatibilityCheckerProps) {
  const [compatibility, setCompatibility] = useState<{
    webAuthnSupported: boolean
    fingerprintSupported: boolean
    cameraAvailable: boolean
    cameraPermissionGranted: boolean
    isFullyCompatible: boolean
    partiallyCompatible: boolean
  } | null>(null)

  const [message, setMessage] = useState<{
    title: string
    message: string
    severity: "success" | "warning" | "error" | "info"
  } | null>(null)

  const [isChecking, setIsChecking] = useState(false)

  const checkCompatibility = async () => {
    setIsChecking(true)
    try {
      const compatibilityResult = await checkDeviceCompatibility()
      setCompatibility(compatibilityResult)

      const messageResult = await getCompatibilityMessage()
      setMessage(messageResult)

      if (onCompatibilityCheck) {
        onCompatibilityCheck(compatibilityResult.partiallyCompatible)
      }
    } catch (error) {
      console.error("Error checking device compatibility:", error)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkCompatibility()
  }, [])

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "success":
        return <CheckCircle2 className="h-5 w-5" />
      case "warning":
        return <ShieldAlert className="h-5 w-5" />
      case "error":
        return <XCircle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  if (!compatibility || !message) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="h-2 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Alert variant={message.severity as any}>
        <div className="flex items-start">
          {getAlertIcon(message.severity)}
          <div className="ml-3">
            <AlertTitle>{message.title}</AlertTitle>
            <AlertDescription>{message.message}</AlertDescription>
          </div>
        </div>
      </Alert>

      {showDetailed && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="detailed-compatibility">
            <AccordionTrigger className="text-sm font-medium">View Detailed Compatibility Report</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    <span>WebAuthn Support</span>
                    <EducationalTooltip content="WebAuthn is a web standard for strong authentication. It's required for secure biometric authentication." />
                  </div>
                  {getStatusIcon(compatibility.webAuthnSupported)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Fingerprint className="h-4 w-4 mr-2" />
                    <span>Fingerprint Sensor</span>
                    <EducationalTooltip content="A fingerprint sensor allows you to authenticate using your fingerprint instead of a password." />
                  </div>
                  {getStatusIcon(compatibility.fingerprintSupported)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Camera className="h-4 w-4 mr-2" />
                    <span>Camera Available</span>
                    <EducationalTooltip content="A camera is required for facial recognition authentication." />
                  </div>
                  {getStatusIcon(compatibility.cameraAvailable)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Camera className="h-4 w-4 mr-2" />
                    <span>Camera Permission</span>
                    <EducationalTooltip content="Permission to access your camera is required for facial recognition." />
                  </div>
                  {getStatusIcon(compatibility.cameraPermissionGranted)}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={checkCompatibility} disabled={isChecking}>
          {isChecking ? "Checking..." : "Recheck Compatibility"}
        </Button>
      </div>
    </div>
  )
}
