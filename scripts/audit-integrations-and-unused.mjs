#!/usr/bin/env node

/**
 * AUDITORIA INTEGRAL DE RISCO - INTEGRAÇÕES E CÓDIGO NÃO UTILIZADO
 *
 * Este script executa 5 scanners especializados para detectar:
 * 1. Variáveis de ambiente declaradas mas não usadas
 * 2. Código não utilizado (imports, exports, funções)
 * 3. Integrações configuradas mas não utilizadas
 * 4. Integrações usadas de forma insegura
 * 5. Rotas expostas que não fazem nada útil
 *
 * Resultado: relatório JSON + resumo executivo para governança
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configurações
const INVENTORY_PATH = path.join(__dirname, '../quality-audit/integrations-inventory.json');
const REPORT_DIR = path.join(__dirname, '../quality-history');
const SRC_DIR = path.join(__dirname, '../');

// Garantir diretório de relatórios existe
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Carregar inventário de integrações
const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf8'));

// Carregar taxonomia de erros
const TAXONOMY_PATH = path.join(__dirname, '../quality-audit/audit-taxonomy.json');
const taxonomy = JSON.parse(fs.readFileSync(TAXONOMY_PATH, 'utf8'));

/**
 * COLETOR DE SINAIS DE CONTEXTO AVANÇADO
 * Coleta metadados completos + análise semântica para classificação baseada em intenção
 */
