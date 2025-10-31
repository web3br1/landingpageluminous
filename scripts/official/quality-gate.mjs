#!/usr/bin/env node

/**
 * Quality Gate - Pré-PR
 *
 * Executa validações de qualidade antes do merge.
 * Substitui quality-gate.mjs antigo.
 *
 * Status: ACTIVE
 * Owner: Quality Team
 * Approved: 2025-10-31
 */

console.log('🚀 Quality Gate - Pré-PR');
console.log('✅ Validating code quality...');

// TODO: Implementar lógica consolidada do gate pré-PR
// Por enquanto chama o gate antigo como placeholder

const path = require('path');
const { spawn } = require('child_process');

const oldGate = path.join(__dirname, '..', 'quality-gate.mjs');

const child = spawn('node', [oldGate], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..', '..')
});

child.on('close', (code) => {
  process.exit(code);
});

child.on('error', (error) => {
  console.error('❌ Error running quality gate:', error);
  process.exit(1);
});
