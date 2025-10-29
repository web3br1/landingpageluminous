// Script para verificar seções configuradas vs mapeadas
import fs from 'fs';
import path from 'path';

const configFile = fs.readFileSync('lib/composition/services/page-composition-service.ts', 'utf8');
const landingMatch = configFile.match(/landing:\s*\{[\s\S]*?sections:\s*\[([\s\S]*?)\]/);
let configuredSections = [];
if (landingMatch) {
  const sectionsText = landingMatch[1];
  const sectionMatches = sectionsText.matchAll(/\{\s*id:\s*'([^']+)'/g);
  configuredSections = Array.from(sectionMatches).map(match => match[1]);
}

const lazyFile = fs.readFileSync('lib/composition/performance/route-based-lazy-loading.tsx', 'utf8');

// Capturar seções mapeadas diretamente das linhas que terminam com LazyXXX
const mapMatch = lazyFile.match(/const sectionComponentMap.*= \{\s*([\s\S]*?)\}/);
let mappedSections = [];
if (mapMatch) {
  const mapText = mapMatch[1];
  // Capturar linhas que terminam com LazyXXX,
  const sectionMatches = mapText.matchAll(/^\s*['"]?([^'"]+)['"]?\s*:\s*Lazy\w+,?$/gm);
  mappedSections = Array.from(sectionMatches).map(match => match[1]);
}

console.log('=== VERIFICAÇÃO DE SEÇÕES ===');
console.log('Seções configuradas na landing:', configuredSections);
console.log('Seções mapeadas:', mappedSections);

const missing = configuredSections.filter(s => !mappedSections.includes(s));
const extra = mappedSections.filter(s => !configuredSections.includes(s) && !s.startsWith('Admin'));

console.log('❌ Faltando no mapeamento:', missing);
console.log('⚠️  Extras no mapeamento (não landing):', extra);
console.log('✅ Status:', missing.length === 0 ? 'TODAS MAPEADAS' : 'PROBLEMAS DETECTADOS');

// Verificar imports dos lazy components
console.log('\n=== VERIFICAÇÃO DE IMPORTS ===');
const importMatches = lazyFile.matchAll(/import\('([^']+)'\)/g);
const imports = Array.from(importMatches).map(match => match[1]);

imports.forEach(imp => {
  const componentPath = imp.replace('../../../', '');
  const fullPath = `components/${componentPath}`;

  // Verificar se existe arquivo .tsx
  const tsxPath = `${fullPath}.tsx`;
  // Verificar se existe pasta com index.ts
  const indexPath = path.join(fullPath, 'index.ts');

  let found = false;
  let foundPath = '';

  if (fs.existsSync(tsxPath)) {
    found = true;
    foundPath = tsxPath;
  } else if (fs.existsSync(indexPath)) {
    found = true;
    foundPath = indexPath;
  }

  if (found) {
    console.log(`✅ ${componentPath} → ${foundPath.replace('components/', '')}`);

    // Verificar se tem "use client" no arquivo
    try {
      const fileContent = fs.readFileSync(foundPath, 'utf8');
      const hasUseClient = fileContent.includes('"use client"') || fileContent.includes("'use client'");
      if (!hasUseClient) {
        console.log(`   ⚠️  SEM "use client" directive`);
      }
    } catch (e) {
      console.log(`   ❌ ERRO lendo arquivo: ${e.message}`);
    }
  } else {
    console.log(`❌ ${componentPath} - ARQUIVO NÃO ENCONTRADO`);
  }
});
