# quality-audit.ps1 - Script de Auditoria Sistemática de Qualidade
# Executa todos os checks de qualidade e gera relatório para correção sistemática

param(
    [switch]$Quiet,
    [switch]$NoChatOutput
)

Write-Host "=== QUALITY AUDIT START ===" -ForegroundColor Green

# Criar diretório de logs se não existir
$logDir = "quality-logs"
if (!(Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

# Run all checks and capture output
Write-Host "Running TypeScript check..." -ForegroundColor Yellow
try {
    $typecheckOutput = & pnpm typecheck 2>&1
    $typecheckOutput | Out-File -FilePath "$logDir/typecheck-errors.log" -Encoding UTF8
} catch {
    $typecheckOutput = $_.Exception.Message
    $typecheckOutput | Out-File -FilePath "$logDir/typecheck-errors.log" -Encoding UTF8
}

Write-Host "Running ESLint check..." -ForegroundColor Yellow
try {
    $lintOutput = & pnpm lint 2>&1
    $lintOutput | Out-File -FilePath "$logDir/lint-errors.log" -Encoding UTF8
} catch {
    $lintOutput = $_.Exception.Message
    $lintOutput | Out-File -FilePath "$logDir/lint-errors.log" -Encoding UTF8
}

Write-Host "Running Architecture check..." -ForegroundColor Yellow
try {
    $depOutput = & pnpm depcruise --output-type err 2>&1
    $depOutput | Out-File -FilePath "$logDir/depcruise-errors.log" -Encoding UTF8
} catch {
    $depOutput = $_.Exception.Message
    $depOutput | Out-File -FilePath "$logDir/depcruise-errors.log" -Encoding UTF8
}

Write-Host "Running Dead Code check..." -ForegroundColor Yellow
try {
    $knipOutput = & pnpm knip 2>&1
    $knipOutput | Out-File -FilePath "$logDir/knip-errors.log" -Encoding UTF8
} catch {
    $knipOutput = $_.Exception.Message
    $knipOutput | Out-File -FilePath "$logDir/knip-errors.log" -Encoding UTF8
}

Write-Host "Running Unit Tests..." -ForegroundColor Yellow
try {
    $testOutput = & pnpm test:vitest:unit --reporter=verbose 2>&1
    $testOutput | Out-File -FilePath "$logDir/test-errors.log" -Encoding UTF8
} catch {
    $testOutput = $_.Exception.Message
    $testOutput | Out-File -FilePath "$logDir/test-errors.log" -Encoding UTF8
}

# Count errors per category
$typecheckErrors = (Get-Content "$logDir/typecheck-errors.log" | Where-Object { $_ -match "error TS" }).Count
$lintErrors = (Get-Content "$logDir/lint-errors.log" | Where-Object { $_ -match "error" -or $_ -match "warning" }).Count
$depErrors = (Get-Content "$logDir/depcruise-errors.log" | Where-Object { $_ -match "→" -or $_ -match "error" }).Count
$knipErrors = (Get-Content "$logDir/knip-errors.log" | Where-Object { $_ -match "unused" -or $_ -match "error" }).Count
$testErrors = (Get-Content "$logDir/test-errors.log" | Where-Object { $_ -match "failed" -or $_ -match "✗" }).Count

# Summary
if (!$Quiet) {
    Write-Host "`n=== QUALITY AUDIT RESULTS ===" -ForegroundColor Yellow
    Write-Host "TypeScript errors: $typecheckErrors" -ForegroundColor $(if ($typecheckErrors -eq 0) { "Green" } else { "Red" })
    Write-Host "Lint errors: $lintErrors" -ForegroundColor $(if ($lintErrors -eq 0) { "Green" } else { "Red" })
    Write-Host "Architecture errors: $depErrors" -ForegroundColor $(if ($depErrors -eq 0) { "Green" } else { "Red" })
    Write-Host "Unused code: $knipErrors" -ForegroundColor $(if ($knipErrors -eq 0) { "Green" } else { "Yellow" })
    Write-Host "Test failures: $testErrors" -ForegroundColor $(if ($testErrors -eq 0) { "Green" } else { "Red" })
}

# Generate structured results for dashboard
$results = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    typecheck = $typecheckErrors
    lint = $lintErrors
    architecture = $depErrors
    unused = $knipErrors
    tests = $testErrors
    total = $typecheckErrors + $lintErrors + $depErrors + $knipErrors + $testErrors
}

$results | ConvertTo-Json | Out-File -FilePath "$logDir/current-results.json" -Encoding UTF8

# Generate chat-ready output
if (!$NoChatOutput) {
    $chatOutput = @"
**AUDITORIA COMPLETA DE QUALIDADE - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')**

## Resumo de Erros:
- **TypeScript**: $typecheckErrors erros
- **Lint**: $lintErrors erros
- **Arquitetura**: $depErrors erros
- **Código não usado**: $knipErrors itens
- **Testes**: $testErrors falhas
- **TOTAL**: $($results.total) problemas

## Priorização de Correção:
1. **Arquitetura/Import** ($depErrors) - corrigir PRIMEIRO
2. **Contrato/Borda** - validação Zod + Problem+JSON
3. **CLEAN/DDD** - padrões estruturais
4. **TypeScript** ($typecheckErrors) - tipos incompatíveis
5. **Lint/Estilo** ($lintErrors) - complexidade, any, formatação
6. **Testes** ($testErrors) - cobertura e assertions

---

**TypeScript ($typecheckErrors erros):**
``````
$(Get-Content "$logDir/typecheck-errors.log" -Raw)
``````

**Lint ($lintErrors erros):**
``````
$(Get-Content "$logDir/lint-errors.log" -Raw)
``````

**Arquitetura ($depErrors erros):**
``````
$(Get-Content "$logDir/depcruise-errors.log" -Raw)
``````

**Testes ($testErrors falhas):**
``````
$(Get-Content "$logDir/test-errors.log" -Raw)
``````

**Código não usado ($knipErrors itens):**
``````
$(Get-Content "$logDir/knip-errors.log" -Raw)
``````
"@

    $chatOutput | Out-File -FilePath "quality-audit-chat.txt" -Encoding UTF8
    if (!$Quiet) {
        Write-Host "`nChat output saved to quality-audit-chat.txt" -ForegroundColor Cyan
    }
}

# Return results for other scripts
return $results
