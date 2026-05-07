"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, XCircle, Play, RefreshCw, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface TestResult {
  name: string
  passed: boolean
  duration: number
  message?: string
}

interface TestSuite {
  name: string
  timestamp: string
  passed: boolean
  duration: number
  results: TestResult[]
}

export function TestingPanel() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null)

  useEffect(() => {
    loadTests()
  }, [])

  const showNotification = (message: string, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadTests = () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load test results from localStorage
      const results = JSON.parse(localStorage.getItem("testResults") || "[]")
      setTestSuites(results)

      showNotification(`${results.length} test suites loaded`)
    } catch (error) {
      console.error("Error loading test results:", error)
      setError("Failed to load test results")
    } finally {
      setIsLoading(false)
    }
  }

  const runAllTests = async () => {
    setIsRunningTests(true)
    setError(null)

    try {
      showNotification("Running all test suites...")

      // Mock test execution
      const mockTestSuite: TestSuite = {
        name: "Biometric Authentication Tests",
        timestamp: new Date().toISOString(),
        passed: true,
        duration: 1250,
        results: [
          { name: "Face Detection", passed: true, duration: 300, message: "Face detected successfully" },
          { name: "Fingerprint Auth", passed: true, duration: 450, message: "Fingerprint verified" },
          { name: "User Registration", passed: true, duration: 500, message: "User created successfully" },
        ],
      }

      const updatedSuites = [mockTestSuite, ...testSuites]
      setTestSuites(updatedSuites)
      localStorage.setItem("testResults", JSON.stringify(updatedSuites))

      showNotification(`Tests completed successfully`)
    } catch (error) {
      console.error("Error running tests:", error)
      setError("Failed to run tests")
      showNotification("An error occurred while running tests", "error")
    } finally {
      setIsRunningTests(false)
    }
  }

  const clearTests = () => {
    try {
      localStorage.setItem("testResults", JSON.stringify([]))
      setTestSuites([])
      showNotification("All test results have been cleared")
    } catch (error) {
      console.error("Error clearing tests:", error)
      setError("Failed to clear test results")
    }
  }

  const formatDuration = (duration: number) => {
    return `${duration.toFixed(2)}ms`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getPassRate = (suite: TestSuite) => {
    if (suite.results.length === 0) return 0
    const passedTests = suite.results.filter((result) => result.passed).length
    return (passedTests / suite.results.length) * 100
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
            <CardTitle>Testing Dashboard</CardTitle>
            <CardDescription>Run and monitor automated tests</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadTests} disabled={isRunningTests}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button variant="default" size="sm" onClick={runAllTests} disabled={isRunningTests}>
              <Play className="h-4 w-4 mr-2" /> Run All Tests
            </Button>
            <Button variant="destructive" size="sm" onClick={clearTests} disabled={isRunningTests}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear Results
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

        {isRunningTests && (
          <Alert className="mb-4">
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            <AlertTitle>Running Tests</AlertTitle>
            <AlertDescription>Please wait while tests are running...</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : testSuites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No test results available</div>
        ) : (
          <div className="space-y-6">
            {testSuites.map((suite) => (
              <div key={suite.timestamp} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {suite.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <h3 className="font-medium">{suite.name}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{formatDate(suite.timestamp)}</span>
                      <span className="text-sm text-gray-500">Duration: {formatDuration(suite.duration)}</span>
                      <Badge variant={suite.passed ? "default" : "destructive"}>
                        {suite.passed ? "PASSED" : "FAILED"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>
                        {suite.results.filter((r) => r.passed).length} of {suite.results.length} tests passed
                      </span>
                      <span>{Math.round(getPassRate(suite))}%</span>
                    </div>
                    <Progress value={getPassRate(suite)} className="h-2" />
                  </div>
                </div>
                <div className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead>Test Name</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suite.results.map((result) => (
                        <TableRow key={result.name}>
                          <TableCell>
                            {result.passed ? (
                              <Badge variant="default">PASSED</Badge>
                            ) : (
                              <Badge variant="destructive">FAILED</Badge>
                            )}
                          </TableCell>
                          <TableCell>{result.name}</TableCell>
                          <TableCell>{formatDuration(result.duration)}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {result.message || (result.passed ? "Test passed successfully" : "Test failed")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TestingPanel
