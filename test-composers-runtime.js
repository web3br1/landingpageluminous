// Test individual composers at runtime
const fs = require("fs");
const path = require("path");

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

async function testComposer(composerName) {
  console.log(`\n🧪 Testing ${composerName} composer...`);

  try {
    const composerPath = path.join(
      __dirname,
      "domains/marketing/composers",
      `${composerName}-composer.ts`,
    );

    // Check if file exists
    if (!fs.existsSync(composerPath)) {
      console.log(`❌ File not found: ${composerPath}`);
      return false;
    }

    // Read file content
    const fileContent = fs.readFileSync(composerPath, "utf8");

    // Extract function name
    const functionName = `compose${composerName.charAt(0).toUpperCase() + composerName.slice(1)}Content`;

    // Check if function exists in file (either function declaration or const export)
    const hasFunctionDeclaration = fileContent.includes(
      `export function ${functionName}`,
    );
    const hasConstExport = fileContent.includes(`export const ${functionName}`);

    if (!hasFunctionDeclaration && !hasConstExport) {
      console.log(
        `❌ Function ${functionName} not found in file (neither function declaration nor const export)`,
      );
      return false;
    }

    console.log(`✅ File and function found`);

    // Try to import and execute
    try {
      const modulePath = `./domains/marketing/composers/${composerName}-composer.js`;
      const module = await import(modulePath);

      if (!module[functionName]) {
        console.log(`❌ Function ${functionName} not exported from module`);
        return false;
      }

      console.log(`✅ Module imported successfully`);

      const startTime = Date.now();
      const result = module[functionName]();
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
    } catch (importError) {
      console.error(`❌ Import/execution failed: ${importError.message}`);
      console.error(`   Stack:`, importError.stack);
      return false;
    }
  } catch (error) {
    console.error(`❌ Test setup failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting individual composer tests...\n");

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