function collectContextSignals(filePath, itemType, itemName) {
  const signals = {
    // Temporal
    lastModified: null,
    ageInDays: null,

    // Intenção explícita
    hasTodoWip: false,
    hasFeatureFlag: false,
    intendedForRelease: false,

    // Testes e qualidade
    hasTests: false,
    hasTestMentions: false,

    // Arquitetura
    isInRegistry: false,
    isExposedExternally: false,

    // Impacto
    generatesCost: false,
    generatesRisk: false,

    // Análise semântica
    isDevOnly: false,
    hasRealLogic: false,
    hasSecurityCheck: false,
    hasLogging: false,

    // Metadados
    fileSize: 0,
    lineCount: 0
  };

  try {
    // 1. Última modificação e idade
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      signals.lastModified = stats.mtime;
      signals.fileSize = stats.size;

      const ageMs = Date.now() - stats.mtime.getTime();
      signals.ageInDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

      // Contar linhas
      const content = fs.readFileSync(filePath, 'utf8');
      signals.lineCount = content.split('\n').length;

      // 2. Verificar intenção explícita
      signals.hasTodoWip = /TODO|WIP|FIXME|HACK|@todo|@hack/i.test(content);
      signals.hasFeatureFlag = /feature-flag|FEATURE_FLAG|experimental|EXPERIMENTAL/i.test(content);
      signals.intendedForRelease = /@intent release|@production|@live/i.test(content);

      // 3. Análise semântica do código
      signals.isDevOnly = /mock|test|debug|playground|stub|dummy/i.test(content);
      signals.hasRealLogic = /import.*from|\.create\(|\.find\(|\.update\(|\.delete\(|\.query\(|await|async|function|class/i.test(content);
      signals.hasSecurityCheck = /auth|token|session|admin|role|permission|authorize|authenticate/i.test(content);
      signals.hasLogging = /console\.|log\(|logger\.|winston|bunyan/i.test(content);
    }

    // 3. Verificar testes relacionados
    const testPatterns = [
      `test.*${itemName}`,
      `${itemName}.test`,
      `${itemName}.spec`,
      `describe.*${itemName}`,
      `it.*${itemName}`,
      `mock.*${itemName}`,
      `${itemName}.*\.test`
    ];

    function checkForTests(dir) {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            checkForTests(fullPath);
          } else if (stat.isFile() && (item.endsWith('.test.ts') || item.endsWith('.spec.ts') || item.endsWith('.test.tsx') || item.endsWith('.spec.tsx'))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (testPatterns.some(pattern => new RegExp(pattern, 'i').test(content))) {
              signals.hasTests = true;
              return;
            }
            // Também verificar menções em testes (mesmo que não específicas)
            if (content.includes(itemName) && (content.includes('describe') || content.includes('it(') || content.includes('test('))) {
              signals.hasTestMentions = true;
            }
          }
        }
      } catch (error) {
        // Ignorar erros de leitura
      }
    }

    checkForTests(SRC_DIR);

    // 4. Verificar exposição externa e arquitetura
    if (itemType === 'route') {
      signals.isExposedExternally = filePath.includes('/api/') || filePath.includes('pages/api');
      signals.isInRegistry = true; // Rotas são sempre registradas no Next.js

      // Para rotas, verificar se é admin ou requer autenticação
      if (itemName.includes('/admin/') || itemName.includes('/private/') || signals.hasSecurityCheck) {
        signals.generatesRisk = true; // Rotas admin têm risco de segurança se mal protegidas
      }
    } else if (itemType === 'export') {
      // Verificar se é usado em outros arquivos (simplificado)
      signals.isInRegistry = false; // Verificaremos depois se é importado
    } else if (itemType === 'env') {
      signals.isExposedExternally = ['SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'API'].some(sensitive =>
        itemName.toUpperCase().includes(sensitive));
    }

    // 5. Verificar custo e risco
    if (itemType === 'integration') {
      const integration = inventory.integrations[itemName];
      if (integration) {
        signals.generatesCost = integration.env_vars.length > 0 ||
          ['vercel-kv', 'plausible'].includes(itemName); // SDKs que podem gerar custo
        signals.generatesRisk = integration.fallback_required === false ||
          integration.schema_validation_required === false;
      }
    } else if (itemType === 'env') {
      signals.generatesCost = ['SECRET', 'KEY', 'TOKEN', 'PASSWORD'].some(sensitive =>
        itemName.toUpperCase().includes(sensitive));
      signals.generatesRisk = signals.generatesCost; // Credenciais sempre geram risco
    } else if (itemType === 'route') {
      signals.generatesRisk = signals.isExposedExternally; // APIs públicas sempre geram risco
    }

  } catch (error) {
    console.warn(`⚠️  Erro coletando sinais para ${filePath}:`, error.message);
  }

  return signals;
}

/**
 * ÁRVORE DE DECISÃO - CLASSIFICAÇÃO BASEADA EM INTENÇÃO
 * EM ANDAMENTO | CONGELADO | OBSOLETO
 */
function classifyIntent(signals, itemType) {
  const {
    ageInDays,
    hasTodoWip,
    hasFeatureFlag,
    intendedForRelease,
    hasTests,
    hasTestMentions,
    isInRegistry,
    isExposedExternally,
    generatesCost,
    generatesRisk,
    isDevOnly,
    hasRealLogic,
    hasSecurityCheck,
    hasLogging
  } = signals;

  // A) EM ANDAMENTO - NÃO REMOVER
  // Item está sendo construído ativamente

  // 1. Última modificação < 14 dias
  if (ageInDays !== null && ageInDays <= 14) {
    return 'EM_ANDAMENTO';
  }

  // 2. Intenção explícita (TODO/WIP/feature-flag)
  if (hasTodoWip || hasFeatureFlag) {
    return 'EM_ANDAMENTO';
  }

  // 2.1. Autorização explícita para release
  if (intendedForRelease) {
    return 'EM_ANDAMENTO';
  }

  // 3. Existe teste específico ou menção em testes
  if (hasTests || hasTestMentions) {
    return 'EM_ANDAMENTO';
  }

  // 4. Registrado em arquitetura (service container, roteador, etc.)
  if (isInRegistry) {
    return 'EM_ANDAMENTO';
  }

  // 5. Exposto externamente (contrato público)
  if (isExposedExternally) {
    return 'EM_ANDAMENTO';
  }

  // 6. Possui lógica real (não é apenas placeholder)
  if (hasRealLogic && !isDevOnly) {
    return 'EM_ANDAMENTO';
  }

  // B) CONGELADO - DECISÃO HUMANA NECESSÁRIA (48h)
  // Item parece abandonado mas pode ser estratégico

  // Última modificação entre 14-45 dias E nenhuma intenção clara
  if (ageInDays !== null && ageInDays > 14 && ageInDays <= 45 &&
      !hasTodoWip && !hasFeatureFlag && !hasTests && !hasTestMentions &&
      !isExposedExternally) {
    return 'CONGELADO';
  }

  // C) OBSOLETO - REMOVER IMEDIATAMENTE
  // Item é claramente lixo

  // 1. Muito antigo (>45 dias) sem sinais de vida
  if (ageInDays !== null && ageInDays > 45 &&
      !hasTodoWip && !hasFeatureFlag && !hasTests && !hasTestMentions &&
      !isExposedExternally && !isInRegistry) {
    return 'OBSOLETO';
  }

  // 2. Gera custo/risco mas não tem uso
  if (generatesCost && !hasTests && !hasTestMentions && ageInDays !== null && ageInDays > 30) {
    return 'OBSOLETO';
  }

  // 3. Endpoint público sem lógica útil (>30 dias)
  if (itemType === 'route' && isExposedExternally && ageInDays !== null && ageInDays > 30) {
    // Se não tem lógica real E não tem intenção clara E não tem segurança
    if (!hasRealLogic && !hasTodoWip && !hasFeatureFlag && !hasSecurityCheck) {
      return 'OBSOLETO';
    }
  }

  // 4. Código dev-only sem intenção de release
  if (isDevOnly && !intendedForRelease && ageInDays !== null && ageInDays > 7) {
    return 'OBSOLETO';
  }

  // 5. Sem logging ou monitoramento em produção
  if (isExposedExternally && !hasLogging && !hasSecurityCheck && ageInDays !== null && ageInDays > 21) {
    return 'CONGELADO'; // Precisa decisão se deve ter monitoramento
  }

  // Default: se não se encaixa em nenhum critério claro, marcar como congelado para revisão
  return 'CONGELADO';
}

/**
 * SISTEMA DE CATEGORIZAÇÃO INTELIGENTE
 * Classifica achados nas 3 dimensões: Origem, Área, Impacto
 */
function categorizeFinding(finding, itemType, filePath, signals) {
  const categories = {
    family: null,
    origins: [],
    areas: [],
    impacts: [],
    relationships: []
  };

  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const relativePath = path.relative(SRC_DIR, filePath);

  // 1. DETERMINAR FAMÍLIA (categoria principal)
  if (itemType === 'route' && finding.intent === 'EM_ANDAMENTO') {
    categories.family = 'structural_orphaned';
  } else if (itemType === 'integration' && finding.missingErrorHandling) {
    categories.family = 'operational_failure';
  } else if (itemType === 'env' && finding.variable?.includes('SECRET')) {
    categories.family = 'security_exposure';
  } else if (itemType === 'export') {
    categories.family = 'structural_orphaned';
  } else if (signals.generatesRisk) {
    categories.family = 'security_exposure';
  } else if (signals.generatesCost) {
    categories.family = 'resource_inefficiency';
  } else {
    categories.family = 'development_hygiene';
  }

  // 2. DETERMINAR ORIGENS (causas)
  if (signals.ageInDays <= 14) {
    categories.origins.push('refactor_incomplete');
  }
  if (signals.hasTodoWip || signals.hasFeatureFlag) {
    categories.origins.push('feature_abandoned');
  }
  if (content.includes('mock') || content.includes('stub')) {
    categories.origins.push('pattern_violation');
  }
  if (itemType === 'env' && !finding.variable) {
    categories.origins.push('configuration_drift');
  }
  if (signals.isDevOnly) {
    categories.origins.push('refactor_incomplete');
  }

  // 3. DETERMINAR ÁREAS (contextos)
  if (relativePath.includes('/api/') || relativePath.includes('pages/api')) {
    categories.areas.push('backend/api');
  }
  if (relativePath.includes('/auth/') || signals.hasSecurityCheck) {
    categories.areas.push('security/auth');
  }
  if (relativePath.includes('/ui/') || relativePath.includes('/components/')) {
    categories.areas.push('frontend/ui');
  }
  if (relativePath.includes('/analytics/') || content.includes('track')) {
    categories.areas.push('analytics/tracking');
  }
  if (relativePath.includes('/config/') || itemType === 'env') {
    categories.areas.push('infra/config');
  }
  if (relativePath.includes('/test/') || signals.hasTests) {
    categories.areas.push('testing/unit');
  }

  // 4. DETERMINAR IMPACTOS (efeitos)
  if (signals.generatesRisk || categories.family === 'security_exposure') {
    categories.impacts.push('security', 'data_protection');
  }
  if (signals.generatesCost) {
    categories.impacts.push('cost', 'performance');
  }
  if (itemType === 'export' || itemType === 'route') {
    categories.impacts.push('maintainability', 'developer_cognitive_load');
  }
  if (signals.hasRealLogic) {
    categories.impacts.push('reliability', 'user_experience');
  }
  if (signals.isDevOnly) {
    categories.impacts.push('developer_productivity');
  }

  // 5. CRIAR RELACIONAMENTOS (grafo de dependências)
  // Esta é uma versão simplificada - em produção seria mais sofisticada
  if (itemType === 'route' && finding.intent === 'EM_ANDAMENTO') {
    // Procurar dependências relacionadas
    const relatedFiles = findRelatedFiles(filePath, content);
    relatedFiles.forEach(related => {
      categories.relationships.push({
        target_id: path.relative(SRC_DIR, related),
        type: 'depends_on',
        strength: 0.8,
        description: 'Rota depende deste arquivo'
      });
    });
  }

  return categories;
}

/**
 * CALCULAR GRAVIDADE COMPOSTA
 * Severity = (Impacto * Probabilidade) + (Interconexão * Peso)
 */
function calculateCompoundSeverity(finding, categories, signals) {
  const family = taxonomy.taxonomy.families[categories.family];
  const baseSeverity = family ? family.severity_weight : 0.5;

  // Fator de impacto (baseado na família e sinais)
  let impactFactor = baseSeverity;
  if (signals.generatesRisk) impactFactor *= 1.5;
  if (signals.generatesCost) impactFactor *= 1.2;
  if (categories.impacts.includes('security')) impactFactor *= 2.0;

  // Fator de probabilidade (baseado em sinais de atividade)
  let probabilityFactor = 1.0;
  if (signals.ageInDays <= 7) probabilityFactor *= 0.8; // Recente = mais provável de ser usado
  if (signals.hasTests) probabilityFactor *= 0.7; // Testado = mais provável de ser válido
  if (signals.isDevOnly) probabilityFactor *= 1.3; // Dev-only = mais provável de ser problema

  // Fator de interconexão (quantidade de relacionamentos)
  const interconnectionFactor = Math.min(categories.relationships.length * 0.1, 0.5);

  // Gravidade composta
  const compoundSeverity = (impactFactor * probabilityFactor) + interconnectionFactor;

  return {
    base: baseSeverity,
    compound: Math.min(compoundSeverity, 1.0),
    factors: {
      impact: impactFactor,
      probability: probabilityFactor,
      interconnection: interconnectionFactor
    }
  };
}

/**
 * ENCONTRAR ARQUIVOS RELACIONADOS (simplificado)
 */
function findRelatedFiles(filePath, content) {
  const related = [];
  const dir = path.dirname(filePath);

  try {
    // Procurar imports no mesmo diretório
    const importMatches = content.match(/from ['"]([^'"]+)['"]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const importPath = match.replace(/from ['"]/, '').replace(/['"]/, '');
        if (!importPath.startsWith('@') && !importPath.startsWith('.')) {
          // Import relativo - procurar no diretório
          const possiblePaths = [
            path.join(dir, importPath + '.ts'),
            path.join(dir, importPath + '.tsx'),
            path.join(dir, importPath, 'index.ts'),
            path.join(dir, importPath, 'index.tsx')
          ];

          possiblePaths.forEach(possiblePath => {
            if (fs.existsSync(possiblePath)) {
              related.push(possiblePath);
            }
          });
        }
      });
    }
  } catch (error) {
    // Ignorar erros
  }

  return related;
}

/**
 * DETERMINAR OWNER VIA GIT (Cross-platform)
 */
function getOwner(filePath) {
  try {
    // Tentar usar git blame de forma cross-platform
    const relativePath = path.relative(SRC_DIR, filePath);

    // Método 1: Usar execSync com comando compatível
    try {
      let blameCommand;
      if (process.platform === 'win32') {
        // Windows: usar findstr e alternativa ao head
        blameCommand = `git blame --line-porcelain "${relativePath}" 2>nul | findstr "^author "`;
      } else {
        // Unix-like
        blameCommand = `git blame --line-porcelain "${relativePath}" | grep "^author " | head -1`;
      }

      const blameOutput = execSync(blameCommand, {
        cwd: SRC_DIR,
        encoding: 'utf8',
        timeout: 5000 // 5s timeout
      }).trim();

      if (blameOutput) {
        // Para Windows, pegar apenas a primeira linha
        const firstLine = process.platform === 'win32'
          ? blameOutput.split('\n')[0]
          : blameOutput;

        return firstLine.replace('author ', '');
      }
    } catch (execError) {
      // Fallback: tentar método alternativo
      console.warn(`⚠️  Git blame falhou para ${relativePath}, tentando método alternativo`);
    }

    // Método 2: Usar git log para o arquivo
    try {
      const logCommand = process.platform === 'win32'
        ? `git log --format="%an" -1 -- "${relativePath}" 2>nul`
        : `git log --format="%an" -1 -- "${relativePath}"`;

      const logOutput = execSync(logCommand, {
        cwd: SRC_DIR,
        encoding: 'utf8',
        timeout: 3000
      }).trim();

      if (logOutput) {
        return logOutput;
      }
    } catch (logError) {
      console.warn(`⚠️  Git log também falhou para ${relativePath}`);
    }

  } catch (error) {
    console.warn(`⚠️  Erro geral obtendo owner para ${filePath}:`, error.message);
  }

  return 'Desconhecido';
}

/**
 * SCANNER 1: Variáveis de ambiente declaradas mas não usadas
 */
function scanUnusedEnvVars() {
  console.log('🔍 Scanner 1: Analisando variáveis de ambiente...');

  try {
    const unused = [];
    const leakedToClient = [];

    // Coletar todas as env vars declaradas
    const declaredEnvVars = new Set();

  for (const sourceFile of inventory.env_sources) {
    const fullPath = path.join(SRC_DIR, sourceFile);

    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');

      // Procurar declarações de env vars
      const envDeclarations = content.match(/process\.env\.(\w+)|env\.(\w+)/g);
      if (envDeclarations) {
        envDeclarations.forEach(decl => {
          const varName = decl.replace(/process\.env\.|env\./, '');
          declaredEnvVars.add(varName);
        });
      }
    }
  }

  // Verificar quais são realmente usadas no código
  const usedEnvVars = new Set();

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');

        // Verificar se é arquivo client-side (pode vazar env)
        const isClientFile = inventory.client_bundle_files.some(pattern =>
          fullPath.includes(pattern.replace('/**/*.{ts,tsx}', '').replace('**/*.{ts,tsx}', ''))
        );

        // Procurar uso de env vars
        const envUsage = content.match(/process\.env\.(\w+)|env\.(\w+)/g);
        if (envUsage) {
          envUsage.forEach(usage => {
            const varName = usage.replace(/process\.env\.|env\./, '');
            usedEnvVars.add(varName);

            // Verificar se env sensível está em client bundle
            if (isClientFile && ['SECRET', 'KEY', 'TOKEN', 'PASSWORD'].some(sensitive =>
              varName.toUpperCase().includes(sensitive))) {
              leakedToClient.push({
                variable: varName,
                file: fullPath,
                severity: 'CRITICAL'
              });
            }
          });
        }
      }
    }
  }

  scanDirectory(SRC_DIR);

  // Encontrar vars não usadas com sinais de contexto
  for (const declared of declaredEnvVars) {
    if (!usedEnvVars.has(declared)) {
      // Encontrar arquivo onde foi declarada
      let sourceFile = 'Desconhecido';
      for (const source of inventory.env_sources) {
        const fullPath = path.join(SRC_DIR, source);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes(declared)) {
            sourceFile = fullPath;
            break;
          }
        }
      }

      // Coletar sinais de contexto
      const signals = collectContextSignals(sourceFile, 'env', declared);
      const intent = classifyIntent(signals, 'env');
      const owner = getOwner(sourceFile);

      // Categorização inteligente
      const categories = categorizeFinding({ variable: declared, intent }, 'env', sourceFile, signals);
      const severityInfo = calculateCompoundSeverity({ variable: declared, intent }, categories, signals);

      unused.push({
        variable: declared,
        sourceFile: path.relative(SRC_DIR, sourceFile),
        intent,
        owner,
        signals,
        categories,
        severity: severityInfo.compound > 0.8 ? 'CRITICAL' :
                 severityInfo.compound > 0.6 ? 'HIGH' :
                 severityInfo.compound > 0.4 ? 'MEDIUM' : 'LOW',
        severity_compound: severityInfo,
        recommendation: intent === 'OBSOLETO' ? 'Remover imediatamente - credencial órfã gera risco de segurança' :
                        intent === 'CONGELADO' ? 'Revisar em 48h - decidir manter ou remover' :
                        'Manter - sinal de atividade recente'
      });
    }
  }

  // Processar vazamentos com sinais de contexto
  const processedLeakedToClient = leakedToClient.map(item => {
    const signals = collectContextSignals(item.file, 'env', item.variable);
    const intent = classifyIntent(signals, 'env');
    const owner = getOwner(item.file);
    const categories = categorizeFinding(item, 'env', item.file, signals);
    const severityInfo = calculateCompoundSeverity(item, categories, signals);

    return {
      ...item,
      intent,
      owner,
      signals,
      categories,
      severity: 'CRITICAL', // Vazamentos sempre críticos
      severity_compound: severityInfo,
      recommendation: 'Corrigir IMEDIATAMENTE - credencial exposta no client bundle'
    };
  });

    return { unused, leakedToClient: processedLeakedToClient };
  } catch (error) {
    console.error('❌ Erro no Scanner 1:', error);
    return { unused: [], leakedToClient: [] };
  }
}

