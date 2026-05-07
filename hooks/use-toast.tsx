"use client"

import type React from "react"

import { useState, useCallback } from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

export interface ToastProps {
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((props: ToastProps) => {
    const id = (++toastCount).toString()
    const newToast: Toast = {
      id,
      ...props,
    }

    setToasts((prevToasts) => [...prevToasts, newToast])

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id))
    }, 5000)

    return {
      id,
      dismiss: () => {
        setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id))
      },
      update: (props: Partial<ToastProps>) => {
        setToasts((prevToasts) => prevToasts.map((t) => (t.id === id ? { ...t, ...props } : t)))
      },
    }
  }, [])

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== toastId))
    } else {
      setToasts([])
    }
  }, [])

  return {
    toast,
    dismiss,
    toasts,
  }
}

// Export toast function directly for convenience
export const toast = (props: ToastProps) => {
  console.log("Toast:", props)

  // Create a temporary toast notification
  const toastElement = document.createElement("div")
  toastElement.className = `
    fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm
    transform transition-all duration-300 ease-in-out
  `

  toastElement.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="flex-1">
        ${props.title ? `<h4 class="font-semibold text-gray-900">${props.title}</h4>` : ""}
        ${props.description ? `<p class="text-sm text-gray-600 mt-1">${props.description}</p>` : ""}
      </div>
      <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `

  document.body.appendChild(toastElement)

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (toastElement.parentNode) {
      toastElement.remove()
    }
  }, 5000)

  return {
    dismiss: () => toastElement.remove(),
  }
}
