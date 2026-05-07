import "server-only"
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const stripeInstance: Stripe | null = null

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("[Stripe] STRIPE_SECRET_KEY not set, Stripe features disabled")
    return null
  }

  return stripe
}

// Use getStripe() function instead to avoid build-time initialization
