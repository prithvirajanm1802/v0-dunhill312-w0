"use client"

import { useState } from "react"

export default function MongoDBConnectionTest() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/test-mongodb-connection")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, message: "Connection test failed" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Test Database Connection</h3>
      <button
        onClick={testConnection}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Connection"}
      </button>

      {result && (
        <div className="mt-4 p-3 rounded border">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${result.success ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="font-medium">{result.message}</span>
          </div>
          {result.success && result.details && (
            <div className="mt-2 text-sm text-gray-600">
              <div>Host: {result.details.host}</div>
              <div>Version: {result.details.version}</div>
              <div>Uptime: {result.details.uptime}s</div>
            </div>
          )}
          {!result.success && result.error && <div className="mt-2 text-sm text-red-600">{result.error}</div>}
        </div>
      )}
    </div>
  )
}
