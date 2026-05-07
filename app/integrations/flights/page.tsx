"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plane, MapPin, Clock, Users, Star, Wifi, Coffee, Luggage, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { BiometricAuth } from "@/components/biometric-auth"

interface Flight {
  id: string
  airline: string
  flightNumber: string
  from: string
  to: string
  departure: string
  arrival: string
  duration: string
  price: number
  stops: number
  aircraft: string
  amenities: string[]
  rating: number
}

interface PopularRoute {
  from: string
  to: string
  price: number
  duration: string
}

const flights: Flight[] = [
  {
    id: "1",
    airline: "IndiGo",
    flightNumber: "6E 2142",
    from: "DEL",
    to: "BOM",
    departure: "06:00",
    arrival: "08:15",
    duration: "2h 15m",
    price: 4500,
    stops: 0,
    aircraft: "A320",
    amenities: ["wifi", "meals", "entertainment"],
    rating: 4.2,
  },
  {
    id: "2",
    airline: "Air India",
    flightNumber: "AI 131",
    from: "DEL",
    to: "BOM",
    departure: "08:30",
    arrival: "10:50",
    duration: "2h 20m",
    price: 5200,
    stops: 0,
    aircraft: "B737",
    amenities: ["wifi", "meals", "luggage"],
    rating: 4.0,
  },
  {
    id: "3",
    airline: "SpiceJet",
    flightNumber: "SG 8194",
    from: "DEL",
    to: "BOM",
    departure: "14:25",
    arrival: "16:45",
    duration: "2h 20m",
    price: 3800,
    stops: 0,
    aircraft: "B737",
    amenities: ["meals", "entertainment"],
    rating: 3.8,
  },
  {
    id: "4",
    airline: "Vistara",
    flightNumber: "UK 995",
    from: "DEL",
    to: "BOM",
    departure: "19:15",
    arrival: "21:35",
    duration: "2h 20m",
    price: 6800,
    stops: 0,
    aircraft: "A320neo",
    amenities: ["wifi", "meals", "entertainment", "luggage"],
    rating: 4.5,
  },
]

const popularRoutes: PopularRoute[] = [
  { from: "Delhi", to: "Mumbai", price: 4500, duration: "2h 15m" },
  { from: "Mumbai", to: "Bangalore", price: 3200, duration: "1h 30m" },
  { from: "Delhi", to: "Bangalore", price: 5800, duration: "2h 45m" },
  { from: "Chennai", to: "Hyderabad", price: 2800, duration: "1h 15m" },
  { from: "Kolkata", to: "Delhi", price: 4200, duration: "2h 30m" },
  { from: "Pune", to: "Goa", price: 2500, duration: "1h 10m" },
]

const cities = [
  { code: "DEL", name: "Delhi" },
  { code: "BOM", name: "Mumbai" },
  { code: "BLR", name: "Bangalore" },
  { code: "MAA", name: "Chennai" },
  { code: "CCU", name: "Kolkata" },
  { code: "HYD", name: "Hyderabad" },
  { code: "GOI", name: "Goa" },
  { code: "PNQ", name: "Pune" },
  { code: "AMD", name: "Ahmedabad" },
  { code: "JAI", name: "Jaipur" },
]

