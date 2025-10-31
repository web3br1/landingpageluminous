# quality-dashboard.ps1 - Dashboard de Progresso de Qualidade
# Mostra melhoria de qualidade ao longo do tempo

param(
    [switch]$Baseline,
    [string]$BaselineFile = "baseline-results.json"
)

Write-Host "=== QUALITY DASHBOARD ===" -ForegroundColor Green

# Criar diretório de logs se não existir
$logDir = "quality-logs"
if (!(Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

# Run current audit
Write-Host "Running current quality audit..." -ForegroundColor Yellow
$currentResults = & "$PSScriptRoot/quality-audit.ps1" -Quiet -NoChatOutput

# Load baseline or create new one
if ($Baseline -or !(Test-Path $BaselineFile)) {
    Write-Host "Creating new baseline..." -ForegroundColor Cyan
    $currentResults | ConvertTo-Json | Out-File -FilePath $BaselineFile -Encoding UTF8
    Write-Host "Baseline saved to $BaselineFile" -ForegroundColor Green
    exit 0
}

$baselineResults = Get-Content $BaselineFile | ConvertFrom-Json

# Calculate improvements
$improvement = @{
    typecheck = $baselineResults.typecheck - $currentResults.typecheck
    lint = $baselineResults.lint - $currentResults.lint
    architecture = $baselineResults.architecture - $currentResults.architecture
    unused = $baselineResults.unused - $currentResults.unused
    tests = $baselineResults.tests - $currentResults.tests
    total = $baselineResults.total - $currentResults.total
}

# Display dashboard
Write-Host "`n=== QUALITY IMPROVEMENT DASHBOARD ===" -ForegroundColor Yellow
Write-Host "Baseline: $($baselineResults.timestamp)" -ForegroundColor Gray
Write-Host "Current:  $($currentResults.timestamp)" -ForegroundColor Gray
Write-Host "".PadRight(50, "-") -ForegroundColor Gray

$categories = @(
    @{Name = "TypeScript"; Baseline = $baselineResults.typecheck; Current = $currentResults.typecheck; Improvement = $improvement.typecheck},
    @{Name = "Lint"; Baseline = $baselineResults.lint; Current = $currentResults.lint; Improvement = $improvement.lint},
    @{Name = "Architecture"; Baseline = $baselineResults.architecture; Current = $currentResults.architecture; Improvement = $improvement.architecture},
    @{Name = "Unused Code"; Baseline = $baselineResults.unused; Current = $currentResults.unused; Improvement = $improvement.unused},
    @{Name = "Tests"; Baseline = $baselineResults.tests; Current = $currentResults.tests; Improvement = $improvement.tests}
)

$totalBaseline = $categories | ForEach-Object { $_.Baseline } | Measure-Object -Sum | Select-Object -ExpandProperty Sum
$totalCurrent = $categories | ForEach-Object { $_.Current } | Measure-Object -Sum | Select-Object -ExpandProperty Sum
$totalImprovement = $categories | ForEach-Object { $_.Improvement } | Measure-Object -Sum | Select-Object -ExpandProperty Sum

foreach ($category in $categories) {
    $improvement = $category.Improvement
    $color = if ($improvement -gt 0) { "Green" }
            elseif ($improvement -eq 0) { "Yellow" }
            else { "Red" }

    $trend = if ($improvement -gt 0) { "DOWN" }
            elseif ($improvement -eq 0) { "SAME" }
            else { "UP" }

    Write-Host ("{0,-15} {1,3} -> {2,3} ({3}{4,3})" -f $category.Name, $category.Baseline, $category.Current, $trend, [Math]::Abs($improvement)) -ForegroundColor $color
}

Write-Host "".PadRight(50, "-") -ForegroundColor Gray
Write-Host ("{0,-15} {1,3} -> {2,3} ({3}{4,3})" -f "TOTAL", $totalBaseline, $totalCurrent, $(if ($totalImprovement -gt 0) { "DOWN" } elseif ($totalImprovement -eq 0) { "SAME" } else { "UP" }), [Math]::Abs($totalImprovement)) -ForegroundColor $(if ($totalImprovement -gt 0) { "Green" } elseif ($totalImprovement -eq 0) { "Yellow" } else { "Red" })

# Calculate success rate
$successRate = if ($totalBaseline -gt 0) { [Math]::Round(($totalImprovement / $totalBaseline) * 100, 1) } else { 0 }
Write-Host "`nSuccess Rate: $successRate% of errors fixed" -ForegroundColor $(if ($successRate -gt 50) { "Green" } elseif ($successRate -gt 0) { "Yellow" } else { "Red" })

# Generate progress report
$progressReport = @"
# Quality Progress Report - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## Summary
- **Baseline**: $($baselineResults.timestamp)
- **Current**: $($currentResults.timestamp)
- **Total Errors Fixed**: $totalImprovement
- **Success Rate**: $successRate%

## Category Breakdown
$(foreach ($category in $categories) {
    $improvement = $category.Improvement
    $trend = if ($improvement -gt 0) { "IMPROVED" } elseif ($improvement -eq 0) { "STABLE" } else { "REGRESSED" }
    "- **$($category.Name)**: $($category.Baseline) → $($category.Current) ($trend by $([Math]::Abs($improvement)))"
} -join "`n")

## Next Steps
- $(if ($currentResults.architecture -gt 0) { "CRITICAL: Fix architecture issues first (priority 1)" } else { "OK: Architecture clean" })
- $(if ($currentResults.typecheck -gt 0) { "TODO: Address TypeScript errors" } else { "OK: TypeScript clean" })
- $(if ($currentResults.lint -gt 0) { "TODO: Fix linting issues" } else { "OK: Linting clean" })
- $(if ($currentResults.tests -gt 0) { "TODO: Fix test failures" } else { "OK: Tests passing" })

---
Generated by quality-dashboard.ps1
"@

$progressReport | Out-File -FilePath "quality-progress-report.md" -Encoding UTF8
Write-Host "`nProgress report saved to quality-progress-report.md" -ForegroundColor Cyan

# Check if all green
$allGreen = ($currentResults.typecheck -eq 0) -and ($currentResults.lint -eq 0) -and ($currentResults.architecture -eq 0) -and ($currentResults.tests -eq 0)

if ($allGreen) {
    Write-Host "`nSUCCESS: ALL QUALITY GATES PASSING! Codebase is clean." -ForegroundColor Green
} else {
    Write-Host "`nWARNING: Quality issues remain. Continue systematic fixes." -ForegroundColor Yellow
}

return @{
    baseline = $baselineResults
    current = $currentResults
    improvement = $improvement
    successRate = $successRate
}
