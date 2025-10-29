// Debug script to test demo composer validation
import { ComposerGuard } from './lib/composition/composer-validation.ts';

console.log('Starting validation debug...');

async function testValidation() {
  try {
    // Initialize validators
    ComposerGuard.initializeValidators();
    console.log('✅ Validators initialized');

    // Test demo composer
    const { composeDemoContent } = await import('./domains/marketing/index.ts');
    console.log('✅ Demo composer imported');

    const result = composeDemoContent();
    console.log('✅ Demo composer executed');

    if (result.content) {
      console.log('✅ Content present');
      console.log('Content keys:', Object.keys(result.content));
    } else {
      console.log('❌ No content found');
      console.log('Result:', JSON.stringify(result, null, 2));
    }

    // Test validation directly
    const validation = ComposerGuard.validate('demo', result);
    console.log('Validation result:', validation);

    if (!validation.success) {
      console.log('❌ Validation failed');
      console.log('Error:', validation.error);
    } else {
      console.log('✅ Validation passed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testValidation();
