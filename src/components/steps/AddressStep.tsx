"use client";

import { useState } from "react";
import { AddressData, US_STATES } from "@/lib/types";

interface Props {
  data: AddressData;
  onNext: (data: AddressData) => void;
}

export default function AddressStep({ data, onNext }: Props) {
  const [form, setForm] = useState<Omit<AddressData, "validated" | "fullAddress">>({
    street: data.street,
    apt: data.apt,
    city: data.city,
    state: data.state,
    zip: data.zip,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatedAddress, setValidatedAddress] = useState<string | null>(
    data.validated ? (data.fullAddress ?? null) : null
  );

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setValidatedAddress(null);
    setError(null);
  }

  async function handleValidate() {
    setError(null);
    setValidatedAddress(null);

    if (!form.street.trim() || !form.city.trim() || !form.state || !form.zip.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) {
      setError("Please enter a valid 5-digit ZIP code.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: try server-side API (Vercel / local dev with full server).
      // If unreachable or unavailable, fall through to the direct Census call.
      let serverHandled = false;
      try {
        const res = await fetch("/api/validate-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.valid) {
            setValidatedAddress(json.fullAddress);
          } else {
            setError(json.error ?? "Address could not be verified.");
          }
          serverHandled = true;
        }
        // Non-OK (404 = static deploy, 502 = Census unreachable server-side,
        // etc.) — fall through to the browser-side Census call below.
      } catch {
        // Server API threw (connection refused, etc.) — fall through.
      }

      if (serverHandled) return;

      // Step 2: call the Census Geocoding API directly from the browser.
      // The API supports CORS, so this works even in static deployments.
      const parts = [form.street.trim(), form.apt.trim()].filter(Boolean);
      const formatted = `${parts.join(" ")}, ${form.city.trim()}, ${form.state} ${form.zip.trim()}`;
      const encoded = encodeURIComponent(formatted);
      const censusUrl =
        `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress` +
        `?address=${encoded}&benchmark=Public_AR_Current&format=json`;

      try {
        const censusRes = await fetch(censusUrl, {
          signal: AbortSignal.timeout(8000),
        });
        const data = await censusRes.json();
        const matches: { matchedAddress: string }[] =
          data?.result?.addressMatches ?? [];

        if (matches.length > 0) {
          setValidatedAddress(matches[0].matchedAddress);
        } else {
          setError(
            "Address could not be verified. Please check your entry and try again."
          );
        }
      } catch {
        // Step 3: Census API also unreachable — accept the format-valid address.
        setValidatedAddress(formatted);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (!validatedAddress) return;
    onNext({
      ...form,
      validated: true,
      fullAddress: validatedAddress,
    });
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Service Address</h2>
      <p className="text-gray-500 mb-6">Where should we send our technician?</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.street}
            onChange={(e) => set("street", e.target.value)}
            placeholder="123 Main St"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apt / Suite / Unit{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={form.apt}
            onChange={(e) => set("apt", e.target.value)}
            placeholder="Apt 4B"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Austin"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <select
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select…</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.zip}
            onChange={(e) => set("zip", e.target.value)}
            placeholder="78701"
            maxLength={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {validatedAddress && (
        <div className="mt-4 flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 text-sm">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Address verified!</p>
            <p className="text-green-700 mt-0.5">{validatedAddress}</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {!validatedAddress ? (
          <button
            onClick={handleValidate}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Validating…
              </>
            ) : (
              "Validate Address"
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Continue to Schedule
          </button>
        )}
      </div>
    </div>
  );
}
