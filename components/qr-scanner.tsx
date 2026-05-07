"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, QrCode, Camera, AlertCircle, Upload, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [manualInput, setManualInput] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)
  const [fileUpload, setFileUpload] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    setError(null)
    setScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraPermission(true)

        toast({
          title: "Camera Active",
          description: "Point your camera at a QR code",
        })

        // Start scanning
        scanIntervalRef.current = setInterval(() => {
          scanQRCode()
        }, 500)
      }
    } catch (err: any) {
      console.error("Camera error:", err)
      setScanning(false)
      setCameraPermission(false)

      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera access in your browser settings.")
      } else if (err.name === "NotFoundError") {
        setError("No camera found on your device.")
      } else {
        setError("Could not access camera. Please try again.")
      }

      if (onError) onError("Camera access denied")
    }
  }

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    setScanning(false)
  }

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // In production, use jsQR or similar library
      // For demo, we simulate detection
      try {
        // Check for test QR data in localStorage
        const testQr = localStorage.getItem("test_qr_scan")
        if (testQr) {
          localStorage.removeItem("test_qr_scan")
          stopScanning()
          onScan(testQr)
          return
        }
      } catch (err) {
        console.error("QR scan error:", err)
      }
    }
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileUpload(true)
      setError(null)

      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onload = () => {
        // Simulate QR detection from image
        setTimeout(() => {
          setFileUpload(false)
          toast({
            title: "Image Processed",
            description: "Please enter the QR data manually or try camera scan",
          })
          setShowManualInput(true)
        }, 1500)
      }

      reader.onerror = () => {
        setError("Error reading the image file")
        setFileUpload(false)
        if (onError) onError("Error reading file")
      }

      reader.readAsDataURL(file)
    }
  }

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      setManualInput("")
      setShowManualInput(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showManualInput ? (
        <Card className="w-full">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Enter QR Data</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowManualInput(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qrData">QR Code Data</Label>
              <Input
                id="qrData"
                placeholder="Paste QR code data here"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
            </div>
            <Button onClick={handleManualSubmit} className="w-full" disabled={!manualInput.trim()}>
              Submit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full overflow-hidden">
          <CardContent className="p-0 relative">
            {scanning ? (
              <>
                <video ref={videoRef} className="w-full aspect-video object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 relative">
                    <div className="absolute inset-0 border-2 border-dashed border-emerald-500 rounded-lg animate-pulse" />
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <Button variant="outline" size="sm" onClick={stopScanning} className="bg-white/90">
                    Cancel
                  </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 text-center text-white text-sm bg-black/60 py-2">
                  Position QR code within frame
                </div>
              </>
            ) : fileUpload ? (
              <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
                <Loader2 className="h-12 w-12 mb-4 text-emerald-500 animate-spin" />
                <p className="text-muted-foreground">Processing image...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 min-h-[300px] bg-muted/30">
                <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <QrCode className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Scan QR Code</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Scan another user's QR code to send them money instantly
                </p>
                <div className="flex flex-col w-full gap-3">
                  <Button onClick={startScanning} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Camera className="mr-2 h-4 w-4" />
                    Open Camera
                  </Button>
                  <Button variant="outline" onClick={handleFileUpload} className="w-full bg-transparent">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload QR Image
                  </Button>
                  <Button variant="ghost" onClick={() => setShowManualInput(true)} className="w-full">
                    Enter QR Data Manually
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {cameraPermission === false && !error && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Camera Access Required</AlertTitle>
          <AlertDescription>
            Please allow camera access in your browser settings to scan QR codes, or use the manual input option.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
