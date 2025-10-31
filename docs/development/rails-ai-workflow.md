# 🚀 Workflow Rails com IA (Cursor + Taskmaster)

Este documento descreve o fluxo completo de desenvolvimento Rails usando Cursor 2.0 + Taskmaster para produtividade máxima com IA.

## 📋 Visão Geral

O workflow combina três ferramentas principais:

- **Cursor**: Editor com agente de IA integrado que executa tarefas automaticamente
- **Taskmaster**: Sistema de gerenciamento de tarefas que conecta ao agente do Cursor
- **Rails**: Framework web usado como exemplo de aplicação completa

Juntos, eles criam um pipeline de desenvolvimento onde a IA funciona como um "dev sênior disciplinado" que segue instruções claras e mantém estado do progresso.

---

## 🧭 Parte 1 — Fluxo Rails com IA

### 1. Ferramentas-base do workflow

**Cursor**
- Editor com agente de IA integrado (janela de chat ao lado do código)
- → Ele lê, edita e cria arquivos direto no seu repo

**Taskmaster** (Conceitual)
- Sistema de gerenciamento de tarefas para desenvolvimento com IA:
  - Gera documentação de produto (PRD → Product Requirements Doc)
  - Quebra esse PRD em tarefas claras
  - Mantém estado das tarefas (to do / in progress / done)
  - Conecta isso ao agente do Cursor via MCP (Message/Task Protocol)
- Resultado: o agente para de "sair viajando" e passa a trabalhar de forma sequencial, como um dev disciplinado

> **Nota**: O Taskmaster mencionado é um conceito/ferramenta em desenvolvimento. Por enquanto, use alternativas como GitHub Issues, Linear, ou Jira para gerenciamento de tarefas.

Essas duas coisas juntas te dão:
- Planejamento claro → Execução automatizada → Rastreamento automático de progresso

### 2. Setup inicial do ambiente

1. **Criar um novo app Rails** (`rails new`)
2. **Abrir o projeto no Cursor**
3. **Configurar variáveis de ambiente** usadas pelos modelos de IA:
   - `ANTHROPIC_API_KEY`
   - `PERPLEXITY_API_KEY`
   - (cria conta nesses serviços, pega as keys, coloca no `.env` / variáveis do ambiente)
4. **Instalar Taskmaster** (`npm i taskmaster`)
5. **Rodar `taskmaster init`**:
   - Ele faz perguntas (responde "yes")
   - Ele gera:
     - Um arquivo de regras para o agente do Cursor (isso ensina o agente a usar Taskmaster direito)
     - Uma pasta `tasks/` (por enquanto vazia)
     - Um exemplo de PRD (`scripts/example_prd.txt` ou semelhante)
     - Um servidor MCP para o Cursor conversar com Taskmaster

**Resumo**: esse `init` literalmente conecta sua IA ao seu gerenciador de tarefas

### 3. Criar o PRD com ajuda da IA

Agora você já está dentro do Cursor.

**Fluxo**:

1. Escolhe um modelo grande e bom de raciocínio/contexto (no vídeo foi "Gemini 2.5 Pro Max mode") e coloca o Cursor em **Agent Mode**
2. Pede algo como:

   > "Crie um PRD usando `example_prd.txt` como template. O produto é um app de controle de compras de mercado ('grocery tracking'). Vamos usar Rails + SQLite + views padrão Rails."

**O que sai disso**:

- Um arquivo `prd.txt` descritivo
- Esse PRD explica:
  - Objetivo do app
  - Funcionalidades principais
  - Fluxo do usuário
  - Requisitos técnicos básicos

**Importante**: quanto mais clara sua visão de produto, melhor esse PRD

### 4. Gerar tarefas acionáveis a partir do PRD

Agora você transforma visão em execução.

No terminal:

```bash
taskmaster parse-prd path/para/seu/prd.txt
```

**Isso faz o Taskmaster**:

- Ler o PRD
- Criar um conjunto de tarefas numeradas
- Preencher `tasks/` com arquivos `.txt` para cada tarefa
- Criar um `tasks.json` com tudo consolidado (id, descrição, dependências, status)

**Exemplo típico de tarefas geradas**:

