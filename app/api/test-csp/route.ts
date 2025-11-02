import { NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  HTTP_STATUS,
} from "../../../lib/architecture/api-handler";

// CSP Test Endpoint
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return createErrorResponse(
      "CSP_TEST_NOT_ALLOWED_IN_PRODUCTION",
      "CSP test endpoint only available in development",
      { status: HTTP_STATUS.FORBIDDEN }
    );
  }

  try {
    const url = new URL(request.url);
    const testType = url.searchParams.get("test") || "nonce";

    if (testType === "nonce") {
      // Test nonce generation
      const crypto = await import("crypto");
      const nonce = crypto.randomBytes(16).toString("base64");

      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>CSP Nonce Test</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script nonce="${nonce}">
            console.log('[CSP Test] Nonce-based script executed successfully:', '${nonce}');
            document.body.innerHTML = '<h1>✅ CSP Nonce Test Passed</h1><p>Nonce: ${nonce}</p>';
          </script>
        </head>
        <body>
          <h1>Testing CSP Nonce...</h1>
        </body>
        </html>
      `,
        {
          headers: {
            "Content-Type": "text/html",
            "Content-Security-Policy": `default-src 'self'; script-src 'self' 'nonce-${nonce}'`,
          },
        },
      );
    }

    if (testType === "report") {
      // Test CSP reporting
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>CSP Report Test</title>
          <script>
            // This should trigger a CSP violation report
            eval('console.log("This should be blocked by CSP")');
          </script>
        </head>
        <body>
          <h1>CSP Report Test</h1>
          <p>Check console for CSP violation reports</p>
        </body>
        </html>
      `,
        {
          headers: {
            "Content-Type": "text/html",
            "Content-Security-Policy": `default-src 'self'; script-src 'self'; report-uri /api/csp-report`,
          },
        },
      );
    }

    return createErrorResponse(
      "INVALID_CSP_TEST_TYPE",
      "Invalid test type",
      {
        status: HTTP_STATUS.BAD_REQUEST,
        details: {
          availableTests: ["nonce", "report"],
          usage: "/api/test-csp?test=nonce or /api/test-csp?test=report",
        },
      }
    );
  } catch (error) {
    console.error("[CSP Test Error]", error);
    return createErrorResponse(
      "CSP_TEST_FAILED",
      "CSP test failed",
      {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        details: error instanceof Error ? error.message : String(error),
      }
    );
  }
}
