function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/")
  const pad = base64.length % 4 === 0 ? 0 : 4 - (base64.length % 4)
  const padded = base64 + "=".repeat(pad)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export function supportsPasskey(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    typeof (window.PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable === "function"
  )
}

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

  isGooglePasskey = (browser === "Chrome" || browser === "Edge" || browser === "Android Browser") && supportsPasskey()

  const isSupported = supportsPasskey()
  const message = isSupported
    ? isGooglePasskey
      ? "Google Password Manager will store your passkey"
      : "Your browser's native passkey storage will be used"
    : "Passkeys are not supported on this device/browser"

  return { isSupported, browser, isGooglePasskey, message }
}

const PASSKEY_KEY = (userId: string) => `honeydrew_passkey_${userId}`
const PASSKEY_GLOBAL_KEY = "honeydrew_passkey_global"

async function fetchPasskeyFromNeonDB(userId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/passkeys/get/${userId}`)
    if (response.ok) {
      const data = await response.json()
      if (data.credentialId) {
        console.log("[v0] Fetched passkey from Neon DB for cross-device sync")
        return data.credentialId
      }
    }
  } catch (e) {
    console.log("[v0] Error fetching passkey from Neon DB:", e)
  }
  return null
}

function getStoredPasskey(userId: string): string | null {
  try {
    // Try user-specific key first
    let credId = localStorage.getItem(PASSKEY_KEY(userId))
    if (credId) return credId

    // Try global passkey
    credId = localStorage.getItem(PASSKEY_GLOBAL_KEY)
    if (credId) return credId

    // Try to find by email if userId is email-like
    const users = JSON.parse(localStorage.getItem("honeydrew_users") || "[]")
    for (const user of users) {
      const possibleKeys = [
        `honeydrew_passkey_${user.id}`,
        `honeydrew_passkey_${user.email}`,
        `honeydrew_passkey_${user.phone}`,
      ]
      for (const key of possibleKeys) {
        credId = localStorage.getItem(key)
        if (credId) return credId
      }
    }

    // Check biometricData
    const biometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")
    for (const key of Object.keys(biometricData)) {
      if (biometricData[key]?.fingerprintData?.credentialId) {
        return biometricData[key].fingerprintData.credentialId
      }
    }

    return null
  } catch {
    return null
  }
}

async function savePasskeyToNeonDB(userId: string, credentialId: string, metadata: any) {
  try {
    const response = await fetch("/api/passkeys/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        credentialId,
        metadata,
      }),
    })
    
    if (!response.ok) {
      console.warn("[v0] Failed to save passkey to Neon DB:", response.statusText)
    } else {
      console.log("[v0] Passkey saved to Neon DB successfully")
    }
  } catch (e) {
    console.warn("[v0] Error saving passkey to Neon DB:", e)
  }
}

function savePasskey(userId: string, credentialId: string, metadata: any) {
  try {
    // Save to user-specific key
    localStorage.setItem(PASSKEY_KEY(userId), credentialId)

    // Also save to global key as backup
    localStorage.setItem(PASSKEY_GLOBAL_KEY, credentialId)

    // Save metadata
    localStorage.setItem(`honeydrew_fingerprint_data_${userId}`, JSON.stringify(metadata))

    // Update biometricData
    const biometricData = JSON.parse(localStorage.getItem("biometricData") || "{}")
    biometricData[userId] = {
      ...(biometricData[userId] || {}),
      fingerprint: true,
      fingerprintData: metadata,
    }
    localStorage.setItem("biometricData", JSON.stringify(biometricData))

    // Update current user and users array
    const currentUser = JSON.parse(
      localStorage.getItem("honeydrew_current_user") || localStorage.getItem("currentUser") || "{}",
    )
    if (currentUser.id || currentUser.email) {
      localStorage.setItem(PASSKEY_KEY(currentUser.id), credentialId)
      localStorage.setItem(PASSKEY_KEY(currentUser.email), credentialId)
      currentUser.fingerprintRegistered = true
      localStorage.setItem("honeydrew_current_user", JSON.stringify(currentUser))
      localStorage.setItem("currentUser", JSON.stringify(currentUser))
    }

    // Mark as registered
    localStorage.setItem(`honeydrew_passkey_registered_${userId}`, "1")
    localStorage.setItem("honeydrew_passkey_registered", "1")
    
    // Sync with Neon DB asynchronously
    savePasskeyToNeonDB(userId, credentialId, metadata)
  } catch (e) {
    console.warn("[v0] Error saving passkey:", e)
  }
}

export function hasRegisteredPasskey(userId: string): boolean {
  return !!getStoredPasskey(userId)
}

function randomChallenge(length = 32): Uint8Array {
  const random = new Uint8Array(length)
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(random)
  } else {
    for (let i = 0; i < length; i++) random[i] = Math.floor(Math.random() * 256)
  }
  return random
}

function userIdToBuffer(userId: string): Uint8Array {
  const encoder = new TextEncoder()
  const data = encoder.encode(userId)
  const buf = new Uint8Array(16)
  for (let i = 0; i < buf.length; i++) {
    buf[i] = data[i % data.length]
  }
  return buf
}

export async function registerPasskey(
  userId: string,
  userName?: string,
  forceNew?: boolean,
): Promise<{ success: boolean; credentialId?: string; message?: string; credential?: any }> {
  console.log("[v0] registerPasskey called for userId:", userId)

  try {
    const compatibility = getPasskeyCompatibility()

    if (!compatibility.isSupported) {
      // This allows signup to proceed without passkey
      return { success: true, message: "Passkey registration skipped on this device" }
    }

    if (!forceNew) {
      const existingCredId = getStoredPasskey(userId)
      if (existingCredId) {
        console.log("[v0] Found existing passkey - returning")
        return {
          success: true,
          credentialId: existingCredId,
          message: "Already registered",
        }
      }
    }

    let platformAvailable = false
    try {
      platformAvailable = await (window.PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable()
    } catch (err) {
      console.log("[v0] Platform authenticator check failed, skipping passkey")
      return { success: true, message: "Passkey registration skipped - not available" }
    }

    if (!platformAvailable) {
      console.log("[v0] No biometric authenticator available, skipping passkey")
      return { success: true, message: "Passkey registration skipped - biometric not available" }
    }

    const challenge = randomChallenge(32)
    const rpId = window.location.hostname

    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "Honeydrew Mills",
        id: rpId,
      },
      user: {
        id: userIdToBuffer(userId),
        name: userName || userId,
        displayName: userName || userId,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      timeout: 60000,
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        requireResidentKey: false,
        residentKey: "preferred",
      },
      attestation: "none",
      excludeCredentials: [],
    }

    console.log("[v0] Calling navigator.credentials.create...")

    let cred: PublicKeyCredential | null = null
    try {
      cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null
    } catch (credErr: any) {
      console.log("[v0] Credential error:", credErr?.name, credErr?.message)

      if (credErr?.name === "NotAllowedError") {
        return { success: false, message: "Registration cancelled. Please try again." }
      }
      if (credErr?.name === "InvalidStateError") {
        const existingCred = await attemptDiscoverableCredential(challenge, rpId)
        if (existingCred) {
          savePasskey(userId, existingCred, {
            credentialId: existingCred,
            registrationTime: new Date().toISOString(),
            type: "Google Password Manager",
            browser: compatibility.browser,
          })
          return { success: true, credentialId: existingCred, message: "Using existing passkey" }
        }
        return { success: false, message: "Passkey exists. Please use login instead." }
      }
      if (credErr?.name === "NotSupportedError" || credErr?.name === "UnknownError") {
        return {
          success: false,
          message:
            "Biometric registration not available on this device. You can register your fingerprint later in settings.",
        }
      }
      throw credErr
    }

    if (!cred) {
      return { success: false, message: "Registration cancelled." }
    }

    const rawId = cred.rawId
    const credentialId = toBase64Url(rawId)
    const attestationResponse = cred.response as AuthenticatorAttestationResponse

    let publicKeyBase64 = ""
    try {
      const publicKeyBuffer = attestationResponse.getPublicKey?.()
      if (publicKeyBuffer) {
        publicKeyBase64 = toBase64Url(publicKeyBuffer)
      }
    } catch {}

    const metadata = {
      credentialId,
      publicKey: publicKeyBase64,
      registrationTime: new Date().toISOString(),
      type: compatibility.isGooglePasskey ? "Google Password Manager" : "WebAuthn",
      browser: compatibility.browser,
      platform: "Honeydrew Mills",
      isGooglePasskey: compatibility.isGooglePasskey,
    }

    savePasskey(userId, credentialId, metadata)

    console.log("[v0] Passkey registration complete")
    return {
      success: true,
      credentialId,
      credential: {
        id: credentialId,
        publicKey: publicKeyBase64,
        deviceType: compatibility.browser,
      },
    }
  } catch (err: any) {
    console.error("[v0] registerPasskey error:", err)
    return { success: false, message: err?.message || "Failed to register passkey." }
  }
}

async function attemptDiscoverableCredential(challenge: Uint8Array, rpId: string): Promise<string | null> {
  try {
    const requestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      userVerification: "required",
      timeout: 30000,
      rpId,
      allowCredentials: [], // Empty = discoverable credentials
    }

    const assertion = (await navigator.credentials.get({ publicKey: requestOptions })) as PublicKeyCredential | null
    if (!assertion) return null

    return toBase64Url(assertion.rawId)
  } catch {
    return null
  }
}

export async function verifyPasskey(userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const compatibility = getPasskeyCompatibility()
    if (!compatibility.isSupported) {
      return { success: false, message: compatibility.message }
    }

    // Try local storage first
    let credentialId = getStoredPasskey(userId)
    
    // If not found locally, fetch from Neon DB for cross-device support
    if (!credentialId) {
      console.log("[v0] Passkey not found locally, checking Neon DB for cross-device sync...")
      credentialId = await fetchPasskeyFromNeonDB(userId)
      
      if (credentialId) {
        // Save to local storage for faster access
        savePasskey(userId, credentialId, {
          credentialId,
          syncedFromNeonDB: true,
          syncTime: new Date().toISOString(),
        })
      }
    }

    if (!credentialId) {
      return { success: false, message: "No registered passkey found. Please register first." }
    }

    const challenge = randomChallenge(32)
    const rpId = window.location.hostname

    // Try with specific credential first
    try {
      const allowCredential: PublicKeyCredentialDescriptor = {
        type: "public-key",
        id: new Uint8Array(fromBase64Url(credentialId)),
        transports: ["internal"],
      }

      const requestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [allowCredential],
        userVerification: "required",
        timeout: 60000,
        rpId,
      }

      console.log("[v0] Requesting passkey verification...")
      const assertion = (await navigator.credentials.get({ publicKey: requestOptions })) as PublicKeyCredential | null

      if (assertion) {
        console.log("[v0] Passkey verified successfully")
        return { success: true, message: "Verified successfully" }
      }
    } catch (err: any) {
      console.log("[v0] Specific credential failed, trying discoverable:", err?.name)
    }

    try {
      const requestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [],
        userVerification: "required",
        timeout: 60000,
        rpId,
      }

      const assertion = (await navigator.credentials.get({ publicKey: requestOptions })) as PublicKeyCredential | null

      if (assertion) {
        // Save this credential for future use
        const newCredentialId = toBase64Url(assertion.rawId)
        savePasskey(userId, newCredentialId, {
          credentialId: newCredentialId,
          verifiedAt: new Date().toISOString(),
          type: "Google Password Manager",
          browser: compatibility.browser,
        })
        console.log("[v0] Passkey verified via discoverable credentials")
        return { success: true, message: "Verified via Google Password Manager" }
      }
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        return { success: false, message: "Verification cancelled." }
      }
    }

    return { success: false, message: "Passkey verification failed." }
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to verify passkey." }
  }
}
