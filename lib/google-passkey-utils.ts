/**
 * Detects if the current environment supports Google Passkey (conditional UI)
 * This allows for graceful fallback on browsers that don't support passkeys
 */
export async function detectGooglePasskeySupport(): Promise<boolean> {
  if (typeof window === "undefined") return false

  try {
    if (!window.PublicKeyCredential) {
      return false
    }

    const isAvailable = await (window.PublicKeyCredential as any)
      .isUserVerifyingPlatformAuthenticatorAvailable()
      .catch(() => false)

    return isAvailable
  } catch {
    return false
  }
}

/**
 * Get passkey compatibility info for current browser
 */
export function getPasskeyCompatibility(): {
  isSupported: boolean
  browser: string
  isGooglePasskey: boolean
  message: string
} {
  if (typeof window === "undefined") {
    return { isSupported: false, browser: "Unknown", isGooglePasskey: false, message: "Window object not available" }
  }

  let browser = "Unknown"
  let isGooglePasskey = false

  const ua = navigator.userAgent
  if (ua.includes("Chrome") && !ua.includes("Chromium")) {
    browser = "Chrome"
  } else if (ua.includes("Firefox")) {
    browser = "Firefox"
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    browser = "Safari"
  } else if (ua.includes("Edge")) {
    browser = "Edge"
  } else if (ua.includes("Android")) {
    browser = "Android Browser"
  } else if (/iPad|iPhone|iPod/.test(ua)) {
    browser = "iOS Safari"
  }

  // Check if WebAuthn is supported
  const isSupported =
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    typeof (window.PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable === "function"

  isGooglePasskey = (browser === "Chrome" || browser === "Edge" || browser === "Android Browser") && isSupported

  const message = isSupported
    ? isGooglePasskey
      ? "Google Passkey (Native) is available on this browser"
      : "Standard WebAuthn Passkey is available on this browser"
    : "Passkeys are not supported on this device/browser"

  return { isSupported, browser, isGooglePasskey, message }
}

/**
 * Get browser-specific passkey recommendations
 */
export function getBrowserPasskeyRecommendation(): {
  isSupported: boolean
  recommendation: string
  fallback: string
} {
  const ua = navigator.userAgent

  if (ua.includes("Chrome")) {
    return {
      isSupported: true,
      recommendation: "Google Passkey is fully supported. Tap the fingerprint icon to register.",
      fallback: "If passkey fails, you can use your password instead.",
    }
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    return {
      isSupported: true,
      recommendation: "Face ID or Touch ID will be used for passkey registration.",
      fallback: "If passkey fails, you can use your password instead.",
    }
  } else if (ua.includes("Firefox")) {
    return {
      isSupported: true,
      recommendation: "Platform authenticator (fingerprint/face) will be used.",
      fallback: "If passkey fails, you can use your password instead.",
    }
  } else if (ua.includes("Edge")) {
    return {
      isSupported: true,
      recommendation: "Windows Hello or platform biometric will be used.",
      fallback: "If passkey fails, you can use your password instead.",
    }
  } else {
    return {
      isSupported: false,
      recommendation: "Your browser may not support passkeys. You can sign up with email and password instead.",
      fallback: "Consider using Chrome, Safari, Firefox, or Edge for full passkey support.",
    }
  }
}

/**
 * Format passkey registration error for user-friendly display
 */
export function formatPasskeyError(error: any): string {
  if (!error) return "Unknown error occurred"

  const message = error?.message || error?.toString() || ""
  const name = error?.name || ""

  if (
    name === "NotAllowedError" ||
    message.includes("NotAllowedError") ||
    message.includes("NotAllowed") ||
    message.includes("canceled")
  ) {
    return "Registration was canceled. Please click 'Register Fingerprint' again and approve the biometric prompt on your device."
  }
  if (name === "InvalidStateError" || message.includes("InvalidStateError")) {
    return "A passkey is already registered for this account. Please use the login page."
  }
  if (
    name === "SecurityError" ||
    message.includes("Permissions Policy") ||
    message.includes("permissions") ||
    message.includes("SecurityError")
  ) {
    return "Passkey registration is blocked. Please ensure you're using HTTPS and not in an embedded frame. Try refreshing the page."
  }
  if (name === "NotSupportedError" || message.includes("NotSupportedError") || message.includes("NotSupported")) {
    return "Your device doesn't support passkeys. Please use Chrome, Safari, Firefox, or Edge on a device with biometric authentication."
  }
  if (name === "AbortError" || message.includes("AbortError") || message.includes("timed out")) {
    return "Registration timed out. Please try again and complete the biometric prompt within 2 minutes."
  }
  if (message.includes("NetworkError")) {
    return "Network error during registration. Check your connection and try again."
  }
  if (message.includes("authenticator")) {
    return "No biometric authenticator found. Please enable fingerprint or face recognition in your device settings."
  }

  return message || "Failed to register passkey. Please try again or use password login."
}

/**
 * Redirect user to payment setup after successful passkey registration
 */
export function redirectToPaymentSetup(userId: string): void {
  localStorage.setItem(`passkey_registered_${userId}`, "true")

  if (typeof window !== "undefined") {
    window.location.href = "/payments/setup"
  }
}
