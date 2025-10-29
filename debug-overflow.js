const puppeteer = require("playwright");

(async () => {
  const browser = await puppeteer.chromium.launch();

  // Test tablet viewport
  console.log("🔍 Testing Tablet (768px)...");
  const contextTablet = await browser.newContext({
    viewport: { width: 768, height: 1024 },
  });
  const pageTablet = await contextTablet.newPage();
  await pageTablet.goto("http://localhost:3001", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  const tabletOverflow = await pageTablet.evaluate(() => {
    const body = document.body;
    const hasOverflow = body.scrollWidth > window.innerWidth;
    const overflowAmount = body.scrollWidth - window.innerWidth;

    if (!hasOverflow) return null;

    const elements = Array.from(document.querySelectorAll("*"));
    const overflowingElements = elements
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.right > window.innerWidth + 1; // 1px tolerance
      })
      .map((el) => ({
        tag: el.tagName,
        id: el.id,
        class: el.className.split(" ").slice(0, 3).join(" "),
        rect: {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        },
        text: el.textContent?.slice(0, 30).replace(/\s+/g, " ").trim() || "",
      }))
      .slice(0, 5);

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      bodyScrollWidth: body.scrollWidth,
      overflowAmount,
      overflowingElements,
    };
  });

  if (tabletOverflow) {
    console.log("❌ Tablet Overflow Detected:");
    console.log(
      `   Viewport: ${tabletOverflow.viewport.width}x${tabletOverflow.viewport.height}`,
    );
    console.log(`   Body width: ${tabletOverflow.bodyScrollWidth}px`);
    console.log(`   Overflow: ${tabletOverflow.overflowAmount}px`);
    console.log("   Elements:");
    tabletOverflow.overflowingElements.forEach((el) => {
      console.log(
        `     ${el.tag}#${el.id || "no-id"}.${el.class} - right: ${el.rect.right}px, width: ${el.rect.width}px`,
      );
      if (el.text) console.log(`       Text: "${el.text}..."`);
    });
  } else {
    console.log("✅ No tablet overflow detected");
  }

  await contextTablet.close();

  // Test desktop viewport
  console.log("\n🔍 Testing Desktop (1280px)...");
  const contextDesktop = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.goto("http://localhost:3001", {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  const desktopOverflow = await pageDesktop.evaluate(() => {
    const body = document.body;
    const hasOverflow = body.scrollWidth > window.innerWidth;
    const overflowAmount = body.scrollWidth - window.innerWidth;

    if (!hasOverflow) return null;

    const elements = Array.from(document.querySelectorAll("*"));
    const overflowingElements = elements
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.right > window.innerWidth + 1;
      })
      .map((el) => ({
        tag: el.tagName,
        id: el.id,
        class: el.className.split(" ").slice(0, 3).join(" "),
        rect: {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        },
        text: el.textContent?.slice(0, 30).replace(/\s+/g, " ").trim() || "",
      }))
      .slice(0, 5);

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      bodyScrollWidth: body.scrollWidth,
      overflowAmount,
      overflowingElements,
    };
  });

  if (desktopOverflow) {
    console.log("❌ Desktop Overflow Detected:");
    console.log(
      `   Viewport: ${desktopOverflow.viewport.width}x${desktopOverflow.viewport.height}`,
    );
    console.log(`   Body width: ${desktopOverflow.bodyScrollWidth}px`);
    console.log(`   Overflow: ${desktopOverflow.overflowAmount}px`);
    console.log("   Elements:");
    desktopOverflow.overflowingElements.forEach((el) => {
      console.log(
        `     ${el.tag}#${el.id || "no-id"}.${el.class} - right: ${el.rect.right}px, width: ${el.rect.width}px`,
      );
      if (el.text) console.log(`       Text: "${el.text}..."`);
    });
  } else {
    console.log("✅ No desktop overflow detected");
  }

  await contextDesktop.close();
  await browser.close();
})();
