"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function BrowserCompatibilityCheck() {
  const [compatibility, setCompatibility] = useState<{
    browser: string
    biometricSupport: boolean
    cameraSupport: boolean
    webAuthnSupport: boolean
  } | null>(null)

  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Detect browser
    const detectBrowser = () => {
      const userAgent = navigator.userAgent
      let browserName

      if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = "Chrome"
      } else if (userAgent.match(/firefox|fxios/i)) {
        browserName = "Firefox"
      } else if (userAgent.match(/safari/i)) {
        browserName = "Safari"
      } else if (userAgent.match(/opr\//i)) {
        browserName = "Opera"
      } else if (userAgent.match(/edg/i)) {
        browserName = "Edge"
      } else {
        browserName = "Unknown"
      }

      return browserName
    }

    // Check biometric support
    const checkBiometricSupport = async () => {
      try {
        if (
          window.PublicKeyCredential &&
          typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
        ) {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          return available
        }
        return false
      } catch (error) {
        console.error("Error checking biometric support:", error)
        return false
      }
    }

    // Check camera support
    const checkCameraSupport = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          return true
        }
        return false
      } catch (error) {
        console.error("Error checking camera support:", error)
        return false
      }
    }

    // Check WebAuthn support
    const checkWebAuthnSupport = () => {
      return window.PublicKeyCredential !== undefined
    }

    // Run all checks
    const runCompatibilityChecks = async () => {
      const browser = detectBrowser()
      const biometricSupport = await checkBiometricSupport()
      const cameraSupport = await checkCameraSupport()
      const webAuthnSupport = checkWebAuthnSupport()

      setCompatibility({
        browser,
        biometricSupport,
        cameraSupport,
        webAuthnSupport,
      })
    }

    runCompatibilityChecks()
  }, [])

  if (!compatibility) {
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Checking browser compatibility...</AlertTitle>
        <AlertDescription>Please wait while we check if your browser supports all features.</AlertDescription>
      </Alert>
    )
  }

  const allSupported = compatibility.biometricSupport && compatibility.cameraSupport && compatibility.webAuthnSupport

  return (
    <>
      <Alert variant={allSupported ? "default" : "destructive"} className="mb-4">
        {allSupported ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <AlertTitle>
          {allSupported
            ? `Your browser (${compatibility.browser}) supports all features! 🎉`
            : `Your browser (${compatibility.browser}) has limited support 🚫`}
        </AlertTitle>
        <AlertDescription className="flex justify-between items-center">
          <span>
            {allSupported
              ? "You can use all biometric and camera features."
              : "Some biometric or camera features may not work properly."}
          </span>
          <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>
        </AlertDescription>
      </Alert>

      {showDetails && (
        <div className="mb-4 p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Compatibility Details:</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              {compatibility.biometricSupport ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>
                Biometric Authentication: {compatibility.biometricSupport ? "Supported ✅" : "Not Supported ❌"}
              </span>
            </li>
            <li className="flex items-center gap-2">
              {compatibility.cameraSupport ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Camera Access: {compatibility.cameraSupport ? "Supported ✅" : "Not Supported ❌"}</span>
            </li>
            <li className="flex items-center gap-2">
              {compatibility.webAuthnSupport ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>WebAuthn API: {compatibility.webAuthnSupport ? "Supported ✅" : "Not Supported ❌"}</span>
            </li>
          </ul>

          {!allSupported && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Recommended Browsers:</h4>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Chrome (version 67+) 🌐</li>
                <li>• Edge (version 79+) 🌐</li>
                <li>• Firefox (version 60+) 🌐</li>
                <li>• Safari (version 13+) 🌐</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  )
}
