// Message sanitization utility to prevent inappropriate content

// List of inappropriate words and phrases to filter
const INAPPROPRIATE_TERMS = [
  "fuck",
  "shit",
  "ass",
  "bitch",
  "dick",
  "pussy",
  "cunt",
  "whore",
  "slut",
  "bastard",
  "nigger",
  "faggot",
  "retard",
  // Add more terms as needed
]

// Sanitize a message by replacing inappropriate content
export function sanitizeMessage(message: string): string {
  if (!message) return "Unknown error occurred"

  let sanitized = message

  // Replace inappropriate terms with asterisks
  INAPPROPRIATE_TERMS.forEach((term) => {
    const regex = new RegExp(term, "gi")
    sanitized = sanitized.replace(regex, "*".repeat(term.length))
  })

  // Check for HTML/script injection
  if (/<script|<iframe|<img|onerror|javascript:|alert\(|document\.|window\.|eval\(|setTimeout\(/i.test(sanitized)) {
    return "Invalid content detected"
  }

  // Limit message length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 497) + "..."
  }

  return sanitized
}

// Create a safe error message from any error object
export function createSafeErrorMessage(error: any): string {
  let message = "An unknown error occurred"

  if (error) {
    if (typeof error === "string") {
      message = error
    } else if (error instanceof Error) {
      message = error.message || "Error occurred"
    } else if (error.message && typeof error.message === "string") {
      message = error.message
    } else if (error.error && typeof error.error === "string") {
      message = error.error
    } else if (error.toString && typeof error.toString === "function") {
      try {
        message = error.toString()
      } catch (e) {
        // If toString throws, fall back to default
      }
    }
  }

  // Sanitize the extracted message
  return sanitizeMessage(message)
}

// Log content for moderation review
export function logContentModeration(
  content: string,
  type: "error" | "message" | "registered" | "error_filtered",
  userId?: string,
): void {
  try {
    const moderationLogs = JSON.parse(localStorage.getItem("contentModerationLogs") || "[]")

    // Check if content contains inappropriate terms
    const containsInappropriate = INAPPROPRIATE_TERMS.some((term) => {
      const regex = new RegExp(term, "gi")
      return regex.test(content)
    })

    moderationLogs.push({
      timestamp: new Date().toISOString(),
      type,
      content: type === "error_filtered" ? "[FILTERED]" : content,
      containsInappropriate,
      userId: userId || "unknown",
      userAgent: navigator.userAgent,
    })

    // Keep only the last 100 logs
    while (moderationLogs.length > 100) moderationLogs.shift()

    localStorage.setItem("contentModerationLogs", JSON.stringify(moderationLogs))
  } catch (error) {
    console.error("Error logging content for moderation:", error)
  }
}

/**
 * Checks if a message contains inappropriate content
 * @param message The message to check
 * @returns True if the message contains inappropriate content
 */
export function containsInappropriateContent(message: string): boolean {
  if (!message) return false

  // Check for inappropriate words
  const hasInappropriateWords = INAPPROPRIATE_TERMS.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi")
    return regex.test(message)
  })

  return hasInappropriateWords
}

/**
 * Determines the severity of inappropriate content
 * @param content The content to check
 * @returns A severity level: "none", "low", "medium", or "high"
 */
export function getContentSeverity(content: string): "none" | "low" | "medium" | "high" {
  if (!content) return "none"

  let severityScore = 0

  // Check for inappropriate words
  INAPPROPRIATE_TERMS.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi")
    const matches = content.match(regex)
    if (matches) {
      // More severe words have higher weights
      const weight = word.length <= 4 ? 1 : 2
      severityScore += matches.length * weight
    }
  })

  // Determine severity level
  if (severityScore === 0) return "none"
  if (severityScore <= 2) return "low"
  if (severityScore <= 5) return "medium"
  return "high"
}
