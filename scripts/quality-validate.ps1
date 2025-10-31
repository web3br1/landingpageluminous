# quality-validate.ps1 - Validação Final de Qualidade
# Executa todos os checks finais quando codebase estiver limpa

Write-Host "=== QUALITY VALIDATION ===" -ForegroundColor Green
Write-Host "Running final validation checks..." -ForegroundColor Yellow

$allPassed = $true
$checks = @()

# TypeScript
Write-Host "`n1. TypeScript..." -NoNewline
try {
    $tsResult = & pnpm typecheck 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ OK" -ForegroundColor Green
        $checks += @{Name = "TypeScript"; Status = "PASS"; Output = ""}
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        $checks += @{Name = "TypeScript"; Status = "FAIL"; Output = $tsResult}
        $allPassed = $false
    }
} catch {
    Write-Host " ❌ ERROR" -ForegroundColor Red
    $checks += @{Name = "TypeScript"; Status = "ERROR"; Output = $_.Exception.Message}
    $allPassed = $false
}

# ESLint
Write-Host "2. ESLint..." -NoNewline
try {
    $lintResult = & pnpm lint 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ OK" -ForegroundColor Green
        $checks += @{Name = "ESLint"; Status = "PASS"; Output = ""}
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        $checks += @{Name = "ESLint"; Status = "FAIL"; Output = $lintResult}
        $allPassed = $false
    }
} catch {
    Write-Host " ❌ ERROR" -ForegroundColor Red
    $checks += @{Name = "ESLint"; Status = "ERROR"; Output = $_.Exception.Message}
    $allPassed = $false
}

# Architecture
Write-Host "3. Architecture..." -NoNewline
try {
    $depResult = & pnpm depcruise 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ OK" -ForegroundColor Green
        $checks += @{Name = "Architecture"; Status = "PASS"; Output = ""}
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        $checks += @{Name = "Architecture"; Status = "FAIL"; Output = $depResult}
        $allPassed = $false
    }
} catch {
    Write-Host " ❌ ERROR" -ForegroundColor Red
    $checks += @{Name = "Architecture"; Status = "ERROR"; Output = $_.Exception.Message}
    $allPassed = $false
}

# Dead Code
Write-Host "4. Dead Code..." -NoNewline
try {
    $knipResult = & pnpm knip 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ OK" -ForegroundColor Green
        $checks += @{Name = "Dead Code"; Status = "PASS"; Output = ""}
    } else {
        Write-Host " ⚠️  WARNING (non-blocking)" -ForegroundColor Yellow
        $checks += @{Name = "Dead Code"; Status = "WARN"; Output = $knipResult}
        # Dead code is not a blocking error
    }
} catch {
    Write-Host " ⚠️  ERROR (non-blocking)" -ForegroundColor Yellow
    $checks += @{Name = "Dead Code"; Status = "WARN"; Output = $_.Exception.Message}
}

# Unit Tests
Write-Host "5. Unit Tests..." -NoNewline
try {
    $testResult = & pnpm test:vitest:unit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ OK" -ForegroundColor Green
        $checks += @{Name = "Unit Tests"; Status = "PASS"; Output = ""}
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        $checks += @{Name = "Unit Tests"; Status = "FAIL"; Output = $testResult}
        $allPassed = $false
    }
} catch {
    Write-Host " ❌ ERROR" -ForegroundColor Red
    $checks += @{Name = "Unit Tests"; Status = "ERROR"; Output = $_.Exception.Message}
    $allPassed = $false
}

# Build
Write-Host "6. Build..." -NoNewline
try {
    $buildResult = & pnpm build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ OK" -ForegroundColor Green
        $checks += @{Name = "Build"; Status = "PASS"; Output = ""}
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        $checks += @{Name = "Build"; Status = "FAIL"; Output = $buildResult}
        $allPassed = $false
    }
} catch {
    Write-Host " ❌ ERROR" -ForegroundColor Red
    $checks += @{Name = "Build"; Status = "ERROR"; Output = $_.Exception.Message}
    $allPassed = $false
}

# Final result
Write-Host "`n" + "".PadRight(50, "=") -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "🎉 CODEBASE LIMPO - QUALIDADE VERIFICADA" -ForegroundColor Green
    Write-Host "All quality gates are passing!" -ForegroundColor Green

    # Generate success certificate
    $certificate = @"
# Quality Validation Certificate
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

✅ ALL QUALITY GATES PASSING

## Validation Results
$(foreach ($check in $checks) {
    $icon = switch ($check.Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "ERROR" { "❌" }
        "WARN" { "⚠️" }
    }
    "- $icon $($check.Name): $($check.Status)"
} -join "`n")

## Next Steps
- Code is ready for commit/merge
- Consider running integration tests
- Update baseline with: .\scripts\quality-dashboard.ps1 -Baseline

---
Validated by quality-validate.ps1
"@

    $certificate | Out-File -FilePath "quality-validation-certificate.md" -Encoding UTF8
    Write-Host "`nValidation certificate saved to quality-validation-certificate.md" -ForegroundColor Cyan

} else {
    Write-Host "❌ QUALITY ISSUES REMAIN" -ForegroundColor Red
    Write-Host "Some quality gates are failing. Continue systematic fixes." -ForegroundColor Red

    # Show failed checks
    Write-Host "`nFailed Checks:" -ForegroundColor Red
    foreach ($check in $checks | Where-Object { $_.Status -in @("FAIL", "ERROR") }) {
        Write-Host "- $($check.Name): $($check.Status)" -ForegroundColor Red
        if ($check.Output) {
            Write-Host "  Output: $($check.Output | Select-Object -First 3)" -ForegroundColor Gray
        }
    }

    Write-Host "`n💡 Run '.\scripts\quality-audit.ps1' for detailed error analysis" -ForegroundColor Yellow
}

# Save detailed results
$validationResults = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    allPassed = $allPassed
    checks = $checks
}

$validationResults | ConvertTo-Json -Depth 10 | Out-File -FilePath "quality-validation-results.json" -Encoding UTF8

return @{
    allPassed = $allPassed
    checks = $checks
}
