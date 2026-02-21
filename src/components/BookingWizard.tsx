"use client";

import { useState } from "react";
import { BookingData } from "@/lib/types";
import ProgressBar from "./ProgressBar";
import AddressStep from "./steps/AddressStep";
import ScheduleStep from "./steps/ScheduleStep";
import ContactStep from "./steps/ContactStep";
import PaymentStep from "./steps/PaymentStep";
import ConfirmationStep from "./steps/ConfirmationStep";

const EMPTY_BOOKING: BookingData = {
  address: { street: "", apt: "", city: "", state: "", zip: "", validated: false },
  schedule: { date: "", timeSlot: "" },
  contact: { firstName: "", lastName: "", email: "", phone: "" },
  payment: { completed: false },
};

type Step = "address" | "schedule" | "contact" | "payment" | "confirmation";

const STEP_ORDER: Step[] = ["address", "schedule", "contact", "payment", "confirmation"];

export default function BookingWizard() {
  const [step, setStep] = useState<Step>("address");
  const [data, setData] = useState<BookingData>(EMPTY_BOOKING);
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");

  const stepIndex = STEP_ORDER.indexOf(step);

  function goNext() {
    const next = STEP_ORDER[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const prev = STEP_ORDER[stepIndex - 1];
    if (prev) setStep(prev);
  }

  function reset() {
    setData(EMPTY_BOOKING);
    setPaymentIntentId("");
    setStep("address");
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-lg mx-auto">
      {step !== "confirmation" && (
        <ProgressBar currentStep={stepIndex} />
      )}

      {step === "address" && (
        <AddressStep
          data={data.address}
          onNext={(address) => {
            setData((d) => ({ ...d, address }));
            goNext();
          }}
        />
      )}

      {step === "schedule" && (
        <ScheduleStep
          data={data.schedule}
          onNext={(schedule) => {
            setData((d) => ({ ...d, schedule }));
            goNext();
          }}
          onBack={goBack}
        />
      )}

      {step === "contact" && (
        <ContactStep
          data={data.contact}
          onNext={(contact) => {
            setData((d) => ({ ...d, contact }));
            goNext();
          }}
          onBack={goBack}
        />
      )}

      {step === "payment" && (
        <PaymentStep
          bookingData={data}
          onNext={(id) => {
            setPaymentIntentId(id);
            setData((d) => ({ ...d, payment: { completed: true, paymentIntentId: id } }));
            goNext();
          }}
          onBack={goBack}
        />
      )}

      {step === "confirmation" && (
        <ConfirmationStep
          bookingData={data}
          paymentIntentId={paymentIntentId}
          onReset={reset}
        />
      )}
    </div>
  );
}
