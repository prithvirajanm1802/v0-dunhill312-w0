/**
 * Password Validation Utility
 * Enforces strong password requirements
 */

export interface PasswordStrength {
  score: number // 0-5
  isValid: boolean
  errors: string[]
  requirements: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecialChar: boolean
  }
}

export function validatePassword(password: string): PasswordStrength {
  const errors: string[] = []
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  }

  if (!requirements.minLength) errors.push("Password must be at least 8 characters")
  if (!requirements.hasUppercase) errors.push("Password must contain an uppercase letter")
  if (!requirements.hasLowercase) errors.push("Password must contain a lowercase letter")
  if (!requirements.hasNumber) errors.push("Password must contain a number")
  if (!requirements.hasSpecialChar) errors.push("Password must contain a special character")

  const fulfilledRequirements = Object.values(requirements).filter(Boolean).length
  const score = Math.min(5, Math.floor((fulfilledRequirements / 5) * 5))

  return {
    score,
    isValid: errors.length === 0,
    errors,
    requirements,
  }
}

export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
  if (!password || !confirmPassword) {
    return "Both passwords are required"
  }
  if (password !== confirmPassword) {
    return "Passwords do not match"
  }
  return null
}
