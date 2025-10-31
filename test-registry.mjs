#!/usr/bin/env node

// Test simples do registry
import { getRegistry } from './compliance-engine/core/script-registry.mjs';

async function main() {
  console.log('🧪 Testing Script Registry...');

  try {
    const registry = getRegistry();
    console.log('✅ Registry instance created');

    await registry.load();
    console.log('✅ Registry loaded');

    const scripts = await registry.list();
    console.log(`📊 Scripts loaded: ${scripts.length}`);

    scripts.forEach(script => {
      console.log(`  - ${script.id}: ${script.status} (${script.owner || 'no owner'})`);
    });

    const health = await registry.healthCheck();
    console.log('🏥 Health check:', health);

  } catch (error) {
    console.error('❌ Registry test failed:', error.message);
    console.error(error.stack);
  }
}

main().catch(console.error);
