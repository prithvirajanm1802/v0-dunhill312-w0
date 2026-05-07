// Device compatibility checking utility

export async function checkDeviceCompatibility() {
  try {
    // Check if the browser supports the Web Authentication API
    const webAuthnSupported = window.PublicKeyCredential !== undefined

    // Check if platform authenticator is available (for fingerprint)
    let fingerprintSupported = false
    if (
      webAuthnSupported &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
    ) {
      fingerprintSupported = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    }

    // Check camera support
    const cameraAvailable = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

    // Check camera permission (this is a best effort - permissions API isn't fully supported everywhere)
    let cameraPermissionGranted = false
    if (cameraAvailable) {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: "camera" as PermissionName })
          cameraPermissionGranted = result.state === "granted"
        } else {
          // If permissions API isn't available, we'll assume permission might be granted
          cameraPermissionGranted = true
        }
      } catch (e) {
        // If there's an error checking permissions, we'll assume permission might be granted
        cameraPermissionGranted = true
      }
    }

    // Device is fully compatible if it supports both fingerprint and camera
    const isFullyCompatible = webAuthnSupported && fingerprintSupported && cameraAvailable && cameraPermissionGranted

    // Device is partially compatible if it supports at least one biometric method
    const partiallyCompatible = webAuthnSupported || (cameraAvailable && cameraPermissionGranted)

    return {
      webAuthnSupported,
      fingerprintSupported,
      cameraAvailable,
      cameraPermissionGranted,
      isFullyCompatible,
      partiallyCompatible,
    }
  } catch (error) {
    console.error("Error checking device compatibility:", error)
    // Default to partially compatible on error
    return {
      webAuthnSupported: false,
      fingerprintSupported: false,
      cameraAvailable: false,
      cameraPermissionGranted: false,
      isFullyCompatible: false,
      partiallyCompatible: true,
    }
  }
}

export async function getCompatibilityMessage() {
  try {
    const compatibility = await checkDeviceCompatibility()

    if (compatibility.isFullyCompatible) {
      return {
        title: "Full Biometric Support Detected",
        message: "Your device supports both fingerprint and facial recognition.",
        severity: "success",
      }
    } else if (compatibility.partiallyCompatible) {
      if (compatibility.fingerprintSupported) {
        return {
          title: "Fingerprint Support Detected",
          message: "Your device supports fingerprint authentication but may not support facial recognition.",
          severity: "info",
        }
      } else if (compatibility.cameraAvailable) {
        return {
          title: "Camera Support Detected",
          message: "Your device supports facial recognition but may not support fingerprint authentication.",
          severity: "info",
        }
      } else {
        return {
          title: "Limited Biometric Support",
          message:
            "Your device has limited biometric capabilities. You can still use simulated biometrics for this demo.",
          severity: "warning",
        }
      }
    } else {
      return {
        title: "Biometric Support Not Detected",
        message:
          "Your device doesn't appear to support biometric authentication. Using fallback authentication methods.",
        severity: "error",
      }
    }
  } catch (error) {
    return {
      title: "Compatibility Check Error",
      message: "There was an error checking your device compatibility. Using fallback authentication methods.",
      severity: "error",
    }
  }
}
