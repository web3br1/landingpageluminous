#!/usr/bin/env node

// Test simples do script registry
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Simple Compliance Engine Test');
console.log('Current directory:', __dirname);
console.log('Files in compliance-engine:');

try {
  const files = fs.readdirSync('compliance-engine');
  files.forEach(file => {
    console.log(`  - ${file}`);
  });
} catch (error) {
  console.error('❌ Error reading compliance-engine directory:', error.message);
}

console.log('\nChecking script-registry.mjs...');
try {
  const registryPath = path.resolve('compliance-engine/core/script-registry.mjs');
  console.log('Registry path:', registryPath);
  console.log('File exists:', fs.existsSync(registryPath));

  if (fs.existsSync(registryPath)) {
    const content = fs.readFileSync(registryPath, 'utf8');
    console.log('File size:', content.length, 'characters');
    console.log('First 200 chars:', content.substring(0, 200));
  }
} catch (error) {
  console.error('❌ Error checking registry:', error.message);
}