/**
 * SCANNER 2: Código não utilizado (imports, exports, funções)
 */
function scanUnusedCode() {
  console.log('🔍 Scanner 2: Analisando código não utilizado...');

  const unusedExports = [];
  const unusedImports = [];

  try {
    // Método 1: Tentar usar TypeScript compiler de forma cross-platform
    try {
      let tsCommand;
      if (process.platform === 'win32') {
        tsCommand = 'npx.cmd tsc --noEmit --noUnusedLocals --noUnusedParameters 2>nul';
      } else {
        tsCommand = 'npx tsc --noEmit --noUnusedLocals --noUnusedParameters 2>&1 || true';
      }

      const tsOutput = execSync(tsCommand, {
        cwd: SRC_DIR,
        encoding: 'utf8',
        timeout: 10000 // 10s timeout
      });

      // Parse basic unused errors
      const unusedMatches = tsOutput.match(/'(\w+)' is declared but never used/g);
      if (unusedMatches) {
        unusedMatches.forEach(match => {
          const symbol = match.replace(/'.*' is declared but never used/, '$1');
          unusedImports.push({
            symbol,
            type: 'local_variable',
            severity: 'MEDIUM'
          });
        });
      }
    } catch (tsError) {
      console.warn('⚠️  TypeScript compiler falhou, usando análise alternativa');
    }

    // Método 2: Análise básica usando APIs Node.js (fallback)
    console.log('🔍 Usando análise alternativa de código não utilizado...');

    const allExports = new Map(); // symbol -> file
    const allImports = new Map(); // symbol -> files[]

    // Função para analisar um arquivo
    function analyzeFile(filePath) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(SRC_DIR, filePath);

        // Detectar exports
        const exportMatches = content.match(/export (?:const|function|class|interface|type) (\w+)/g);
        if (exportMatches) {
          exportMatches.forEach(match => {
            const symbol = match.replace(/export (?:const|function|class|interface|type) /, '');
            if (!allExports.has(symbol)) {
              allExports.set(symbol, []);
            }
            allExports.get(symbol).push(relativePath);
          });
        }

        // Detectar exports default
        if (content.includes('export default')) {
          const defaultSymbol = `default_${path.basename(filePath, path.extname(filePath))}`;
          if (!allExports.has(defaultSymbol)) {
            allExports.set(defaultSymbol, []);
          }
          allExports.get(defaultSymbol).push(relativePath);
        }

        // Detectar imports
        const importMatches = content.match(/import .* from ['"]([^'"]+)['"]/g);
        if (importMatches) {
          importMatches.forEach(match => {
            // Simplificado: apenas registra que há imports
            // Análise completa seria mais complexa
          });
        }

        // Detectar uso de variáveis (análise básica)
        const usagePatterns = [
          /\b(\w+)\s*\(/g,  // function calls
          /\b(\w+)\s*\./g,  // property access
          /\b(\w+)\s*=/g,   // assignments
        ];

        usagePatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const symbol = match[1];
            if (!allImports.has(symbol)) {
              allImports.set(symbol, []);
            }
            if (!allImports.get(symbol).includes(relativePath)) {
              allImports.get(symbol).push(relativePath);
            }
          }
        });

      } catch (error) {
        // Ignorar erros de leitura
      }
    }

    // Analisar todos os arquivos TypeScript/JavaScript
    function scanDirectoryForCode(dir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectoryForCode(fullPath);
        } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
          analyzeFile(fullPath);
        }
      }
    }

    scanDirectoryForCode(SRC_DIR);

    // Comparar exports vs imports (análise simplificada)
    for (const [symbol, exportFiles] of allExports) {
      const importFiles = allImports.get(symbol) || [];

      // Se um export não é importado em lugar nenhum
      const unusedExportFiles = exportFiles.filter(exportFile =>
        !importFiles.some(importFile => importFile !== exportFile) // Não conta auto-import
      );

      if (unusedExportFiles.length > 0) {
        unusedExports.push({
          symbol,
          files: unusedExportFiles,
          severity: 'LOW',
          type: 'unused_export'
        });
      }
    }

    console.log(`📊 Análise alternativa encontrou: ${unusedExports.length} exports não utilizados, ${unusedImports.length} imports não utilizados`);

  } catch (error) {
    console.warn('⚠️  Análise de código não utilizado falhou completamente:', error.message);
  }

  return { unusedExports, unusedImports };
}

