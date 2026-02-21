import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AirScheduler — Book Your HVAC Service",
  description: "Schedule professional HVAC service visits quickly and easily.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-50 via-white to-sky-50 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
