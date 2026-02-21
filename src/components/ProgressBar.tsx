"use client";

const STEPS = ["Address", "Schedule", "Contact", "Payment"];

interface Props {
  currentStep: number; // 0-indexed
}

export default function ProgressBar({ currentStep }: Props) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-blue-500 z-0 transition-all duration-500"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((label, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div key={label} className="flex flex-col items-center z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                  ${done ? "bg-blue-500 text-white" : active ? "bg-blue-500 text-white ring-4 ring-blue-100" : "bg-white text-gray-400 border-2 border-gray-200"}`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${active ? "text-blue-600" : done ? "text-blue-400" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
