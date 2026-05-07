"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Fingerprint, Scan, Info, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BiometricSecurityTooltip } from "./educational-tooltip"

interface BiometricFallbackProps {
  mode: "register" | "verify"
  isSimulated?: boolean
  onToggleSimulation?: () => void
  onComplete?: () => void
}

export function BiometricFallback({
  mode,
  isSimulated = true,
  onToggleSimulation,
  onComplete,
}: BiometricFallbackProps) {
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleComplete = () => {
    setLoading(true)

    // Simulate processing
    setTimeout(() => {
      setSuccess(true)
      setLoading(false)

      // Call the onComplete callback after a short delay
      if (onComplete) {
        setTimeout(onComplete, 1000)
      }
    }, 1500)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === "register" ? "Biometric Registration" : "Biometric Verification"}
          <BiometricSecurityTooltip />
        </CardTitle>
        <CardDescription>
          {isSimulated ? "Using simulated biometrics for demonstration purposes" : "Alternative authentication method"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>{mode === "register" ? "Registration Successful" : "Verification Successful"}</AlertTitle>
            <AlertDescription>
              {mode === "register"
                ? "Your biometric data has been successfully registered."
                : "You have been successfully authenticated."}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Biometric Fallback Mode</AlertTitle>
              <AlertDescription>
                {isSimulated
                  ? "You are using simulated biometrics. In a production environment, this would use your device's actual biometric sensors."
                  : "This is an alternative method when biometric authentication is not available."}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col space-y-4 items-center justify-center py-4">
              <div className="flex space-x-4">
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Fingerprint className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-sm mt-2">Fingerprint</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Scan className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm mt-2">Face ID</p>
                </div>
              </div>

              <p className="text-center text-sm text-gray-500 mt-4">
                {mode === "register"
                  ? "Click the button below to simulate registering your biometric data."
                  : "Click the button below to simulate verifying your identity."}
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="why-fallback">
                <AccordionTrigger className="text-sm">Why am I seeing this?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600">You're seeing this fallback interface because:</p>
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 space-y-1">
                    <li>Your device may not support biometric authentication</li>
                    <li>Your browser may not have the necessary permissions</li>
                    <li>You may be using an unsupported browser or device</li>
                    <li>The required hardware (fingerprint sensor or camera) may not be available</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="security-info">
                <AccordionTrigger className="text-sm">Security Information</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600">
                    Biometric authentication provides an additional layer of security by using your unique physical
                    characteristics. Even in fallback mode, we maintain security by:
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 space-y-1">
                    <li>Requiring password verification</li>
                    <li>Using secure encryption for all data</li>
                    <li>Implementing additional verification steps when needed</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!success && (
          <>
            <Button variant="outline" onClick={onToggleSimulation} disabled={loading}>
              {isSimulated ? "Try Real Biometrics" : "Use Simulation"}
            </Button>
            <Button onClick={handleComplete} disabled={loading || success}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>{mode === "register" ? "Registering..." : "Verifying..."}</span>
                </div>
              ) : mode === "register" ? (
                "Complete Registration"
              ) : (
                "Complete Verification"
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
