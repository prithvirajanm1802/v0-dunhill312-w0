"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Wallet, Shield, Clock, CreditCard, Sparkles, Laugh, PartyPopper } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationButton } from "@/components/notification"
import { motion } from "framer-motion"
import { HoneydrewLogo } from "@/components/honeydrew-logo"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-yellow-50 to-blue-50 dark:from-blue-950 dark:via-yellow-950 dark:to-blue-950">
      <header className="border-b border-blue-200 dark:border-blue-800">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <HoneydrewLogo size="md" />
          <nav className="ml-auto flex gap-4 items-center">
            <NotificationButton />
            <ThemeToggle />
            <Link href="/login">
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900 bg-transparent"
              >
                Login 🔑
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
                Sign Up 🚀
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-blue-900 dark:text-blue-100">
                  Secure Digital Payments 💸
                </h1>
                <p className="text-gray-600 dark:text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Honeydrew Mills offers a secure way to send and receive money, pay bills, and manage your finances.
                  <span className="inline-block animate-bounce ml-2">🎉</span>
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/signup">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
                      Get Started 🚀
                    </Button>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center justify-center"
              >
                <Card className="w-full max-w-sm border-blue-200 shadow-lg dark:border-blue-800">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 rounded-t-lg dark:from-blue-900 dark:to-green-900">
                    <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" /> Features
                    </CardTitle>
                    <CardDescription className="dark:text-gray-300">What Honeydrew Mills offers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">Secure Authentication 🔒</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Biometric security for your account</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                        <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">Money Transfers 💰</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Send money instantly to anyone</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">Bill Payments 📃</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pay all your bills in one place</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">Transaction History 📊</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Track all your payments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 bg-white dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tighter text-blue-800 dark:text-blue-200 flex items-center justify-center gap-2">
                <Crown className="h-6 w-6 text-yellow-500" /> Why Choose Honeydrew Mills?{" "}
                <PartyPopper className="h-6 w-6 text-yellow-500" />
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Experience the best in digital payments and financial services
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="border-blue-200 dark:border-blue-800 h-full">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900">
                    <CardTitle className="text-blue-800 dark:text-blue-200 text-xl flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-300" /> Security First 🔒
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-gray-600 dark:text-gray-300">
                      Advanced biometric authentication with fingerprint and face recognition keeps your account secure.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="border-blue-200 dark:border-blue-800 h-full">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900">
                    <CardTitle className="text-blue-800 dark:text-blue-200 text-xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" /> Comprehensive Services ✨
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-gray-600 dark:text-gray-300">
                      From money transfers to bill payments, mobile recharges, and loans - everything in one app.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card className="border-blue-200 dark:border-blue-800 h-full">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-900">
                    <CardTitle className="text-blue-800 dark:text-blue-200 text-xl flex items-center gap-2">
                      <Laugh className="h-5 w-5 text-yellow-500" /> User Friendly 😊
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-gray-600 dark:text-gray-300">
                      Simple, intuitive interface designed for everyone, making digital payments easier than ever.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-blue-200 py-6 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 md:text-left">
            © {new Date().getFullYear()} Honeydrew Mills. All rights reserved. 👑
          </p>
          <nav className="flex gap-4 text-sm">
            <a
              href="https://www.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Terms 📜
            </a>
            <a
              href="https://www.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Privacy 🔒
            </a>
            <a
              href="https://www.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Contact 📞
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
