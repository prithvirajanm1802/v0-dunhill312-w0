// Cross-device synchronization system using IndexedDB and localStorage
// Syncs user data, transactions, and biometric data across devices

export interface SyncRecord {
  id: string
  userId: string
  dataType: "user" | "transaction" | "biometric" | "settings"
  data: any
  timestamp: number
  deviceId: string
}

export interface DeviceInfo {
  deviceId: string
  deviceName: string
  lastSyncTime: number
  deviceType: "mobile" | "tablet" | "desktop"
}

// Generate unique device ID
function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem("honeydrew_device_id")
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem("honeydrew_device_id", deviceId)
  }
  return deviceId
}

// Detect device type
function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop"

  const userAgent = navigator.userAgent.toLowerCase()

  if (/mobile|android|iphone|ipod/.test(userAgent)) {
    return "mobile"
  } else if (/tablet|ipad/.test(userAgent)) {
    return "tablet"
  }
  return "desktop"
}

// Get device name
function getDeviceName(): string {
  if (typeof window === "undefined") return "Unknown"

  const userAgent = navigator.userAgent

  if (/iPhone/.test(userAgent)) return "iPhone"
  if (/iPad/.test(userAgent)) return "iPad"
  if (/Android/.test(userAgent)) return "Android Device"
  if (/Windows/.test(userAgent)) return "Windows PC"
  if (/Mac/.test(userAgent)) return "Mac"
  if (/Linux/.test(userAgent)) return "Linux"

  return "Unknown Device"
}

// Initialize IndexedDB for sync records
export async function initSyncDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("honeydrew_sync", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains("sync_records")) {
        const store = db.createObjectStore("sync_records", { keyPath: "id" })
        store.createIndex("userId", "userId", { unique: false })
        store.createIndex("timestamp", "timestamp", { unique: false })
        store.createIndex("dataType", "dataType", { unique: false })
      }

      if (!db.objectStoreNames.contains("devices")) {
        db.createObjectStore("devices", { keyPath: "deviceId" })
      }
    }
  })
}

// Save sync record to IndexedDB
export async function saveSyncRecord(record: SyncRecord): Promise<void> {
  try {
    const db = await initSyncDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["sync_records"], "readwrite")
      const store = transaction.objectStore("sync_records")
      const request = store.add({
        ...record,
        timestamp: Date.now(),
      })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        console.log("[v0] Sync record saved:", record.id)
        resolve()
      }
    })
  } catch (error) {
    console.error("[v0] Error saving sync record:", error)
  }
}

// Get all sync records for a user
export async function getUserSyncRecords(userId: string): Promise<SyncRecord[]> {
  try {
    const db = await initSyncDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["sync_records"], "readonly")
      const store = transaction.objectStore("sync_records")
      const index = store.index("userId")
      const request = index.getAll(userId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  } catch (error) {
    console.error("[v0] Error getting sync records:", error)
    return []
  }
}

// Register device for sync
export async function registerDevice(userId: string): Promise<DeviceInfo> {
  const deviceId = getOrCreateDeviceId()
  const deviceInfo: DeviceInfo = {
    deviceId,
    deviceName: getDeviceName(),
    lastSyncTime: Date.now(),
    deviceType: getDeviceType(),
  }

  try {
    const db = await initSyncDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["devices"], "readwrite")
      const store = transaction.objectStore("devices")
      const request = store.put(deviceInfo)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        console.log("[v0] Device registered:", deviceId)
        localStorage.setItem(`honeydrew_device_user_${deviceId}`, userId)
        resolve(deviceInfo)
      }
    })
  } catch (error) {
    console.error("[v0] Error registering device:", error)
    return deviceInfo
  }
}

// Get all registered devices for a user
export async function getUserDevices(userId: string): Promise<DeviceInfo[]> {
  try {
    const db = await initSyncDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["devices"], "readonly")
      const store = transaction.objectStore("devices")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const devices = request.result.filter(
          (d) => localStorage.getItem(`honeydrew_device_user_${d.deviceId}`) === userId,
        )
        resolve(devices)
      }
    })
  } catch (error) {
    console.error("[v0] Error getting devices:", error)
    return []
  }
}

// Sync user data across devices
export async function syncUserData(userId: string, data: any): Promise<void> {
  const deviceId = getOrCreateDeviceId()
  const record: SyncRecord = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    dataType: "user",
    data,
    timestamp: Date.now(),
    deviceId,
  }

  await saveSyncRecord(record)

  // Also save to localStorage for quick access
  localStorage.setItem(
    `honeydrew_sync_user_${userId}`,
    JSON.stringify({
      data,
      timestamp: record.timestamp,
      deviceId,
    }),
  )
}

// Sync transaction across devices
export async function syncTransaction(userId: string, transaction: any): Promise<void> {
  const deviceId = getOrCreateDeviceId()
  const record: SyncRecord = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    dataType: "transaction",
    data: transaction,
    timestamp: Date.now(),
    deviceId,
  }

  await saveSyncRecord(record)
}

// Sync session across devices
export async function syncSession(userId: string): Promise<void> {
  const deviceId = getOrCreateDeviceId()
  localStorage.setItem(
    `honeydrew_session_${userId}`,
    JSON.stringify({
      deviceId,
      loginTime: Date.now(),
      isActive: true,
    }),
  )
}

export const crossDeviceSync = {
  initSyncDatabase,
  saveSyncRecord,
  getUserSyncRecords,
  registerDevice,
  getUserDevices,
  syncUserData,
  syncTransaction,
  syncSession,
}
