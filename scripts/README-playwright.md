# Comandos Playwright com Timeout Automático

## Problema Resolvido

Os testes do Playwright ficavam rodando indefinidamente, exigindo Ctrl+C manual para parar. Isso acontecia porque:

- O report HTML ficava sendo servido em background
- Processos do `webServer` não terminavam automaticamente
- Não havia timeout configurado

## Solução

Criamos scripts inteligentes que executam Playwright com:

- **Timeout automático** (45s dev, 300s CI) - nunca mais Ctrl+C manual
- **Captura de erros estruturada** - resumo claro dos problemas
- **Análise de resultados** - conta testes passados/falhados/pulados
- **Dicas de otimização** - quando há timeout ou erros
- **Limpeza automática** - mata processos remanescentes

## Comandos Disponíveis

### Desenvolvimento Rápido (com timeout curto)

```bash
# 🔥 TESTES MAIS RÁPIDOS (recomendado para desenvolvimento)
npm run test:fast          # ~11s - testes essenciais funcionais
npm run test:visual        # ~4s - testes visuais simples
npm run test:functional    # ~45s - testes funcionais completos

# Testes específicos (timeout automático inteligente)
npm run test:core          # ~90s - core (landing + visual + hydration + ssr)
npm run test:responsive    # ~45s - responsividade
npm run test:stable        # ~45s - testes estáveis

# Com timeout customizado
TEST_TIMEOUT=60 npm run test:fast
```

### Desenvolvimento Normal (sem timeout forçado)

```bash
# Todos os testes E2E (modo normal, pode precisar Ctrl+C)
npm run test:e2e

# Apenas testes visuais
npm run test:visual
```

### CI/CD (timeout longo)

Em CI, o timeout é automaticamente 300s (5 minutos):

```bash
# Em pipeline CI
npm run test:e2e:quick  # timeout = 300s
```

## Configuração

### Timeout Inteligente

- **Comandos simples** (1-2 arquivos): 45 segundos
- **Comandos complexos** (3+ arquivos): 90 segundos
- **CI**: 300 segundos (5 minutos)
- **Customizado**: Use `TEST_TIMEOUT=X` antes do comando

O script detecta automaticamente a complexidade do comando e ajusta o timeout apropriadamente.

### Status dos Testes

- ✅ **Funcionando**: Testes funcionais, carregamento, responsividade básica
- ⏸️ **Skip (MVP)**: Seções inexistentes (pricing, footer), screenshots instáveis
- 🔧 **Em desenvolvimento**: Performance avançado, acessibilidade completa

### Relatórios de Erro Inteligentes

Quando há falhas, o script mostra:

```
❌ RESUMO DOS ERROS:
📊 Código de saída: 1
⏱️  Timeout usado: 45s

🔴 STDERR: [erros específicos]

📋 TESTES QUE FALHARAM:
  1. [chromium] › Test Name - erro específico
  2. [firefox] › Test Name - erro específico

📈 RESULTADO FINAL:
  ✅ Passaram: 5
  ❌ Falharam: 2
  ⏭️  Pulados: 1
  📊 Total: 8
```

### Timeout com Dicas

Quando há timeout:

```
⏰ TIMEOUT: 45s atingido...

💡 DICAS PARA OTIMIZAR:
  - Aumente o timeout: TEST_TIMEOUT=90 npm run ...
  - Execute menos testes: npm run test:fast
  - Verifique testes específicos que podem estar travando
```

### Browsers

Por padrão roda em: Chromium, Firefox, WebKit

### Reports

- **Modo rápido**: Apenas saída no terminal (`--reporter=line`)
- **Modo normal**: Report HTML completo

## Exemplos de Uso

```bash
# Desenvolvimento: testar mudanças visuais rapidamente
npm run test:visual:quick

# Debug: mais tempo para investigar
TEST_TIMEOUT=120 npm run test:visual:quick

# CI: timeout longo para testes completos
npm run test:e2e:quick

# Teste específico com timeout
TEST_TIMEOUT=45 node scripts/run-playwright-quick.js landing-page-e2e.spec.ts
```

## Troubleshooting

### Processo não termina

Se ainda precisar usar Ctrl+C, o script detectará e fará cleanup automático.

### Timeout muito curto

Aumente com `TEST_TIMEOUT=180 npm run test:visual:quick`

### Testes falhando

O script ainda retorna código de erro correto para CI, mas termina automaticamente.
