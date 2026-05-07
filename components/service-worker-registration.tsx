"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export function ServiceWorkerRegistration() {
  const { toast } = useToast()

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Register service worker after page load
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          })
          console.log("[v0] ServiceWorker registration successful with scope:", registration.scope)
          
          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60000) // Check every minute
        } catch (error) {
          console.error("[v0] ServiceWorker registration failed:", error)
        }
      }

      // Register after window load
      if (document.readyState === "loading") {
        window.addEventListener("load", registerServiceWorker)
      } else {
        registerServiceWorker()
      }

      // Create event handler functions outside of the event listener setup
      const handleOnline = () => {
        toast({
          title: "You're back online!",
          description: "All features are now available.",
        })
      }

      const handleOffline = () => {
        toast({
          title: "You're offline",
          description: "Some features may not be available.",
        })
      }

      // Handle offline/online events
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      // Clean up event listeners
      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [toast])

  return null
}
