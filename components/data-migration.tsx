"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Database, RefreshCw, ArrowRightLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { migrateData } from "@/app/actions/migration-actions"
import { Progress } from "@/components/ui/progress"

export function DataMigration() {
  const [status, setStatus] = useState<"idle" | "migrating" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")
  const [stats, setStats] = useState<any>(null)
  const [progress, setProgress] = useState(0)

  const handleMigration = async () => {
    if (status === "migrating") return

    setStatus("migrating")
    setMessage("Migrating data from localStorage to MongoDB...")
    setProgress(10)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 1000)

      const result = await migrateData()

      clearInterval(progressInterval)

      if (result.success) {
        setStatus("success")
        setMessage(result.message)
        setStats(result.stats)
        setProgress(100)
      } else {
        setStatus("error")
        setMessage(result.message)
        setProgress(0)
      }
    } catch (error) {
      setStatus("error")
      setMessage(`Error during migration: ${error instanceof Error ? error.message : String(error)}`)
      setProgress(0)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Data Migration
        </CardTitle>
        <CardDescription>Migrate data from localStorage to MongoDB database</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Status:</span>
            <Badge
              variant={
                status === "success"
                  ? "success"
                  : status === "migrating"
                    ? "outline"
                    : status === "error"
                      ? "destructive"
                      : "secondary"
              }
            >
              {status === "success"
                ? "Migration Successful"
                : status === "migrating"
                  ? "Migration in Progress"
                  : status === "error"
                    ? "Migration Failed"
                    : "Ready to Migrate"}
            </Badge>
          </div>

          {status === "migrating" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Migration Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Migration Error</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === "success" && stats && (
            <div className="space-y-4">
              <Alert variant="success">
                <AlertTitle>Migration Successful</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-medium">Migration Statistics</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Users:</div>
                  <div>
                    {stats.users.migrated} / {stats.users.total}
                  </div>

                  <div>Transactions:</div>
                  <div>
                    {stats.transactions.migrated} / {stats.transactions.total}
                  </div>

                  <div>Biometric Records:</div>
                  <div>
                    {stats.biometricData.migrated} / {stats.biometricData.total}
                  </div>

                  <div>QR Codes:</div>
                  <div>
                    {stats.qrCodes.migrated} / {stats.qrCodes.total}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleMigration} disabled={status === "migrating"} className="w-full">
          {status === "migrating" ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Migrating Data...
            </>
          ) : status === "success" ? (
            "Migrate Again"
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Migrate to MongoDB
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
