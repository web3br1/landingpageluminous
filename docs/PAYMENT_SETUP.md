# 🚀 Integração de Pagamentos - Luminaris

Guia completo para configurar Stripe + PagBank e começar a receber pagamentos.

## 📋 Pré-requisitos

- Conta no [Stripe](https://stripe.com/br) (para USD/internacional)
- Conta no [PagBank](https://pagseguro.uol.com.br) (para BRL)
- Domínio próprio para webhooks
- Certificado SSL válido

## ⚙️ Configuração do Stripe

### 1. Criar Conta e Configurar

```bash
# 1. Acesse https://dashboard.stripe.com
# 2. Ative o modo de teste inicialmente
# 3. Vá para Developers > API Keys
```

### 2. Configurar Produtos/Planos

```bash
# No dashboard do Stripe:
# 1. Products > Create Product
# 2. Crie os planos: "Starter", "Professional", "Enterprise"
# 3. Defina preços recorrentes (monthly/annual)
# 4. Anote os Price IDs (price_xxx)
```

### 3. Configurar Webhooks

```bash
# 1. Developers > Webhooks > Add endpoint
# 2. URL: https://seudominio.com/api/webhooks/stripe
# 3. Eventos importantes:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
```

### 4. Variáveis de Ambiente

```env
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
```

## 🇧🇷 Configuração do PagBank

### 1. Criar Conta e Configurar

```bash
# 1. Acesse https://pagseguro.uol.com.br
# 2. Crie conta jurídica
# 3. Ative a API (sandbox primeiro)
# 4. Gere token de integração
```

### 2. Configurar Planos de Assinatura

```bash
# Use a API do PagBank para criar planos:
curl -X POST https://api.pagseguro.com/plans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reference_id": "starter-plan",
    "name": "Plano Starter",
    "description": "Plano básico",
    "amount": {
      "value": 9700,
      "currency": "BRL"
    },
    "interval": {
      "unit": "MONTH",
      "length": 1
    }
  }'
```

### 3. Configurar Webhooks

```bash
# No painel PagBank:
# 1. Configurações > Integrações
# 2. Webhooks > Novo webhook
# 3. URL: https://seudominio.com/api/webhooks/pagbank
# 4. Eventos:
   - ORDER.PAID
   - ORDER.CANCELLED
   - SUBSCRIPTION.CREATED
   - SUBSCRIPTION.ACTIVATED
   - SUBSCRIPTION.CANCELLED
   - CHARGE.PAID
   - CHARGE.DECLINED
```

### 4. Variáveis de Ambiente

```env
# .env.local
PAGBANK_TOKEN=your-pagbank-token
PAGBANK_WEBHOOK_TOKEN=your-webhook-token
PAGBANK_STARTER_PLAN_ID=plan_...
PAGBANK_PROFESSIONAL_PLAN_ID=plan_...
```

## 🧪 Testes

### Testar Stripe

```bash
# Use cartões de teste:
# Sucesso: 4242 4242 4242 4242
# Falha: 4000 0000 0000 0002
# PIX: Configure no dashboard
```

### Testar PagBank

```bash
# Use dados de teste da documentação
# Sandbox token diferente do production
```

## 🔒 Segurança

### Checklist de Segurança

- [ ] Webhook signatures validadas
- [ ] Dados sensíveis não logados
- [ ] Rate limiting nos endpoints
- [ ] PCI compliance (Stripe Elements)
- [ ] HTTPS obrigatório
- [ ] Secrets em variáveis de ambiente

### Proteção contra Fraude

```typescript
// Implementar verificações
- Limite de tentativas por IP
- Validação de CPF/CNPJ
- Bloqueio de países de alto risco
- Monitoramento de chargebacks
```

## 📊 Monitoramento

### Métricas Essenciais

```typescript
// Implementar tracking
- Taxa de conversão do checkout
- Taxa de aprovação de pagamentos
- Churn rate por método de pagamento
- Receita recorrente mensal (MRR)
- Lifetime Value (LTV) por canal
```

### Alertas

```typescript
// Configurar alertas para:
- Webhooks falhando
- Taxa de aprovação < 90%
- Chargebacks > 1%
- MRR abaixo da meta
```

## 🚀 Próximos Passos

### Semana 1: Setup Básico

1. [ ] Configurar contas Stripe/PagBank
2. [ ] Criar produtos/planos
3. [ ] Implementar webhooks
4. [ ] Testes básicos

### Semana 2: Integração Completa

1. [ ] Conectar checkout real
2. [ ] Implementar confirmação de pagamento
3. [ ] Configurar emails de confirmação
4. [ ] Testes end-to-end

### Semana 3: Otimização

1. [ ] Otimizar conversão do checkout
2. [ ] Implementar upsells no checkout
3. [ ] Configurar analytics detalhado
4. [ ] Monitoramento e alertas

### Semana 4: Scale

1. [ ] Migrar para produção
2. [ ] Otimizar performance
3. [ ] Implementar retenção avançada
4. [ ] Análise de cohort

## 🆘 Troubleshooting

### Problemas Comuns

**Webhook não chega:**

- Verificar URL do webhook
- Confirmar signature validation
- Checar firewall/antivirus

**Pagamento falha:**

- Validar dados do cartão
- Verificar limite de crédito
- Checar configurações de PCI

**Assinatura não renova:**

- Confirmar método de pagamento válido
- Verificar webhook invoice.payment_failed
- Implementar dunning management

## 📞 Suporte

- **Stripe:** [Suporte Stripe](https://support.stripe.com)
- **PagBank:** [Suporte PagSeguro](https://suporte.pagseguro.uol.com.br)
- **Documentação:** Ver arquivos no `/docs/payments/`

## ✅ Checklist de Go-Live

- [ ] Todos os webhooks configurados e testados
- [ ] Certificado SSL válido
- [ ] Variáveis de produção configuradas
- [ ] Testes de carga realizados
- [ ] Monitoramento ativo
- [ ] Plano de rollback definido
- [ ] Suporte técnico disponível 24/7

---

**Resultado esperado:** Receita recorrente automática e escalável! 💰✨