/**
 * SCANNER 3: Integrações configuradas mas não utilizadas
 */
function scanUnusedIntegrations() {
  console.log('🔍 Scanner 3: Analisando integrações não utilizadas...');

  const declaredNotUsed = [];

  // Verificar package.json
  const packageJson = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'package.json'), 'utf8'));
  const installedPackages = new Set([
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {})
  ]);

  for (const [integrationKey, integration] of Object.entries(inventory.integrations)) {
    const isPackageInstalled = installedPackages.has(integration.package);

    if (isPackageInstalled) {
      // Verificar se é usado no código
      let isUsed = false;

      function scanForUsage(dir) {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanForUsage(fullPath);
          } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(integration.package.replace('@', '').replace('/', '.')) ||
                content.includes(integrationKey)) {
              isUsed = true;
              return;
            }
          }
        }
      }

      scanForUsage(SRC_DIR);

      if (!isUsed) {
        // Encontrar arquivo de configuração da integração
        let configFile = 'Desconhecido';
        function findIntegrationFile(dir) {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
              findIntegrationFile(fullPath);
            } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js'))) {
              const content = fs.readFileSync(fullPath, 'utf8');
              if (content.includes(integration.package) || content.includes(integrationKey)) {
                configFile = fullPath;
                return;
              }
            }
          }
        }
        findIntegrationFile(SRC_DIR);

        // Coletar sinais de contexto
        const signals = collectContextSignals(configFile, 'integration', integrationKey);
        const intent = classifyIntent(signals, 'integration');
        const owner = getOwner(configFile);
        const categories = categorizeFinding({
          name: integration.name,
          package: integration.package,
          intent
        }, 'integration', configFile, signals);
        const severityInfo = calculateCompoundSeverity({
          name: integration.name,
          package: integration.package,
          intent
        }, categories, signals);

        declaredNotUsed.push({
          name: integration.name,
          package: integration.package,
          env_vars: integration.env_vars,
          configFile: path.relative(SRC_DIR, configFile),
          intent,
          owner,
          signals,
          categories,
          severity: severityInfo.compound > 0.8 ? 'CRITICAL' :
                   severityInfo.compound > 0.6 ? 'HIGH' :
                   severityInfo.compound > 0.4 ? 'MEDIUM' : 'LOW',
          severity_compound: severityInfo,
          recommendation: intent === 'OBSOLETO' ? 'Remover pacote e credenciais - SDK não utilizado gera custo desnecessário' :
                          intent === 'CONGELADO' ? 'Revisar em 48h - decidir manter integração ou remover' :
                          'Manter - sinal de atividade/planejamento'
        });
      }
    }
  }

  return { declaredNotUsed };
}

