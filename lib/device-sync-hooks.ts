"use client"

import { useEffect, useState } from "react"

export interface SyncStatus {
  isSyncing: boolean
  lastSyncTime: number | null
  syncedDevices: number
  error: string | null
}

/**
 * Hook for cross-device payment sync
 */
export function usePaymentSync(userId: string, deviceId: string) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    syncedDevices: 0,
    error: null,
  })

  const syncPaymentStatus = async (paymentStatus: Record<string, any>) => {
    try {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }))

      const response = await fetch("/api/sync/payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          deviceId,
          paymentStatus,
          verificationStatus: {},
        }),
      })

      if (!response.ok) {
        throw new Error("Sync failed")
      }

      const data = await response.json()

      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: Date.now(),
      }))

      console.log("[v0] Payment sync successful")
    } catch (error) {
      console.error("[v0] Payment sync error:", error)
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : "Sync failed",
      }))
    }
  }

  const getLatestSync = async () => {
    try {
      const response = await fetch(`/api/sync/payment-status?userId=${userId}&deviceId=${deviceId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch sync data")
      }

      return await response.json()
    } catch (error) {
      console.error("[v0] Get sync data error:", error)
      return null
    }
  }

  return {
    syncStatus,
    syncPaymentStatus,
    getLatestSync,
  }
}

/**
 * Hook for device management
 */
export function useDeviceManagement(userId: string) {
  const [devices, setDevices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const registerDevice = async (deviceName: string) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/sync/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, deviceName }),
      })

      if (!response.ok) {
        throw new Error("Device registration failed")
      }

      const data = await response.json()
      await fetchDevices()

      return data
    } catch (error) {
      console.error("[v0] Device registration error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDevices = async () => {
    try {
      const response = await fetch(`/api/sync/devices?userId=${userId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch devices")
      }

      const data = await response.json()
      setDevices(data.devices || [])
    } catch (error) {
      console.error("[v0] Fetch devices error:", error)
    }
  }

  const revokeDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/sync/devices?userId=${userId}&deviceId=${deviceId}`, { method: "DELETE" })

      if (!response.ok) {
        throw new Error("Failed to revoke device")
      }

      await fetchDevices()
    } catch (error) {
      console.error("[v0] Revoke device error:", error)
      throw error
    }
  }

  useEffect(() => {
    if (userId) {
      fetchDevices()
    }
  }, [userId])

  return {
    devices,
    isLoading,
    registerDevice,
    revokeDevice,
    refreshDevices: fetchDevices,
  }
}
