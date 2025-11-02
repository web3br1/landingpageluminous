import {
  createSuccessResponse,
  createErrorResponse,
  HTTP_STATUS,
} from "../../../lib/architecture/api-handler";

// Import the audit store from middleware (in a real app, this would be shared state)
const scriptAuditStore = new Map<
  string,
  { count: number; lastSeen: number; sources: Set<string> }
>();

// Script Audit Debug Endpoint
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return createErrorResponse(
      "SCRIPT_AUDIT_NOT_ALLOWED_IN_PRODUCTION",
      "Script audit endpoint only available in development",
      { status: HTTP_STATUS.FORBIDDEN }
    );
  }

  try {
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const sortBy = url.searchParams.get("sort") || "count"; // 'count' or 'lastSeen'

    // Convert Map to array for sorting
    const scripts = Array.from(scriptAuditStore.entries()).map(
      ([path, data]) => ({
        path,
        count: data.count,
        lastSeen: new Date(data.lastSeen).toISOString(),
        sources: Array.from(data.sources),
      }),
    );

    // Sort by requested field
    scripts.sort((a, b) => {
      if (sortBy === "lastSeen") {
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      }
      return b.count - a.count;
    });

    // Limit results
    const limitedScripts = scripts.slice(0, limit);

    // Generate summary statistics
    const totalScripts = scripts.length;
    const totalRequests = scripts.reduce(
      (sum, script) => sum + script.count,
      0,
    );
    const nonNextScripts = scripts.filter(
      (script) =>
        script.path.includes(".js") &&
        !script.path.startsWith("/_next/") &&
        !script.path.startsWith("/api/"),
    );

    const summary = {
      totalScripts,
      totalRequests,
      nonNextScriptsCount: nonNextScripts.length,
      timestamp: new Date().toISOString(),
      sortBy,
      limit,
    };

    return createSuccessResponse({
      summary,
      scripts: limitedScripts,
      alerts:
        nonNextScripts.length > 0
          ? {
              message: `${nonNextScripts.length} scripts detected outside Next.js bundle`,
              scripts: nonNextScripts.map((s) => s.path),
            }
          : null,
    });
  } catch (error) {
    console.error("[Script Audit API Error]", error);
    return createErrorResponse(
      "SCRIPT_AUDIT_FETCH_FAILED",
      "Failed to fetch script audit data",
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// Clear audit data
export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return createErrorResponse(
      "SCRIPT_AUDIT_DELETE_NOT_ALLOWED_IN_PRODUCTION",
      "Script audit endpoint only available in development",
      { status: HTTP_STATUS.FORBIDDEN }
    );
  }

  try {
    scriptAuditStore.clear();
    return createSuccessResponse({
      status: "ok",
      message: "Script audit data cleared",
    });
  } catch (error) {
    console.error("[Script Audit Clear Error]", error);
    return createErrorResponse(
      "SCRIPT_AUDIT_CLEAR_FAILED",
      "Failed to clear script audit data",
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