/**
 * SCANNER 4: Integrações usadas de forma insegura
 */
function scanUnsafeIntegrationUsage() {
  console.log('🔍 Scanner 4: Analisando uso inseguro de integrações...');

  const missingErrorHandling = [];
  const forbiddenLayerUsage = [];

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const relativePath = path.relative(SRC_DIR, fullPath);

        // Verificar uso direto de SDKs em camadas proibidas
        for (const [integrationKey, integration] of Object.entries(inventory.integrations)) {
          if (integration.forbidden_layers.some(layer => relativePath.includes(layer))) {
            if (content.includes(integration.package.replace('@', '').replace('/', '.')) ||
                content.includes(integrationKey)) {
              forbiddenLayerUsage.push({
                integration: integration.name,
                file: relativePath,
                layer: integration.forbidden_layers.find(layer => relativePath.includes(layer)),
                severity: 'CRITICAL'
              });
            }
          }

          // Verificar chamadas sem try/catch
          const integrationCalls = content.match(new RegExp(`await ${integrationKey}\\.|await \\w+\\.${integrationKey}`, 'g'));
          if (integrationCalls) {
            integrationCalls.forEach(call => {
              const callLine = content.split('\n').findIndex(line => line.includes(call));
              const contextStart = Math.max(0, callLine - 5);
              const contextEnd = Math.min(content.split('\n').length, callLine + 5);
              const context = content.split('\n').slice(contextStart, contextEnd).join('\n');

              if (!context.includes('try {') || !context.includes('catch')) {
                missingErrorHandling.push({
                  file: relativePath,
                  line: callLine + 1,
                  call: call.trim(),
                  integration: integration.name,
                  severity: 'HIGH'
                });
              }
            });
          }
        }
      }
    }
  }

  scanDirectory(SRC_DIR);

  return { missingErrorHandling, forbiddenLayerUsage };
}

