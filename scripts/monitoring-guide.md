# 📊 Guia de Uso - Sistema de Monitoramento em Produção

## 🚀 Como Usar o Sistema de Monitoramento

### 1. **Dashboard Administrativo**

- **URL**: `http://localhost:3000/admin/monitoring`
- **Funcionalidades**:
  - ✅ Visão geral de erros críticos
  - ✅ Padrões de erro detectados
  - ✅ Métricas de Core Web Vitals
  - ✅ Taxa de erro em tempo real
  - ✅ Última atualização automática

### 2. **APIs de Monitoramento**

#### **Relatório de Erros**

```bash
GET http://localhost:3000/api/monitoring/report
```

- Retorna padrões de erro detectados
- Frequência de ocorrência
- Impacto e contexto

#### **Enviar Erro Manual**

```bash
POST http://localhost:3000/api/monitoring/error
Content-Type: application/json

{
  "error": {
    "message": "Cannot read properties of undefined (reading 'call')",
    "type": "FACTORY_ERROR",
    "code": "webpack_runtime_error"
  },
  "context": {
    "url": "/dashboard",
    "userAgent": "Mozilla/5.0...",
    "timestamp": 1703123456789,
    "sessionId": "session_123",
    "viewport": { "width": 1920, "height": 1080 },
    "connection": { "effectiveType": "4g", "downlink": 10 }
  }
}
```

#### **Enviar Métrica de Performance**

```bash
POST http://localhost:3000/api/monitoring/performance
Content-Type: application/json

{
  "metric": "LCP",
  "value": 2.5,
  "sessionId": "session_123",
  "timestamp": "2023-12-20T10:30:00Z",
  "url": "/dashboard",
  "additionalData": {
    "budget": 2.5,
    "navigationTiming": {...}
  }
}
```

### 3. **Scripts de Teste**

#### **Testes Específicos de Webpack**

```bash
npm run test:webpack-errors
```

- Testa carregamento de módulos
- Verifica erros factory.call
- Valida carregamento de chunks

#### **Testes de Performance**

```bash
npm run test:performance
```

- Core Web Vitals
- Carregamento de recursos
- Memória e CPU

#### **Testes de Hidratação**

```bash
npm run test:hydration
```

- React hydration
- Componentes lazy
- Estados de erro

### 4. **Monitoramento Automático**

O sistema funciona automaticamente:

- **Erros são capturados** em `console.error`
- **Performance é medida** via Web Vitals
- **Dados são enviados** para APIs automaticamente
- **Dashboard é atualizado** em tempo real

### 5. **Alertas e Notificações**

#### **Tipos de Erros Monitorados**

- 🔴 **FACTORY_ERROR**: `options.factory.call` undefined
- 🔴 **WEBPACK_RUNTIME**: Erros de webpack runtime
- 🟡 **MODULE_LOADING**: Falhas de carregamento de módulos
- 🟡 **PERFORMANCE**: Core Web Vitals fora do budget

#### **Thresholds de Alerta**

- LCP > 2.5s
- FID > 100ms
- CLS > 0.1
- Taxa de erro > 5%

### 6. **Debugging em Produção**

#### **Logs Estruturados**

```javascript
import { logger } from "@/lib/logger";

logger.error("Factory call error detected", {
  error: error.message,
  stack: error.stack,
  context: {
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  },
});
```

#### **Console Override**

O sistema automaticamente intercepta `console.error` para detectar erros críticos.

#### **Performance Monitoring**

```javascript
import { ProductionMonitor } from '@/lib/production-monitoring'

const monitor = ProductionMonitor.getInstance()
monitor.trackPerformance('LCP', 2.3, { navigationTiming: {...} })
```

### 7. **Integração com Ferramentas Externas**

#### **Sentry/Datadog**

```javascript
// Os dados são estruturados para fácil integração
const errorData = {
  level: "error",
  tags: { type: "FACTORY_ERROR" },
  extra: { context, experiments, sections },
};
```

#### **Google Analytics**

```javascript
// Eventos customizados são enviados automaticamente
gtag("event", "factory_error_detected", {
  event_category: "webpack_error",
  event_label: "factory.call",
});
```

### 8. **Manutenção**

#### **Limpeza de Dados**

- Dados são mantidos por 30 dias
- Limpeza automática via cron job
- Backup antes de limpeza

#### **Configuração**

```typescript
// lib/production-monitoring.ts
const config = {
  errorReporting: {
    enabled: true,
    sampleRate: 0.1, // 10% dos erros
    filters: ["FACTORY_ERROR", "WEBPACK_RUNTIME"],
  },
  performance: {
    webVitals: true,
    memoryMonitoring: true,
    thresholds: { lcp: 2500, fid: 100, cls: 0.1 },
  },
};
```

### 9. **Troubleshooting**

#### **Problema: Dashboard não carrega**

- ✅ Verificar se servidor está rodando
- ✅ Verificar logs do console
- ✅ Verificar permissões de rede

#### **Problema: Erros não aparecem**

- ✅ Verificar se ProductionMonitor está inicializado
- ✅ Verificar configuração de sample rate
- ✅ Verificar filtros de erro

#### **Problema: Performance não é medida**

- ✅ Verificar se Web Vitals API está disponível
- ✅ Verificar se monitor.trackPerformance é chamado
- ✅ Verificar configuração de thresholds

---

## 🎯 **Checklist de Implementação**

- [x] Sistema de error tracking implementado
- [x] Core Web Vitals monitoring ativo
- [x] Dashboard administrativo funcional
- [x] APIs de relatório operacionais
- [x] Testes abrangentes criados
- [x] Logging estruturado configurado
- [x] Alertas automáticos ativos
- [x] Documentação completa criada

---

**🚀 Sistema Pronto para Produção!**
