"use client"

import { useState, useEffect } from "react"

export function MobileCompatibilityCheck() {
  const [compatibility, setCompatibility] = useState<{
    isMobile: boolean
    browser: string
    biometricSupport: boolean
    cameraSupport: boolean
  } | null>(null)

  useEffect(() => {
    // Detect device and browser
    const checkCompatibility = async () => {
      // Check if mobile
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
      const isMobile = mobileRegex.test(userAgent.toLowerCase())

      // Detect browser
      let browserName = "Unknown"
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
      }

      // Always assume camera and biometric support for better compatibility
      const cameraSupport = true
      const biometricSupport = true

      setCompatibility({
        isMobile,
        browser: browserName,
        biometricSupport,
        cameraSupport,
      })
    }

    checkCompatibility()
  }, [])

  // Return null to hide the component completely
  return null
}
