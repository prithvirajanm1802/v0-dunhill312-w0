import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/components/notification"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { MobileNav } from "@/components/mobile-nav"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Honeydrew Mills - Secure Digital Payments",
  description: "Secure payment app with biometric authentication powered by Honeydrew Mills",
  manifest: "/manifest.json",
  other: {
    "permissions-policy":
      "camera=self; microphone=self; publickey-credentials-get=self; publickey-credentials-create=self",
  },
  generator: "Honeydrew Mills Payment System",
  keywords: ["Honeydrew Mills", "digital payments", "biometric authentication", "secure payments", "mobile wallet"],
  authors: [{ name: "Honeydrew Mills" }],
  creator: "Honeydrew Mills",
  publisher: "Honeydrew Mills",
  applicationName: "Honeydrew Mills Pay",
  referrer: "origin-when-cross-origin",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#059669" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://honeydrew-mills.vercel.app",
    siteName: "Honeydrew Mills",
    title: "Honeydrew Mills - Secure Digital Payments",
    description: "Experience secure digital payments with biometric authentication",
    images: [
      {
        url: "/honeydrew-logo.jpg",
        width: 1200,
        height: 630,
        alt: "Honeydrew Mills Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Honeydrew Mills - Secure Digital Payments",
    description: "Experience secure digital payments with biometric authentication",
    images: ["/honeydrew-logo.jpg"],
    creator: "@honeydrew_mills",
  },
  icons: {
    icon: [
      { url: "/icon-192.jpg", sizes: "192x192", type: "image/jpeg" },
      { url: "/icon-512.jpg", sizes: "512x512", type: "image/jpeg" },
    ],
    apple: [{ url: "/icon-192.jpg", sizes: "192x192", type: "image/jpeg" }],
    shortcut: "/honeydrew-logo.jpg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Honeydrew Mills" />
        <meta name="theme-color" content="#10b981" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="msapplication-navbutton-color" content="#10b981" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/honeydrew-logo.jpg" />
        <link rel="apple-touch-icon" href="/icon-192.jpg" />
        <link rel="shortcut icon" href="/honeydrew-logo.jpg" />
        <meta
          httpEquiv="Permissions-Policy"
          content="accelerometer=(), camera=*, geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), publickey-credentials-get=*, publickey-credentials-create=*, usb=()"
        />
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="HandheldFriendly" content="true" />
        <meta name="MobileOptimized" content="width" />
        <meta name="apple-mobile-web-app-orientations" content="portrait" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NotificationProvider>
            {children}
            <MobileNav />
            <ServiceWorkerRegistration />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
