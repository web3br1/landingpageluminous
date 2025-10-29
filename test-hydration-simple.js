// Simple hydration test
const puppeteer = require("playwright");

async function testHydration() {
  console.log("🧪 Testing hydration with Playwright...");

  const browser = await puppeteer.chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the page
    console.log("📄 Loading page...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // Wait for hydration
    console.log("⏳ Waiting for hydration...");
    await page.waitForTimeout(2000);

    // Wait for lazy-loaded components
    console.log("⏳ Waiting for lazy components...");
    await page.waitForTimeout(3000);

    // Scroll to bottom to trigger lazy loading
    console.log("📜 Scrolling to bottom to trigger lazy loading...");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    // Check if sections are rendered
    const sections = await page.$$eval("[data-section]", (elements) => {
      return elements.map((el) => ({
        id: el.getAttribute("data-section"),
        hasContent: el.innerHTML.trim().length > 50, // More lenient content check
        hasChildren: el.children.length > 0,
        innerHTML: el.innerHTML.substring(0, 200) + "...", // Debug content
        isVisible: el.offsetWidth > 0 && el.offsetHeight > 0,
      }));
    });

    console.log("🔍 Detailed section analysis:");
    sections.forEach((section) => {
      console.log(
        `  - ${section.id}: content=${section.hasContent}, children=${section.hasChildren}, visible=${section.isVisible}`,
      );
      if (!section.hasContent && !section.hasChildren) {
        console.log(`    HTML preview: ${section.innerHTML}`);
      }
    });

    console.log(`📊 Found ${sections.length} sections:`);
    sections.forEach((section) => {
      console.log(
        `  - ${section.id}: ${section.hasContent ? "✅" : "❌"} content, ${section.isVisible ? "👁️" : "🙈"} visible`,
      );
    });

    // Check for hydration errors and console logs
    const errors = [];
    const consoleLogs = [];
    const consoleErrors = [];

    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    page.on("console", (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      if (
        text.includes("Demo component") ||
        text.includes("🎬") ||
        text.includes("💥")
      ) {
        console.log("🎬 DEMO LOG:", text);
      }
      if (msg.type() === "error") {
        consoleErrors.push(text);
      }
    });

    // Wait a bit more
    await page.waitForTimeout(1000);

    console.log(`📝 Captured ${consoleLogs.length} console messages`);
    console.log(`🚨 Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log("❌ Console errors:");
      consoleErrors.forEach((error) => console.log(`   - ${error}`));
    }

    if (errors.length > 0) {
      console.log("❌ Hydration errors found:");
      errors.forEach((error) => console.log(`  - ${error}`));
    } else {
      console.log("✅ No hydration errors detected");
    }

    // Summary
    const totalSections = sections.length;
    const visibleSections = sections.filter((s) => s.isVisible).length;
    const contentSections = sections.filter((s) => s.hasContent).length;

    console.log("\n📈 Summary:");
    console.log(`  - Total sections: ${totalSections}`);
    console.log(`  - Sections with content: ${contentSections}`);
    console.log(`  - Visible sections: ${visibleSections}`);
    console.log(`  - Hydration errors: ${errors.length}`);

    if (
      totalSections >= 9 &&
      contentSections >= 9 &&
      visibleSections >= 9 &&
      errors.length === 0
    ) {
      console.log("🎉 Hydration test PASSED!");
      return true;
    } else {
      console.log("❌ Hydration test FAILED!");
      return false;
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testHydration().then((success) => {
  process.exit(success ? 0 : 1);
});
