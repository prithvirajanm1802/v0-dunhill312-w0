import Stripe from "stripe"

// Initialize Stripe with secret key from environment
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
      typescript: true,
    })
  : null

// Stripe publishable key for client-side
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""

// Helper to check if Stripe is configured
export function isStripeConfigured(): boolean {
  return !!stripe && !!STRIPE_PUBLISHABLE_KEY
}

// Create a Stripe customer for a user
export async function createStripeCustomer(userId: string, email: string, name: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured")
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
      platform: "honeydrew_mills",
    },
  })

  return customer
}

// Create a payment intent
export async function createPaymentIntent(amount: number, currency = "usd", customerId?: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured")
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
  })

  return paymentIntent
}

// Retrieve payment intent
export async function retrievePaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured")
  }

  return await stripe.paymentIntents.retrieve(paymentIntentId)
}

// Cancel payment intent
export async function cancelPaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured")
  }

  return await stripe.paymentIntents.cancel(paymentIntentId)
}
