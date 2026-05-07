"use client"

import type { PasswordStrength } from "@/lib/password-validator"

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength
  password: string
}

export function PasswordStrengthIndicator({ strength, password }: PasswordStrengthIndicatorProps) {
  if (!password) return null

  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"]
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-emerald-600",
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password Strength</span>
        <span className={`text-sm font-semibold ${strengthColors[strength.score].replace("bg-", "text-")}`}>
          {strengthLabels[strength.score]}
        </span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
        <div
          className={`h-full transition-all duration-300 ${strengthColors[strength.score]}`}
          style={{ width: `${(strength.score + 1) * 20}%` }}
        />
      </div>
      {strength.errors.length > 0 && (
        <ul className="space-y-1">
          {strength.errors.map((error, i) => (
            <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <span>✗</span> {error}
            </li>
          ))}
        </ul>
      )}
      {strength.isValid && (
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <span>✓</span> Password is strong
        </p>
      )}
    </div>
  )
}