/**
 * SCANNER 5: Rotas expostas que não fazem nada útil
 */
function scanInactiveRoutes() {
  console.log('🔍 Scanner 5: Analisando rotas inativas...');

  const inactiveEndpoints = [];

  for (const routePattern of inventory.route_files) {
    const routeDir = path.join(SRC_DIR, routePattern.replace('/**/*.ts', '').replace('**/*.ts', ''));

    if (fs.existsSync(routeDir)) {
      function scanRoutes(dir, currentPath = '') {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scanRoutes(fullPath, currentPath + '/' + item);
          } else if (item === 'route.ts' || item === 'page.tsx') {
            const content = fs.readFileSync(fullPath, 'utf8');

            // Verificar se chama algum serviço de domínio
            const hasDomainCall = content.match(/await \w+\.|\w+\.create\(|\w+\.find\(|\w+\.update\(/);

            if (!hasDomainCall) {
              // Coletar sinais de contexto para a rota
              const signals = collectContextSignals(fullPath, 'route', currentPath);
              const intent = classifyIntent(signals, 'route');
              const owner = getOwner(fullPath);

              const categories = categorizeFinding({
                route: currentPath,
                intent
              }, 'route', fullPath, signals);
              const severityInfo = calculateCompoundSeverity({
                route: currentPath,
                intent
              }, categories, signals);

              inactiveEndpoints.push({
                route: currentPath,
                file: path.relative(SRC_DIR, fullPath),
                intent,
                owner,
                signals,
                categories,
                severity: 'CRITICAL', // Endpoints fantasmas sempre críticos
                severity_compound: severityInfo,
                recommendation: intent === 'EM_ANDAMENTO' ? 'Em desenvolvimento - manter até implementação' :
                               intent === 'CONGELADO' ? 'Proteger com auth ou remover em 48h - vetor de ataque exposto' :
                               'Remover IMEDIATAMENTE - endpoint fantasma sem função útil'
              });
            }
          }
        }
      }

      scanRoutes(routeDir);
    }
  }

  return { inactiveEndpoints };
}

/**
 * Gerar relatório final
 */
function generateReport(results) {
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(REPORT_DIR, `${timestamp}-integrations-audit.json`);

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total_findings: Object.values(results).reduce((sum, category) =>
        sum + Object.values(category).reduce((catSum, items) => catSum + items.length, 0), 0),
      critical_issues: 0,
      high_issues: 0,
      medium_issues: 0,
      low_issues: 0
    },
    findings: results
  };

  // Contar severidades
  Object.values(results).forEach(category => {
    Object.values(category).forEach(items => {
      items.forEach(item => {
        if (item.severity === 'CRITICAL') report.summary.critical_issues++;
        else if (item.severity === 'HIGH') report.summary.high_issues++;
        else if (item.severity === 'MEDIUM') report.summary.medium_issues++;
        else report.summary.low_issues++;
      });
    });
  });

  // Salvar relatório JSON
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Relatório salvo em: ${reportPath}`);

  // Gerar resumo executivo
  generateExecutiveSummary(report);

  return report;
}

/**
 * Gerar resumo executivo para liderança
 */
function generateExecutiveSummary(report) {
  const summaryPath = path.join(REPORT_DIR, `${report.timestamp.split('T')[0]}-executive-summary.md`);

  // Agrupar itens por intenção (usando os novos valores)
  const groupByIntent = (items) => {
    const groups = { 'EM_ANDAMENTO': [], 'CONGELADO': [], 'OBSOLETO': [] };
    if (items) {
      items.forEach(item => {
        const intentKey = item.intent || 'CONGELADO'; // Fallback para itens sem classificação
        if (groups[intentKey]) {
          groups[intentKey].push(item);
        }
      });
    }
    return groups;
  };

  const envIntentGroups = report.findings.env?.unused ? groupByIntent(report.findings.env.unused) : {};
  const integrationIntentGroups = report.findings.integrations?.declaredNotUsed ? groupByIntent(report.findings.integrations.declaredNotUsed) : {};
  const routeIntentGroups = report.findings.routes?.inactiveEndpoints ? groupByIntent(report.findings.routes.inactiveEndpoints) : {};

  const summary = `# 🚨 RELATÓRIO EXECUTIVO - AUDITORIA DE RISCO
