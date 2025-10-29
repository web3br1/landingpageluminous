// Debug script to test page composition
import { composePage } from "./lib/composition/page-composer.js";

async function testComposition() {
  console.log("🧪 Testing page composition...");

  try {
    console.log("Testing landing page composition...");
    const sections = await composePage("landing");

    console.log(`📊 Sections composed: ${sections.length}`);
    console.log(
      "🏷️ Section IDs:",
      sections.map((s) => s.id),
    );

    const expectedSections = [
      "hero",
      "benefits",
      "features",
      "pricing",
      "social-proof",
      "demo",
      "faq",
      "final-cta",
      "footer",
    ];

    console.log("🎯 Expected sections:", expectedSections.length);
    console.log("✅ Found sections:");
    expectedSections.forEach((expected) => {
      const found = sections.some((s) => s.id === expected);
      console.log(`  - ${expected}: ${found ? "✅" : "❌"}`);
    });

    const foundCount = expectedSections.filter((expected) =>
      sections.some((s) => s.id === expected),
    ).length;

    console.log(
      `\n📈 Summary: ${foundCount}/${expectedSections.length} sections found`,
    );

    if (foundCount < expectedSections.length) {
      console.log("⚠️ Some sections are missing!");
      return false;
    } else {
      console.log("🎉 All sections found!");
      return true;
    }
  } catch (error) {
    console.error("❌ Composition test failed:", error);
    return false;
  }
}

testComposition().then((success) => {
  process.exit(success ? 0 : 1);
});
