"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CreditCard, Smartphone, Plane, ShoppingCart, Utensils, PaintRoller as GameController2, Heart, GraduationCap, Building, Truck, Search, ArrowLeft, ExternalLink, Star, TrendingUp, Shield, Zap } from 'lucide-react'
import Link from "next/link"

interface Integration {
  id: string
  name: string
  description: string
  category: string
  status: "active" | "beta" | "coming-soon"
  icon: React.ReactNode
  rating: number
  users: string
  href?: string
}

const integrations: Integration[] = [
  // Payment Gateways
  {
    id: "razorpay",
    name: "Razorpay",
    description: "Complete payment solution for businesses",
    category: "Payment Gateways",
    status: "active",
    icon: <CreditCard className="h-6 w-6" />,
    rating: 4.8,
    users: "50M+",
    href: "/integrations/razorpay",
  },
  {
    id: "paytm",
    name: "Paytm",
    description: "India's leading digital payment platform",
    category: "Payment Gateways",
    status: "active",
    icon: <Smartphone className="h-6 w-6" />,
    rating: 4.5,
    users: "350M+",
    href: "/integrations/paytm",
  },

  // UPI & Banking
  {
    id: "upi",
    name: "UPI Integration",
    description: "Unified Payments Interface for instant transfers",
    category: "Banking",
    status: "active",
    icon: <Smartphone className="h-6 w-6" />,
    rating: 4.9,
    users: "500M+",
    href: "/integrations/upi",
  },
  {
    id: "phonepe",
    name: "PhonePe",
    description: "Digital payments and financial services",
    category: "Banking",
    status: "active",
    icon: <Smartphone className="h-6 w-6" />,
    rating: 4.7,
    users: "400M+",
    href: "/integrations/phonepe",
  },
  {
    id: "googlepay",
    name: "Google Pay",
    description: "Simple and secure digital wallet",
    category: "Banking",
    status: "active",
    icon: <Smartphone className="h-6 w-6" />,
    rating: 4.6,
    users: "150M+",
    href: "/integrations/googlepay",
  },

  // Travel
  {
    id: "flights",
    name: "Flight Booking",
    description: "Book flights across India with best prices",
    category: "Travel",
    status: "active",
    icon: <Plane className="h-6 w-6" />,
    rating: 4.4,
    users: "10M+",
    href: "/integrations/flights",
  },
  {
    id: "makemytrip",
    name: "MakeMyTrip",
    description: "Complete travel booking platform",
    category: "Travel",
    status: "beta",
    icon: <Plane className="h-6 w-6" />,
    rating: 4.3,
    users: "25M+",
    href: "/integrations/makemytrip",
  },
  {
    id: "oyo",
    name: "OYO Hotels",
    description: "Budget hotel booking platform",
    category: "Travel",
    status: "active",
    icon: <Building className="h-6 w-6" />,
    rating: 4.1,
    users: "15M+",
    href: "/integrations/oyo",
  },

  // E-commerce
  {
    id: "amazon",
    name: "Amazon Pay",
    description: "Shop and pay on Amazon marketplace",
    category: "E-commerce",
    status: "active",
    icon: <ShoppingCart className="h-6 w-6" />,
    rating: 4.5,
    users: "200M+",
    href: "/integrations/amazon",
  },
  {
    id: "flipkart",
    name: "Flipkart",
    description: "India's leading e-commerce platform",
    category: "E-commerce",
    status: "active",
    icon: <ShoppingCart className="h-6 w-6" />,
    rating: 4.3,
    users: "350M+",
    href: "/integrations/flipkart",
  },
  {
    id: "myntra",
    name: "Myntra",
    description: "Fashion and lifestyle shopping",
    category: "E-commerce",
    status: "beta",
    icon: <ShoppingCart className="h-6 w-6" />,
    rating: 4.2,
    users: "50M+",
    href: "/integrations/myntra",
  },

  // Food Delivery
  {
    id: "zomato",
    name: "Zomato",
    description: "Food delivery and restaurant discovery",
    category: "Food",
    status: "active",
    icon: <Utensils className="h-6 w-6" />,
    rating: 4.2,
    users: "100M+",
    href: "/integrations/zomato",
  },
  {
    id: "swiggy",
    name: "Swiggy",
    description: "On-demand food delivery platform",
    category: "Food",
    status: "active",
    icon: <Utensils className="h-6 w-6" />,
    rating: 4.3,
    users: "80M+",
    href: "/integrations/swiggy",
  },
  {
    id: "ubereats",
    name: "Uber Eats",
    description: "Global food delivery service",
    category: "Food",
    status: "coming-soon",
    icon: <Utensils className="h-6 w-6" />,
    rating: 4.0,
    users: "50M+",
    href: "/integrations/ubereats",
  },

  // Entertainment & Gaming
  {
    id: "gaming",
    name: "Gaming Platforms",
    description: "Add money to gaming accounts",
    category: "Entertainment",
    status: "active",
    icon: <GameController2 className="h-6 w-6" />,
    rating: 4.6,
    users: "5M+",
    href: "/gaming",
  },
  {
    id: "netflix",
    name: "Netflix",
    description: "Streaming entertainment platform",
    category: "Entertainment",
    status: "beta",
    icon: <GameController2 className="h-6 w-6" />,
    rating: 4.8,
    users: "230M+",
    href: "/integrations/netflix",
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Music streaming service",
    category: "Entertainment",
    status: "active",
    icon: <GameController2 className="h-6 w-6" />,
    rating: 4.7,
    users: "400M+",
    href: "/integrations/spotify",
  },

  // Health & Fitness
  {
    id: "healthcare",
    name: "Healthcare Services",
    description: "Book appointments and health checkups",
    category: "Health",
    status: "active",
    icon: <Heart className="h-6 w-6" />,
    rating: 4.5,
    users: "2M+",
    href: "/healthcare",
  },
  {
    id: "practo",
    name: "Practo",
    description: "Online doctor consultation platform",
    category: "Health",
    status: "active",
    icon: <Heart className="h-6 w-6" />,
    rating: 4.4,
    users: "30M+",
    href: "/integrations/practo",
  },
  {
    id: "1mg",
    name: "1mg",
    description: "Online pharmacy and health services",
    category: "Health",
    status: "beta",
    icon: <Heart className="h-6 w-6" />,
    rating: 4.3,
    users: "20M+",
    href: "/integrations/1mg",
  },

  // Education
  {
    id: "byjus",
    name: "BYJU'S",
    description: "Online learning and education platform",
    category: "Education",
    status: "active",
    icon: <GraduationCap className="h-6 w-6" />,
    rating: 4.2,
    users: "100M+",
    href: "/integrations/byjus",
  },
  {
    id: "unacademy",
    name: "Unacademy",
    description: "Competitive exam preparation platform",
    category: "Education",
    status: "active",
    icon: <GraduationCap className="h-6 w-6" />,
    rating: 4.4,
    users: "50M+",
    href: "/integrations/unacademy",
  },
  {
    id: "coursera",
    name: "Coursera",
    description: "Online courses from top universities",
    category: "Education",
    status: "coming-soon",
    icon: <GraduationCap className="h-6 w-6" />,
    rating: 4.6,
    users: "100M+",
    href: "/integrations/coursera",
  },

  // Cryptocurrency
  {
    id: "crypto",
    name: "Cryptocurrency Trading",
    description: "Buy, sell and trade cryptocurrencies",
    category: "Investment",
    status: "active",
    icon: <TrendingUp className="h-6 w-6" />,
    rating: 4.3,
    users: "1M+",
    href: "/integrations/crypto",
  },
  {
    id: "investments",
    name: "Investment Platform",
    description: "Stocks, mutual funds, and bonds",
    category: "Investment",
    status: "active",
    icon: <TrendingUp className="h-6 w-6" />,
    rating: 4.7,
    users: "3M+",
    href: "/integrations/investments",
  },

  // Business & Logistics
  {
    id: "gst-billing",
    name: "GST Billing",
    description: "Generate GST compliant invoices",
    category: "Business",
    status: "beta",
    icon: <Building className="h-6 w-6" />,
    rating: 4.1,
    users: "500K+",
    href: "/integrations/gst-billing",
  },
  {
    id: "logistics",
    name: "Logistics & Shipping",
    description: "Package delivery and tracking",
    category: "Logistics",
    status: "active",
    icon: <Truck className="h-6 w-6" />,
    rating: 4.0,
    users: "1M+",
    href: "/integrations/logistics",
  },
]