**Data:** ${new Date().toLocaleDateString('pt-BR')}

## 📊 STATUS GERAL
- **Total de achados:** ${report.summary.total_findings}
- **Problemas críticos:** ${report.summary.critical_issues} 🔴
- **Problemas altos:** ${report.summary.high_issues} 🟠
- **Problemas médios:** ${report.summary.medium_issues} 🟡
- **Problemas baixos:** ${report.summary.low_issues} 🟢

## 🔥 PONTOS CRÍTICOS (ATENÇÃO IMEDIATA)

### Vazamentos de Segurança
${report.findings.env?.leakedToClient?.length > 0
    ? report.findings.env.leakedToClient.map(item =>
        `- **${item.variable}** vazando para client bundle\n  👤 Owner: ${item.owner} | 📋 ${item.recommendation}`).join('\n')
    : '✅ Nenhum vazamento detectado'}

### Endpoints Fantasmas
${report.findings.routes?.inactiveEndpoints?.length > 0
    ? report.findings.routes.inactiveEndpoints.map(item =>
        `- **${item.route}** não executa lógica de domínio\n  👤 Owner: ${item.owner} | 📋 ${item.recommendation}`).join('\n')
    : '✅ Nenhum endpoint fantasma encontrado'}

### Uso Proibido de Integrações
${report.findings.integrations?.forbiddenLayerUsage?.length > 0
    ? report.findings.integrations.forbiddenLayerUsage.map(item =>
        `- **${item.integration}** usado incorretamente em ${item.file}`).join('\n')
    : '✅ Nenhum uso proibido detectado'}

## ⚠️ PONTOS ALTOS (ATENÇÃO RÁPIDA - <7 DIAS)

### Integrações Não Utilizadas
${report.findings.integrations?.declaredNotUsed?.length > 0
    ? report.findings.integrations.declaredNotUsed.map(item =>
        `- **${item.name}** (${item.package})\n  👤 Owner: ${item.owner} | 📋 ${item.recommendation}`).join('\n')
    : '✅ Todas as integrações estão sendo utilizadas'}

### Tratamento de Erro Ausente
${report.findings.integrations?.missingErrorHandling?.length > 0
    ? report.findings.integrations.missingErrorHandling.slice(0, 5).map(item =>
        `- ${item.file}:${item.line} - ${item.call}`).join('\n') +
        (report.findings.integrations.missingErrorHandling.length > 5 ? '\n... e mais' : '')
    : '✅ Tratamento de erro adequado'}

### Variáveis de Ambiente Órfãs
${report.findings.env?.unused?.length > 0
    ? report.findings.env.unused.map(item => `- **${item.variable}**\n  👤 Owner: ${item.owner} | 📋 ${item.recommendation}`).join('\n')
    : '✅ Nenhuma variável órfã encontrada'}

## 🎯 CLASSIFICAÇÃO POR INTENÇÃO - GOVERNANÇA ATIVA

### 🚧 EM ANDAMENTO (manter e terminar)
**Critério:** Sinais claros de construção ativa (recentes, TODOs, testes, registrados, expostos)

