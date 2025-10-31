# Script para categorizar erros TypeScript
# Executa tsc e organiza erros por categoria e severidade

Write-Host "=== DIAGNÓSTICO TS ERRORS - FASE 1 ===" -ForegroundColor Cyan

# Executar TSC e capturar erros
$tscOutput = & tsc --noEmit 2>&1
$errors = $tscOutput | Where-Object { $_ -match "error TS\d+:" }

Write-Host "Total de erros encontrados: $($errors.Count)" -ForegroundColor Yellow

# Categorizar por tipo de erro TS
$errorCategories = @{}
$errors | ForEach-Object {
    if ($_ -match "error TS(\d+):") {
        $errorCode = "TS$($matches[1])"
        if (-not $errorCategories.ContainsKey($errorCode)) {
            $errorCategories[$errorCode] = @()
        }
        $errorCategories[$errorCode] += $_
    }
}

Write-Host "`n=== DISTRIBUIÇÃO POR CATEGORIA ===" -ForegroundColor Green
$errorCategories.GetEnumerator() | Sort-Object { $_.Value.Count } -Descending | ForEach-Object {
    Write-Host "$($_.Key): $($_.Value.Count) erros" -ForegroundColor White
}

# Categorizar por arquivo
$fileErrors = @{}
$errors | ForEach-Object {
    # Extrair nome do arquivo (antes dos parênteses)
    $line = $_ -as [string]
    if ($line -match "^(.+?)\(\d+,\d+\): error") {
        $file = $matches[1]
        if (-not $fileErrors.ContainsKey($file)) {
            $fileErrors[$file] = @()
        }
        $fileErrors[$file] += $_
    }
}

Write-Host "`n=== ARQUIVOS MAIS PROBLEMÁTICOS ===" -ForegroundColor Green
$fileErrors.GetEnumerator() | Sort-Object { $_.Value.Count } -Descending | Select-Object -First 10 | ForEach-Object {
    Write-Host "$($_.Key): $($_.Value.Count) erros" -ForegroundColor White
}

# Salvar resultados estruturados
$result = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    totalErrors = $errors.Count
    categories = $errorCategories
    files = $fileErrors
}

$result | ConvertTo-Json -Depth 10 | Out-File -FilePath "ts-errors-categorized.json" -Encoding UTF8

Write-Host "`n=== RESULTADOS SALVOS ===" -ForegroundColor Green
Write-Host "Arquivo: ts-errors-categorized.json" -ForegroundColor White
Write-Host "Total de erros: $($errors.Count)" -ForegroundColor White

# Criar matriz de severidade
$severityMatrix = @"
# MATRIZ DE SEVERIDADE - ERROS TS

## Categorização por Impacto

### CRÍTICO (Quebra build/runtime)
TS2305/TS2694: Imports/exports quebrados
TS2322: Type assignments incompatíveis em interfaces core
TS1005/TS1110: Sintaxe JSX/TS inválida

### ALTO (Impacta contratos entre módulos)
TS2339: Property access em unknown (runtime impact)
TS2307: Cannot find module (dependency issues)
TS2322: Type assignments em APIs públicas

### MÉDIO (Inconsistências internas)
TS2339: Property access em objetos tipados
TS2322: Type assignments locais
TS2683: 'this' implicitly has type 'any'

### BAIXO (Convenções e narrowing)
TS7006: Parameter implicitly has 'any' type
TS6133: Variable is declared but never used
TS2322: Type narrowing desnecessário

## Estatísticas Atuais
Total de erros: $($errors.Count)
Arquivos afetados: $($fileErrors.Count)
Categorias distintas: $($errorCategories.Count)

## Priorização para Correção
1. SPRINT 1: CRÍTICO + ALTO (>70% dos erros)
2. SPRINT 2: MÉDIO (contratos internos)
3. SPRINT 3: BAIXO (convenções)
"@

$severityMatrix | Out-File -FilePath "error-severity-matrix.md" -Encoding UTF8

Write-Host "Matriz de severidade: error-severity-matrix.md" -ForegroundColor White
