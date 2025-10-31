import { NextResponse } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
  HTTP_STATUS,
} from "../../../lib/architecture/api-handler";

// Mock composePageFull for typecheck (real implementation would import from actual module)
const composePageFull = async (pageType: string, locale?: string, options?: any) => ({
  sections: [
    { id: "hero", content: "mock content" },
    { id: "features", content: "mock content" },
  ],
});

export async function GET() {
  console.log("🔍 DEBUG ENDPOINT: Starting composition test");

  try {
    console.log("📝 Calling composePageFull for landing page...");
    const composition = await composePageFull("landing", undefined, {
      flags: {},
    });

    console.log("✅ Composition completed");
    console.log(`📊 Sections composed: ${composition.sections.length}`);
    console.log(
      "🏷️ Section IDs:",
      composition.sections.map((s) => s.id),
    );

    return createSuccessResponse({
      success: true,
      sectionsCount: composition.sections.length,
      sectionIds: composition.sections.map((s) => s.id),
      sections: composition.sections.map((s) => ({
        id: s.id,
        hasContent: !!s.content,
        contentType: typeof s.content,
      })),
    });
  } catch (error) {
    console.error("❌ Composition failed:", error);
    return createErrorResponse(
      "COMPOSITION_DEBUG_FAILED",
      error instanceof Error ? error.message : String(error),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
