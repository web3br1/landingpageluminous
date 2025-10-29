import { NextResponse } from "next/server";
import { composePageFull } from "@/lib/composition/page-composer";

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

    return NextResponse.json({
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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
