"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Film, MapPin, Calendar, Ticket, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { HoneydrewPaymentVerification } from "@/components/honeydrew-payment-verification"

export default function BookMyShowPage() {
  const { toast } = useToast()
  const [city, setCity] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMovie, setSelectedMovie] = useState<any>(null)
  const [selectedShow, setSelectedShow] = useState<any>(null)
  const [seats, setSeats] = useState(2)
  const [bookingStep, setBookingStep] = useState("search") // search -> select -> payment -> confirmed

  const mockMovies = [
    { id: "1", name: "Pushpa 2: The Rule", genre: "Action", rating: "8.5", price: 350 },
    { id: "2", name: "Singham Again", genre: "Action", rating: "8.2", price: 300 },
    { id: "3", name: "Bhool Bhulaiyaa 3", genre: "Horror Comedy", rating: "7.8", price: 280 },
  ]

  const showTimings = ["10:00 AM", "1:30 PM", "5:00 PM", "9:00 PM"]

  const handleSearch = () => {
    if (!city || !searchQuery) {
      toast({
        title: "Missing Information",
        description: "Please select city and movie/event",
        variant: "destructive",
      })
      return
    }

    const movie = mockMovies.find((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    if (movie) {
      setSelectedMovie(movie)
      setBookingStep("select")
    } else {
      toast({
        title: "Movie Found",
        description: "Showing available movies",
      })
      setSelectedMovie(mockMovies[0])
      setBookingStep("select")
    }
  }

  const handleSelectShow = (time: string) => {
    setSelectedShow(time)
    setBookingStep("payment")
  }

  const handlePaymentSuccess = (result: { verified: boolean; method: string; transactionId: string }) => {
    const booking = {
      id: `bms_${Date.now()}`,
      movie: selectedMovie.name,
      showTime: selectedShow,
      seats,
      totalAmount: selectedMovie.price * seats,
      city,
      transactionId: result.transactionId,
      paymentMethod: `honeydrew_${result.method}`,
      timestamp: new Date().toISOString(),
    }

    // Save booking
    try {
      const bookings = JSON.parse(localStorage.getItem("honeydrew_bookings") || "[]")
      bookings.push(booking)
      localStorage.setItem("honeydrew_bookings", JSON.stringify(bookings))
    } catch {}

    setBookingStep("confirmed")
    toast({
      title: "Booking Confirmed!",
      description: `${seats} tickets for ${selectedMovie.name}`,
    })

    setTimeout(() => {
      setBookingStep("search")
      setSelectedMovie(null)
      setSelectedShow(null)
      setCity("")
      setSearchQuery("")
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="border-emerald-200 hover:bg-emerald-50 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">BookMyShow</h1>
            <p className="text-gray-600 dark:text-slate-400">Book movies, events & sports tickets</p>
          </div>
        </div>

        {/* Search Step */}
        {bookingStep === "search" && (
          <Tabs defaultValue="movies" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-emerald-50 dark:bg-slate-800 p-1">
              <TabsTrigger value="movies" className="dark:text-slate-300">
                Movies
              </TabsTrigger>
              <TabsTrigger value="sports" className="dark:text-slate-300">
                Sports
              </TabsTrigger>
              <TabsTrigger value="events" className="dark:text-slate-300">
                Events
              </TabsTrigger>
            </TabsList>

            <TabsContent value="movies">
              <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                    <Film className="h-5 w-5" />
                    Book Movie Tickets
                  </CardTitle>
                  <CardDescription>Find and book movie tickets near you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="dark:text-slate-300">
                      City
                    </Label>
                    <Input
                      id="city"
                      placeholder="Enter your city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="border-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="movie" className="dark:text-slate-300">
                      Movie Name
                    </Label>
                    <Input
                      id="movie"
                      placeholder="Search movie..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <Button onClick={handleSearch} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Search Tickets
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sports">
              <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                    <MapPin className="h-5 w-5" />
                    Sports Events
                  </CardTitle>
                  <CardDescription>Book tickets for cricket, football & more</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sport-city" className="dark:text-slate-300">
                      City
                    </Label>
                    <Input
                      id="sport-city"
                      placeholder="Enter your city"
                      className="border-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">View Events</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                    <Calendar className="h-5 w-5" />
                    Upcoming Events
                  </CardTitle>
                  <CardDescription>Concerts, conferences & more</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-city" className="dark:text-slate-300">
                      City
                    </Label>
                    <Input
                      id="event-city"
                      placeholder="Enter your city"
                      className="border-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">View Events</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Select Show Step */}
        {bookingStep === "select" && selectedMovie && (
          <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                  <Ticket className="h-5 w-5" />
                  {selectedMovie.name}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setBookingStep("search")} className="bg-transparent">
                  Back
                </Button>
              </div>
              <CardDescription>
                {selectedMovie.genre} | Rating: {selectedMovie.rating}/10 | Rs. {selectedMovie.price}/ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Number of Seats</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <Button
                      key={num}
                      variant={seats === num ? "default" : "outline"}
                      className={seats === num ? "bg-emerald-600" : "bg-transparent"}
                      onClick={() => setSeats(num)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-slate-300">Select Show Time</Label>
                <div className="grid grid-cols-2 gap-3">
                  {showTimings.map((time) => (
                    <Button
                      key={time}
                      variant="outline"
                      className="h-16 bg-transparent hover:bg-emerald-50 dark:hover:bg-slate-800"
                      onClick={() => handleSelectShow(time)}
                    >
                      <div className="text-center">
                        <p className="font-semibold">{time}</p>
                        <p className="text-xs text-gray-500">{city}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Total Amount:</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    Rs. {(selectedMovie.price * seats).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {bookingStep === "payment" && selectedMovie && selectedShow && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Secure Payment</h2>
              <Button variant="outline" onClick={() => setBookingStep("select")} className="bg-transparent">
                Back
              </Button>
            </div>

            {/* Booking Summary */}
            <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Movie:</span>
                    <span className="font-medium text-emerald-800 dark:text-emerald-300">{selectedMovie.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Show Time:</span>
                    <span className="font-medium text-emerald-800 dark:text-emerald-300">{selectedShow}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Seats:</span>
                    <span className="font-medium text-emerald-800 dark:text-emerald-300">{seats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">City:</span>
                    <span className="font-medium text-emerald-800 dark:text-emerald-300">{city}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Honeydrew Biometric Payment */}
            <HoneydrewPaymentVerification
              paymentDetails={{
                amount: selectedMovie.price * seats,
                description: `${seats} ticket${seats > 1 ? "s" : ""} for ${selectedMovie.name} at ${selectedShow}`,
                serviceName: "BookMyShow",
              }}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setBookingStep("select")}
            />
          </div>
        )}

        {/* Confirmed Step */}
        {bookingStep === "confirmed" && (
          <Card className="border-emerald-200 dark:border-slate-700 dark:bg-slate-900">
            <CardContent className="pt-10 text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-400">Booking Confirmed!</h3>
              <p className="text-gray-600 dark:text-slate-400">
                {seats} ticket{seats > 1 ? "s" : ""} for {selectedMovie?.name}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Show Time: {selectedShow} | City: {city}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
