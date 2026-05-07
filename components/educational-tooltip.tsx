"use client"

import type React from "react"

import { useState } from "react"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EducationalTooltipProps {
  content: string
  icon?: React.ReactNode
  className?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function EducationalTooltip({
  content,
  icon = <HelpCircle className="h-4 w-4 text-muted-foreground ml-1" />,
  className = "",
  side = "top",
  align = "center",
}: EducationalTooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
          <span className={`inline-flex items-center cursor-help ${className}`}>{icon}</span>
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className="max-w-xs text-sm">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Specialized tooltips for common biometric concepts
export function FingerprintTooltip() {
  return (
    <EducationalTooltip content="Fingerprint authentication uses the unique patterns in your fingerprint to verify your identity. It's secure, convenient, and can't be easily replicated." />
  )
}

export function FaceRecognitionTooltip() {
  return (
    <EducationalTooltip content="Facial recognition uses the unique features of your face to verify your identity. Modern systems can distinguish between a photo and a real person." />
  )
}

export function BiometricSecurityTooltip() {
  return (
    <EducationalTooltip content="Biometric data is stored securely on your device and is never sent to our servers. Your privacy is protected through encryption and secure storage." />
  )
}

export function ProgressiveEnhancementTooltip() {
  return (
    <EducationalTooltip content="Progressive enhancement means we start with basic authentication that works everywhere, then add advanced features like biometrics when your device supports them." />
  )
}