1. Inicializar projeto Rails (config de DB, autenticação, etc)
2. Criar modelo User
3. Criar tabela de itens de compra
4. Criar tela para adicionar item
5. Criar tela de histórico
...e assim por diante

**Você pode**:

- Rodar `taskmaster list` → vê todas as tarefas, status e dependências
- Rodar `taskmaster show <id>` → vê detalhes de uma tarefa específica (ex: 1)

Isso vira seu mini Jira pessoal, só que automatizado

### 5. Rodar tarefa por tarefa com a IA (ciclo de desenvolvimento)

Agora começa a mágica.

**Fluxo recomendado para cada tarefa**:

1. **Abra um chat NOVO no Cursor**. Sempre limpo, sempre do zero

   - Isso garante que o agente foque só na tarefa atual
2. Selecione o modelo que você quer usar no dia a dia (no vídeo: "Claude 4 Sonnet"/"Claude 4.5 Sonnet", sem "max mode" pra economizar)
3. Certifique-se de estar em **Agent Mode** (não só Chat Mode)
4. Peça:

   > "Start working on task 1."

**A partir daí**:

- O agente conversa com Taskmaster via MCP
- Ele lê a task 1 do `tasks.json`
- Ele muda o status dessa task para "in progress"
- Ele faz o trabalho dentro do seu repo Rails:
  - ajusta Gemfile
  - gera scaffolds
  - configura Devise
  - configura RSpec
  - cria migrações
  - roda `bin/dev` ou equivalente para testar
  - etc
- Quando terminar:
  - Ele gera um **resumo do que foi feito**
  - Marca a tarefa como `done`
  - Libera a próxima tarefa cujas dependências agora estão satisfeitas

**Você pode confirmar** rodando:

```bash
taskmaster list
```

e vendo que a Task 1 mudou pra `done`, Task 2 agora está `ready`

Esse é o loop:

- Limpa o chat
- "Start working on task 2"
- Deixa rodar
- Verifica no browser (`localhost:3000`) se tá tudo de pé
- Próxima

**Dois detalhes poderosos**:

- Se a tarefa é grande, o agente pode automaticamente quebrar em subtarefas internas (`expand`) e marcar progresso parcial
- Se você some por uma semana e volta, só roda `taskmaster list` e você sabe exatamente onde parou. Você não precisa "lembrar"

### 6. Verificação contínua

Entre uma task e outra:

- Você sobe o servidor Rails (normalmente `bin/dev` ou `rails server`) e valida se a app ainda roda
- Você abre `localhost:3000` e checa:
  - Auth funciona?
  - DB migrou?
  - Layout carregou?
- Se quebrou: você pode simplesmente perguntar pro agente "o app quebrou após a Task 2, conserte"

O agente entende o estado atual porque Taskmaster mantém o contexto de qual tarefa está ativa e o Cursor tem acesso ao repo

### 7. Por que esse fluxo é forte?

- **Menos caos mental**: você não precisa ficar lembrando manualmente "o que falta?". Taskmaster é memória viva do projeto
- **Menos deriva da IA**: em vez de a IA tentar refatorar o mundo inteiro, ela fica presa na Task atual e suas dependências
- **Reprodutibilidade de progresso**: você pode parar hoje no meio da Task 5 e continuar sábado à noite com zero confusão
- **Onboarding fácil**: até se você é iniciante em Rails, a IA já configura:
  - versão mais recente do Rails (no exemplo, subiu pra Rails 8.0.2)
  - Devise pra auth
  - Bootstrap pra UI
  - RSpec pra testes
  - SQLite local
  - Gems úteis

Em termos humanos: Taskmaster é o gerente de projeto, Cursor é o dev sênior que escreve/edita código

---

## 🧠 Parte 2 — Como isso se conecta ao Cursor 2.0

Agora vamos unificar: Cursor 2.0 + Taskmaster + seu fluxo Rails formam uma pipeline completa.

### 1. Planejamento

- No Cursor 2.0 você tem **Plan Mode** (gera plano técnico passo a passo)
- No fluxo Rails você tem **PRD + parse** (gera plano de produto → tarefas)
- Esses dois níveis se complementam:
  - PRD = visão do produto
  - Plan Mode = plano técnico pra implementar uma parte específica dessa visão

