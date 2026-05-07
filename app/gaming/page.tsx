"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

// Gaming apps
const gamingApps = [
  {
    id: "dream11",
    name: "Dream 11",
    description: "Fantasy sports platform",
    icon: "🏏",
  },
  {
    id: "my11circle",
    name: "My11Circle",
    description: "Fantasy cricket platform",
    icon: "🏆",
  },
  {
    id: "mpl",
    name: "MPL",
    description: "Mobile Premier League",
    icon: "🎮",
  },
  {
    id: "winzo",
    name: "WinZO",
    description: "Multi-gaming platform",
    icon: "🎯",
  },
  {
    id: "rummy",
    name: "Rummy",
    description: "Card game",
    icon: "🃏",
  },
  {
    id: "poker",
    name: "Poker",
    description: "Card game",
    icon: "♠️",
  },
]

export default function GamingPage() {
  const { toast } = useToast()
  const [selectedApp, setSelectedApp] = useState<any>(null)

  const handleSelectApp = (app: any) => {
    setSelectedApp(app)
    toast({
      title: `${app.name} Selected`,
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
        <h1 className="text-xl font-bold">Gaming</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gaming Apps</CardTitle>
          <CardDescription>Add money to your gaming accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {gamingApps.map((app) => (
              <Card
                key={app.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleSelectApp(app)}
              >
                <CardContent className="flex flex-col items-center justify-center p-4">
                  <div className="text-3xl mb-2">{app.icon}</div>
                  <span className="text-sm font-medium">{app.name}</span>
                  <span className="text-xs text-gray-500">{app.description}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-gray-500 w-full text-center">
            Note: Gaming involves financial risk. Play responsibly.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
