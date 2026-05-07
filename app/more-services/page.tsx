"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { serviceIntegrations, categories } from "@/lib/service-integrations"
import { ServiceCard } from "@/components/service-card"

export default function MoreServicesPage() {
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState("telecom")

  const getCategoryServices = (categoryId: string) => {
    return Object.values(serviceIntegrations).filter((service) => service.category === categoryId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="border-emerald-200 hover:bg-emerald-50 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">All Services</h1>
            <p className="text-gray-600 dark:text-slate-400">Access 50+ payment and booking services</p>
          </div>
        </div>

        <Tabs defaultValue="telecom" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-emerald-50 dark:bg-slate-800 p-1 h-auto gap-1">
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs sm:text-sm dark:text-slate-300">
                <span className="mr-1">{cat.icon}</span>
                <span className="hidden sm:inline">{cat.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <Card className="border-emerald-200 dark:border-slate-800 dark:bg-slate-900 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                    <span className="text-2xl">{category.icon}</span>
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getCategoryServices(category.id).map((service) => (
                      <ServiceCard key={service.id} service={service} minimal={false} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