${(envIntentGroups['EM_ANDAMENTO']?.length || 0) +
  (integrationIntentGroups['EM_ANDAMENTO']?.length || 0) +
  (routeIntentGroups['EM_ANDAMENTO']?.length || 0) > 0 ?
  [...(envIntentGroups['EM_ANDAMENTO'] || []).map(item =>
    item.variable ? `• ENV: \`${item.variable}\` (${item.owner})` :
    item.name ? `• SDK: ${item.name} (${item.owner})` :
    `• ROUTE: ${item.route} (${item.owner})`),
   ...(integrationIntentGroups['EM_ANDAMENTO'] || []).map(item => `• SDK: ${item.name} (${item.owner})`),
   ...(routeIntentGroups['EM_ANDAMENTO'] || []).map(item => `• ROUTE: ${item.route} (${item.owner})`)].join('\n') :
  '• Nenhum item classificado como "em andamento"'}

### ❓ CONGELADO (decisão humana necessária)
**SLA:** 48h para resposta - ${new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
**Critério:** Parece abandonado (14-45 dias) mas pode ser estratégico

${(envIntentGroups['CONGELADO']?.length || 0) +
  (integrationIntentGroups['CONGELADO']?.length || 0) +
  (routeIntentGroups['CONGELADO']?.length || 0) > 0 ?
  [...(envIntentGroups['CONGELADO'] || []).map(item =>
    item.variable ? `• ENV: \`${item.variable}\` (${item.owner}) - justificar manutenção` :
    item.name ? `• SDK: ${item.name} (${item.owner}) - confirmar uso futuro` :
    `• ROUTE: ${item.route} (${item.owner}) - validar necessidade`),
   ...(integrationIntentGroups['CONGELADO'] || []).map(item => `• SDK: ${item.name} (${item.owner}) - confirmar uso futuro`),
   ...(routeIntentGroups['CONGELADO'] || []).map(item => `• ROUTE: ${item.route} (${item.owner}) - validar necessidade`)].join('\n') :
  '• Nenhum item congelado identificado'}

### 🗑️ OBSOLETO (remover imediatamente)
**Ação:** Deletar sem cerimônia
**Critério:** Claramente lixo (>45 dias sem sinais, gera custo sem benefício)

${(envIntentGroups['OBSOLETO']?.length || 0) +
  (integrationIntentGroups['OBSOLETO']?.length || 0) +
  (routeIntentGroups['OBSOLETO']?.length || 0) > 0 ?
  [...(envIntentGroups['OBSOLETO'] || []).map(item =>
    item.variable ? `• ENV: \`${item.variable}\` (${item.owner}) - revogar credencial` :
    item.name ? `• SDK: ${item.name} (${item.owner}) - remover package` :
    `• ROUTE: ${item.route} (${item.owner}) - deletar endpoint`),
   ...(integrationIntentGroups['OBSOLETO'] || []).map(item => `• SDK: ${item.name} (${item.owner}) - remover package e env vars`),
   ...(routeIntentGroups['OBSOLETO'] || []).map(item => `• ROUTE: ${item.route} (${item.owner}) - deletar endpoint`)].join('\n') :
  '• Nenhum item obsoleto identificado'}

## 🧹 HIGIENE CONTÍNUA (BACKLOG TÉCNICO)

### Código Não Utilizado
- **Exports não utilizados:** ${report.findings.code?.unusedExports?.length || 0}
- **Imports não utilizados:** ${report.findings.code?.unusedImports?.length || 0}

## 📋 PRÓXIMOS PASSOS

${report.summary.critical_issues > 0 ? '🔴 **CRÍTICO:** Resolver problemas críticos ANTES do próximo deploy' :
 report.summary.high_issues > 0 ? '🟠 **ALTO:** Resolver items obsoletos + congelados nesta sprint' :
 '✅ **LIMPO:** Foco em melhorias incrementais e manutenção preventiva'}

### 🎯 SLA de Resolução por Categoria
- **CRÍTICO:** Imediato (antes do deploy)
- **ALTO:** < 7 dias (esta sprint)
- **CONGELADO:** 48h para decisão (owners notificados acima)
- **OBSOLETO:** Imediato (remover sem cerimônia)
- **EM ANDAMENTO:** Manter até conclusão

---

*Relatório gerado automaticamente pelo sistema de auditoria contínua*
*Sistema agora inclui classificação inteligente baseada em intenção*
*Para detalhes técnicos completos, consulte o arquivo JSON correspondente*
`;

  fs.writeFileSync(summaryPath, summary);
  console.log(`📋 Resumo executivo salvo em: ${summaryPath}`);
}

/**
 * Verificar se deve falhar CI
 */
function shouldFailCI(report) {
  return report.summary.critical_issues > 0;
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando auditoria integral de risco...\n');

  const results = {
    env: scanUnusedEnvVars(),
    code: scanUnusedCode(),
    integrations: {
      ...scanUnusedIntegrations(),
      ...scanUnsafeIntegrationUsage()
    },
    routes: scanInactiveRoutes()
  };

  console.log('📊 Gerando relatório final...');
  const report = generateReport(results);
  console.log('✅ Relatório gerado com sucesso');

  console.log('\n🎯 Auditoria concluída!');
  console.log(`📊 ${report.summary.total_findings} achados totais`);
  console.log(`🔴 ${report.summary.critical_issues} problemas críticos`);
  console.log(`🟠 ${report.summary.high_issues} problemas altos`);

  // Verificar se deve falhar CI
  if (shouldFailCI(report)) {
    console.error('\n❌ CI FALHANDO: Problemas críticos detectados!');
    console.error('🔧 Corrija os problemas críticos antes de fazer merge.');
    process.exit(1);
  } else {
    console.log('\n✅ CI APROVADO: Nenhum problema crítico encontrado.');
  }
}

// Executar se chamado diretamente
main().catch(error => {
  console.error('Erro na execução:', error);
  process.exit(1);
});

export { main as runAudit };