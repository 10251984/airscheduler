"use client";

import { useState } from "react";
import { ScheduleData, TIME_SLOTS } from "@/lib/types";

interface Props {
  data: ScheduleData;
  onNext: (data: ScheduleData) => void;
  onBack: () => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function ScheduleStep({ data, onNext, onBack }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(
    data.date ? parseInt(data.date.split("-")[0]) : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    data.date ? parseInt(data.date.split("-")[1]) - 1 : today.getMonth()
  );
  const [selectedDate, setSelectedDate] = useState<string>(data.date);
  const [selectedSlot, setSelectedSlot] = useState<string>(data.timeSlot);
  const [error, setError] = useState<string | null>(null);

  // Max bookable date: 60 days from today
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 60);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  function isAvailable(day: number): boolean {
    const d = new Date(viewYear, viewMonth, day);
    const dow = d.getDay();
    // Weekdays only, after today, within 60 days
    return dow !== 0 && dow !== 6 && d > today && d <= maxDate;
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    setSelectedDate(toLocalDateString(d));
    setSelectedSlot("");
    setError(null);
  }

  function handleNext() {
    if (!selectedDate) {
      setError("Please select a service date.");
      return;
    }
    if (!selectedSlot) {
      setError("Please select a time slot.");
      return;
    }
    onNext({ date: selectedDate, timeSlot: selectedSlot });
  }

  // Check if we can go to previous month
  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose a Date</h2>
      <p className="text-gray-500 mb-6">Select a weekday for your service visit.</p>

      {/* Calendar */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <button
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold text-gray-900">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 p-2 gap-1">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} />;
            }
            const dateStr = toLocalDateString(new Date(viewYear, viewMonth, day));
            const available = isAvailable(day);
            const selected = dateStr === selectedDate;

            return (
              <button
                key={day}
                onClick={() => available && selectDay(day)}
                disabled={!available}
                className={`
                  relative h-10 w-full rounded-lg text-sm font-medium transition-all
                  ${selected
                    ? "bg-blue-600 text-white shadow-md"
                    : available
                    ? "text-gray-900 hover:bg-blue-50 hover:text-blue-700"
                    : "text-gray-300 cursor-not-allowed"}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Available times for{" "}
            <span className="text-blue-600">{formatDateDisplay(selectedDate)}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                onClick={() => { setSelectedSlot(slot); setError(null); }}
                className={`
                  border rounded-lg px-4 py-3 text-sm font-medium text-left transition-all
                  ${selectedSlot === slot
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700"}
                `}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          className="px-5 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Continue to Contact Info
        </button>
      </div>
    </div>
  );
}
