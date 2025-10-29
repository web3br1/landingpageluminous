import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  // Return a simple SVG favicon to avoid 404 errors
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
    <circle cx="16" cy="16" r="15" fill="#3b82f6"/>
    <text x="16" y="21" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold">D</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
