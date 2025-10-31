// Test individual composers using tsx
import * as fs from "fs";
import * as path from "path";

const composers = [
  "hero",
  "benefits",
  "features",
  "pricing",
  "social-proof",
  "faq",
  "demo",
  "final-cta",
  "footer",
];

async function testComposer(composerName: string) {
  console.log(`\n🧪 Testing ${composerName} composer...`);

  try {
    // Try to import and execute
    try {
      const modulePath = `./domains/marketing/composers/${composerName}-composer`;
      const module = await import(modulePath);

      // Try different function name patterns
      const patterns = [
        `compose${composerName.charAt(0).toUpperCase() + composerName.slice(1)}Content`,
        `compose${composerName.charAt(0).toUpperCase() + composerName.slice(1).replace("-", "")}Content`,
        `compose${composerName.replace("-", "").charAt(0).toUpperCase() + composerName.replace("-", "").slice(1)}Content`,
      ];

      let composeFunction: unknown = null;
      let functionName = "";

      for (const pattern of patterns) {
        if (module[pattern]) {
          composeFunction = module[pattern];
          functionName = pattern;
          break;
        }
      }

      if (!composeFunction) {
        console.log(
          `❌ No compose function found. Available exports:`,
          Object.keys(module),
        );
        return false;
      }

      console.log(`✅ Module imported successfully, function: ${functionName}`);

      const startTime = Date.now();
      const result = typeof composeFunction === 'function' ? composeFunction() : null;
      const duration = Date.now() - startTime;

      if (result) {
        console.log(
          `✅ ${composerName} composer executed successfully [${duration}ms]`,
        );
        console.log(`   Result type: ${typeof result}`);
        if (result.content || result.envelope) {
          console.log(
            `   Has content: ${!!result.content || !!result.envelope}`,
          );
        }
        return true;
      } else {
        console.log(`⚠️ ${composerName} composer returned null/undefined`);
        return false;
      }
    } catch (importError: unknown) {
      console.error(`❌ Import/execution failed: ${(importError as Error).message}`);
      console.error(`   Stack:`, importError.stack);
      return false;
    }
  } catch (error: unknown) {
    console.error(`❌ Test setup failed: ${(error as Error).message}`);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting individual composer tests with tsx...\n");

  const results = [];

  for (const composer of composers) {
    const success = await testComposer(composer);
    results.push({ composer, success });
  }

  console.log("\n📊 Test Results Summary:");
  console.log("========================");

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}`);

  if (failed > 0) {
    console.log("\n❌ Failed composers:");
    results
      .filter((r) => !r.success)
      .forEach((r) => console.log(`   - ${r.composer}`));
  }

  console.log("\n✅ Passed composers:");
  results
    .filter((r) => r.success)
    .forEach((r) => console.log(`   - ${r.composer}`));

  return failed === 0;
}

runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
