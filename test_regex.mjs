// Teste do regex usado no script de análise TDD
const output = `Test Files  1 passed (1)
      Tests  2 passed | 0 failed | 0 skipped`;

console.log("Saída a ser parseada:");
console.log(output);
console.log("\n=== TESTE DO REGEX ===");

const lines = output.split('\n');
lines.forEach(line => {
  const testMatch = line.match(/(\d+)\s+passed.*(\d+)\s+failed.*(\d+)\s+skipped/);
  if (testMatch) {
    console.log("✅ REGEX encontrou match:");
    console.log(`   Passed: ${testMatch[1]}, Failed: ${testMatch[2]}, Skipped: ${testMatch[3]}`);
  } else {
    console.log("❌ REGEX não encontrou match na linha:", line);
  }
});
