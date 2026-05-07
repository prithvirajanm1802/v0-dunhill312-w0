"use client"

import { useState, useEffect } from "react"
import { initDatabase } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Database, CheckCircle, XCircle } from "lucide-react"

export function DatabaseStatus() {
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkDatabaseStatus = () => {
      try {
        setLoading(true)
        const result = initDatabase()
        setStatus(result)
      } catch (error) {
        setStatus({ success: false, message: `Error: ${error}` })
      } finally {
        setLoading(false)
      }
    }

    checkDatabaseStatus()

    // Check status every 5 minutes
    const interval = setInterval(checkDatabaseStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Badge variant="outline" className="ml-auto flex items-center gap-2">
        <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
        <span>Checking database...</span>
      </Badge>
    )
  }

  if (!status) {
    return null
  }

  return (
    <Badge variant={status.success ? "default" : "destructive"} className="ml-auto flex items-center gap-2">
      <Database className="h-3 w-3" />
      {status.success ? (
        <>
          <CheckCircle className="h-3 w-3" />
          <span>Database Connected</span>
        </>
      ) : (
        <>
          <XCircle className="h-3 w-3" />
          <span>Database Error</span>
        </>
      )}
    </Badge>
  )
}