export default function FlightBookingPage() {
  const [showBiometric, setShowBiometric] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [searchParams, setSearchParams] = useState({
    from: "DEL",
    to: "BOM",
    departure: "2024-01-20",
    passengers: "1",
    class: "economy",
  })
  const [showFlights, setShowFlights] = useState(true)
  const { toast } = useToast()

  const handleBookFlight = (flight: Flight) => {
    setSelectedFlight(flight)
    setShowBiometric(true)
  }

  const handleBiometricSuccess = () => {
    if (selectedFlight) {
      toast({
        title: "Flight Booked Successfully",
        description: `Booking confirmed for ${selectedFlight.flightNumber} - ${selectedFlight.from} to ${selectedFlight.to}`,
        variant: "default",
      })

      setShowBiometric(false)
      setSelectedFlight(null)
    }
  }

  const searchFlights = () => {
    setShowFlights(true)
    toast({
      title: "Searching Flights",
      description: `Finding flights from ${searchParams.from} to ${searchParams.to}`,
      variant: "default",
    })
  }

  const swapCities = () => {
    setSearchParams((prev) => ({
      ...prev,
      from: prev.to,
      to: prev.from,
    }))
  }

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "wifi":
        return <Wifi className="h-4 w-4" />
      case "meals":
        return <Coffee className="h-4 w-4" />
      case "luggage":
        return <Luggage className="h-4 w-4" />
      default:
        return <Star className="h-4 w-4" />
    }
  }

  if (showBiometric) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">Confirm Booking</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedFlight?.flightNumber} - {selectedFlight?.from} to {selectedFlight?.to}
              </p>
              <p className="text-lg font-semibold text-emerald-600">Total: ₹{selectedFlight?.price.toLocaleString()}</p>
            </div>

            <BiometricAuth
              userId="current-user"
              mode="verify"
              onFingerprint={handleBiometricSuccess}
              onFaceId={handleBiometricSuccess}
              onError={(error) => {
                toast({
                  title: "Authentication Failed",
                  description: error,
                  variant: "destructive",
                })
                setShowBiometric(false)
              }}
            />

            <Button
              variant="outline"
              onClick={() => setShowBiometric(false)}
              className="w-full mt-4 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/integrations">
            <Button variant="outline" size="icon" className="border-emerald-200 hover:bg-emerald-50 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">Flight Booking</h1>
            <p className="text-gray-600 dark:text-gray-400">Search and book flights across India</p>
          </div>
        </div>

        {/* Search Form */}
        <Card className="border-emerald-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Plane className="h-5 w-5" />
              Search Flights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <Select
                  value={searchParams.from}
                  onValueChange={(value) => setSearchParams((prev) => ({ ...prev, from: value }))}
                >
                  <SelectTrigger className="border-emerald-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.code} value={city.code}>
                        {city.name} ({city.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={swapCities}
                  className="border-emerald-200 hover:bg-emerald-50 bg-transparent"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Select
                  value={searchParams.to}
                  onValueChange={(value) => setSearchParams((prev) => ({ ...prev, to: value }))}
                >
                  <SelectTrigger className="border-emerald-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.code} value={city.code}>
                        {city.name} ({city.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="departure">Departure</Label>
                <Input
                  id="departure"
                  type="date"
                  value={searchParams.departure}
                  onChange={(e) => setSearchParams((prev) => ({ ...prev, departure: e.target.value }))}
                  className="border-emerald-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passengers">Passengers</Label>
                <Select
                  value={searchParams.passengers}
                  onValueChange={(value) => setSearchParams((prev) => ({ ...prev, passengers: value }))}
                >
                  <SelectTrigger className="border-emerald-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Passenger</SelectItem>
                    <SelectItem value="2">2 Passengers</SelectItem>
                    <SelectItem value="3">3 Passengers</SelectItem>
                    <SelectItem value="4">4 Passengers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={searchFlights} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700">
              Search Flights
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Flight Results */}
          <div className="lg:col-span-2">
            {showFlights && (
              <Card className="border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-800">Available Flights</CardTitle>
                  <CardDescription>
                    {cities.find((c) => c.code === searchParams.from)?.name} to{" "}
                    {cities.find((c) => c.code === searchParams.to)?.name} • {searchParams.departure}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {flights.map((flight) => (
                      <div
                        key={flight.id}
                        className="border border-emerald-100 rounded-lg p-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-emerald-800">{flight.departure}</p>
                              <p className="text-sm text-gray-600">{flight.from}</p>
                            </div>

                            <div className="flex-1 text-center">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <div className="h-px bg-gray-300 flex-1"></div>
                                <Plane className="h-4 w-4 text-emerald-600" />
                                <div className="h-px bg-gray-300 flex-1"></div>
                              </div>
                              <p className="text-sm text-gray-600">{flight.duration}</p>
                              <p className="text-xs text-gray-500">
                                {flight.stops === 0 ? "Non-stop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-2xl font-bold text-emerald-800">{flight.arrival}</p>
                              <p className="text-sm text-gray-600">{flight.to}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-800">₹{flight.price.toLocaleString()}</p>
                            <Button
                              onClick={() => handleBookFlight(flight)}
                              className="mt-2 bg-emerald-600 hover:bg-emerald-700"
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            <span className="font-medium">{flight.airline}</span>
                            <span>{flight.flightNumber}</span>
                            <span>{flight.aircraft}</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{flight.rating}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {flight.amenities.map((amenity, index) => (
                              <div key={index} className="text-emerald-600" title={amenity}>
                                {getAmenityIcon(amenity)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Popular Routes */}
          <div>
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800">Popular Routes</CardTitle>
                <CardDescription>Frequently searched destinations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {popularRoutes.map((route, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-emerald-100 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="font-medium text-emerald-800">
                          {route.from} → {route.to}
                        </p>
                        <p className="text-sm text-gray-600">{route.duration}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">₹{route.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Travel Tips */}
            <Card className="border-emerald-200 mt-6">
              <CardHeader>
                <CardTitle className="text-emerald-800">Travel Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <p>Arrive at airport 2 hours before domestic flights</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Luggage className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <p>Check baggage allowance before packing</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <p>Keep ID proof ready for security check</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <p>Web check-in opens 48 hours before departure</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
