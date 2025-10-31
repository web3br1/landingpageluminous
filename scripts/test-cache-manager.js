#!/usr/bin/env node

/**
 * Gerenciador de Cache Inteligente para Testes
 * Estratégia: Cache baseado em mudanças de arquivos para otimização de CI/CD
 */

const fs = require("fs");
const path = require("path");

// Import secure crypto utilities (replaces insecure MD5)
const { sha256Hash } = require("../lib/architecture/crypto-utils.js");

class TestCacheManager {
  constructor() {
    this.cacheDir = path.join(process.cwd(), ".test-cache");
    this.cacheFile = path.join(this.cacheDir, "cache.json");
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  getFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath);
      return sha256Hash(content);
    } catch (err) {
      return null;
    }
  }

  getDirectoryHash(dirPath, extensions = [".ts", ".tsx", ".js", ".jsx"]) {
    const files = this.getFilesRecursively(dirPath, extensions);
    const hashes = files.map((file) => this.getFileHash(file)).filter(Boolean);
    return sha256Hash(hashes.join(""));
  }

  getFilesRecursively(dirPath, extensions) {
    const files = [];

    function traverse(dir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (
          stat.isDirectory() &&
          !item.startsWith(".") &&
          item !== "node_modules"
        ) {
          traverse(fullPath);
        } else if (
          stat.isFile() &&
          extensions.some((ext) => item.endsWith(ext))
        ) {
          files.push(fullPath);
        }
      }
    }

    traverse(dirPath);
    return files;
  }

  loadCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        return JSON.parse(fs.readFileSync(this.cacheFile, "utf8"));
      }
    } catch (err) {
      console.warn("⚠️  Erro ao carregar cache:", err.message);
    }
    return {};
  }

  saveCache(cache) {
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2));
    } catch (err) {
      console.warn("⚠️  Erro ao salvar cache:", err.message);
    }
  }

  hasChanged(cacheKey, currentHash) {
    const cache = this.loadCache();
    const cachedHash = cache[cacheKey];
    return cachedHash !== currentHash;
  }

  updateCache(cacheKey, hash) {
    const cache = this.loadCache();
    cache[cacheKey] = hash;
    this.saveCache(cache);
  }

  // Mapeamento de lotes para diretórios que afetam eles
  getBatchDependencies() {
    return {
      "vitest:unit": ["lib/**/*.ts", "shared/**/*.ts", "domains/**/*.ts"],
      "vitest:components": [
        "components/**/*.tsx",
        "components/**/*.ts",
        "lib/**/*.ts",
        "shared/**/*.ts",
        "domains/**/*.ts",
      ],
      "vitest:lib": ["lib/**/*.ts", "shared/**/*.ts"],
      "vitest:dom": ["lib/**/*.ts", "shared/**/*.ts", "components/**/*.ts"],
      "vitest:utils": ["lib/**/*.ts", "shared/**/*.ts"],
      "vitest:integration": [
        "lib/**/*.ts",
        "shared/**/*.ts",
        "domains/**/*.ts",
        "components/**/*.ts",
      ],
      "vitest:browser": ["lib/**/*.ts", "components/**/*.ts"],
      "vitest:ssr": [
        "app/**/*.tsx",
        "app/**/*.ts",
        "lib/**/*.ts",
        "components/**/*.ts",
        "domains/**/*.ts",
      ],
      "vitest:a11y": [
        "components/**/*.tsx",
        "components/**/*.ts",
        "lib/**/*.ts",
      ],
      "vitest:hydration": [
        "app/**/*.tsx",
        "app/**/*.ts",
        "components/**/*.tsx",
        "lib/**/*.ts",
      ],
      "playwright:core-critical": [
        "app/**/*.tsx",
        "app/**/*.ts",
        "lib/**/*.ts",
      ],
      "playwright:landing-page": [
        "app/**/*.tsx",
        "app/**/*.ts",
        "components/**/*.tsx",
        "lib/**/*.ts",
        "domains/**/*.ts",
      ],
      "playwright:accessibility": [
        "app/**/*.tsx",
        "components/**/*.tsx",
        "lib/**/*.ts",
      ],
      "playwright:performance": [
        "app/**/*.tsx",
        "lib/**/*.ts",
        "components/**/*.tsx",
      ],
      "playwright:visual-regression": [
        "app/**/*.tsx",
        "components/**/*.tsx",
        "styles/**/*.css",
      ],
      "playwright:critical-flows": [
        "app/**/*.tsx",
        "app/**/*.ts",
        "components/**/*.tsx",
        "lib/**/*.ts",
      ],
    };
  }

  shouldRunBatch(batchKey) {
    const dependencies = this.getBatchDependencies()[batchKey];
    if (!dependencies) {
      // Se não temos mapeamento, sempre executar
      return true;
    }

    for (const pattern of dependencies) {
      const dirPath = path.join(process.cwd(), path.dirname(pattern));
      const extensions = [path.extname(pattern)];

      if (fs.existsSync(dirPath)) {
        const currentHash = this.getDirectoryHash(dirPath, extensions);
        const cacheKey = `${batchKey}:${pattern}`;

        if (this.hasChanged(cacheKey, currentHash)) {
          console.log(`🔄 Mudanças detectadas em ${pattern} para ${batchKey}`);
          this.updateCache(cacheKey, currentHash);
          return true;
        }
      }
    }

    console.log(`⚡ Cache hit: pulando ${batchKey} (sem mudanças)`);
    return false;
  }

  getChangedFiles(since = "HEAD~1") {
    // Implementação básica - em produção, usar git diff
    try {
      const { execSync } = require("child_process");
      const output = execSync(`git diff --name-only ${since}`, {
        encoding: "utf8",
      });
      return output.trim().split("\n").filter(Boolean);
    } catch (err) {
      console.warn("⚠️  Não foi possível obter arquivos alterados do git");
      return [];
    }
  }

  getAffectedBatches(changedFiles) {
    const affected = new Set();
    const dependencies = this.getBatchDependencies();

    for (const file of changedFiles) {
      for (const [batchKey, patterns] of Object.entries(dependencies)) {
        if (patterns.some((pattern) => this.matchesPattern(file, pattern))) {
          affected.add(batchKey);
        }
      }
    }

    return Array.from(affected);
  }

  matchesPattern(filePath, pattern) {
    // Implementação simples de matching
    const regex = new RegExp(
      pattern.replace(/\*/g, ".*").replace(/\//g, "\\/"),
    );
    return regex.test(filePath);
  }

  clearCache() {
    try {
      if (fs.existsSync(this.cacheDir)) {
        fs.rmSync(this.cacheDir, { recursive: true, force: true });
        console.log("🗑️  Cache limpo com sucesso");
      }
    } catch (err) {
      console.error("❌ Erro ao limpar cache:", err.message);
    }
  }

  showCacheStats() {
    const cache = this.loadCache();
    const entries = Object.keys(cache);

    console.log(`📊 Estatísticas do Cache:`);
    console.log(`   📁 Arquivo: ${this.cacheFile}`);
    console.log(`   📦 Entradas: ${entries.length}`);

    if (entries.length > 0) {
      console.log(`   📋 Chaves:`);
      entries.forEach((key) => {
        const shortHash = cache[key].substring(0, 8);
        console.log(`      • ${key}: ${shortHash}...`);
      });
    }
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const manager = new TestCacheManager();

  switch (command) {
    case "check":
      const batchKey = args[1];
      if (!batchKey) {
        console.error("❌ Uso: node test-cache-manager.js check <batch-key>");
        process.exit(1);
      }
      const shouldRun = manager.shouldRunBatch(batchKey);
      console.log(
        `${shouldRun ? "✅" : "⏭️"} ${batchKey} deve ${shouldRun ? "executar" : "pular"}`,
      );
      process.exit(shouldRun ? 0 : 1);

    case "clear":
      manager.clearCache();
      break;

    case "stats":
      manager.showCacheStats();
      break;

    case "changed":
      const changedFiles = manager.getChangedFiles(args[1] || "HEAD~1");
      console.log("📝 Arquivos alterados:");
      changedFiles.forEach((file) => console.log(`   • ${file}`));

      const affected = manager.getAffectedBatches(changedFiles);
      console.log("\n🎯 Lotes afetados:");
      affected.forEach((batch) => console.log(`   • ${batch}`));
      break;

    default:
      console.log(`
🧠 GERENCIADOR DE CACHE DE TESTES

📖 USO:
  node scripts/test-cache-manager.js <comando> [opções]

📋 COMANDOS:
  check <batch>    - Verifica se um lote deve executar baseado em mudanças
  clear            - Limpa todo o cache
  stats            - Mostra estatísticas do cache
  changed [ref]    - Lista arquivos alterados e lotes afetados

📝 EXEMPLOS:
  node scripts/test-cache-manager.js check vitest:unit
  node scripts/test-cache-manager.js clear
  node scripts/test-cache-manager.js changed HEAD~1
  node scripts/test-cache-manager.js stats
`);
  }
}

if (require.main === module) {
  main();
}

module.exports = TestCacheManager;
