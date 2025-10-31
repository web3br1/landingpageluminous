# Compliance Engine

Sistema de governança automatizada para scripts de qualidade e automação.

## Visão Geral

O Compliance Engine implementa governança institucional para scripts, garantindo:
- **Registro obrigatório** de todos os scripts
- **Propriedade definida** com responsabilidade clara
- **Monitoramento de uso** e compliance automática
- **Alertas inteligentes** com SLA por severidade
- **Relatórios trimestrais** de conformidade

## Arquitetura

### Componentes Core (Fase 1 - Implementada)

```
compliance-engine/
├── core/
│   ├── compliance-core.mjs      # Orquestrador principal
│   ├── script-registry.mjs      # Registro canônico de scripts
│   └── usage-monitor.mjs        # Monitor de execução
├── alerts/
│   └── alert-manager.mjs        # Sistema de alertas com SLA
├── data/                        # Dados persistentes
└── init.mjs                     # Script de inicialização
```

### Políticas Institucionais

1. **Conformidade Estrutural**: Nenhum script roda sem estar registrado e aprovado
2. **Cadeia de Auditoria**: Bypass requer justificativa documentada
3. **Accountability Executiva**: Relatórios trimestrais são matéria diretorial

## Instalação e Inicialização

### 1. Estrutura de Diretórios
```bash
# Já criada automaticamente
compliance-engine/
├── core/
├── alerts/
├── data/
└── hooks/
```

### 2. Inicialização
```bash
# Inicializar o sistema
node compliance-engine/init.mjs
```

### 3. Configuração de Canais (Opcional)
```javascript
import { getAlertManager } from './alerts/alert-manager.mjs';

const alerts = getAlertManager();

// Configurar Slack
await alerts.configureChannel('engineering-alerts', 'slack', {
  webhookUrl: 'https://hooks.slack.com/...',
  channel: '#engineering-alerts'
});

// Configurar Email
await alerts.configureChannel('owner', 'email', {
  smtp: { host: 'smtp.company.com', port: 587 },
  from: 'compliance@company.com'
});
```

## Uso Programático

### Registrar Novo Script
```javascript
import { getRegistry } from './core/script-registry.mjs';

const registry = getRegistry();

await registry.register({
  id: 'my-script',
  name: 'My Script',
  path: 'scripts/my-script.mjs',
  purpose: 'Processa dados de usuários',
  category: 'analytics',
  owner: 'john.doe@company.com'
});
```

### Verificar Compliance
```javascript
import { getComplianceCore } from './core/compliance-core.mjs';

const engine = getComplianceCore();
const isCompliant = await engine.checkCompliance('my-script');
```

### Executar Auditoria Completa
```javascript
const audit = await engine.runComplianceAudit();
console.log(`Score: ${audit.summary.score}%`);
```

## Estados de Governança

| Estado | Descrição | Pode Executar | Requer Aprovação |
|--------|-----------|---------------|------------------|
| `unapproved` | Aguardando registro inicial | ❌ | ✅ |
| `active` | Totalmente operacional | ✅ | ❌ |
| `quarantined` | Bloqueado por segurança | ❌ | ✅ (liberação) |
| `legacy` | Ainda funciona, candidato a depreciação | ⚠️ | ❌ |
| `deprecated` | Bloqueado, agendado para remoção | ❌ | ✅ (exceção) |

## Matriz SLA de Alertas

| Severidade | SLA Acknowledgment | SLA Resolution | Responsável |
|------------|-------------------|----------------|-------------|
| `low` | 5 dias úteis | N/A | Owner |
| `medium` | 48 horas | 7 dias úteis | Owner |
| `high` | 4 horas | 24 horas | Owner + Tech Lead |
| `critical` | 15 minutos | 2 horas | Owner + Director |

## Relatórios Trimestrais

Executado automaticamente todo trimestre, inclui:

- **Taxa de Conformidade Geral**
- **Scripts por Estado** (active/legacy/deprecated)
- **Métricas de Ownership** (cobertura de propriedade)
- **Alertas e SLA** (compliance de resposta)
- **Riscos Identificados** (com owner designado)
- **Recomendações Executivas**

## Desenvolvimento

### Adicionando Novos Scripts
1. Criar script em `/scripts/`
2. Registrar via `registry.register()`
3. Aguardar aprovação (status muda para `active`)
4. Script ganha hooks automáticos de monitoramento

### Configurando Alertas
- Editar `data/channels-config.json`
- Testar canais via `alerts.testChannel()`
- Monitorar SLA via dashboard

### Monitoramento
```javascript
// Health check do sistema
const health = await engine.healthCheck();

// Métricas detalhadas
const metrics = await registry.generateMetrics();
const usage = await monitor.generateUsageReport();
const alerts = await alertManager.getAlertStats();
```

## Segurança e Compliance

### Rastreabilidade Jurídica
- Toda execução registra `runAuthority`
- Bypass requer `reasonForBypass`
- Histórico imutável por 7 anos

### Quarentena Automática
- Scripts podem ser colocados em quarentena por segurança
- Requer motivo documentado e aprovação
- Escalação automática após 3 dias

### Cadeia de Custódia
- Todo script tem `policyVersion` atual
- Operações críticas registram `approvedBy`
- Relatórios incluem `validationId` único

## Próximas Fases

### Fase 2: Motor de Autoridade (CI Gates)
- `ci-gate.mjs`: Bloqueio em pipeline
- `pre-commit-hook.mjs`: Validação local
- Integração com CI/CD

### Fase 3: Depreciação e Lifecycle
- `depreciation-engine.mjs`: Strikes e depreciação automática
- Rules engine (`rules/`): Validações configuráveis
- Lifecycle management

### Fase 4: Relatórios Trimestrais
- `quarterly-report.mjs`: Relatório completo
- Risk assessment com owner designado
- Accountability tracking

### Fase 5: Dashboard Executivo
- Interface web para acompanhamento
- KPIs de maturidade institucional
- Transparency portal

## Troubleshooting

### Sistema Não Inicializa
```bash
# Verificar arquivos de dados
ls -la compliance-engine/data/

# Verificar permissões
chmod +x compliance-engine/**/*.mjs
```

### Alertas Não São Enviados
```bash
# Testar canais
node -e "
import { getAlertManager } from './alerts/alert-manager.mjs';
const alerts = getAlertManager();
alerts.testChannel('engineering-alerts');
"
```

### Scripts Não Aparecem no Registry
```bash
# Forçar recarga
rm compliance-engine/data/script-registry.json
node compliance-engine/init.mjs
```

## Contribuição

1. Todo novo componente deve implementar health check
2. Seguir contratos definidos no Manual de Governo
3. Incluir testes unitários
4. Atualizar documentação

## Suporte

Para questões técnicas, consulte:
- Manual de Governo (`compliance-engine/docs/`)
- Health checks (`engine.healthCheck()`)
- Alert logs (`data/alerts-history.json`)
