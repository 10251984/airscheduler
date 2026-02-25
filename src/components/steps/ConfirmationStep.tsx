"use client";

import { BookingData } from "@/lib/types";

interface Props {
  bookingData: BookingData;
  paymentIntentId: string;
  onReset: () => void;
}

export default function ConfirmationStep({ bookingData, paymentIntentId, onReset }: Props) {
  const { address, schedule, contact } = bookingData;

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  }

  const confirmationNumber = paymentIntentId.startsWith("demo_")
    ? `AIR-${paymentIntentId.slice(-6).toUpperCase()}`
    : `AIR-${paymentIntentId.slice(-8).toUpperCase()}`;

  return (
    <div className="text-center">
      {/* Success icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
      <p className="text-gray-500 mb-1">
        Thanks, <strong>{contact.firstName}</strong>! Your appointment is scheduled.
      </p>
      <p className="text-sm text-gray-400 mb-8">
        Confirmation #{" "}
        <span className="font-mono font-semibold text-gray-600">{confirmationNumber}</span>
      </p>

      {/* Details card */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left space-y-3 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Service Address</p>
            <p className="text-gray-900 text-sm mt-0.5">{address.fullAddress}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Appointment</p>
            <p className="text-gray-900 text-sm mt-0.5">{formatDate(schedule.date)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Confirmation sent to</p>
            <p className="text-gray-900 text-sm mt-0.5">{contact.email}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Our technician will arrive within the selected window. You&#39;ll receive a reminder the day before your appointment.
      </p>

      <button
        onClick={onReset}
        className="text-blue-600 hover:text-blue-700 text-sm font-medium underline underline-offset-2 transition-colors"
      >
        Book another appointment
      </button>
    </div>
  );
}
