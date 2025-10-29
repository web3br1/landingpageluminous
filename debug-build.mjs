// Debug script to simulate the exact import used in page-composer.ts
console.log('Testing exact import pattern from page-composer.ts...');

async function testDynamicImport() {
  try {
    console.log('Testing: const { composeDemoContent } = await import("@/domains/marketing")');

    // This is the exact pattern used in page-composer.ts
    const { composeDemoContent } = await import('./domains/marketing/index.ts');

    console.log('✅ Import successful');
    console.log('composeDemoContent type:', typeof composeDemoContent);

    if (composeDemoContent) {
      const result = composeDemoContent();
      console.log('✅ Execution successful');
      console.log('Result has content:', !!result.content);
      console.log('Result has variant:', !!result.variant);
      console.log('Result structure:', {
        hasContent: !!result.content,
        hasVariant: !!result.variant,
        hasExperiment: !!result.experiment,
        contentKeys: result.content ? Object.keys(result.content) : null
      });
    } else {
      console.log('❌ composeDemoContent is undefined/null');
    }

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('Full error:', error);
  }
}

testDynamicImport();
