"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useRef, useCallback } from "react"
import { Crown } from "lucide-react"

interface HoneydrewLogoProps {
  size?: "sm" | "md" | "lg"
  showSubtitle?: boolean
  className?: string
  showAdminCrown?: boolean
}

export function HoneydrewLogo({
  size = "md",
  showSubtitle = false,
  className = "",
  showAdminCrown = true,
}: HoneydrewLogoProps) {
  const router = useRouter()
  const tapCountRef = useRef(0)
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleCrownTap = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      tapCountRef.current += 1

      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current)
      }

      if (tapCountRef.current === 2) {
        // Double tap detected - navigate to admin login
        tapCountRef.current = 0
        router.push("/admin-login")
      } else {
        // Reset tap count after 400ms if no second tap
        tapTimeoutRef.current = setTimeout(() => {
          tapCountRef.current = 0
        }, 400)
      }
    },
    [router],
  )

  const sizeClasses = {
    sm: {
      icon: "h-6 w-6",
      kingCircle: "h-5 w-5",
      kingIcon: "h-3 w-3",
      title: "text-lg",
      subtitle: "text-xs",
    },
    md: {
      icon: "h-8 w-8",
      kingCircle: "h-6 w-6",
      kingIcon: "h-3.5 w-3.5",
      title: "text-xl",
      subtitle: "text-xs",
    },
    lg: {
      icon: "h-10 w-10",
      kingCircle: "h-7 w-7",
      kingIcon: "h-4 w-4",
      title: "text-2xl",
      subtitle: "text-sm",
    },
  }

  const sizes = sizeClasses[size]

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <Crown className={`${sizes.icon} text-emerald-600 dark:text-emerald-400`} />
      <div className="flex items-center gap-1.5">
        <div>
          <h1 className={`${sizes.title} font-bold text-emerald-800 dark:text-emerald-300`}>Honeydrew Mills</h1>
          {showSubtitle && (
            <p className={`${sizes.subtitle} text-emerald-600 dark:text-emerald-400`}>Digital Payments</p>
          )}
        </div>
        {showAdminCrown && (
          <div
            onClick={handleCrownTap}
            className={`${sizes.kingCircle} rounded-full bg-yellow-400 dark:bg-yellow-500 flex items-center justify-center shadow-sm cursor-pointer hover:bg-yellow-300 dark:hover:bg-yellow-400 transition-colors`}
            title="Double-tap for admin access"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleCrownTap(e as any)
              }
            }}
          >
            <Crown className={`${sizes.kingIcon} text-yellow-800 dark:text-yellow-900`} />
          </div>
        )}
      </div>
    </div>
  )
}
