#!/usr/bin/env tsx

/**
 * Script de Migração: CTA Unificado
 *
 * Este script ajuda a migrar componentes que usam Button/CtaButton
 * para o novo sistema CTA unificado.
 *
 * Uso: npx tsx scripts/migrate-to-unified-cta.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

// ===== CONFIGURAÇÃO =====
const TARGET_DIR = "app/(marketing)/components";
const BACKUP_SUFFIX = ".backup";

// Mapeamento de migração
const MIGRATION_MAP = {
  // Imports antigos → novos
  imports: {
    'from "../ui/cta-button"': 'from "../ui/cta-button-unified"',
    'from "@/components/ui/cta-button"':
      'from "@/components/ui/cta-button-unified"',
  },

  // Componentes antigos → novos
  components: {
    CtaButton: "CTA",
    Button: "CTA",
  },

  // Props que precisam ser ajustadas
  props: {
    // variant mappings
    'variant="default"': 'variant="primary"',
    'variant="destructive"': 'variant="error"',
    'variant="ghost"': 'variant="secondary"',
    'variant="link"': 'variant="ghost"',

    // size mappings (mantém iguais)
    // className custom pode precisar ajustes
  },
} as const;

// ===== FUNÇÕES DE MIGRAÇÃO =====

function migrateFile(filePath: string): boolean {
  console.log(`🔄 Migrating: ${filePath}`);

  let content = readFileSync(filePath, "utf-8");
  let hasChanges = false;

  // 1. Migrar imports
  Object.entries(MIGRATION_MAP.imports).forEach(([oldImport, newImport]) => {
    if (content.includes(oldImport)) {
      content = content.replace(oldImport, newImport);
      hasChanges = true;
      console.log(`  📦 Updated import: ${oldImport} → ${newImport}`);
    }
  });

  // 2. Migrar componentes
  Object.entries(MIGRATION_MAP.components).forEach(
    ([oldComponent, newComponent]) => {
      const regex = new RegExp(`<${oldComponent}(\\s|>)`, "g");
      if (regex.test(content)) {
        content = content.replace(regex, `<${newComponent}$1`);
        hasChanges = true;
        console.log(
          `  🏷️  Migrated component: ${oldComponent} → ${newComponent}`,
        );
      }
    },
  );

  // 3. Migrar props
  Object.entries(MIGRATION_MAP.props).forEach(([oldProp, newProp]) => {
    if (content.includes(oldProp)) {
      content = content.replace(new RegExp(oldProp, "g"), newProp);
      hasChanges = true;
      console.log(`  ⚙️  Updated prop: ${oldProp} → ${newProp}`);
    }
  });

  // 4. Ajustes específicos para CTA unificado
  if (hasChanges) {
    // Remover className custom que pode conflitar
    content = content.replace(
      /<CTA([^>]*)className="([^"]*bg-[^"]*)"([^>]*)>/g,
      "<CTA$1$3>",
    );

    // Adicionar size="md" se não especificado
    content = content.replace(/<CTA([^>]*)>/g, (match, attrs) => {
      if (!attrs.includes("size=")) {
        return `<CTA${attrs} size="md">`;
      }
      return match;
    });
  }

  if (hasChanges) {
    // Criar backup
    writeFileSync(
      `${filePath}${BACKUP_SUFFIX}`,
      readFileSync(filePath, "utf-8"),
    );

    // Salvar versão migrada
    writeFileSync(filePath, content);
    console.log(`✅ Migrated: ${filePath}`);
    return true;
  }

  console.log(`⏭️  No changes needed: ${filePath}`);
  return false;
}

function walkDirectory(dir: string): void {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (
      stat.isDirectory() &&
      !file.startsWith(".") &&
      file !== "node_modules"
    ) {
      walkDirectory(filePath);
    } else if (stat.isFile() && extname(file) === ".tsx") {
      // Verificar se arquivo usa componentes antigos
      const content = readFileSync(filePath, "utf-8");
      const usesOldComponents = Object.keys(MIGRATION_MAP.components).some(
        (comp) => content.includes(`<${comp}`),
      );

      if (usesOldComponents) {
        migrateFile(filePath);
      }
    }
  }
}

// ===== EXECUÇÃO =====
console.log("🚀 Starting CTA Migration Script");
console.log("================================");
console.log(`Target directory: ${TARGET_DIR}`);
console.log("");

try {
  walkDirectory(TARGET_DIR);
  console.log("");
  console.log("✅ Migration completed!");
  console.log("");
  console.log("📋 Next steps:");
  console.log("1. Run type checking: npm run typecheck");
  console.log("2. Test components visually");
  console.log("3. Remove backup files (*backup) when satisfied");
  console.log("4. Update any custom className that may have been removed");
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}

// ===== VALIDAÇÃO =====
console.log("");
console.log("🔍 Validation:");
console.log("- Check that all CTA components render correctly");
console.log("- Verify variant mappings (primary/secondary/ghost/promo)");
console.log("- Test hover/focus states");
console.log("- Confirm accessibility (focus rings, keyboard nav)");

export {}; // Make it a module
