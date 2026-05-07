"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Train, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { sessionManager } from "@/lib/session-manager"
import { crossDeviceSync } from "@/lib/cross-device-sync"
import { dbService } from "@/lib/db"
import { HoneydrewPaymentVerification } from "@/components/honeydrew-payment-verification"

export default function IRCTCPage() {
  const { toast } = useToast()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [date, setDate] = useState("")
  const [passengers, setPassengers] = useState("1")
  const [trains, setTrains] = useState<any[]>([])
  const [selectedTrain, setSelectedTrain] = useState<any>(null)
  const [bookingStep, setBookingStep] = useState("search") // search -> results -> payment -> confirmation
  const [bookings, setBookings] = useState<any[]>([])

  const mockTrains = [
    { id: "101", name: "Rajdhani Express", departure: "10:00 AM", arrival: "4:00 PM", price: 2500, seats: 45 },
    { id: "102", name: "Shatabdi Express", departure: "12:00 PM", arrival: "6:00 PM", price: 1800, seats: 32 },
    { id: "103", name: "Local Express", departure: "2:00 PM", arrival: "8:00 PM", price: 800, seats: 120 },
  ]

  const handleSearch = async () => {
    if (!from || !to || !date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all booking details",
        variant: "destructive",
      })
      return
    }

    setTrains(mockTrains)
    setBookingStep("results")
    toast({
      title: "Search Results",
      description: `Found ${mockTrains.length} trains from ${from} to ${to}`,
    })
  }

  const handleSelectTrain = (train: any) => {
    setSelectedTrain(train)
    setBookingStep("payment")
  }

  const handlePaymentSuccess = async (result: { verified: boolean; method: string; transactionId: string }) => {
    try {
      const session = await sessionManager.getSession()
      const totalCost = selectedTrain.price * Number.parseInt(passengers)

      const booking = {
        id: `booking_${Date.now()}`,
        type: "train_booking",
        from,
        to,
        date,
        passengers: Number.parseInt(passengers),
        train: selectedTrain,
        totalCost,
        paymentMethod: `honeydrew_${result.method}`,
        transactionId: result.transactionId,
        status: "confirmed",
        pnr: Math.random().toString().slice(2, 12),
        timestamp: new Date().toISOString(),
        deviceId: session?.deviceId,
        userId: session?.userId,
      }

      await dbService.addTransaction(booking)
      await crossDeviceSync.syncData({ type: "booking", data: booking })

      setBookings([booking, ...bookings])
      setBookingStep("confirmation")

      toast({
        title: "Booking Confirmed!",
        description: `PNR: ${booking.pnr}`,
      })

      setTimeout(() => {
        setBookingStep("search")
        setFrom("")
        setTo("")
        setDate("")
        setSelectedTrain(null)
      }, 3000)
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to complete booking",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const loadBookings = async () => {
      const txns = await dbService.getTransactions("train_booking")
      setBookings(txns)
    }
    loadBookings()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="border-emerald-200 hover:bg-emerald-50 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">IRCTC Train Booking</h1>
            <p className="text-gray-600 dark:text-slate-400">Book trains instantly across India</p>
          </div>
        </div>

        {/* Step 1: Search */}
        {bookingStep === "search" && (
          <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                <Train className="h-5 w-5" />
                Search Trains
              </CardTitle>
              <CardDescription>Find and book trains across India</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from" className="dark:text-slate-300">
                    From
                  </Label>
                  <Input
                    id="from"
                    placeholder="Departure station"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="border-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to" className="dark:text-slate-300">
                    To
                  </Label>
                  <Input
                    id="to"
                    placeholder="Arrival station"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="border-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="dark:text-slate-300">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passengers" className="dark:text-slate-300">
                    Passengers
                  </Label>
                  <Select value={passengers} onValueChange={setPassengers}>
                    <SelectTrigger className="border-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} Passenger{num > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSearch} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Search Trains
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Results */}
        {bookingStep === "results" && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Available Trains</h2>
              <Button variant="outline" onClick={() => setBookingStep("search")} className="bg-transparent">
                Back to Search
              </Button>
            </div>

            {trains.map((train) => (
              <Card
                key={train.id}
                className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900 hover:shadow-lg cursor-pointer"
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-emerald-800 dark:text-emerald-400">{train.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">Train ID: {train.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">Rs. {train.price}</p>
                      <p className="text-xs text-gray-600 dark:text-slate-400">per seat</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-slate-400">Departure</p>
                      <p className="font-semibold text-emerald-800 dark:text-emerald-400">{train.departure}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-slate-400">Duration</p>
                      <p className="font-semibold text-emerald-800 dark:text-emerald-400">6 hrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-slate-400">Arrival</p>
                      <p className="font-semibold text-emerald-800 dark:text-emerald-400">{train.arrival}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-slate-400">{train.seats} seats available</span>
                    <Button onClick={() => handleSelectTrain(train)} className="bg-emerald-600 hover:bg-emerald-700">
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {bookingStep === "payment" && selectedTrain && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Secure Payment</h2>
              <Button variant="outline" onClick={() => setBookingStep("results")} className="bg-transparent">
                Back
              </Button>
            </div>

            {/* Booking Summary */}
            <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900 mb-4">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Train:</span>
                    <span className="font-medium text-emerald-800 dark:text-emerald-300">{selectedTrain.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Route:</span>
                    <span className="font-medium text-emerald-800 dark:text-emerald-300">
                      {from} to {to}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Passengers:</span>
                    <span className="font-medium text-emerald-800 dark:text-emerald-300">{passengers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Honeydrew Biometric Payment */}
            <HoneydrewPaymentVerification
              paymentDetails={{
                amount: selectedTrain.price * Number.parseInt(passengers),
                description: `${selectedTrain.name} - ${from} to ${to} (${passengers} passenger${Number.parseInt(passengers) > 1 ? "s" : ""})`,
                serviceName: "IRCTC Train Booking",
              }}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setBookingStep("results")}
            />
          </div>
        )}

        {/* Step 4: Confirmation */}
        {bookingStep === "confirmation" && bookings.length > 0 && (
          <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900 mb-6">
            <CardContent className="pt-10 text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-400">Booking Confirmed!</h3>
              <p className="text-gray-600 dark:text-slate-400">Your ticket is now active on all your devices</p>
            </CardContent>
          </Card>
        )}

        {/* Previous Bookings */}
        <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-emerald-800 dark:text-emerald-400">Your Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-gray-500 dark:text-slate-400">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-emerald-800 dark:text-emerald-400">
                          {booking.from} to {booking.to}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-slate-400">PNR: {booking.pnr}</p>
                      </div>
                      <p className="font-bold text-emerald-800 dark:text-emerald-300">
                        Rs. {booking.totalCost.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
