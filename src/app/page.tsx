import BookingWizard from "@/components/BookingWizard";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900">AirScheduler</span>
        </div>
        <p className="text-sm text-gray-500">Professional HVAC service, on your schedule.</p>
      </header>

      {/* Booking wizard */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12 pt-4">
        <BookingWizard />
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} AirScheduler. Licensed, insured, and background-checked technicians.
      </footer>
    </main>
  );
}
