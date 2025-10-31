// Configuração específica do projeto Landing Page SaaS
// Ajustes baseados no contexto: marketing, UI/UX, performance crítica

export const projectConfig = {
  // Identificação do projeto
  name: "Landing Page SaaS",
  domain: "marketing-landing",
  version: "1.0.0",

  // Stack técnica
  tech: {
    framework: "nextjs",
    testing: "vitest",
    language: "typescript",
    styling: "tailwind",
    deployment: "vercel",
  },

  // Características do projeto
  characteristics: {
    // Performance crítica (LCP < 2.5s)
    performanceCritical: true,

    // UI/UX focused - testes visuais importantes
    uiFocused: true,

    // Marketing - conversão > qualidade técnica pura
    marketingDriven: true,

    // Monólito modular - arquitetura complexa
    modularArchitecture: true,
  },

  // Expectativas de qualidade ajustadas para o contexto
  expectations: {
    minCoverage: 70, // Mais baixo devido à natureza de marketing
    targetCoverage: 85, // Meta realista
    maxComplexity: 12, // Permissivo para componentes UI
    requireTypes: true, // TypeScript obrigatório
    requireTests: true, // Testes obrigatórios
    performanceBudget: {
      lcp: 2500, // 2.5s
      cls: 0.1, // 0.1
      inp: 200, // 200ms
    },
  },

  // Thresholds específicos por maturidade
  maturity: {
    M0: {
      // Caos total - permissivo para recuperação
      score: {
        minMerge: 15, // Muito permissivo para caos total
        target: 35,
        excellent: 55,
      },

      issues: {
        maxCritical: 5, // Mais tolerante
        maxWarnings: 25,
        maxInfo: 50,
      },

      metrics: {
        coverage: {
          min: 0,
          target: 25,
          weight: 0.15, // Baixo peso - foco em funcionamento
        },
        isolation: {
          min: 0,
          target: 40,
          weight: 0.45, // Alto peso - isolamento crítico
        },
        performance: {
          maxTime: 300000, // 5 min - permissivo
          weight: 0.1,
        },
        quality: {
          min: 0,
          target: 50,
          weight: 0.3, // Peso em qualidade básica
        },
      },

      execution: {
        allowEngineFailure: true,
        requireSafeTests: false,
        useProxyCoverage: true,
        allowPartialAnalysis: true,
      },
    },

    M1: {
      // Instável - começando a estabilizar
      score: {
        minMerge: 50, // Score profissional mínimo
        target: 70,
        excellent: 80,
      },

      issues: {
        maxCritical: 3,
        maxWarnings: 15,
        maxInfo: 30,
      },

      metrics: {
        coverage: {
          min: 15,
          target: 45,
          weight: 0.2,
        },
        isolation: {
          min: 40,
          target: 70,
          weight: 0.35,
        },
        performance: {
          maxTime: 180000, // 3 min
          weight: 0.15,
        },
        quality: {
          min: 30,
          target: 70,
          weight: 0.3,
        },
      },

      execution: {
        allowEngineFailure: true,
        requireSafeTests: true, // Agora requer subset confiável
        useProxyCoverage: true,
        allowPartialAnalysis: false,
      },
    },

    M2: {
      // Estável - qualidade consolidada
      score: {
        minMerge: 70, // Score alto obrigatório
        target: 85,
        excellent: 95,
      },

      issues: {
        maxCritical: 1, // Só 1 crítico tolerado
        maxWarnings: 8,
        maxInfo: 15,
      },

      metrics: {
        coverage: {
          min: 50,
          target: 75,
          weight: 0.25, // Peso significativo
        },
        isolation: {
          min: 70,
          target: 85,
          weight: 0.25,
        },
        performance: {
          maxTime: 90000, // 1.5 min - mais exigente
          weight: 0.2,
        },
        quality: {
          min: 60,
          target: 85,
          weight: 0.3,
        },
      },

      execution: {
        allowEngineFailure: false, // Engine deve funcionar
        requireSafeTests: true,
        useProxyCoverage: false, // Prefere cobertura real
        allowPartialAnalysis: false,
      },
    },

    M3: {
      // Sólido - excelência técnica
      score: {
        minMerge: 85, // Score muito alto
        target: 95,
        excellent: 100,
      },

      issues: {
        maxCritical: 0, // Zero críticos
        maxWarnings: 3,
        maxInfo: 8,
      },

      metrics: {
        coverage: {
          min: 75,
          target: 90,
          weight: 0.3, // Peso máximo
        },
        isolation: {
          min: 85,
          target: 95,
          weight: 0.25,
        },
        performance: {
          maxTime: 60000, // 1 min - crítico
          weight: 0.25,
        },
        quality: {
          min: 80,
          target: 95,
          weight: 0.2,
        },
      },

      execution: {
        allowEngineFailure: false,
        requireSafeTests: true,
        useProxyCoverage: false,
        allowPartialAnalysis: false,
      },
    },
  },

  // Políticas específicas do projeto
  policies: {
    // Performance crítica - penaliza mais issues de perf
    performancePenalty: {
      lcpViolation: 15, // -15 pontos por violação LCP
      clsViolation: 10, // -10 pontos por violação CLS
      inpViolation: 5, // -5 pontos por violação INP
    },

    // Marketing-driven - permite algumas concessões
    marketingConcessions: {
      allowStubsInMarketing: true, // Permite stubs em componentes marketing
      flexibleCoverageForUI: true, // Cobertura flexível para componentes UI puros
      prioritizeConversionTests: true, // Prioriza testes de conversão
    },

    // Arquitetura modular - requisitos específicos
    modularRequirements: {
      requireDomainSeparation: true, // Separação domínio/apresentação
      enforceCompositionRoot: true, // Root de composição obrigatório
      validateImports: true, // Validação de imports por camada
    },
  },

  // Experimentos ativos
  experiments: {
    // Otimização de pesos para landing pages
    "landing-page-weights": {
      enabled: true,
      variants: [
        {
          name: "ui-focused",
          weights: { coverage: 0.15, isolation: 0.25, performance: 0.2 },
        },
        {
          name: "conversion-focused",
          weights: { coverage: 0.2, isolation: 0.2, performance: 0.25 },
        },
      ],
    },

    // Thresholds adaptativos por componente
    "adaptive-thresholds": {
      enabled: true,
      variants: [
        {
          name: "strict-critical",
          config: {
            rules: {
              "components/sections/": { coverage: 0.9 }, // Seções críticas
              "components/ui/": { coverage: 0.7 }, // UI components
              "lib/utils/": { coverage: 0.95 }, // Utilitários críticos
            },
          },
        },
        {
          name: "balanced",
          config: {
            rules: {
              "components/sections/": { coverage: 0.8 }, // Seções críticas
              "components/ui/": { coverage: 0.6 }, // UI components
              "lib/utils/": { coverage: 0.9 }, // Utilitários críticos
            },
          },
        },
      ],
    },
  },

  // Notificações específicas
  notifications: {
    channels: {
      slack: {
        enabled: true,
        channels: ["#dev-quality", "#marketing-dev"],
        templates: {
          critical: "landing-critical-alert.md",
          performance: "landing-performance-alert.md",
        },
      },
    },

    // Alertas específicos para landing
    alerts: {
      performanceRegression: {
        enabled: true,
        threshold: 500, // +500ms LCP
        channels: ["slack", "github"],
      },

      conversionTestFailure: {
        enabled: true,
        severity: "high",
        channels: ["slack"],
      },
    },
  },

  // Cache tuning para projeto
  cache: {
    // Políticas específicas
    policies: {
      // Componentes mudam pouco - cache longo
      "src/components/": {
        ttl: 7200000, // 2 horas
        priority: "high",
      },

      // Configs mudam mais - cache curto
      "tailwind.config.js": {
        ttl: 1800000, // 30 min
        priority: "medium",
      },

      // Marketing content - cache médio
      "src/domains/marketing/": {
        ttl: 3600000, // 1 hora
        priority: "medium",
      },
    },

    // Estratégias específicas
    strategies: {
      // Invalidação por dependências
      dependencyBased: {
        enabled: true,
        watch: ["package.json", "tsconfig.json"],
      },
    },
  },
};

// Validação da configuração
export function validateProjectConfig(config) {
  const errors = [];

  // Valida estrutura básica
  if (!config.name) errors.push("Nome do projeto obrigatório");
  if (!config.domain) errors.push("Domínio obrigatório");

  // Valida maturidades
  const requiredMaturities = ["M0", "M1", "M2", "M3"];
  requiredMaturities.forEach((level) => {
    if (!config.maturity[level]) {
      errors.push(`Configuração de maturidade ${level} obrigatória`);
    }
  });

  // Valida expectations
  if (config.expectations.minCoverage > config.expectations.targetCoverage) {
    errors.push("Coverage mínimo não pode ser maior que target");
  }

  if (errors.length > 0) {
    throw new Error(`Erros na configuração do projeto: ${errors.join(", ")}`);
  }

  return true;
}

// Auto-valida ao importar
validateProjectConfig(projectConfig);
