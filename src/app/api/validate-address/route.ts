import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { street, apt, city, state, zip } = await req.json();

  if (!street || !city || !state || !zip) {
    return NextResponse.json(
      { valid: false, error: "Missing required address fields." },
      { status: 400 }
    );
  }

  const addressLine = [street, apt].filter(Boolean).join(" ");
  const fullAddress = `${addressLine}, ${city}, ${state} ${zip}`;
  const encoded = encodeURIComponent(fullAddress);

  try {
    const url =
      `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress` +
      `?address=${encoded}&benchmark=Public_AR_Current&format=json`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!res.ok) {
      throw new Error(`Census API returned ${res.status}`);
    }

    const data = await res.json();
    const matches: unknown[] =
      data?.result?.addressMatches ?? [];

    if (matches.length === 0) {
      return NextResponse.json({
        valid: false,
        error: "Address could not be verified. Please check your entry and try again.",
      });
    }

    const match = matches[0] as {
      matchedAddress: string;
      coordinates: { x: number; y: number };
    };

    return NextResponse.json({
      valid: true,
      fullAddress: match.matchedAddress,
      coordinates: {
        lat: match.coordinates.y,
        lon: match.coordinates.x,
      },
    });
  } catch (err) {
    console.error("Address validation error:", err);
    return NextResponse.json(
      { valid: false, error: "Validation service unavailable. Please try again." },
      { status: 502 }
    );
  }
}
