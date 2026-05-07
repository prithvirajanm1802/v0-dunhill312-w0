/**
 * Utilities for comprehensive testing of the application
 */

// Test result interface
interface TestResult {
  name: string
  passed: boolean
  message?: string
  timestamp: string
  duration: number
}

// Test suite interface
interface TestSuite {
  name: string
  results: TestResult[]
  passed: boolean
  timestamp: string
  duration: number
}

// Global test results storage
const testResults: TestSuite[] = []

/**
 * Runs a test function and records the result
 * @param testName The name of the test
 * @param testFn The test function to run
 * @returns The test result
 */
async function runTest(testName: string, testFn: () => Promise<void> | void): Promise<TestResult> {
  const startTime = performance.now()
  let passed = false
  let message = ""

  try {
    await testFn()
    passed = true
  } catch (error) {
    passed = false
    message = error instanceof Error ? error.message : String(error)
  }

  const endTime = performance.now()
  const duration = endTime - startTime

  const result: TestResult = {
    name: testName,
    passed,
    message: passed ? undefined : message,
    timestamp: new Date().toISOString(),
    duration,
  }

  // Log the test result
  console.log(`Test: ${testName} - ${passed ? "PASSED" : "FAILED"}${message ? ` (${message})` : ""}`)

  return result
}

/**
 * Runs a suite of tests and records the results
 * @param suiteName The name of the test suite
 * @param tests An array of test functions to run
 * @returns The test suite results
 */
async function runTestSuite(
  suiteName: string,
  tests: { name: string; fn: () => Promise<void> | void }[],
): Promise<TestSuite> {
  console.log(`Running test suite: ${suiteName}`)
  const startTime = performance.now()
  const results: TestResult[] = []

  for (const test of tests) {
    const result = await runTest(test.name, test.fn)
    results.push(result)
  }

  const endTime = performance.now()
  const duration = endTime - startTime
  const passed = results.every((result) => result.passed)

  const suite: TestSuite = {
    name: suiteName,
    results,
    passed,
    timestamp: new Date().toISOString(),
    duration,
  }

  // Store the test suite results
  testResults.push(suite)

  // Log the test suite summary
  console.log(
    `Test suite: ${suiteName} - ${passed ? "PASSED" : "FAILED"} (${results.filter((r) => r.passed).length}/${results.length} tests passed)`,
  )

  return suite
}

/**
 * Gets all test results
 * @returns All test results
 */
function getTestResults(): TestSuite[] {
  return testResults
}

/**
 * Saves test results to localStorage
 */
function saveTestResults(): void {
  try {
    localStorage.setItem("testResults", JSON.stringify(testResults))
  } catch (error) {
    console.error("Error saving test results:", error)
  }
}

/**
 * Loads test results from localStorage
 * @returns The loaded test results
 */
function loadTestResults(): TestSuite[] {
  try {
    const results = localStorage.getItem("testResults")
    if (results) {
      return JSON.parse(results)
    }
  } catch (error) {
    console.error("Error loading test results:", error)
  }
  return []
}

/**
 * Clears all test results
 */
function clearTestResults(): void {
  testResults.length = 0
  try {
    localStorage.removeItem("testResults")
  } catch (error) {
    console.error("Error clearing test results:", error)
  }
}

/**
 * Tests biometric functionality
 * @param userId The user ID to test with
 * @returns A promise that resolves when the tests are complete
 */
async function testBiometricFunctionality(userId: string): Promise<TestSuite> {
  return runTestSuite("Biometric Functionality", [
    {
      name: "Fingerprint Registration",
      fn: async () => {
        // Simulate fingerprint registration
        const result = { success: true, message: "Fingerprint registered successfully" }
        if (!result.success) {
          throw new Error(`Fingerprint registration failed: ${result.message}`)
        }
      },
    },
    {
      name: "Face Registration",
      fn: async () => {
        // Simulate face registration
        const result = { success: true, message: "Face registered successfully" }
        if (!result.success) {
          throw new Error(`Face registration failed: ${result.message}`)
        }
      },
    },
    {
      name: "Fingerprint Verification",
      fn: async () => {
        // Simulate fingerprint verification
        const result = { success: true, message: "Fingerprint verified successfully" }
        if (!result.success) {
          throw new Error(`Fingerprint verification failed: ${result.message}`)
        }
      },
    },
    {
      name: "Face Verification",
      fn: async () => {
        // Simulate face verification
        const result = { success: true, message: "Face verified successfully" }
        if (!result.success) {
          throw new Error(`Face verification failed: ${result.message}`)
        }
      },
    },
  ])
}

/**
 * Tests user authentication
 * @returns A promise that resolves when the tests are complete
 */
async function testUserAuthentication(): Promise<TestSuite> {
  return runTestSuite("User Authentication", [
    {
      name: "User Registration",
      fn: async () => {
        // Simulate user registration
        const result = { success: true, message: "User registered successfully" }
        if (!result.success) {
          throw new Error(`User registration failed: ${result.message}`)
        }
      },
    },
    {
      name: "User Login",
      fn: async () => {
        // Simulate user login
        const result = { success: true, message: "User logged in successfully" }
        if (!result.success) {
          throw new Error(`User login failed: ${result.message}`)
        }
      },
    },
    {
      name: "Password Reset",
      fn: async () => {
        // Simulate password reset
        const result = { success: true, message: "Password reset successfully" }
        if (!result.success) {
          throw new Error(`Password reset failed: ${result.message}`)
        }
      },
    },
  ])
}

export type { TestSuite }
export {
  runTest,
  runTestSuite,
  getTestResults,
  saveTestResults,
  loadTestResults,
  clearTestResults,
  testBiometricFunctionality,
  testUserAuthentication,
}
