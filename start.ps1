# run_project.ps1
$ErrorActionPreference = "Stop"

# --- Frontend ---
Write-Host "Starting Angular frontend..."
Set-Location -Path  (Join-Path $PSScriptRoot "frontend")
Start-Process powershell -ArgumentList "ng serve"

# --- Backend environment setup ---
Write-Host "Setting up backend environment..."
Set-Location -Path (Join-Path $PSScriptRoot "backend\buildEnv")
. .\createEnv.ps1   # dot-source so it runs in this shell

# --- Backend server ---
Write-Host "Starting FastAPI backend..."
Set-Location -Path (Join-Path $PSScriptRoot "backend")
uvicorn main:app --reload