#!/usr/bin/env node

/**
 * Script para testar se os imports @shared estão funcionando
 */

import { Result, isOk } from '../shared/core/index.js';

console.log('🧪 Testando imports @shared...\n');

try {
  // Test Result
  const okResult = Result.ok('test');
  const errResult = Result.err('error');

  console.log('✅ Result.ok criado:', okResult);
  console.log('✅ Result.err criado:', errResult);
  console.log('✅ isOk(okResult):', isOk(okResult));
  console.log('✅ isOk(errResult):', isOk(errResult));

  console.log('\n🎉 Todos os imports funcionando!');
} catch (error) {
  console.error('❌ Erro nos imports:', error.message);
  process.exit(1);
}
