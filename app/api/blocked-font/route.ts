import { NextResponse } from "next/server";

export async function GET() {
  // Return 204 No Content for blocked font requests
  // This prevents 404 errors in logs while still blocking the requests
  return new NextResponse(null, {
    status: 204, // No Content
    headers: {
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}
