#!/usr/bin/env node

/**
 * Script para verificar o progresso das correções de testes
 * Executa análise detalhada dos problemas identificados
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔍 VERIFICAÇÃO DE CORREÇÕES - SUITE DE TESTES\n");

// 1. Executar testes e capturar saída
console.log("1️⃣ Executando testes...");
try {
  const testOutput = execSync("npx vitest run 2>&1", {
    encoding: "utf8",
    timeout: 300000, // 5 minutos
  });

  // Analisar resultados
  const passedMatches = testOutput.match(/✅ (\d+) passed/g);
  const failedMatches = testOutput.match(/❌ (\d+) failed/g);
  const skippedMatches = testOutput.match(/⏭️ (\d+) skipped/g);

  const passed = passedMatches ? parseInt(passedMatches[0].match(/\d+/)[0]) : 0;
  const failed = failedMatches ? parseInt(failedMatches[0].match(/\d+/)[0]) : 0;
  const skipped = skippedMatches
    ? parseInt(skippedMatches[0].match(/\d+/)[0])
    : 0;

  const total = passed + failed + skipped;
  const failureRate = total > 0 ? ((failed / total) * 100).toFixed(1) : "0.0";

  console.log(`📊 RESULTADOS ATUAIS:`);
  console.log(`   ✅ Testes Passando: ${passed}`);
  console.log(`   ❌ Testes Falhando: ${failed}`);
  console.log(`   ⏭️ Testes Pulados: ${skipped}`);
  console.log(`   📈 Total: ${total}`);
  console.log(`   📊 Taxa de Falha: ${failureRate}%\n`);

  // 2. Verificar uso de 'any'
  console.log('2️⃣ Verificando uso de "any"...');
  try {
    const grepResult = execSync(
      'grep -r ": any" tests/ --include="*.ts" --include="*.tsx" | wc -l',
      {
        encoding: "utf8",
      },
    );

    const anyCount = parseInt(grepResult.trim());
    console.log(`   🚨 Ocorrências de ': any': ${anyCount}`);

    if (anyCount === 0) {
      console.log('   ✅ Nenhuma ocorrência de ": any" encontrada!\n');
    } else {
      console.log('   ❌ Ainda há ocorrências de ": any"\n');

      // Mostrar detalhes
      const anyDetails = execSync(
        'grep -r ": any" tests/ --include="*.ts" --include="*.tsx"',
        {
          encoding: "utf8",
        },
      );
      console.log("   📋 Detalhes:");
      console.log(anyDetails);
    }
  } catch (error) {
    console.log('   ⚠️ Erro ao verificar ": any"\n');
  }

  // 3. Verificar uso de fireEvent
  console.log('3️⃣ Verificando uso de "fireEvent"...');
  try {
    const fireEventResult = execSync(
      'grep -r "fireEvent" tests/ --include="*.ts" --include="*.tsx" | wc -l',
      {
        encoding: "utf8",
      },
    );

    const fireEventCount = parseInt(fireEventResult.trim());
    console.log(`   🚨 Ocorrências de 'fireEvent': ${fireEventCount}`);

    if (fireEventCount === 0) {
      console.log("   ✅ Nenhum uso de fireEvent encontrado!\n");
    } else {
      console.log("   ❌ Ainda há usos de fireEvent\n");
    }
  } catch (error) {
    console.log("   ⚠️ Erro ao verificar fireEvent\n");
  }

  // 4. Verificar beforeEach
  console.log('4️⃣ Verificando implementação de "beforeEach"...');
  try {
    const beforeEachResult = execSync(
      'grep -r "beforeEach" tests/ --include="*.ts" --include="*.tsx" | wc -l',
      {
        encoding: "utf8",
      },
    );

    const beforeEachCount = parseInt(beforeEachResult.trim());
    console.log(`   📋 Arquivos com beforeEach: ${beforeEachCount}`);

    // Contar arquivos de teste
    const testFilesResult = execSync(
      'find tests/ -name "*.test.ts" -o -name "*.test.tsx" | wc -l',
      {
        encoding: "utf8",
      },
    );

    const testFilesCount = parseInt(testFilesResult.trim());
    const coverage =
      testFilesCount > 0
        ? ((beforeEachCount / testFilesCount) * 100).toFixed(1)
        : "0.0";

    console.log(
      `   📊 Cobertura de beforeEach: ${coverage}% (${beforeEachCount}/${testFilesCount})\n`,
    );
  } catch (error) {
    console.log("   ⚠️ Erro ao verificar beforeEach\n");
  }

  // 5. Verificar status dos testes críticos
  console.log("5️⃣ Verificando status dos componentes críticos...");

  const criticalTests = [
    "tests/components/sections/lead-form.test.tsx",
    "tests/components/sections/benefits.test.tsx",
    "tests/components/sections/final-cta.test.tsx",
    "tests/contract-apis.test.ts",
  ];

  criticalTests.forEach((testFile) => {
    if (fs.existsSync(testFile)) {
      try {
        console.log(`   🔍 Executando ${path.basename(testFile)}...`);
        const result = execSync(`npx vitest run ${testFile} 2>&1`, {
          encoding: "utf8",
          timeout: 60000,
        });

        const filePassed = result.match(/(\d+) passed/);
        const fileFailed = result.match(/(\d+) failed/);

        const passed = filePassed ? parseInt(filePassed[1]) : 0;
        const failed = fileFailed ? parseInt(fileFailed[1]) : 0;

        if (failed === 0) {
          console.log(
            `   ✅ ${path.basename(testFile)}: ${passed} testes passando`,
          );
        } else {
          console.log(
            `   ❌ ${path.basename(testFile)}: ${passed} passando, ${failed} falhando`,
          );
        }
      } catch (error) {
        console.log(`   ❌ ${path.basename(testFile)}: erro na execução`);
      }
    } else {
      console.log(`   ⚠️ ${path.basename(testFile)}: arquivo não encontrado`);
    }
  });

  // 6. Análise final e recomendações
  console.log("\n🎯 ANÁLISE FINAL E RECOMENDAÇÕES\n");

  if (failureRate <= 5.0 && anyCount === 0) {
    console.log("✅ STATUS: PRONTO PARA DEPLOY");
    console.log("   • Taxa de falha aceitável");
    console.log("   • Type safety restaurada");
    console.log("   • Pode prosseguir para validação funcional");
  } else if (failureRate <= 10.0) {
    console.log("⚠️ STATUS: MELHORIAS NECESSÁRIAS");
    console.log("   • Taxa de falha ainda elevada");
    console.log("   • Focar em correções críticas");
    console.log("   • Verificar componentes principais");
  } else {
    console.log("❌ STATUS: BLOQUEADO PARA PRODUÇÃO");
    console.log("   • Taxa de falha crítica");
    console.log("   • Correções urgentes necessárias");
    console.log("   • Revisar abordagem de testes");
  }

  console.log(`\n📈 PROGRESSO GERAL:`);
  console.log(`   • Meta de falha: < 5.0% (atual: ${failureRate}%)`);
  console.log(`   • Meta 'any': 0 (atual: ${anyCount})`);
  console.log(`   • Componentes críticos: verificar acima`);
} catch (error) {
  console.error("❌ Erro na execução dos testes:");
  console.error(error.message);
  process.exit(1);
}

console.log("\n✨ Verificação concluída!\n");
