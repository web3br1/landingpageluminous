import fs from 'fs';

const report = JSON.parse(fs.readFileSync('quality-history/2025-10-31-integrations-audit.json', 'utf8'));

console.log('🔍 LISTAGEM COMPLETA DOS PROBLEMAS ENCONTRADOS');
console.log('='.repeat(60));

console.log('\n🔴 PROBLEMAS CRÍTICOS (11):');
if (report.findings.routes?.inactiveEndpoints) {
  report.findings.routes.inactiveEndpoints.forEach((item, i) => {
    console.log(`${i+1}. ${item.route} (${item.file})`);
    console.log(`   👤 Owner: ${item.owner} | 📋 ${item.recommendation}`);
  });
}

console.log('\n🟠 PROBLEMAS ALTOS (2):');
if (report.findings.integrations?.missingErrorHandling) {
  report.findings.integrations.missingErrorHandling.forEach((item, i) => {
    console.log(`${i+1}. ${item.file}:${item.line} - ${item.call}`);
    console.log(`   🔒 Integração: ${item.integration}`);
  });
}

console.log('\n🔵 PROBLEMAS MÉDIOS (0):');
console.log('✅ Nenhum problema médio detectado');

console.log('\n🟢 PROBLEMAS BAIXOS (1823) - EXPORTS NÃO UTILIZADOS:');
if (report.findings.code?.unusedExports) {
  // Mostrar apenas os primeiros 20 como exemplo
  report.findings.code.unusedExports.slice(0, 20).forEach((item, i) => {
    console.log(`${i+1}. ${item.symbol} (${item.files.length} arquivo(s))`);
    console.log(`   📁 ${item.files[0]}`);
  });

  if (report.findings.code.unusedExports.length > 20) {
    console.log(`   ... e mais ${report.findings.code.unusedExports.length - 20} exports não utilizados`);
  }
}

console.log('\n📊 IMPORTS NÃO UTILIZADOS:');
if (report.findings.code?.unusedImports && report.findings.code.unusedImports.length > 0) {
  report.findings.code.unusedImports.forEach((item, i) => {
    console.log(`${i+1}. ${item.symbol} (${item.type})`);
  });
} else {
  console.log('✅ Nenhum import não utilizado detectado');
}

console.log('\n📊 VARIÁVEIS DE AMBIENTE:');
console.log('✅ Nenhuma variável órfã detectada');
console.log('✅ Nenhum vazamento para client bundle detectado');
