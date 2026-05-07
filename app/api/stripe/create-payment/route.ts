export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { getNeon } from "@/lib/neon"

export async function POST(req: Request) {
  try {
    const stripe = getStripe()

    if (!stripe) {
      return NextResponse.json(
        {
          success: false,
          message: "Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.",
        },
        { status: 500 },
      )
    }

    const { userId, amount, currency = "inr", description } = await req.json()

    if (!userId || !amount) {
      return NextResponse.json({ success: false, message: "userId and amount are required" }, { status: 400 })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      redirect_on_completion: "never",
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "Wallet Top-up",
              description: description || `Add ₹${amount / 100} to your Honeydrew Mills wallet`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        userId,
        type: "wallet_topup",
      },
    })

    const sql = getNeon()
    if (sql) {
      try {
        await sql`
          INSERT INTO admin_logs (action, admin_username, details, created_at)
          VALUES (
            'stripe_session_created',
            'system',
            ${JSON.stringify({ sessionId: session.id, userId, amount, currency })}::jsonb,
            NOW()
          )
        `
      } catch (logErr) {
        console.error("[v0] Failed to log stripe session:", logErr)
      }
    }

    return NextResponse.json({
      success: true,
      clientSecret: session.client_secret,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error("[v0] Stripe create payment error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
