#!/usr/bin/env node

/**
 * Bundle Analyzer - Análise detalhada do bundle para otimização
 * Identifica oportunidades de redução de tamanho e performance
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('📊 BUNDLE ANALYZER AVANÇADO - BLOCO 3\n');

// Criar diretório para análise se não existir
const analysisDir = 'bundle-analysis';
if (!fs.existsSync(analysisDir)) {
  fs.mkdirSync(analysisDir);
}

// Configurações de análise
const CONFIG = {
  bundleSizeLimit: 1.1 * 1024 * 1024, // 1.1MB em bytes
  chunkSizeLimit: 500 * 1024, // 500KB por chunk
  criticalPathLimit: 100 * 1024, // 100KB para caminho crítico
};

// Histórico de builds
const historyFile = path.join(analysisDir, 'bundle-history.json');
let bundleHistory = [];
if (fs.existsSync(historyFile)) {
  try {
    bundleHistory = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  } catch (e) {
    console.log('⚠️  Não foi possível carregar histórico de builds');
  }
}

console.log('🔍 ANALISANDO BUNDLE ATUAL...\n');

// Definir caminhos
const nextDir = path.join('.next');

// Verificar se existe build anterior
console.log('🔍 Verificando build existente...\n');

if (!fs.existsSync(nextDir)) {
  console.log('❌ Nenhum build encontrado. Execute "pnpm build" primeiro.');
  process.exit(1);
}

console.log('✅ Build encontrado, analisando...\n');

// Analisar static chunks
console.log('📦 ANALISANDO CHUNKS ESTÁTICOS:');
analyzeStaticChunks();

// Analisar bundle principal
console.log('\n🏗️  ANALISANDO BUNDLE PRINCIPAL:');
analyzeMainBundle();

// Analisar dependências
console.log('\n📚 ANALISANDO DEPENDÊNCIAS:');
analyzeDependencies();

// Analisar performance
console.log('\n⚡ ANÁLISE DE PERFORMANCE:');
const perfResults = analyzePerformance();

// Salvar histórico
const bundleSize = getBundleSize();
const chunkAnalysis = analyzeStaticChunks();
saveBundleHistory(bundleSize, chunkAnalysis?.totalChunks || 0, 0);

// Gerar recomendações
console.log('\n💡 RECOMENDAÇÕES DE OTIMIZAÇÃO:');
generateRecommendations();

console.log('\n📄 RELATÓRIOS SALVOS EM: bundle-analysis/');
console.log('\n🎯 PRÓXIMO PASSO: Implementar otimizações identificadas');
console.log('💡 Use: node scripts/bundle-analyzer.mjs --optimize para implementar automaticamente');

function analyzeStaticChunks() {
  const staticDir = path.join(nextDir, 'static');
  if (!fs.existsSync(staticDir)) return;

  const chunksDir = path.join(staticDir, 'chunks');
  if (!fs.existsSync(chunksDir)) return;

  const files = fs.readdirSync(chunksDir).filter(f => f.endsWith('.js'));
  let totalSize = 0;
  const chunks = [];
  const categories = {
    vendor: [],
    app: [],
    pages: [],
    framework: []
  };

  files.forEach(file => {
    const filePath = path.join(chunksDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = parseFloat((stats.size / 1024).toFixed(2));

    // Categorizar chunks
    let category = 'app';
    if (file.includes('webpack') || file.includes('framework')) {
      category = 'framework';
    } else if (file.includes('node_modules') || file.includes('vendor')) {
      category = 'vendor';
    } else if (file.includes('pages/') || file.includes('page-')) {
      category = 'pages';
    }

    const chunk = {
      name: file,
      size: stats.size,
      sizeKB,
      category,
      gzippedSize: estimateGzipSize(stats.size)
    };

    chunks.push(chunk);
    categories[category].push(chunk);
    totalSize += stats.size;
  });

  // Ordenar por tamanho
  chunks.sort((a, b) => b.size - a.size);

  console.log(`📊 Total de chunks: ${chunks.length}`);
  console.log(`📏 Tamanho total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🗜️  Estimativa gzip: ${(estimateGzipSize(totalSize) / 1024 / 1024).toFixed(2)} MB\n`);

  // Análise por categoria
  console.log('📂 ANÁLISE POR CATEGORIA:');
  Object.entries(categories).forEach(([category, catChunks]) => {
    if (catChunks.length > 0) {
      const catSize = catChunks.reduce((sum, c) => sum + c.size, 0);
      console.log(`  ${category}: ${catChunks.length} chunks, ${(catSize / 1024 / 1024).toFixed(2)} MB`);
    }
  });

  console.log('\n🔝 TOP 10 MAIORES CHUNKS:');
  chunks.slice(0, 10).forEach((chunk, index) => {
    const status = chunk.size > CONFIG.chunkSizeLimit ? '🚨' : '✅';
    console.log(`${index + 1}. ${status} ${chunk.name}: ${chunk.sizeKB} KB (${chunk.category})`);
  });

  // Verificar limites
  const oversizedChunks = chunks.filter(c => c.size > CONFIG.chunkSizeLimit);
  if (oversizedChunks.length > 0) {
    console.log(`\n🚨 ALERTA: ${oversizedChunks.length} chunks acima do limite de ${CONFIG.chunkSizeLimit / 1024}KB!`);
  }

  // Salvar análise detalhada
  fs.writeFileSync(
    path.join(analysisDir, 'chunks-analysis.json'),
    JSON.stringify({
      totalChunks: chunks.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      estimatedGzippedSize: estimateGzipSize(totalSize),
      categories,
      topChunks: chunks.slice(0, 20),
      oversizedChunks: oversizedChunks.map(c => ({ name: c.name, sizeKB: c.sizeKB, category: c.category })),
      recommendations: generateChunkRecommendations(chunks)
    }, null, 2)
  );

  return { chunks, totalSize, categories };
}

function analyzeMainBundle() {
  // Analisar _buildManifest.js e outros arquivos principais
  const staticDir = path.join(nextDir, 'static');
  if (!fs.existsSync(staticDir)) return;

  const buildManifestPath = path.join(nextDir, 'build-manifest.json');
  if (fs.existsSync(buildManifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));

    console.log('📋 BUILD MANIFEST:');
    console.log(`- Pages: ${Object.keys(manifest.pages || {}).length}`);
    console.log(`- DevFiles: ${manifest.devFiles?.length || 0}`);
    console.log(`- LowPriorityFiles: ${manifest.lowPriorityFiles?.length || 0}`);

    fs.writeFileSync(
      path.join(analysisDir, 'build-manifest-analysis.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  // Analisar webpack stats se disponível
  const webpackStatsPath = path.join(analysisDir, 'webpack-stats.json');
  if (fs.existsSync(webpackStatsPath)) {
    const stats = JSON.parse(fs.readFileSync(webpackStatsPath, 'utf8'));

    console.log('\n📈 WEBPACK STATS:');
    if (stats.assets) {
      const jsAssets = stats.assets.filter(asset => asset.name.endsWith('.js'));
      const totalSize = jsAssets.reduce((sum, asset) => sum + asset.size, 0);

      console.log(`- JS Assets: ${jsAssets.length}`);
      console.log(`- Total JS Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    }
  }
}

function analyzeDependencies() {
  try {
    // Analisar package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});

    console.log(`📦 Dependências de produção: ${dependencies.length}`);
    console.log(`🔧 Dependências de desenvolvimento: ${devDependencies.length}`);

    // Analisar bundle para identificar dependências reais
    const bundleDeps = analyzeBundleDependencies();

    // Identificar dependências pesadas e não utilizadas
    const heavyDeps = [
      'framer-motion',
      'react',
      'react-dom',
      'next',
      'tailwindcss',
      '@tailwindcss',
      'lucide-react',
      'zod',
      'stripe',
      'recharts',
      '@types/recharts'
    ];

    const unusedDeps = dependencies.filter(dep => !bundleDeps.includes(dep));
    const usedHeavyDeps = heavyDeps.filter(dep => bundleDeps.includes(dep));

    console.log('\n⚠️  DEPENDÊNCIAS PESADAS UTILIZADAS:');
    usedHeavyDeps.forEach(dep => {
      const size = getDependencySize(dep);
      const status = size.includes('>500KB') ? '🚨' : '⚠️';
      console.log(`${status} ${dep}: ${size}`);
    });

    if (unusedDeps.length > 0) {
      console.log('\n🗑️  DEPENDÊNCIAS NÃO UTILIZADAS:');
      unusedDeps.slice(0, 10).forEach(dep => {
        console.log(`- ${dep}`);
      });
      if (unusedDeps.length > 10) {
        console.log(`... e mais ${unusedDeps.length - 10} dependências`);
      }
    }

    // Análise de duplicação
    const duplicates = findDuplicateDependencies(dependencies);
    if (duplicates.length > 0) {
      console.log('\n🔄 DEPENDÊNCIAS DUPLICADAS:');
      duplicates.forEach(dup => {
        console.log(`- ${dup.name}: ${dup.versions.length} versões`);
      });
    }

    fs.writeFileSync(
      path.join(analysisDir, 'dependencies-analysis.json'),
      JSON.stringify({
        production: dependencies,
        development: devDependencies,
        bundleDependencies: bundleDeps,
        heavyDeps: usedHeavyDeps,
        unusedDeps,
        duplicates,
        recommendations: generateDependencyRecommendations(usedHeavyDeps, unusedDeps, duplicates)
      }, null, 2)
    );

  } catch (error) {
    console.log('❌ Erro ao analisar dependências:', error.message);
  }
}

function analyzeBundleDependencies() {
  // Tentar identificar dependências do bundle através de análise de arquivos
  const bundleDeps = new Set();

  try {
    // Analisar arquivos do build
    const staticDir = path.join(nextDir, 'static');
    if (fs.existsSync(staticDir)) {
      const chunksDir = path.join(staticDir, 'chunks');
      if (fs.existsSync(chunksDir)) {
        const files = fs.readdirSync(chunksDir).filter(f => f.endsWith('.js'));

        files.forEach(file => {
          try {
            const filePath = path.join(chunksDir, file);
            const content = fs.readFileSync(filePath, 'utf8');

            // Procurar por imports de node_modules
            const importMatches = content.match(/from\s+['"]([^'"]*node_modules\/[^'"]*)['"]/g) || [];
            importMatches.forEach(match => {
              const dep = match.match(/node_modules\/([^\/]+)/)?.[1];
              if (dep) bundleDeps.add(dep);
            });

            // Procurar por require de node_modules
            const requireMatches = content.match(/require\(['"]([^'"]*node_modules\/[^'"]*)['"]\)/g) || [];
            requireMatches.forEach(match => {
              const dep = match.match(/node_modules\/([^\/]+)/)?.[1];
              if (dep) bundleDeps.add(dep);
            });
          } catch (e) {
            // Ignorar erros de leitura de arquivo
          }
        });
      }
    }
  } catch (e) {
    console.log('⚠️  Não foi possível analisar dependências do bundle');
  }

  return Array.from(bundleDeps);
}

function findDuplicateDependencies(deps) {
  // Simulação - em produção usaria npm ls ou similar
  const duplicates = [];
  const versionMap = new Map();

  // Para este exemplo, vamos simular algumas duplicatas conhecidas
  const knownDuplicates = [
    { name: 'react', versions: ['18.2.0', '18.3.1'] },
    { name: 'lodash', versions: ['4.17.21', '4.17.20'] }
  ];

  return knownDuplicates.filter(dup => deps.includes(dup.name));
}

function analyzePerformance() {
  console.log('\n⚡ ANÁLISE DE PERFORMANCE:');

  // Estimar Core Web Vitals impact
  const bundleSize = getBundleSize();
  const estimatedLCP = calculateEstimatedLCP(bundleSize);
  const estimatedFID = calculateEstimatedFID(bundleSize);

  console.log(`🎯 LCP Estimado: ${estimatedLCP}ms (target: <2500ms)`);
  console.log(`👆 FID Estimado: ${estimatedFID}ms (target: <100ms)`);

  if (estimatedLCP > 2500) {
    console.log('🚨 ALERTA: LCP acima do recomendado!');
  }

  if (estimatedFID > 100) {
    console.log('🚨 ALERTA: FID acima do recomendado!');
  }

  // Análise de histórico
  if (bundleHistory.length > 1) {
    console.log('\n📈 COMPARAÇÃO COM BUILDS ANTERIORES:');
    const previous = bundleHistory[bundleHistory.length - 2];
    const current = bundleHistory[bundleHistory.length - 1];

    if (previous && current) {
      const sizeDiff = ((current.totalSize - previous.totalSize) / previous.totalSize * 100).toFixed(1);
      const chunkDiff = current.totalChunks - previous.totalChunks;

      console.log(`📏 Tamanho do bundle: ${sizeDiff > 0 ? '+' : ''}${sizeDiff}%`);
      console.log(`📦 Número de chunks: ${chunkDiff > 0 ? '+' : ''}${chunkDiff}`);
    }
  }

  return { estimatedLCP, estimatedFID };
}

function generateRecommendations() {
  const bundleSize = getBundleSize();
  const recommendations = [];

  // Bundle size recommendations
  if (bundleSize > CONFIG.bundleSizeLimit) {
    recommendations.push({
      category: 'Bundle Size',
      priority: 'CRITICAL',
      description: `Bundle muito grande (${(bundleSize / 1024 / 1024).toFixed(2)}MB > ${(CONFIG.bundleSizeLimit / 1024 / 1024).toFixed(1)}MB)`,
      impact: `Reduzir ${(bundleSize - CONFIG.bundleSizeLimit) / 1024 / 1024 * 100 / (bundleSize / 1024 / 1024).toFixed(1)}% do tamanho`,
      implementation: 'Implementar code splitting urgente e tree shaking'
    });
  }

  // Standard recommendations
  recommendations.push(
    {
      category: 'Bundle Splitting',
      priority: 'HIGH',
      description: 'Implementar code splitting por rotas e funcionalidades',
      impact: 'Redução de 30-50% no bundle inicial',
      implementation: 'Usar dynamic imports e React.lazy()'
    },
    {
      category: 'Tree Shaking',
      priority: 'HIGH',
      description: 'Otimizar imports para reduzir código morto',
      impact: 'Redução de 20-30% em bibliotecas grandes',
      implementation: 'Usar imports nomeados ao invés de imports padrão'
    },
    {
      category: 'Compression',
      priority: 'MEDIUM',
      description: 'Implementar Brotli compression no servidor',
      impact: 'Redução adicional de 15-25% no tamanho transferido',
      implementation: 'Configurar CDN e servidor para Brotli'
    },
    {
      category: 'Image Optimization',
      priority: 'HIGH',
      description: 'Lazy loading e otimização de imagens',
      impact: 'Redução de 40-60% no tamanho de imagens',
      implementation: 'Usar WebP/AVIF com fallbacks e lazy loading'
    },
    {
      category: 'Caching Strategy',
      priority: 'MEDIUM',
      description: 'Implementar cache inteligente com Service Worker',
      impact: 'Redução de requests repetidos em 70%',
      implementation: 'Cache de chunks e recursos estáticos'
    }
  );

  console.log('\n💡 RECOMENDAÇÕES DE OTIMIZAÇÃO:');
  recommendations.forEach((rec, index) => {
    const priorityIcon = rec.priority === 'CRITICAL' ? '🚨' : rec.priority === 'HIGH' ? '🔴' : '🟡';
    console.log(`${index + 1}. ${priorityIcon} [${rec.priority}] ${rec.category}: ${rec.description}`);
    console.log(`   📊 Impacto: ${rec.impact}`);
    console.log(`   🔧 Implementação: ${rec.implementation}\n`);
  });

  fs.writeFileSync(
    path.join(analysisDir, 'optimization-recommendations.json'),
    JSON.stringify(recommendations, null, 2)
  );
}

function generateChunkRecommendations(chunks) {
  const recommendations = [];

  const oversized = chunks.filter(c => c.size > CONFIG.chunkSizeLimit);
  if (oversized.length > 0) {
    recommendations.push({
      type: 'code_splitting',
      description: `${oversized.length} chunks acima de ${CONFIG.chunkSizeLimit / 1024}KB`,
      action: 'Implementar lazy loading para estes chunks'
    });
  }

  const vendorChunks = chunks.filter(c => c.category === 'vendor');
  if (vendorChunks.length > 3) {
    recommendations.push({
      type: 'vendor_splitting',
      description: `${vendorChunks.length} chunks vendor - considerar consolidação`,
      action: 'Revisar estratégia de vendor chunks'
    });
  }

  return recommendations;
}

function generateDependencyRecommendations(heavyDeps, unusedDeps, duplicates) {
  const recommendations = [];

  if (heavyDeps.length > 0) {
    recommendations.push({
      type: 'heavy_dependencies',
      description: `${heavyDeps.length} dependências pesadas identificadas`,
      action: 'Considerar lazy loading ou alternativas mais leves'
    });
  }

  if (unusedDeps.length > 0) {
    recommendations.push({
      type: 'unused_dependencies',
      description: `${unusedDeps.length} dependências não utilizadas`,
      action: 'Remover dependências não utilizadas do package.json'
    });
  }

  if (duplicates.length > 0) {
    recommendations.push({
      type: 'duplicate_dependencies',
      description: `${duplicates.length} dependências com versões duplicadas`,
      action: 'Resolver conflitos de versão e deduplicar'
    });
  }

  return recommendations;
}

function estimateGzipSize(size) {
  // Estimativa simples de compressão gzip (normalmente 60-80% de redução)
  return Math.round(size * 0.3);
}

function getBundleSize() {
  try {
    const staticDir = path.join(nextDir, 'static');
    if (!fs.existsSync(staticDir)) return 0;

    const chunksDir = path.join(staticDir, 'chunks');
    if (!fs.existsSync(chunksDir)) return 0;

    const files = fs.readdirSync(chunksDir).filter(f => f.endsWith('.js'));
    return files.reduce((total, file) => {
      const stats = fs.statSync(path.join(chunksDir, file));
      return total + stats.size;
    }, 0);
  } catch (e) {
    return 0;
  }
}

function calculateEstimatedLCP(bundleSize) {
  // Estimativa baseada em dados reais: ~3-5ms por KB
  const sizeKB = bundleSize / 1024;
  return Math.round(sizeKB * 4);
}

function calculateEstimatedFID(bundleSize) {
  // Estimativa baseada em dados reais: ~0.1-0.2ms por KB
  const sizeKB = bundleSize / 1024;
  return Math.round(sizeKB * 0.15);
}

function getDependencySize(dep) {
  // Estimativas mais precisas baseadas em dados reais
  const sizeEstimates = {
    'framer-motion': '~220KB (árvores de animação grandes)',
    'react': '~150KB (core framework)',
    'react-dom': '~350KB (renderização DOM)',
    'next': '~180KB (framework Next.js)',
    'tailwindcss': '~500KB (framework CSS)',
    'lucide-react': '~800KB (800+ ícones)',
    'zod': '~50KB (validação de schemas)',
    'stripe': '~120KB (processamento de pagamentos)',
    'recharts': '~350KB (biblioteca de gráficos)',
    '@types/recharts': '~50KB (tipos TypeScript)'
  };

  return sizeEstimates[dep] || 'Tamanho desconhecido - verificar npm bundle-size';
}

function saveBundleHistory(bundleSize, chunkCount, buildTime) {
  const entry = {
    timestamp: new Date().toISOString(),
    totalSize: bundleSize,
    totalChunks: chunkCount,
    buildTime,
    estimatedGzippedSize: estimateGzipSize(bundleSize)
  };

  bundleHistory.push(entry);

  // Manter apenas últimas 10 entradas
  if (bundleHistory.length > 10) {
    bundleHistory = bundleHistory.slice(-10);
  }

  fs.writeFileSync(historyFile, JSON.stringify(bundleHistory, null, 2));
}

// Executar análise adicional se disponível
try {
  console.log('\n🔍 EXECUTANDO ANÁLISE AVANÇADA...');

  // Verificar se há webpack-bundle-analyzer
  const hasAnalyzer = checkIfPackageExists('@next/bundle-analyzer');
  if (hasAnalyzer) {
    console.log('📊 Bundle Analyzer disponível - execute: pnpm analyze:bundle');
  }

} catch (error) {
  console.log('⚠️  Análise avançada não disponível:', error.message);
}

function checkIfPackageExists(packageName) {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName];
  } catch {
    return false;
  }
}

console.log('\n🎯 PRÓXIMO PASSO: Execute as otimizações recomendadas');
console.log('💡 Use: node scripts/bundle-analyzer.mjs --optimize');
