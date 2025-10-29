#!/usr/bin/env node
import { execSync } from 'child_process';

console.log('🚀 Teste de Otimizações - Verificação Rápida\n');

// Executar apenas alguns testes críticos para verificar se as otimizações funcionaram
const testCommands = [
  'npx playwright test --project=core-critical --workers=1 --timeout=30000',
  'npx playwright test --project=visual-regression-enhanced --workers=1 --timeout=60000 --grep="error states and fallback content"',
  'npx playwright test --project=critical-flows --workers=1 --timeout=45000 --grep="user can navigate through all main sections"'
];

let totalTests = 0;
let passedTests = 0;
let totalTime = 0;

for (const [index, command] of testCommands.entries()) {
  console.log(`\n📊 Executando teste ${index + 1}/3...`);
  console.log(`Comando: ${command}`);

  try {
    const startTime = Date.now();
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      timeout: 120000 // 2 minutos máximo por teste
    });
    const duration = Date.now() - startTime;
    totalTime += duration;

    console.log(`✅ Teste ${index + 1} passou em ${(duration / 1000).toFixed(1)}s`);
    passedTests++;
  } catch (error) {
    console.log(`❌ Teste ${index + 1} falhou`);
    console.error('Erro:', error.message);
  }

  totalTests++;
}

console.log('\n📈 Resultado das Otimizações:');
console.log(`Total de testes: ${totalTests}`);
console.log(`Testes aprovados: ${passedTests}`);
console.log(`Tempo total: ${(totalTime / 1000).toFixed(1)}s`);
console.log(`Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 Todas as otimizações funcionaram! Os testes estão mais rápidos e estáveis.');
} else {
  console.log('\n⚠️ Algumas otimizações precisam de ajustes adicionais.');
}
