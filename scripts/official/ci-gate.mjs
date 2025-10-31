#!/usr/bin/env node

/**
 * CI Gate
 *
 * Executa validações de qualidade em CI/CD.
 * Substitui ci-quality-gate.mjs antigo.
 *
 * Status: ACTIVE
 * Owner: Quality Team
 * Approved: 2025-10-31
 */

console.log('🔧 CI Gate');
console.log('✅ Running CI quality validations...');

// TODO: Implementar lógica consolidada do gate CI
// Por enquanto chama o gate antigo como placeholder

const path = require('path');
const { spawn } = require('child_process');

const oldGate = path.join(__dirname, '..', 'ci-quality-gate.mjs');

const child = spawn('node', [oldGate], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..', '..')
});

child.on('close', (code) => {
  process.exit(code);
});

child.on('error', (error) => {
  console.error('❌ Error running CI gate:', error);
  process.exit(1);
});
