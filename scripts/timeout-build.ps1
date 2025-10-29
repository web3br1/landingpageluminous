# PowerShell script with timeout for npm build command
# Usage: .\timeout-build.ps1 [timeout_seconds] [command]
# Example: .\timeout-build.ps1 600 "npm run build"
# Example: .\timeout-build.ps1 300 "npm run lint"

param(
    [int]$TimeoutSeconds = 300,  # Default 5 minutes
    [string]$Command = "npm run build"
)

$ErrorActionPreference = "Stop"

Write-Host "Starting command: '$Command' with ${TimeoutSeconds} second timeout..." -ForegroundColor Yellow
Write-Host "Working directory: $(Get-Location)" -ForegroundColor Gray

try {
    # Create a job to run the command
    $job = Start-Job -ScriptBlock {
        param($cmd, $workingDir)

        try {
            Set-Location $workingDir
            Write-Host "Executing: $cmd" -ForegroundColor Cyan

            # Execute the command and capture output
            $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c $cmd" -NoNewWindow -PassThru -RedirectStandardOutput "output.txt" -RedirectStandardError "error.txt"

            # Wait for the process with a reasonable timeout
            $process.WaitForExit(300000) # 5 minutes max per command

            $exitCode = $process.ExitCode
            $output = Get-Content "output.txt" -ErrorAction SilentlyContinue
            $errorOutput = Get-Content "error.txt" -ErrorAction SilentlyContinue

            # Clean up temp files
            Remove-Item "output.txt" -ErrorAction SilentlyContinue
            Remove-Item "error.txt" -ErrorAction SilentlyContinue

            return @{
                ExitCode = $exitCode
                Output = $output
                ErrorOutput = $errorOutput
                Success = $exitCode -eq 0
            }
        } catch {
            return @{
                ExitCode = -1
                Output = ""
                ErrorOutput = $_.Exception.Message
                Success = $false
            }
        }
    } -ArgumentList $Command, $PWD

    # Wait for the job to complete or timeout
    $completed = Wait-Job -Job $job -Timeout $TimeoutSeconds

    if ($completed) {
        # Job completed within timeout
        $result = Receive-Job -Job $job

        if ($result.Success) {
            Write-Host "Command completed successfully!" -ForegroundColor Green
            if ($result.Output) {
                Write-Host "Output:" -ForegroundColor Gray
                $result.Output | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
            }
            exit 0
        } else {
            Write-Host "Command failed with exit code: $($result.ExitCode)" -ForegroundColor Red
            if ($result.ErrorOutput) {
                Write-Host "Error output:" -ForegroundColor Red
                $result.ErrorOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
            }
            exit $result.ExitCode
        }
    } else {
        # Job timed out
        Write-Host "Command timed out after ${TimeoutSeconds} seconds!" -ForegroundColor Red
        Stop-Job -Job $job -ErrorAction SilentlyContinue
        Remove-Job -Job $job -ErrorAction SilentlyContinue

        # Kill any remaining processes
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -gt (Get-Date).AddMinutes(-5) } | Stop-Process -Force -ErrorAction SilentlyContinue
        Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

        exit 1
    }
} catch {
    Write-Host "Error during command execution: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Clean up any remaining jobs
    Get-Job | Remove-Job -ErrorAction SilentlyContinue
}
