"use client";

import { useEffect, useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { BookingData } from "@/lib/types";

const SERVICE_PRICE = 149.0;

// ──────────────────────────────────────────────
// Inner form rendered inside <Elements>
// ──────────────────────────────────────────────
function CheckoutForm({ onSuccess }: { onSuccess: (id: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setLoading(false);
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setError("Unexpected payment status. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing…
          </>
        ) : (
          `Pay $${SERVICE_PRICE.toFixed(2)}`
        )}
      </button>
    </form>
  );
}

// ──────────────────────────────────────────────
// Demo form shown when Stripe is not configured
// ──────────────────────────────────────────────
function DemoPaymentForm({ onSuccess }: { onSuccess: (id: string) => void }) {
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onSuccess(`demo_${Date.now()}`);
    }, 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm">
        <strong>Demo mode:</strong> Stripe keys are not configured. No real charge
        will occur. Add <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> and{" "}
        <code className="bg-amber-100 px-1 rounded">STRIPE_SECRET_KEY</code> to enable live payments.
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
          <input
            type="text"
            defaultValue="4242 4242 4242 4242"
            readOnly
            className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-gray-500 font-mono text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
            <input
              type="text"
              defaultValue="12 / 28"
              readOnly
              className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-gray-500 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
            <input
              type="text"
              defaultValue="123"
              readOnly
              className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-gray-500 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing…
          </>
        ) : (
          `Complete Booking — $${SERVICE_PRICE.toFixed(2)} (Demo)`
        )}
      </button>
    </form>
  );
}

// ──────────────────────────────────────────────
// Main PaymentStep
// ──────────────────────────────────────────────
interface Props {
  bookingData: BookingData;
  onNext: (paymentIntentId: string) => void;
  onBack: () => void;
}

export default function PaymentStep({ bookingData, onNext, onBack }: Props) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const stripeEnabled = publishableKey.startsWith("pk_");

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [stripePromise] = useState(() =>
    stripeEnabled ? loadStripe(publishableKey) : null
  );

  const { address, schedule, contact } = bookingData;

  const initPaymentIntent = useCallback(async () => {
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, schedule, contact }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setClientSecret(json.clientSecret);
    } catch (err) {
      setInitError(err instanceof Error ? err.message : "Failed to initialize payment.");
    }
  }, [address, schedule, contact]);

  useEffect(() => {
    if (stripeEnabled) {
      initPaymentIntent();
    }
  }, [stripeEnabled, initPaymentIntent]);

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment</h2>
      <p className="text-gray-500 mb-6">Review your booking and complete payment.</p>

      {/* Order Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-2 text-sm">
        <h3 className="font-semibold text-gray-900 text-base mb-3">Booking Summary</h3>
        <div className="flex justify-between text-gray-600">
          <span>Address</span>
          <span className="text-right max-w-[60%] text-gray-900">{address.fullAddress}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Date</span>
          <span className="text-gray-900">{formatDate(schedule.date)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Time</span>
          <span className="text-gray-900">{schedule.timeSlot}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Customer</span>
          <span className="text-gray-900">{contact.firstName} {contact.lastName}</span>
        </div>
        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-semibold text-gray-900">
          <span>Service Visit Fee</span>
          <span>${SERVICE_PRICE.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Form */}
      {stripeEnabled ? (
        initError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm mb-4">
            {initError}
          </div>
        ) : !clientSecret ? (
          <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Preparing secure checkout…
          </div>
        ) : (
          stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm onSuccess={onNext} />
            </Elements>
          )
        )
      ) : (
        <DemoPaymentForm onSuccess={onNext} />
      )}

      <div className="mt-4">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to contact info
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Payments are encrypted and secure.
      </div>
    </div>
  );
}
