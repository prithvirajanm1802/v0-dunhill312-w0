"use client"

import { Button } from "@/components/ui/button"

import React from "react"

import { useState, useCallback, useMemo } from "react"
import { Bell, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
  id: string
  title: string
  message: string
  emoji?: string
  type?: "success" | "error" | "info" | "warning"
}

export const NotificationContext = React.createContext<{
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id">) => void
  removeNotification: (id: string) => void
}>({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setNotifications((prev) => [...prev, { ...notification, id }])

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id)
    }, 5000)
  }

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  // Create a memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ notifications, addNotification, removeNotification }),
    [notifications, removeNotification],
  )

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}

function NotificationContainer({
  notifications,
  removeNotification,
}: {
  notifications: Notification[]
  removeNotification: (id: string) => void
}) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`p-4 rounded-lg shadow-lg flex items-start gap-3 ${
              notification.type === "success"
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                : notification.type === "error"
                  ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
                  : notification.type === "warning"
                    ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100"
                    : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
            }`}
          >
            <div className="text-2xl">{notification.emoji || getDefaultEmoji(notification.type)}</div>
            <div className="flex-1">
              <h3 className="font-medium">{notification.title}</h3>
              <p className="text-sm">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function getDefaultEmoji(type?: "success" | "error" | "info" | "warning") {
  switch (type) {
    case "success":
      return "✅"
    case "error":
      return "❌"
    case "warning":
      return "⚠️"
    default:
      return "ℹ️"
  }
}

export function NotificationButton() {
  const { addNotification } = useNotification()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() =>
        addNotification({
          title: "New Notification",
          message: "This is a test notification",
          emoji: "🔔",
          type: "info",
        })
      }
    >
      <Bell className="h-5 w-5" />
    </Button>
  )
}
