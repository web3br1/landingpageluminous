// Debug script to test demo composer import
console.log('Starting debug...');

async function testImport() {
  try {
    console.log('Testing import: @/domains/marketing');
    const marketing = await import('./domains/marketing/index.ts');

    console.log('Import successful!');
    console.log('Available exports:', Object.keys(marketing));

    if (marketing.composeDemoContent) {
      console.log('✅ composeDemoContent found');
      const result = marketing.composeDemoContent();
      console.log('✅ composeDemoContent executed');
      console.log('Result type:', typeof result);
      console.log('Has content:', !!result.content);
      console.log('Variant:', result.variant);
    } else {
      console.log('❌ composeDemoContent not found');
      console.log('Looking for demo-related exports...');
      const demoExports = Object.keys(marketing).filter(k => k.includes('demo') || k.includes('Demo'));
      console.log('Demo exports found:', demoExports);
    }
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testImport();