const categories = [
  "All",
  "Payment Gateways",
  "Banking",
  "Travel",
  "E-commerce",
  "Food",
  "Entertainment",
  "Health",
  "Education",
  "Investment",
  "Business",
  "Logistics",
]

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesCategory = selectedCategory === "All" || integration.category === selectedCategory
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>
      case "beta":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Beta</Badge>
      case "coming-soon":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Coming Soon</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="border-emerald-200 hover:bg-emerald-50 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">Integrations</h1>
            <p className="text-gray-600 dark:text-gray-400">Connect with 100+ services and platforms</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-emerald-200 focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "border-emerald-200 hover:bg-emerald-50"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-800">{integrations.length}</p>
                  <p className="text-sm text-gray-600">Total Integrations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-800">
                    {integrations.filter((i) => i.status === "active").length}
                  </p>
                  <p className="text-sm text-gray-600">Active Services</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-800">
                    {integrations.filter((i) => i.status === "beta").length}
                  </p>
                  <p className="text-sm text-gray-600">Beta Features</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-800">4.5</p>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <Card key={integration.id} className="border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">{integration.icon}</div>
                    <div>
                      <CardTitle className="text-lg text-emerald-800">{integration.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">{integration.rating}</span>
                        </div>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-600">{integration.users} users</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(integration.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-gray-600 mb-4">{integration.description}</CardDescription>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                    {integration.category}
                  </Badge>
                  {integration.href && (
                    <Link href={integration.href}>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={integration.status === "coming-soon"}
                      >
                        {integration.status === "coming-soon" ? "Coming Soon" : "Connect"}
                        {integration.status !== "coming-soon" && <ExternalLink className="h-3 w-3 ml-1" />}
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No integrations found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                Need a custom integration?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Contact our team to discuss custom integrations for your business needs.
              </p>
              <Button className="bg-emerald-600 hover:bg-emerald-700">Contact Support</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
