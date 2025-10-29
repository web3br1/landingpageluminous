# 🎛️ Configurações por Ambiente

## NEXT_PUBLIC_LAYOUT_DEBUG_STAGE

Controla a ativação progressiva dos recursos avançados do layout.

### Valores e Funcionalidades

| Valor | Funcionalidades Ativadas        | Ambiente Recomendado           |
| ----- | ------------------------------- | ------------------------------ |
| `0`   | Layout básico apenas            | Desenvolvimento (debug mínimo) |
| `1`   | + GlobalErrorBoundary           | Desenvolvimento                |
| `2`   | + NotificationProvider          | Desenvolvimento                |
| `3`   | + PlausibleProvider             | Staging (anterior)             |
| `4`   | + Feature flags básicas         | Staging                        |
| `5`   | + Analytics avançado            | Staging                        |
| `6`   | + ThemeProvider completo        | Staging                        |
| `7`   | + Performance monitoring        | Staging                        |
| `8`   | + UXAdvancedOrchestrator (chat) | Produção                       |
| `9`   | + Onboarding system             | Produção                       |
| `10`  | + Recommendations engine        | Produção                       |
| `11`  | + Debug overlays                | Desenvolvimento                |
| `12+` | + Debug mode completo           | Desenvolvimento                |

### Configurações Atuais

```json
// vercel.staging.json
"NEXT_PUBLIC_LAYOUT_DEBUG_STAGE": "12"

// Produção (vercel.json) - undefined = POSITIVE_INFINITY = tudo ativado
// Desenvolvimento - undefined = POSITIVE_INFINITY = tudo ativado
```

### Recursos Controlados por Debug Stage

#### UX Advanced Orchestrator (≥8)

- **Chat**: `debugStage >= 8` - Chatbot inteligente com WhatsApp
- **Onboarding**: `debugStage >= 9` - Sistema de onboarding personalizado
- **Recomendações**: `debugStage >= 10` - Engine de recomendações inteligentes

#### Debug Features (≥11)

- Debug overlays visuais
- Console logging avançado
- Performance metrics detalhados

### Comandos de Verificação

```bash
# Verificar se UX avançado está ativo
curl -s "https://your-domain.com" | grep -i "ux.*orchestrator\|onboarding\|chat"

# Verificar valor atual da variável
echo $NEXT_PUBLIC_LAYOUT_DEBUG_STAGE

# Testar localmente com valor específico
NEXT_PUBLIC_LAYOUT_DEBUG_STAGE=12 pnpm dev
```

### Troubleshooting

#### Problema: UX avançado não aparece

**Sintomas**: Chat, onboarding e recomendações não funcionam
**Causa**: `NEXT_PUBLIC_LAYOUT_DEBUG_STAGE < 8`
**Solução**: Definir valor ≥ 8 no ambiente

#### Problema: Recursos ativos em produção mas não em staging

**Sintomas**: Funciona localmente e em produção, mas não em staging
**Causa**: Staging com valor baixo (era 3, agora 12)
**Solução**: Verificar `vercel.staging.json` e `scripts/setup-staging.js`

### Histórico de Mudanças

- **2025-01-XX**: Staging alterado de `3` para `12` para ativar UX avançado
- **Rationale**: UX avançado estava implementado mas desabilitado por configuração conservadora

### Próximas Considerações

- Considerar separação em flags individuais para controle granular
- Implementar feature toggles dinâmicos via CMS/admin panel
- Adicionar testes automatizados para validação de configurações
