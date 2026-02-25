import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured on this server." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });

  const body = await req.json();
  const { contact, address, schedule } = body;

  const amountCents = parseInt(process.env.SERVICE_PRICE_CENTS ?? "14900", 10);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        customerName: `${contact.firstName} ${contact.lastName}`,
        customerEmail: contact.email,
        serviceAddress: address.fullAddress ?? "",
        serviceDate: schedule.date,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
