"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { ServiceConfig } from "@/lib/service-integrations"

interface BrandLogoGridProps {
  brands: ServiceConfig[]
  onBrandSelect?: (brand: ServiceConfig) => void
}

export function BrandLogoGrid({ brands, onBrandSelect }: BrandLogoGridProps) {
  if (!brands || !Array.isArray(brands) || brands.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {brands.map((brand) => (
        <Link key={brand.id} href={brand.path}>
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-emerald-200 dark:border-slate-700 h-full hover:scale-105 transform"
            onClick={() => onBrandSelect?.(brand)}
          >
            <CardContent className="p-3 flex flex-col items-center justify-center h-full gap-2">
              <div className="text-4xl">{brand.icon}</div>
              <p className="text-xs font-semibold text-center text-gray-800 dark:text-slate-200 line-clamp-1">
                {brand.name}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
