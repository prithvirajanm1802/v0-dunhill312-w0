"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showAlert, setShowAlert] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    // Define event handlers
    const handleOnline = () => {
      setIsOnline(true)
      setReconnecting(false)
      setReconnectAttempts(0)

      toast({
        title: "Back Online",
        description: "Your internet connection has been restored",
        variant: "success",
      })

      // Hide the alert after 3 seconds
      setTimeout(() => {
        setShowAlert(false)
      }, 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowAlert(true)

      toast({
        title: "You're Offline",
        description: "Some features may be limited until connection is restored",
        variant: "destructive",
      })

      // Start reconnection simulation
      simulateReconnection()
    }

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Clean up
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  const simulateReconnection = () => {
    if (reconnecting) return

    setReconnecting(true)

    const attemptReconnection = () => {
      if (navigator.onLine) {
        setIsOnline(true)
        setReconnecting(false)
        setReconnectAttempts(0)
        return
      }

      setReconnectAttempts((prev) => prev + 1)

      // Simulate checking connection
      setTimeout(() => {
        if (reconnectAttempts < 5) {
          attemptReconnection()
        } else {
          setReconnecting(false)

          toast({
            title: "Connection Failed",
            description: "Unable to reconnect. Please check your internet connection.",
            variant: "destructive",
          })
        }
      }, 3000)
    }

    attemptReconnection()
  }

  // Don't render anything if online and alert is hidden
  if (isOnline && !showAlert) return null

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <Alert
        variant={isOnline ? "default" : "destructive"}
        className={`max-w-md pointer-events-auto ${isOnline ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
      >
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : reconnecting ? (
          <div className="animate-spin h-4 w-4 text-red-600 border-2 border-red-600 border-t-transparent rounded-full" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600" />
        )}
        <AlertTitle>
          {isOnline ? "Back Online" : reconnecting ? `Reconnecting (Attempt ${reconnectAttempts}/5)` : "You're Offline"}
        </AlertTitle>
        <AlertDescription>
          {isOnline
            ? "Your internet connection has been restored"
            : reconnecting
              ? "Attempting to restore your connection..."
              : "Some features may be limited until your connection is restored"}
        </AlertDescription>
      </Alert>
    </div>
  )
}
