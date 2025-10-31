# dev.ps1 - Script de desenvolvimento padronizado para Windows/PowerShell
# Este script encapsula fluxos comuns de desenvolvimento para evitar problemas de sintaxe no Cursor

param(
    [Parameter(Mandatory=$false)]
    [string]$Command = "help",

    [Parameter(Mandatory=$false)]
    [switch]$SkipTests
)

# Configuracoes
$ErrorActionPreference = "Stop"

# Funcao para verificar se estamos no diretorio correto
function Test-ProjectRoot {
    if (!(Test-Path "package.json")) {
        Write-Host "Erro: Execute este script da raiz do projeto (onde esta package.json)" -ForegroundColor Red
        exit 1
    }
}

# Funcao para executar comando com tratamento de erro
function Invoke-SafeCommand {
    param([string]$Command, [string]$Description)

    Write-Host "`n=== $Description ===" -ForegroundColor Cyan
    Write-Host "Executando: $Command" -ForegroundColor Gray

    try {
        Invoke-Expression $Command
        Write-Host "[OK] $Description concluido com sucesso" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERRO] Erro em $Description`: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Comando principal
switch ($Command.ToLower()) {
    "setup" {
        Write-Host "[SETUP] Configurando ambiente de desenvolvimento..." -ForegroundColor Yellow

        Test-ProjectRoot

        Invoke-SafeCommand "pnpm install" "Instalando dependencias"
        Invoke-SafeCommand "pnpm typecheck" "Verificando tipos TypeScript"
        Invoke-SafeCommand "pnpm lint" "Executando linting"

        if (!$SkipTests) {
            Invoke-SafeCommand "pnpm test:unit" "Executando testes unitarios"
        }

        Write-Host "`n[SUCCESS] Setup concluido! Ambiente pronto para desenvolvimento." -ForegroundColor Green
    }

    "dev" {
        Write-Host "[DEV] Iniciando servidor de desenvolvimento..." -ForegroundColor Yellow

        Test-ProjectRoot

        Invoke-SafeCommand "pnpm run dev" "Iniciando servidor de desenvolvimento"
    }

    "test" {
        Write-Host "[TEST] Executando suite completa de testes..." -ForegroundColor Yellow

        Test-ProjectRoot

        Invoke-SafeCommand "pnpm test" "Executando todos os testes"
    }

    "build" {
        Write-Host "[BUILD] Construindo aplicacao para producao..." -ForegroundColor Yellow

        Test-ProjectRoot

        Invoke-SafeCommand "pnpm build" "Build de producao"
    }

    "check" {
        Write-Host "[CHECK] Executando verificacoes de qualidade..." -ForegroundColor Yellow

        Test-ProjectRoot

        Invoke-SafeCommand "pnpm typecheck" "Verificacao de tipos"
        Invoke-SafeCommand "pnpm lint" "Linting"
        Invoke-SafeCommand "pnpm test:unit" "Testes unitarios"
    }

    "clean" {
        Write-Host "[CLEAN] Limpando caches e arquivos temporarios..." -ForegroundColor Yellow

        Test-ProjectRoot

        # Remove node_modules e lock files se existir
        if (Test-Path "node_modules") {
            Remove-Item -Recurse -Force node_modules
            Write-Host "[OK] node_modules removido" -ForegroundColor Green
        }

        if (Test-Path "pnpm-lock.yaml") {
            Remove-Item pnpm-lock.yaml
            Write-Host "[OK] pnpm-lock.yaml removido" -ForegroundColor Green
        }

        # Limpa caches do Next.js
        if (Test-Path ".next") {
            Remove-Item -Recurse -Force .next
            Write-Host "[OK] .next removido" -ForegroundColor Green
        }

        Write-Host "`n[DICA] Execute .\dev.ps1 -Command setup para reinstalar dependencias" -ForegroundColor Cyan
    }

    "deps" {
        Write-Host "[DEPS] Gerenciando dependencias..." -ForegroundColor Yellow

        Test-ProjectRoot

        Invoke-SafeCommand "pnpm install" "Instalando dependencias"
        Invoke-SafeCommand "pnpm update --latest" "Atualizando para versoes mais recentes"
    }

    default {
        Write-Host "[INFO] Script de Desenvolvimento - Landing Page SaaS" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Uso: .\dev.ps1 -Command <comando> [-SkipTests]" -ForegroundColor White
        Write-Host ""
        Write-Host "Comandos disponiveis:" -ForegroundColor Yellow
        Write-Host "  setup     - Instala dependencias e executa verificacoes iniciais"
        Write-Host "  dev       - Inicia servidor de desenvolvimento"
        Write-Host "  test      - Executa suite completa de testes"
        Write-Host "  build     - Build de producao"
        Write-Host "  check     - Verificacoes de qualidade (typecheck + lint + testes)"
        Write-Host "  clean     - Remove caches e arquivos temporarios"
        Write-Host "  deps      - Instala/atualiza dependencias"
        Write-Host "  help      - Mostra esta ajuda (padrao)"
        Write-Host ""
        Write-Host "Exemplos:" -ForegroundColor Gray
        Write-Host "  .\dev.ps1 -Command setup"
        Write-Host "  .\dev.ps1 -Command dev"
        Write-Host "  .\dev.ps1 -Command check -SkipTests"
        Write-Host ""
        Write-Host "[INFO] Compatível com Cursor + PowerShell no Windows" -ForegroundColor Green
    }
}
