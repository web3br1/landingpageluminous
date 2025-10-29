# Scripts de Build com Timeout

Este diretório contém scripts para executar comandos de build com timeout adequado, evitando loops infinitos.

## timeout-build.ps1

Script PowerShell para executar comandos npm com timeout configurável.

### Uso

```powershell
# Comando básico com timeout padrão (5 minutos)
.\timeout-build.ps1

# Comando personalizado com timeout específico
.\timeout-build.ps1 600 "npm run build"

# Executar lint com timeout de 2 minutos
.\timeout-build.ps1 120 "npm run lint"

# Executar testes com timeout de 10 minutos
.\timeout-build.ps1 600 "npm test"
```

### Parâmetros

- `TimeoutSeconds` (opcional): Tempo limite em segundos (padrão: 300 = 5 minutos)
- `Command` (opcional): Comando a executar (padrão: "npm run build")

### Funcionalidades

- ✅ Timeout configurável
- ✅ Captura de saída padrão e erro
- ✅ Limpeza automática de processos órfãos
- ✅ Relatórios coloridos de status
- ✅ Tratamento adequado de erros
- ✅ Prevenção de loops infinitos

### Exemplos de Uso

```powershell
# Build normal
.\timeout-build.ps1

# Build com timeout maior para projetos grandes
.\timeout-build.ps1 900 "npm run build"

# Apenas verificar TypeScript
.\timeout-build.ps1 180 "npx tsc --noEmit"

# Executar todos os testes
.\timeout-build.ps1 1200 "npm run test:all"
```

### Tratamento de Timeout

Quando um comando excede o tempo limite:

1. O job é interrompido
2. Processos relacionados (node, npm) são terminados
3. Arquivos temporários são limpos
4. Status de erro é retornado

### Códigos de Saída

- `0`: Sucesso
- `1`: Timeout ou erro geral
- `-1`: Erro na execução do comando
- `Outros`: Código de saída do comando executado

### Notas de Segurança

- O script mata processos node/npm recentes para evitar recursos órfãos
- Arquivos temporários são automaticamente removidos
- Jobs do PowerShell são limpos no finally

## Recomendações

- Use timeout de 5-10 minutos para builds normais
- Use timeout de 15-30 minutos para builds completos com testes
- Monitore o uso de recursos durante builds longos
- Considere usar CI/CD para builds muito longos
