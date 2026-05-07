import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { getNeon } from "@/lib/neon"

export async function POST(req: Request) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 400 })
    }

    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    let event

    try {
      // If webhook secret is set, verify signature
      if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
      } else {
        event = JSON.parse(body)
      }
    } catch (err: any) {
      console.error("[v0] Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const sql = getNeon()
    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object
      const userId = session.metadata?.userId
      const amount = session.amount_total

      if (userId && amount) {
        // Get user and update balance
        const userResult = await sql`
          SELECT id, full_name, balance FROM honeydrew_users WHERE id = ${userId}
        `

        if (userResult.length) {
          const user = userResult[0]
          const amountInRupees = amount / 100 // Convert paise to rupees
          const newBalance = Number(user.balance) + amountInRupees

          await sql`
            UPDATE honeydrew_users SET balance = ${newBalance}, updated_at = NOW() WHERE id = ${userId}
          `

          await sql`
            INSERT INTO user_transactions (
              user_id, transaction_type, amount, balance_before, balance_after,
              status, payment_method, description, metadata
            )
            VALUES (
              ${userId}, 'deposit', ${amountInRupees}, ${user.balance}, ${newBalance},
              'completed', 'stripe', 'Stripe payment topup',
              ${JSON.stringify({ stripeSessionId: session.id, stripePaymentIntent: session.payment_intent })}::jsonb
            )
          `

          await sql`
            INSERT INTO admin_logs (action_type, description, metadata)
            VALUES (
              'stripe_payment_completed',
              ${`Stripe payment completed for user ${user.full_name}`},
              ${JSON.stringify({
                sessionId: session.id,
                userId,
                amount: amountInRupees,
                userName: user.full_name,
                newBalance,
              })}::jsonb
            )
          `.catch(() => {})
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
