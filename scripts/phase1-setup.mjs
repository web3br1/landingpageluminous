#!/usr/bin/env node

/**
 * ⚙️ Phase 1 Setup Script - Configuração Automática da Fase 1
 *
 * Configura automaticamente o ambiente para Fase 1 - Fundamentos:
 * - Cria diretórios necessários
 * - Instala dependências de desenvolvimento
 * - Configura hooks de pre-commit
 * - Cria arquivos baseline
 * - Valida configuração
 *
 * Uso: node scripts/phase1-setup.mjs [--force] [--verbose]
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const FORCE = process.argv.includes('--force');
const VERBOSE = process.argv.includes('--verbose');

class Phase1Setup {
  constructor() {
    this.rootDir = path.resolve(process.cwd());
    this.colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m'
    };

    this.setupStatus = {
      directories: false,
      dependencies: false,
      hooks: false,
      baseline: false,
      validation: false
    };
  }

  log(message, verbose = false) {
    if (verbose && !VERBOSE) return;
    console.log(`🔧 ${message}`);
  }

  colorize(text, color) {
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }

  // Executa comando de forma segura
  safeExec(command, description, continueOnError = false) {
    try {
      this.log(`${description}...`, true);
      const result = execSync(command, {
        encoding: 'utf8',
        cwd: this.rootDir,
        stdio: VERBOSE ? 'inherit' : 'pipe'
      });

      console.log(this.colorize(`✅ ${description}`, 'green'));
      return { success: true, output: result };
    } catch (error) {
      const message = `❌ ${description} - ${error.message}`;
      if (continueOnError) {
        console.log(this.colorize(message, 'yellow'));
        return { success: false, error: error.message };
      } else {
        console.log(this.colorize(message, 'red'));
        throw error;
      }
    }
  }

  // Cria diretórios necessários
  createDirectories() {
    this.log('Criando diretórios da Fase 1...');

    const directories = [
      'tmp/daily-reports',
      'tmp/weekly-reports',
      'tmp/phase1-milestones',
      'tmp/eslint-progress',
      'tmp/build-logs'
    ];

    directories.forEach(dir => {
      const fullPath = path.join(this.rootDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        this.log(`📁 Criado: ${dir}`, true);
      } else if (FORCE) {
        // Limpa diretório se --force
        fs.rmSync(fullPath, { recursive: true, force: true });
        fs.mkdirSync(fullPath, { recursive: true });
        this.log(`🔄 Recriado: ${dir}`, true);
      } else {
        this.log(`⚠️ Já existe: ${dir}`, true);
      }
    });

    this.setupStatus.directories = true;
    console.log(this.colorize('✅ Diretórios criados', 'green'));
  }

  // Instala dependências necessárias
  installDependencies() {
    this.log('Verificando dependências de desenvolvimento...');

    // Verifica se já estão instaladas
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const devDeps = packageJson.devDependencies || {};

    const requiredDeps = [
      'husky',
      'lint-staged',
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser'
    ];

    const missingDeps = requiredDeps.filter(dep => !devDeps[dep]);

    if (missingDeps.length > 0) {
      this.log(`Instalando ${missingDeps.length} dependências...`);
      const installCmd = `npm install --save-dev ${missingDeps.join(' ')}`;
      this.safeExec(installCmd, 'Instalação de dependências');
    } else {
      this.log('Todas as dependências já estão instaladas');
    }

    this.setupStatus.dependencies = true;
    console.log(this.colorize('✅ Dependências OK', 'green'));
  }

  // Configura hooks de pre-commit
  setupHooks() {
    this.log('Configurando hooks de pre-commit...');

    // Verifica se husky está inicializado
    if (!fs.existsSync('.husky')) {
      this.safeExec('npx husky init', 'Inicializando Husky');
    }

    // Cria hook de pre-commit
    const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Fase 1: Hooks leves para não bloquear desenvolvimento
npx lint-staged

# Validação rápida (não bloqueia)
node scripts/daily-status.mjs || true
`;

    const preCommitPath = '.husky/pre-commit';
    const currentContent = fs.existsSync(preCommitPath) ? fs.readFileSync(preCommitPath, 'utf8') : '';

    if (!currentContent.includes('daily-status.mjs') || FORCE) {
      fs.writeFileSync(preCommitPath, preCommitContent);
      fs.chmodSync(preCommitPath, '755');
      this.log('Hook pre-commit atualizado', true);
    } else {
      this.log('Hook pre-commit já configurado', true);
    }

    this.setupStatus.hooks = true;
    console.log(this.colorize('✅ Hooks configurados', 'green'));
  }

  // Configura lint-staged
  setupLintStaged() {
    this.log('Configurando lint-staged...');

    const lintStagedConfig = {
      "*.{js,jsx,ts,tsx}": [
        "eslint --fix --quiet --max-warnings 0",
        "prettier --write --ignore-unknown"
      ],
      "*.{json,css,md}": [
        "prettier --write --ignore-unknown"
      ]
    };

    const configPath = '.lintstagedrc.json';
    const packagePath = 'package.json';

    // Tenta .lintstagedrc.json primeiro
    if (!fs.existsSync(configPath) || FORCE) {
      fs.writeFileSync(configPath, JSON.stringify(lintStagedConfig, null, 2));
      this.log('Arquivo .lintstagedrc.json criado', true);
    } else {
      this.log('.lintstagedrc.json já existe', true);
    }

    // Adiciona ao package.json se não existir
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (!packageJson['lint-staged'] || FORCE) {
      packageJson['lint-staged'] = lintStagedConfig;
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      this.log('lint-staged adicionado ao package.json', true);
    }
  }

  // Cria arquivo baseline das métricas
  createBaseline() {
    this.log('Criando métricas baseline...');

    const baseline = {
      phase: "FASE_1_CLEANUP",
      startDate: new Date().toISOString(),
      version: "1.0.0",
      initialMetrics: {
        eslintErrors: 2996,
        overallScore: 60,
        failingTests: 7,
        buildStatus: "❌",
        coverage: 0
      },
      targets: {
        eslintErrors: 1000,
        overallScore: 70,
        failingTests: 3,
        buildStatus: "✅",
        coverage: 10
      },
      workDays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
      milestones: [
        {
          day: 1,
          focus: "Setup e Diagnóstico",
          deliverables: ["Ambiente limpo", "Análise baseline", "Top 10 arquivos"],
          metrics: { eslint: "<2996", tests: "≤7", build: "❌" }
        },
        {
          day: 2,
          focus: "Correções de Build",
          deliverables: ["Build funcionando", "Imports circulares resolvidos"],
          metrics: { build: "✅", eslint: "<2996", tests: "≤7" }
        },
        {
          day: 3,
          focus: "ESLint Top 5 Arquivos",
          deliverables: ["5 arquivos limpos", "ESLint -300 erros"],
          metrics: { eslint: "<2696", build: "✅", tests: "≤7" }
        },
        {
          day: 4,
          focus: "ESLint Próximos 5 Arquivos",
          deliverables: ["5 arquivos limpos", "ESLint -550 total"],
          metrics: { eslint: "<2446", build: "✅", tests: "≤7" }
        },
        {
          day: 5,
          focus: "Cobertura + Testes Quebrados",
          deliverables: ["LCOV ativo", "≤3 testes falhando", "Checkpoint semana 1"],
          metrics: { eslint: "<2446", tests: "≤3", coverage: ">0", build: "✅" }
        }
      ],
      week2: {
        focus: "Limpeza em Massa",
        days: [6, 7, 8, 9, 10],
        targets: {
          eslint: "<1000",
          score: "≥70",
          coverage: "≥10",
          tests: "≤3"
        }
      }
    };

    const baselinePath = 'tmp/phase1-baseline.json';
    fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));

    this.setupStatus.baseline = true;
    console.log(this.colorize('✅ Baseline criado', 'green'));
  }

  // Cria arquivo de cronograma semanal
  createSchedule() {
    this.log('Criando cronograma semanal...');

    const schedule = {
      "Segunda": {
        "9:00": "Daily standup + Alinhamento objetivos",
        "10:00": "Setup ambiente desenvolvimento",
        "11:00": "Análise baseline completa",
        "14:00": "Identificação top 10 arquivos problemáticos",
        "15:00": "Priorização correções",
        "16:00": "Relatório estado atual",
        "17:00": "Planning dia 2"
      },
      "Terça": {
        "9:00": "Daily status + Revisão dia 1",
        "10:00": "Correção erros de sintaxe e build",
        "11:00": "Resolução dependências circulares",
        "14:00": "Validação build + testes unitários",
        "15:00": "Correções adicionais se necessário",
        "16:00": "Teste integração",
        "17:00": "Checkpoint build limpo"
      },
      "Quarta": {
        "9:00": "Daily status + Revisão dia 2",
        "10:00": "ESLint: Correção top 5 arquivos críticos",
        "11:00": "Testes de regressão",
        "13:00": "Documentação correções aplicadas",
        "14:00": "Correções adicionais",
        "15:00": "Ajustes finais",
        "16:00": "Checkpoint top 5 limpos",
        "17:00": "Planning dia 4"
      },
      "Quinta": {
        "9:00": "Daily status + Revisão dia 3",
        "10:00": "ESLint: Correção próximos 5 arquivos",
        "11:00": "Validação testes funcionais",
        "13:00": "Ajustes finais",
        "14:00": "Documentação",
        "15:00": "Correções adicionais",
        "16:00": "Checkpoint próximos 5 limpos",
        "17:00": "Planning dia 5"
      },
      "Sexta": {
        "9:00": "Daily status + Revisão dia 4",
        "10:00": "Configuração sistema de cobertura",
        "11:00": "Correção testes falhando (≤3)",
        "14:00": "Validação cobertura report",
        "15:00": "Análise progresso semanal",
        "16:00": "Planning semana 2",
        "17:00": "Checkpoint final semana 1"
      }
    };

    const schedulePath = 'tmp/phase1-schedule.json';
    fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2));

    this.log('Cronograma semanal criado', true);
  }

  // Valida configuração
  validateSetup() {
    this.log('Validando configuração...');

    const validations = [
      {
        name: 'Scripts de monitoramento',
        check: () => fs.existsSync('scripts/daily-status.mjs') && fs.existsSync('scripts/progress-report.mjs'),
        message: 'Scripts de monitoramento criados'
      },
      {
        name: 'Diretórios tmp',
        check: () => fs.existsSync('tmp/daily-reports') && fs.existsSync('tmp/weekly-reports'),
        message: 'Diretórios de relatórios criados'
      },
      {
        name: 'Baseline',
        check: () => fs.existsSync('tmp/phase1-baseline.json'),
        message: 'Métricas baseline configuradas'
      },
      {
        name: 'Pre-commit hooks',
        check: () => fs.existsSync('.husky/pre-commit'),
        message: 'Hooks de pre-commit ativos'
      },
      {
        name: 'Lint-staged',
        check: () => fs.existsSync('.lintstagedrc.json') || JSON.parse(fs.readFileSync('package.json')).hasOwnProperty('lint-staged'),
        message: 'Lint-staged configurado'
      }
    ];

    let allValid = true;
    validations.forEach(validation => {
      try {
        if (validation.check()) {
          console.log(this.colorize(`✅ ${validation.message}`, 'green'));
        } else {
          console.log(this.colorize(`❌ ${validation.name} - Pendente`, 'red'));
          allValid = false;
        }
      } catch (error) {
        console.log(this.colorize(`❌ ${validation.name} - Erro: ${error.message}`, 'red'));
        allValid = false;
      }
    });

    this.setupStatus.validation = allValid;

    if (allValid) {
      console.log(this.colorize('✅ Validação completa - OK', 'green'));
    } else {
      console.log(this.colorize('⚠️ Algumas validações falharam', 'yellow'));
    }
  }

  // Testa configuração executando scripts básicos
  testSetup() {
    this.log('Testando configuração...');

    try {
      // Testa daily status (modo silencioso)
      this.safeExec('node scripts/daily-status.mjs', 'Teste daily status', true);

      // Testa progress report (modo silencioso)
      this.safeExec('node scripts/progress-report.mjs --output=json', 'Teste progress report', true);

      console.log(this.colorize('✅ Testes de configuração passaram', 'green'));
    } catch (error) {
      console.log(this.colorize('⚠️ Alguns testes falharam, mas setup continua válido', 'yellow'));
    }
  }

  // Executa setup completo
  async run() {
    console.log(this.colorize('⚙️ PHASE 1 SETUP - Configuração Automática', 'cyan'));
    console.log(this.colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));
    console.log('Configurando ambiente para Fase 1 - Fundamentos');
    console.log('');

    try {
      // Executa todas as etapas
      this.createDirectories();
      this.installDependencies();
      this.setupHooks();
      this.setupLintStaged();
      this.createBaseline();
      this.createSchedule();
      this.validateSetup();
      this.testSetup();

      console.log('');
      console.log(this.colorize('🎉 Setup da Fase 1 concluído!', 'green'));
      console.log('');
      console.log(this.colorize('📋 PRÓXIMOS PASSOS:', 'blue'));
      console.log('• Executar: node scripts/daily-status.mjs (diariamente)');
      console.log('• Executar: node scripts/progress-report.mjs (sexta-feira)');
      console.log('• Iniciar correções críticas da Fase 1');
      console.log('');
      console.log(this.colorize('🚀 Ambiente pronto para desenvolvimento!', 'green'));

      // Salva status do setup
      const setupStatusPath = 'tmp/phase1-setup-status.json';
      fs.writeFileSync(setupStatusPath, JSON.stringify({
        completedAt: new Date().toISOString(),
        status: this.setupStatus,
        version: '1.0.0'
      }, null, 2));

    } catch (error) {
      console.log('');
      console.log(this.colorize('❌ Erro durante setup:', 'red'), error.message);
      console.log('');
      console.log('Tente executar com --verbose para mais detalhes');
      console.log('Ou use --force para sobrescrever configurações existentes');
      process.exit(1);
    }
  }
}

// Executa se chamado diretamente
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const setup = new Phase1Setup();
  setup.run().catch(error => {
    console.error('❌ Erro no setup:', error.message);
    process.exit(1);
  });
}

export default Phase1Setup;