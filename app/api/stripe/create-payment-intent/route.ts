import { type NextRequest, NextResponse } from "next/server"
import { getNeon } from "@/lib/neon"
import { createPaymentIntent, createStripeCustomer, isStripeConfigured } from "@/lib/stripe-config"

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ success: false, error: "Stripe is not configured" }, { status: 500 })
    }

    const { userId, amount, currency = "usd" } = await request.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid request parameters" }, { status: 400 })
    }

    const sql = getNeon()
    if (!sql) {
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 500 })
    }

    // Get user information
    const userResult = await sql`
      SELECT id, full_name, email, mobile FROM honeydrew_users WHERE id = ${userId}::uuid
    `

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const user = userResult[0]

    // Check if user has a Stripe customer ID
    let stripeCustomerId = user.stripe_customer_id

    if (!stripeCustomerId) {
      // Create Stripe customer
      const customer = await createStripeCustomer(userId, user.email, user.full_name)
      stripeCustomerId = customer.id

      // Update user with Stripe customer ID
      await sql`
        ALTER TABLE honeydrew_users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)
      `
      await sql`
        UPDATE honeydrew_users SET stripe_customer_id = ${stripeCustomerId} WHERE id = ${userId}::uuid
      `
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent(amount, currency, stripeCustomerId)

    // Store payment record in database
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`
    await sql`
      INSERT INTO stripe_payments (
        payment_id, user_id, stripe_payment_intent_id, stripe_customer_id,
        amount, currency, status, metadata
      ) VALUES (
        ${paymentId},
        ${userId}::uuid,
        ${paymentIntent.id},
        ${stripeCustomerId},
        ${amount},
        ${currency},
        'pending',
        ${JSON.stringify({ created_from: "web_app" })}::jsonb
      )
    `

    // Log payment creation
    await sql`
      INSERT INTO admin_logs (admin_id, action_type, resource_type, resource_id, severity, details)
      VALUES (
        ${userId},
        'stripe_payment_created',
        'payment',
        ${paymentId},
        'low',
        ${JSON.stringify({ amount, currency, paymentIntentId: paymentIntent.id })}::jsonb
      )
    `

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId,
    })
  } catch (error: any) {
    console.error("[v0] Stripe payment intent creation error:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to create payment" }, { status: 500 })
  }
}
