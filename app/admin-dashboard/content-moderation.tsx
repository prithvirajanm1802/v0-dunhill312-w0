"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Search, Trash2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export function ContentModeration() {
  const [moderationLogs, setModerationLogs] = useState<any[]>([])
  const [filteredLogs, setFilteredLogs] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null)

  const showNotification = (message: string, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadModerationLogs = () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load moderation logs from localStorage
      const logs = JSON.parse(localStorage.getItem("contentModerationLogs") || "[]")
      setModerationLogs(logs)
      setFilteredLogs(logs)

      showNotification(`${logs.length} logs loaded successfully`)
    } catch (error) {
      console.error("Error loading moderation logs:", error)
      setError("Failed to load moderation logs")
    } finally {
      setIsLoading(false)
    }
  }

  const filterLogs = () => {
    if (!searchTerm) {
      setFilteredLogs(moderationLogs)
      return
    }

    const filtered = moderationLogs.filter(
      (log) =>
        log.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userId?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    setFilteredLogs(filtered)
  }

  const handleDeleteLog = (timestamp: string) => {
    try {
      const updatedLogs = moderationLogs.filter((log) => log.timestamp !== timestamp)
      localStorage.setItem("contentModerationLogs", JSON.stringify(updatedLogs))
      setModerationLogs(updatedLogs)

      showNotification("The moderation log has been deleted")
    } catch (error) {
      console.error("Error deleting log:", error)
      showNotification("Failed to delete the moderation log", "error")
    }
  }

  const handleClearAllLogs = () => {
    try {
      localStorage.setItem("contentModerationLogs", JSON.stringify([]))
      setModerationLogs([])
      setFilteredLogs([])

      showNotification("All moderation logs have been cleared")
    } catch (error) {
      console.error("Error clearing logs:", error)
      showNotification("Failed to clear moderation logs", "error")
    }
  }

  const getSeverityBadge = (content: string) => {
    // Mock function
    const severity = content.length > 20 ? "high" : content.length > 10 ? "medium" : "low"

    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge variant="outline">Medium</Badge>
      case "low":
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="secondary">None</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <Card>
      {notification && (
        <div
          className={`p-3 m-4 rounded-md ${
            notification.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Moderation</CardTitle>
            <CardDescription>Monitor and manage content moderation activities</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadModerationLogs}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClearAllLogs}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "No matching logs found" : "No moderation logs available"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.timestamp}>
                    <TableCell className="whitespace-nowrap">{formatDate(log.timestamp)}</TableCell>
                    <TableCell className="max-w-xs truncate">{log.content}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.action === "blocked" ? "destructive" : log.action === "filtered" ? "outline" : "secondary"
                        }
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.userId}</TableCell>
                    <TableCell>{getSeverityBadge(log.content)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLog(log.timestamp)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ContentModeration
