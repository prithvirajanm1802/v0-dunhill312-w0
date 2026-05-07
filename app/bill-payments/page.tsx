"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Zap, Wifi, Droplet, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

// Bill payment services
const services = [
  {
    id: "electricity",
    name: "Electricity Bill",
    icon: <Zap className="h-6 w-6 text-yellow-500" />,
    providers: ["Bescom", "MSEB", "TNEB", "WBSEDCL", "PSPCL"],
  },
  {
    id: "wifi",
    name: "WiFi Bill",
    icon: <Wifi className="h-6 w-6 text-blue-500" />,
    providers: ["Airtel", "Jio Fiber", "BSNL", "ACT Fibernet", "Tata Sky Broadband"],
  },
  {
    id: "water",
    name: "Water Bill",
    icon: <Droplet className="h-6 w-6 text-blue-500" />,
    providers: ["Municipal Corporation", "Water Board", "Jal Board"],
  },
  {
    id: "emi",
    name: "EMI Payment",
    icon: <CreditCard className="h-6 w-6 text-purple-500" />,
    providers: ["Home Loan EMI", "Car Loan EMI", "Personal Loan EMI", "Electronic Appliances EMI"],
  },
]

export default function BillPaymentsPage() {
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
        <h1 className="text-xl font-bold">Bill Payments</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {services.map((service) => (
          <Card
            key={service.id}
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleSelectService(service)}
          >
            <CardContent className="flex flex-col items-center justify-center p-4">
              <div className="bg-gray-100 p-3 rounded-full mb-2">{service.icon}</div>
              <span className="text-sm font-medium text-center">{service.name}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