**Você pode**:

1. gerar PRD com Taskmaster
2. escolher uma task
3. abrir Plan Mode no Cursor pra aquela task específica e pedir "gera um plano técnico antes de construir"

Isso te dá governança absurda

### 2. Execução guiada

- Cursor 2.0 (Agent Mode) já consegue:
  - editar arquivos
  - rodar comandos
  - migrar DB
  - abrir browser interno
  - depurar erros de runtime
- Taskmaster amarra isso numa fila de tarefas com estado
- Resultado: você tem um "pipeline Kanban" dentro do próprio editor

### 3. Paralelismo e checkpoints

Do Cursor 2.0:

- Você pode rodar **vários agentes em paralelo** (até com modelos diferentes) e comparar abordagens
- Você pode aplicar as mudanças de um agente, testar, e depois desfazer (checkpoint/rollback)

Com Taskmaster:

- Você sabe qual variante realmente completou a tarefa X sem quebrar nada
- Você marca aquela como `done`

Isso parece trivial, mas é literalmente fluxo de squad:

- Explorar → Selecionar → Consolidar → Fechar task

### 4. Contexto e foco

- Antes já falamos de boas práticas no Cursor: **sempre começar um chat novo pra cada feature**
- Aqui isso ganha justificativa técnica: cada nova tarefa do Taskmaster merece um chat limpo
- Assim:
  - o modelo não carrega "lixo" de tarefas antigas
  - o custo cai (menos contexto grande)
  - e você evita "deriva de escopo"

No vídeo Rails isso é regra explícita:

> "Você precisa fechar o chat toda vez e começar do zero pra cada tarefa"

Essa disciplina é ouro. Isso sozinho já eleva a qualidade da IA como se você estivesse usando um modelo melhor

### 5. Transparência operacional

- Cursor 2.0 mostra os diffs de arquivo, o console do navegador, as migrações novas, etc
- Taskmaster mantém histórico do que foi feito por task, incluindo subtarefas e resumos automáticos

Isso resolve dois problemas clássicos de dev solo:

1. "O que a IA acabou de mudar no meu código?"
2. "Em que ponto exatamente eu parei semana passada?"

Agora você tem resposta pra ambos

### 6. Handoff entre humano e IA

O fluxo incentiva um padrão muito saudável:

- IA gera um plano → você revisa antes da execução
- IA faz a execução → você valida no browser
- IA marca task como done → você roda `taskmaster list` e decide o próximo passo conscientemente

Ou seja: você continua como responsável de produto/engenharia, não vira passageiro cego

---

## 📌 Check-list de melhores práticas consolidadas

1. Sempre gere um PRD antes de sair pedindo "faz feature X"
2. Sempre transforme PRD em tarefas claras com Taskmaster
3. Sempre rode UMA tarefa por chat limpo
4. Sempre mantenha Taskmaster como "fonte da verdade" do status
5. Sempre revise planos antes de apertar "Build"
6. Sempre valide no browser integrado e peça correções com os logs/erros reais
7. Sempre use rollback/checkpoint se o agente começar a ir pro caminho errado
8. Sempre pare e rode `taskmaster list` quando voltar depois de alguns dias. É seu mapa mental do projeto
9. Use modelos grandes (Gemini Max / Claude Max etc) só pra planejamento/PRD
   Use modelos padrão (Claude Sonnet / Composer 1) pra execução diária, porque é mais barato
10. Trate Cursor como dev executor e Taskmaster como gestor de projeto. Você é o product owner

---

## 🎯 Próximos Passos

Para implementar esse workflow no seu projeto:

1. **Configurar ambiente**: Instalar Taskmaster e configurar APIs de IA
2. **Criar primeiro PRD**: Usar template para descrever seu produto
3. **Quebrar em tarefas**: Executar `taskmaster parse-prd`
4. **Começar desenvolvimento**: Seguir o ciclo "chat limpo → start working on task X"
5. **Monitorar progresso**: Usar `taskmaster list` como dashboard

Esse fluxo transforma desenvolvimento com IA de "conversa solta" para "pipeline estruturado", mantendo você no controle enquanto a IA executa o trabalho pesado.
