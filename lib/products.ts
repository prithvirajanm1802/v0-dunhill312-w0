export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  currency: string
  category: string
}

export const PRODUCTS: Product[] = [
  {
    id: "balance-topup-100",
    name: "Balance Top-up - ₹100",
    description: "Add ₹100 to your wallet balance",
    priceInCents: 10000,
    currency: "USD",
    category: "wallet",
  },
  {
    id: "balance-topup-500",
    name: "Balance Top-up - ₹500",
    description: "Add ₹500 to your wallet balance",
    priceInCents: 50000,
    currency: "USD",
    category: "wallet",
  },
  {
    id: "balance-topup-1000",
    name: "Balance Top-up - ₹1000",
    description: "Add ₹1000 to your wallet balance",
    priceInCents: 100000,
    currency: "USD",
    category: "wallet",
  },
  {
    id: "premium-subscription-monthly",
    name: "Premium Membership - Monthly",
    description: "Premium features for 1 month",
    priceInCents: 9999,
    currency: "USD",
    category: "subscription",
  },
  {
    id: "premium-subscription-yearly",
    name: "Premium Membership - Yearly",
    description: "Premium features for 1 year",
    priceInCents: 99999,
    currency: "USD",
    category: "subscription",
  },
]

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}
