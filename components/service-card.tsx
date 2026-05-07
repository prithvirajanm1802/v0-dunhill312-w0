"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import type { ServiceConfig } from "@/lib/service-integrations"

interface ServiceCardProps {
  service: ServiceConfig
  onSelect?: (service: ServiceConfig) => void
  minimal?: boolean
}

export function ServiceCard({ service, onSelect, minimal = false }: ServiceCardProps) {
  if (minimal) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow border-emerald-200 dark:border-slate-700 h-full">
        <CardContent className="p-4 flex flex-col items-center justify-center h-full gap-2">
          <div className="text-3xl">{service.icon}</div>
          <h3 className="text-sm font-semibold text-center dark:text-slate-200">{service.name}</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 text-center line-clamp-2">{service.description}</p>
          {service.status === "active" && (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-xs">
              Active
            </Badge>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-emerald-200 hover:shadow-lg transition-shadow dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl p-2 bg-gray-100 dark:bg-slate-800 rounded-lg">{service.icon}</div>
            <div>
              <CardTitle className="text-lg text-emerald-800 dark:text-emerald-400">{service.name}</CardTitle>
              <CardDescription className="text-gray-600 dark:text-slate-400">{service.description}</CardDescription>
            </div>
          </div>
          <Badge
            className={`${
              service.status === "active"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            }`}
          >
            {service.status === "active" ? "Active" : "Coming Soon"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {service.providers && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Providers:</p>
              <div className="flex flex-wrap gap-2">
                {service.providers.map((provider) => (
                  <Badge key={provider} variant="secondary" className="dark:bg-slate-800 dark:text-slate-200">
                    {provider}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {service.features && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Features:</p>
              <ul className="space-y-1">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link href={service.path}>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600">
              Access Service
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
