// This file provides a web-compatible version of react-native-biometrics

export interface BiometricResult {
  success: boolean
  cancelled?: boolean
  error?: string
}

export interface BiometricAvailability {
  available: boolean
  biometryType?: string
  error?: string
}

export class WebBiometrics {
  /**
   * Check if biometric authentication is available on the device
   */
  async isSensorAvailable(): Promise<BiometricAvailability> {
    if (!window.PublicKeyCredential) {
      return { available: false, error: "WebAuthn not supported" }
    }

    try {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()

      // Determine biometry type (this is a best guess for web)
      let biometryType = undefined
      if (available) {
        // Try to detect if we're on a device with Touch ID/Face ID
        const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

        if (isIOS || isMac) {
          // Modern Macs and iOS devices likely have Touch ID or Face ID
          biometryType = "TouchID" // or could be FaceID, but we can't reliably detect which
        } else if (/Android/.test(navigator.userAgent)) {
          biometryType = "Biometrics" // Generic for Android
        } else {
          biometryType = "Biometrics" // Generic fallback
        }
      }

      return {
        available,
        biometryType,
      }
    } catch (error) {
      console.error("Error checking biometric availability:", error)
      return {
        available: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * Check if the permissions policy allows WebAuthn
   * This is a passive check that doesn't trigger permissions errors
   */
  isInIframe(): boolean {
    try {
      return window.self !== window.top
    } catch (e) {
      // If we can't access window.top, we're likely in a cross-origin iframe
      return true
    }
  }

  /**
   * Prompt the user for biometric authentication
   */
  async simplePrompt({ promptMessage }: { promptMessage: string }): Promise<BiometricResult> {
    try {
      // Check if we're in an iframe - WebAuthn often doesn't work in iframes due to permissions policy
      if (this.isInIframe()) {
        console.warn("WebAuthn may not work in iframes due to permissions policy, falling back to simulation")
        return {
          success: false,
          error: "WebAuthn may not be available in this context",
        }
      }

      // Create a random challenge
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      // Create credential options
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        userVerification: "required",
        rpId: window.location.hostname,
      }

      // Show the prompt message in a toast or alert if available
      console.log(promptMessage)

      // Request the credential
      try {
        const credential = await navigator.credentials.get({
          publicKey: publicKeyCredentialRequestOptions,
        })
        return { success: !!credential }
      } catch (error) {
        // Check if this is a permissions policy error
        if ((error as Error).message && (error as Error).message.includes("Permissions Policy")) {
          console.warn("WebAuthn permissions policy error, falling back to simulation:", error)
          return {
            success: false,
            error: "WebAuthn permissions not enabled in this context",
          }
        }

        // Handle user cancellation
        if ((error as Error).name === "NotAllowedError") {
          return { success: false, cancelled: true }
        }

        throw error
      }
    } catch (error) {
      console.error("Biometric authentication error:", error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * Create a signature using biometric authentication
   * This is a simplified version for web
   */
  async createSignature({
    promptMessage,
    payload,
  }: {
    promptMessage: string
    payload: string
  }): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      // First authenticate the user
      const authResult = await this.simplePrompt({ promptMessage })

      if (!authResult.success) {
        return { success: false, error: authResult.error || "Authentication failed" }
      }

      // In a real implementation, we would use the Web Crypto API to sign the payload
      // This is a simplified version that just returns a mock signature
      const encoder = new TextEncoder()
      const data = encoder.encode(payload)
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        true,
        ["sign", "verify"],
      )

      const signature = await window.crypto.subtle.sign(
        {
          name: "ECDSA",
          hash: { name: "SHA-256" },
        },
        keyPair.privateKey,
        data,
      )

      // Convert the signature to base64
      const signatureArray = new Uint8Array(signature)
      let base64Signature = ""
      for (let i = 0; i < signatureArray.byteLength; i++) {
        base64Signature += String.fromCharCode(signatureArray[i])
      }
      base64Signature = btoa(base64Signature)

      return {
        success: true,
        signature: base64Signature,
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }
}

// Create a singleton instance
export const webBiometrics = new WebBiometrics()

// Export a function to create a new instance (for testing or if needed)
export const createWebBiometrics = () => new WebBiometrics()
