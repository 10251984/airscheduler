import * as https from "https";
import { NextRequest, NextResponse } from "next/server";

/**
 * Make a GET request through the HTTPS_PROXY env var if present (required in
 * some sandbox/CI environments where Node.js fetch ignores proxy vars).
 * Falls back to a direct connection when no proxy is configured.
 */
function httpsGet(url: string, timeoutMs = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);

    let agent: https.Agent | undefined;
    const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy;
    if (proxyUrl) {
      try {
        // Next.js bundles https-proxy-agent; use it without adding a dep.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Agent = require("next/dist/compiled/https-proxy-agent");
        agent = new Agent(proxyUrl) as https.Agent;
      } catch {
        // Not available — proceed without proxy
      }
    }

    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "GET",
        agent,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk: Buffer) => (body += chunk));
        res.on("end", () => resolve(body));
      }
    );

    req.setTimeout(timeoutMs, () => req.destroy(new Error("Request timed out")));
    req.on("error", reject);
    req.end();
  });
}

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

    const body = await httpsGet(url);
    const data: {
      result?: { addressMatches?: { matchedAddress: string; coordinates: { x: number; y: number } }[] };
    } = JSON.parse(body);

    const matches = data?.result?.addressMatches ?? [];

    if (matches.length === 0) {
      return NextResponse.json({
        valid: false,
        error: "Address could not be verified. Please check your entry and try again.",
      });
    }

    const match = matches[0];

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
