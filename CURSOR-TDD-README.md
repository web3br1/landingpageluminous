# 🎯 Cursor TDD Loop - Guia Rápido

## ▶ Como Usar

### Fluxo Principal (Diagnóstico & Correção)

```
⌘⇧P → 🔧 Clean Hard
⌘⇧P → 🧱 Build
⌘⇧P → 🧪 Test Críticos
⌘⇧P → 🧪 Test SSR
⌘⇧P → 🧪 Test Unit (Vitest)
⌘⇧P → 🚦 Quality Gate
```

### Fluxo Deploy Seguro

```
⌘⇧P → 🧱 Build
⌘⇧P → 🧪 Test Críticos
⌘⇧P → 🧪 Smoke E2E
⌘⇧P → 🚦 Quality Gate
```

### Fluxo Cobertura

```
⌘⇧P → 📊 Coverage Gaps
→ Abrir arquivos <80% e criar testes para branches faltantes
```

### Ciclo de Reflexo Rápido

Após qualquer execução de teste:

```
analyze current test results and suggest minimal file changes
```

Isso mantém foco no erro atual sem dispersão.

## 📋 Tasks Disponíveis

| Task             | Comando                 | Descrição                                 |
| ---------------- | ----------------------- | ----------------------------------------- |
| 🔧 Clean Hard    | `npm run clean:hard`    | Limpa cache e artefatos                   |
| 🧱 Build         | `npm run build`         | Build Next.js com problem matchers        |
| 🧪 Test Críticos | `npm run test:crit`     | Hydration, lazy-loading, page-composition |
| 🧪 Test SSR      | `npm run test:ssr`      | Todos os testes SSR                       |
| 🧪 Test Unit     | `npm run test:unit`     | Todos os testes unitários Vitest          |
| 🧪 E2E           | `npm run test:e2e`      | Todos os testes Playwright                |
| 🧪 Smoke E2E     | `npm run test:smoke`    | Testes smoke de saúde                     |
| 📊 Coverage Gaps | `npm run coverage:gaps` | Relatório de cobertura                    |
| 🚦 Quality Gate  | `npm run quality:gate`  | Gates de qualidade                        |
| 📊 HUD Status    | `npm run hud`           | Dashboard visual do status                |

## 🎹 Atalhos de Teclado (Hotkey Loop)

| Atalho | Task             | Descrição          |
| ------ | ---------------- | ------------------ |
| `⌘⇧R`  | 🧱 Build         | Build Next.js      |
| `⌘⇧T`  | 🧪 Test Críticos | Testes críticos    |
| `⌘⇧S`  | 🧪 Test SSR      | Testes SSR         |
| `⌘⇧U`  | 🧪 Test Unit     | Todos unitários    |
| `⌘⇧E`  | 🧪 Smoke E2E     | Smoke tests        |
| `⌘⇧G`  | 🚦 Quality Gate  | Gates de qualidade |
| `⌘⇧C`  | 🔧 Clean Hard    | Limpa cache        |

**Dica**: Loop completo sem menus - só atalhos!

## 🎛️ HUD - Heads-Up Display

### Como Usar

```
⌘⇧P → 📊 HUD Status
```

Ou:

```
npm run hud        # Status único
npm run hud:watch  # Monitor contínuo
```

### O que Mostra

```
🎯 CURSOR TDD HUD
Last update: 14:30:25

🧱 Build: ✅ OK
🧪 Tests: ⚠️ WARN
📊 Coverage: 🟡 WARN
🚦 Quality: ❓ UNK

🎛️  Controls: ⌘⇧R: Build | ⌘⇧T: Test Crit | ⌘⇧U: Test Unit | ⌘⇧G: Quality Gate

📈 Overall: ⚠️ WARN
💡 Next: Run tests to get status
```

### Cores e Status

- 🟢 **Success**: OK (≥80% coverage, testes passando)
- 🟡 **Warning**: Atenção (60-79% coverage, alguns testes falhando)
- 🔴 **Failed**: Problema (build falhou, testes críticos falhando)
- 🔵 **Unknown**: Desconhecido (ainda não executado)

## 🐛 Debugging

### Launch Configurations

- **▶ Next.js (dev)**: Servidor de desenvolvimento
- **▶ Vitest (current file)**: Debug teste específico
- **▶ Vitest (all)**: Debug todos os testes
- **▶ Playwright E2E**: Debug E2E com headed mode
- **▶ Playwright E2E (debug)**: Debug E2E com debug mode

## 🎯 Regras do Loop

1. **Sequencial**: Uma task por vez
2. **Build falha**: Top 5 erros TS/ESLint com arquivo:linha
3. **Test falha**: Asserts e arquivo sujeito
4. **Correção rápida**: Arquivo + linha + sugestão

## 📋 Documentação Viva

### TDD Log

Mantenha `docs/tdd-log.md` atualizado após cada sessão:

```markdown
### [2025-10-29] - [Objetivo da Sessão]

**✅ Build OK**

- [Detalhes da execução]

**📊 Métricas**

- Tempo total: 3m21s
- Falhas encontradas: 3
- Correções aplicadas: 8

**💡 Aprendizados**

- [Ponto de aprendizado 1]
- [Decisão arquitetural tomada]
```

### Ciclo de Reflexo

Após cada teste:

```
analyze current test results and suggest minimal file changes
```

## 📊 Arquivos de Configuração

- `.vscode/tasks.json` - Tasks do Command Palette
- `.vscode/launch.json` - Configurações de debug
- `.vscode/keybindings.json` - Atalhos de teclado
- `.cursorrules` - Regras do loop operacional
- `docs/tdd-log.md` - Log de desenvolvimento vivo

---

**🎉 Tudo integrado no Cursor - zero fricção, feedback instantâneo!**
