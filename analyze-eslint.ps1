# PowerShell script to analyze ESLint errors
param(
    [string]$InputFile = "eslint-output.txt"
)

Write-Host "Analyzing ESLint errors from $InputFile..."
Write-Host ""

# Read the file and extract error lines
$lines = Get-Content $InputFile
$errorLines = $lines | Where-Object { $_ -like "*error*" }

Write-Host "Found $($errorLines.Count) error lines"
Write-Host ""

# Extract and count rules
$rules = @{}
$files = @{}
$unusedCount = 0
$typeErrors = 0
$complexityErrors = 0

foreach ($line in $errorLines) {
    # Parse the line: file:line:col: error message rule
    $parts = $line -split ':'
    if ($parts.Length -ge 4) {
        $file = $parts[0]
        $rule = $parts[-1].Trim()  # Last part is usually the rule
        $message = $parts[3..($parts.Length-2)] -join ':'  # Everything in between

        # Count by rule
        if ($rules.ContainsKey($rule)) {
            $rules[$rule]++
        } else {
            $rules[$rule] = 1
        }

        # Count by file
        if ($files.ContainsKey($file)) {
            $files[$file]++
        } else {
            $files[$file] = 1
        }

        # Categorize
        if ($message -like "*is defined but never used*" -or $rule -like "*no-unused-vars*") {
            $unusedCount++
        }
        elseif ($rule -like "*explicit-function-return-type*" -or $rule -like "*no-explicit-any*") {
            $typeErrors++
        }
        elseif ($rule -like "*complexity*") {
            $complexityErrors++
        }
    }
}

Write-Host "ERROR CATEGORIES:"
Write-Host "   Unused Variables/Imports: $unusedCount"
Write-Host "   Type Issues: $typeErrors"
Write-Host "   Complexity: $complexityErrors"
Write-Host ""

Write-Host "TOP 10 RULES:"
$rules.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10 | ForEach-Object {
    $percentage = [math]::Round(($_.Value / $errorLines.Count) * 100, 1)
    Write-Host "   $($_.Key): $($_.Value) ($percentage%)"
}
Write-Host ""

Write-Host "TOP 10 FILES:"
$files.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10 | ForEach-Object {
    Write-Host "   $($_.Key): $($_.Value)"
}
Write-Host ""

Write-Host "HYPOTHESES:"
Write-Host "   1. Massive unused imports from Lucide React icons"
Write-Host "   2. TypeScript strict rules without gradual adoption"
Write-Host "   3. Code complexity from rapid development"
Write-Host "   4. Inconsistent import ordering"
Write-Host ""

Write-Host "ACTION PLAN:"
Write-Host "   Phase 1: Run 'npm run lint:fix' (auto-fixable)"
Write-Host "   Phase 2: Create script to remove unused icons"
Write-Host "   Phase 3: Relax overly strict TypeScript rules"
Write-Host "   Phase 4: Address complexity violations"
Write-Host ""

# Save summary to file
$summary = @{
    TotalErrors = $errorLines.Count
    Categories = @{
        UnusedVars = $unusedCount
        TypeErrors = $typeErrors
        Complexity = $complexityErrors
    }
    TopRules = $rules.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5 | ForEach-Object { @{Rule=$_.Key; Count=$_.Value} }
    TopFiles = $files.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5 | ForEach-Object { @{File=$_.Key; Count=$_.Value} }
}

$summary | ConvertTo-Json -Depth 3 | Out-File -FilePath "eslint-summary.json" -Encoding UTF8
Write-Host "Summary saved to eslint-summary.json"
