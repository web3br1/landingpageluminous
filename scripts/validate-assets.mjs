#!/usr/bin/env node

/**
 * Asset Validation Script - conforme .cursorrules seção 19
 *
 * Valida existência, tamanhos, formatos e otimização dos assets
 * Gera relatório de conformidade para QA
 *
 * Uso: node scripts/validate-assets.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const validationRules = {
  brand: {
    'logo.svg': { maxSize: 50, required: true, format: 'svg' },
    'logo-dark.svg': { maxSize: 50, required: false, format: 'svg' },
    'logo-icon.svg': { maxSize: 10, required: false, format: 'svg' }
  },
  product: {
    hero: {
      'dashboard.webp': { maxSize: 200, required: false, format: 'webp', minWidth: 1600, minHeight: 1000 }
    },
    demo: {
      'screenshot.webp': { maxSize: 200, required: false, format: 'webp', minWidth: 1600, minHeight: 1000 }
    }
  },
  logos: {
    companies: {
      pattern: /^company-\d+\.(svg|webp)$/,
      maxSize: 20,
      format: ['svg', 'webp'],
      minCount: 3
    },
    partners: {
      pattern: /^partner-\d+\.(svg|webp)$/,
      maxSize: 15,
      format: ['svg', 'webp']
    }
  },
  testimonials: {
    pattern: /^avatar-\w+\.(webp|jpg|png)$/,
    maxSize: 50,
    format: ['webp', 'jpg', 'png'],
    maxWidth: 200,
    maxHeight: 200
  }
};

async function getFileStats(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size / 1024, // KB
      exists: true
    };
  } catch {
    return { exists: false };
  }
}

async function validateFile(filePath, rules) {
  const stats = await getFileStats(filePath);

  if (!stats.exists) {
    return { valid: false, error: 'Arquivo não encontrado' };
  }

  const errors = [];

  if (rules.maxSize && stats.size > rules.maxSize) {
    errors.push(`Tamanho excedido: ${stats.size.toFixed(1)}KB > ${rules.maxSize}KB`);
  }

  if (rules.format) {
    const ext = path.extname(filePath).slice(1);
    const formats = Array.isArray(rules.format) ? rules.format : [rules.format];
    if (!formats.includes(ext)) {
      errors.push(`Formato inválido: ${ext}, esperado: ${formats.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    size: stats.size,
    errors
  };
}

async function validateDirectory(dirPath, rules) {
  const results = {};
  let totalFiles = 0;
  let validFiles = 0;

  try {
    const files = await fs.readdir(dirPath);

    if (rules.pattern) {
      // Validação por padrão (ex: company-*.svg)
      const matchingFiles = files.filter(file => rules.pattern.test(file));

      for (const file of matchingFiles) {
        const filePath = path.join(dirPath, file);
        const validation = await validateFile(filePath, rules);
        results[file] = validation;

        totalFiles++;
        if (validation.valid) validFiles++;
      }

      if (rules.minCount && matchingFiles.length < rules.minCount) {
        results._summary = {
          valid: false,
          error: `Mínimo ${rules.minCount} arquivos, encontrado ${matchingFiles.length}`
        };
      }

    } else {
      // Validação específica de arquivos
      for (const [filename, fileRules] of Object.entries(rules)) {
        const filePath = path.join(dirPath, filename);
        const validation = await validateFile(filePath, fileRules);
        results[filename] = validation;

        totalFiles++;
        if (validation.valid) validFiles++;
      }
    }

  } catch (error) {
    results._error = error.message;
  }

  return { results, totalFiles, validFiles };
}

async function generateReport(results) {
  console.log('🎯 RELATÓRIO DE VALIDAÇÃO DE ASSETS\n');

  let totalFiles = 0;
  let totalValid = 0;
  const issues = [];

  for (const [category, categoryResults] of Object.entries(results)) {
    console.log(`📁 ${category.toUpperCase()}`);
    console.log('─'.repeat(50));

    for (const [item, result] of Object.entries(categoryResults)) {
      if (item === '_summary' || item === '_error') continue;

      const status = result.valid ? '✅' : '❌';
      const size = result.size ? `${result.size.toFixed(1)}KB` : '';

      console.log(`${status} ${item} ${size}`);

      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`   ⚠️  ${error}`);
          issues.push(`${category}/${item}: ${error}`);
        });
      }

      totalFiles++;
      if (result.valid) totalValid++;
    }

    if (categoryResults._summary) {
      const summary = categoryResults._summary;
      console.log(`${summary.valid ? '✅' : '❌'} ${summary.error}`);
      if (!summary.valid) issues.push(`${category}: ${summary.error}`);
    }

    if (categoryResults._error) {
      console.log(`❌ Erro: ${categoryResults._error}`);
      issues.push(`${category}: ${categoryResults._error}`);
    }

    console.log('');
  }

  console.log('📊 RESUMO');
  console.log('─'.repeat(50));
  console.log(`Total de arquivos: ${totalFiles}`);
  console.log(`Arquivos válidos: ${totalValid}`);
  console.log(`Arquivos com problemas: ${totalFiles - totalValid}`);

  if (issues.length > 0) {
    console.log('\n🚨 PROBLEMAS ENCONTRADOS:');
    issues.forEach(issue => console.log(`• ${issue}`));
  }

  return { totalFiles, totalValid, issues };
}

async function main() {
  console.log('🔍 Iniciando validação de assets...\n');

  const imagesDir = path.join(__dirname, '../public/images');
  const results = {};

  // Validar cada categoria
  for (const [category, rules] of Object.entries(validationRules)) {
    const categoryPath = path.join(imagesDir, category);
    results[category] = await validateDirectory(categoryPath, rules);
  }

  const report = await generateReport(results);

  // Salvar relatório JSON
  const reportPath = path.join(__dirname, '../public/images/validation-report.json');
  await fs.writeFile(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    ...report,
    results
  }, null, 2));

  console.log(`\n💾 Relatório salvo em: ${reportPath}`);

  if (report.issues.length > 0) {
    console.log('\n❌ Validação falhou. Corrija os problemas antes do deploy.');
    process.exit(1);
  } else {
    console.log('\n✅ Todos os assets estão conformes!');
  }
}

main().catch(error => {
  console.error('❌ Erro na validação:', error);
  process.exit(1);
});
