import QRCode from "qrcode"

export interface QRCodeOptions {
  size?: number
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
  margin?: number
  color?: {
    dark: string
    light: string
  }
}

const DEFAULT_OPTIONS: QRCodeOptions = {
  size: 300,
  errorCorrectionLevel: "H",
  margin: 2,
  color: {
    dark: "#000000",
    light: "#FFFFFF",
  },
}

/**
 * Generate QR code image from data
 */
export async function generateQRCodeImage(data: string, options: QRCodeOptions = {}): Promise<string> {
  try {
    const config = { ...DEFAULT_OPTIONS, ...options }
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: config.errorCorrectionLevel,
      type: "image/png",
      width: config.size,
      margin: config.margin,
      color: {
        dark: config.color?.dark,
        light: config.color?.light,
      },
    })
    return qrCodeDataUrl
  } catch (error) {
    console.error("[v0] Error generating QR code:", error)
    throw new Error("Failed to generate QR code")
  }
}

/**
 * Generate SVG QR code
 */
export async function generateQRCodeSVG(data: string, size = 300): Promise<string> {
  try {
    const svg = await QRCode.toString(data, {
      errorCorrectionLevel: "H",
      type: "svg",
      width: size,
      margin: 2,
    })
    return svg
  } catch (error) {
    console.error("[v0] Error generating QR code SVG:", error)
    throw new Error("Failed to generate QR code SVG")
  }
}

/**
 * Generate canvas QR code
 */
export async function generateQRCodeCanvas(data: string, canvas: HTMLCanvasElement, size = 300): Promise<void> {
  try {
    await QRCode.toCanvas(canvas, data, {
      errorCorrectionLevel: "H",
      width: size,
      margin: 2,
    })
  } catch (error) {
    console.error("[v0] Error generating QR code canvas:", error)
    throw new Error("Failed to generate QR code canvas")
  }
}
