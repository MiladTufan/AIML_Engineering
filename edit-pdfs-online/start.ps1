# run_project.ps1
$ErrorActionPreference = "Stop"

function Check-Command($cmd, $name) {
    if (!(Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "❌ $name is not installed or not in PATH. Please install it to continue."
        exit
    }
}




Write-Host "Initializing PDF Editor Environment..." -ForegroundColor Cyan

# --- Pre-flight Checks ---
Check-Command "node" "Node.js"
Check-Command "python" "Python"
Check-Command "npm" "NPM"

# --- Frontend ---
Write-Host "Setting up Frontend (Angular)..." -ForegroundColor Yellow
Set-Location -Path (Join-Path $PSScriptRoot "frontend")

# Run npm install and wait for it to finish before serving
Write-Host "  --- Installing dependencies..."
Start-Process powershell -ArgumentList "npm install" -Wait 
Write-Host "  --- Starting Angular dev server in a new window..."
Start-Process powershell -ArgumentList "ng serve --open" 

# --- Backend environment setup ---
Write-Host "Setting up Backend (Python)..." -ForegroundColor Yellow
Set-Location -Path (Join-Path $PSScriptRoot "backend\buildEnv")
if (Test-Path ".\createEnv.ps1") {
    . .\createEnv.ps1
} else {
    Write-Warning "createEnv.ps1 not found. Skipping environment creation..."
}

# --- Backend server ---
Write-Host "Starting FastAPI backend at http://127.0.0.1:8000" -ForegroundColor Green
Set-Location -Path (Join-Path $PSScriptRoot "backend")

# Running uvicorn in the current shell so you can see logs/errors directly
uvicorn main:app --reload