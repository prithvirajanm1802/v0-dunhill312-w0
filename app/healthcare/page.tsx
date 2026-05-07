"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Stethoscope, Pill, Activity, Clipboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

// Healthcare services
const healthcareServices = [
  {
    id: "consultation",
    name: "Doctor Consultation",
    description: "Book online doctor appointments",
    icon: <Stethoscope className="h-6 w-6 text-pink-600" />,
  },
  {
    id: "medicines",
    name: "Medicines",
    description: "Order medicines online",
    icon: <Pill className="h-6 w-6 text-pink-600" />,
  },
  {
    id: "insurance",
    name: "Health Insurance",
    description: "Buy or renew health insurance",
    icon: <Clipboard className="h-6 w-6 text-pink-600" />,
  },
  {
    id: "labtest",
    name: "Lab Tests",
    description: "Book diagnostic tests",
    icon: <Activity className="h-6 w-6 text-pink-600" />,
  },
]

export default function HealthcarePage() {
  const { toast } = useToast()
  const [selectedService, setSelectedService] = useState<any>(null)

  const handleSelectService = (service: any) => {
    setSelectedService(service)
    toast({
      title: `${service.name} Selected`,
      description: "This feature will be available soon.",
    })
  }

  return (
    <div className="container max-w-md mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Healthcare</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Healthcare Services</CardTitle>
          <CardDescription>Access healthcare services and pay through KC Pay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {healthcareServices.map((service) => (
              <Card
                key={service.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleSelectService(service)}
              >
                <CardContent className="flex flex-col items-center justify-center p-4">
                  <div className="bg-pink-100 p-3 rounded-full mb-2">{service.icon}</div>
                  <span className="text-sm font-medium">{service.name}</span>
                  <span className="text-xs text-gray-500 text-center">{service.description}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-gray-500 w-full text-center">
            Pay for healthcare services securely through KC Pay
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
