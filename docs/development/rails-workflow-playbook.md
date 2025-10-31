# 🎯 Playbook Operacional - Rails + Cursor + Gerenciamento de Tarefas

> **Nota**: O Taskmaster mencionado neste guia é um conceito/ferramenta em desenvolvimento. Use as alternativas práticas abaixo enquanto aguarda sua disponibilidade:
>
> - **GitHub Issues**: Para projetos open source
> - **Linear**: Para equipes pequenas/médias
> - **Jira**: Para equipes enterprise
> - **Trello/Todoist**: Para gerenciamento pessoal

## 📋 Checklist de Setup (Antes de Começar)

### Ambiente de Desenvolvimento
- [ ] Rails instalado (versão 7+)
- [ ] Node.js 18+ para ferramentas de desenvolvimento
- [ ] Cursor 2.0 ou superior
- [ ] Contas criadas em Anthropic e Perplexity

### Configuração de APIs
- [ ] `ANTHROPIC_API_KEY` configurada
- [ ] `PERPLEXITY_API_KEY` configurada
- [ ] Chaves testadas no Cursor

### Projeto Rails
- [ ] `rails new meu-projeto` executado
- [ ] Projeto aberto no Cursor
- [ ] Sistema de gerenciamento de tarefas configurado (GitHub Issues, Linear, ou Jira)
- [ ] Ferramenta de tarefas inicializada

---

## 🚀 Fluxo de Execução (Passo a Passo)

### Fase 1: Planejamento (30-60 min)

1. **Abrir Cursor em Agent Mode**
   - Selecionar modelo grande (Gemini 2.5 Pro Max ou Claude Max)
   - Ativar Agent Mode (não Chat Mode)

2. **Gerar PRD**
   ```
   Peça: "Crie um PRD usando example_prd.txt como template.
   O produto é [DESCREVA SEU PRODUTO].
   Vamos usar Rails + SQLite + views padrão Rails."
   ```

3. **Revisar PRD**
   - Verificar se cobre: objetivo, funcionalidades, fluxo usuário, requisitos técnicos
   - Editar manualmente se necessário
   - Salvar como `prd.txt`

### Fase 2: Quebrar em Tarefas (10 min)

1. **Executar parsing**
   ```bash
   taskmaster parse-prd path/para/prd.txt
   ```

2. **Verificar tarefas geradas**
   ```bash
   taskmaster list
   ```

3. **Revisar dependências**
   - Verificar se ordem faz sentido
   - Ajustar prioridades se necessário

### Fase 3: Desenvolvimento (Iterativo)

**Para cada tarefa:**

1. **Abrir chat NOVO no Cursor**
   - Sempre começar do zero
   - Selecionar modelo padrão (Claude Sonnet/Composer 1)

2. **Iniciar tarefa**
   ```
   Peça: "Start working on task X"
   (substitua X pelo número da tarefa)
   ```

3. **Deixar executar**
   - Agente vai ler tarefa via MCP
   - Executar mudanças no código
   - Testar automaticamente
   - Gerar resumo quando terminar

4. **Verificar progresso**
   ```bash
   taskmaster list
   ```
   - Confirmar que tarefa ficou "done"
   - Verificar próxima tarefa "ready"

5. **Validar manualmente**
   ```bash
   bin/dev  # ou rails server
   ```
   - Abrir localhost:3000
   - Testar funcionalidade implementada
   - Corrigir se necessário

### Fase 4: Recuperação de Sessão

**Quando voltar ao projeto:**

1. **Verificar estado atual**
   ```bash
   taskmaster list
   ```

2. **Continuar da última tarefa**
   - Identificar qual tarefa estava em progresso
   - Abrir chat novo
   - "Start working on task X"

3. **Se tarefa quebrou**
   - Pedir pro agente: "Conserta o que quebrou na Task X"
   - Usar logs/erros do navegador

---

## ⚡ Dicas de Produtividade

### Modelos por Atividade
- **Planejamento/PRD**: Gemini 2.5 Pro Max, Claude Max (custos maiores OK)
- **Execução diária**: Claude Sonnet, Composer 1 (mais econômico)
- **Debugging**: Mesmo modelo da execução, para consistência

### Gerenciamento de Chats
- **Sempre fechar chat** ao terminar tarefa
- **Um chat = uma tarefa**
- **Não reutilizar chats** entre tarefas diferentes

### Controle de Qualidade
- **Testar no browser** após cada tarefa
- **Verificar migrations** rodaram
- **Confirmar auth** funciona
- **Validar layout** carrega

### Recuperação de Estado
- **taskmaster list** = seu mapa mental
- **Nunca confiar só na memória**
- **Screenshot do progresso** se necessário

---

## 🔧 Troubleshooting Comum

### Agente "saiu viajando"
- Fechar chat e abrir novo
- "Foca só nesta tarefa específica"
- Usar modelo mais simples se necessário

### Tarefa quebrou a app
- Pedir: "O app quebrou após Task X, conserta usando os logs/erros"
- Mostrar erro específico do terminal/browser

### Taskmaster não responde
- Verificar se MCP server está rodando
- Reiniciar Cursor
- Re-executar `taskmaster init`

### Modelo muito caro
- Alternar para Claude Sonnet ao invés de Max
- Usar Gemini 1.5 Pro ao invés de 2.5 Max

---

## 📊 Métricas de Sucesso

### Por Projeto
- **Setup time**: < 30 min
- **Tasks completadas/dia**: 3-5
- **Tempo por task**: 15-45 min
- **Taxa de sucesso**: > 80% (tasks não precisam retrabalho)

### Qualidade
- **Rails version**: Sempre latest (8.x)
- **Gems essenciais**: Devise, RSpec, Bootstrap configurados
- **DB**: SQLite para dev, migrations funcionais
- **Auth**: Fluxo completo funcionando

---

## 🎯 Próximos Passos

Após implementar esse fluxo:

1. **Documentar variações** específicas do seu domínio
2. **Criar templates** de PRD para projetos similares
3. **Automatizar setup** com scripts
4. **Integrar CI/CD** para deploy automático
5. **Expandir** para outras stacks (Next.js, Django, etc)

**Lembrete**: Taskmaster = gerente de projeto, Cursor = dev executor, Você = product owner. Mantenha essa separação de responsabilidades!
