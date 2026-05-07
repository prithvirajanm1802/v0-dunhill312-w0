"use client"

import { useState, useEffect } from "react"

export default function MongoDBStatus() {
  const [status, setStatus] = useState({ success: false, message: "Checking connection..." })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/test-mongodb-connection")
        const data = await response.json()
        setStatus(data)
      } catch (error) {
        setStatus({ success: false, message: "Connection failed" })
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [])

  return (
    <div className="p-4 rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-medium mb-2">Database Status</h3>
      <div className="flex items-center">
        <div
          className={`w-3 h-3 rounded-full mr-2 ${
            loading ? "bg-yellow-500" : status.success ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>
        <span>{status.message}</span>
      </div>
    </div>
  )
}
