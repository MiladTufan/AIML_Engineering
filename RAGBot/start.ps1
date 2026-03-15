# --- Backend environment setup ---
Write-Host "Setting up Backend (Python)..." -ForegroundColor Yellow
Set-Location -Path (Join-Path $PSScriptRoot "backend\buildEnv")
if (Test-Path ".\createEnv.ps1") {
    . .\createEnv.ps1
}

# --- Start Backend in NEW Window ---
Write-Host "Starting FastAPI backend in a new window..." -ForegroundColor Green
Set-Location -Path (Join-Path $PSScriptRoot "backend")
Start-Process powershell -ArgumentList "uvicorn main:app --reload"

# --- Wait for Backend to be reachable ---
Write-Host "Waiting for backend to wake up..." -ForegroundColor Gray
$backendUrl = "http://127.0.0.1:8000"
$retryCount = 0
while ($retryCount -lt 20) {
    try {
        $response = Invoke-WebRequest -Uri $backendUrl -Method Get -ErrorAction SilentlyContinue
        if ($null -ne $response) { 
            break 
        }
    } catch {
        Start-Sleep -Seconds 1
        $retryCount++
    }
}

# --- Start Frontend in CURRENT Window ---
Write-Host "✅ Backend is up! Starting Angular dev server..." -ForegroundColor Cyan
Set-Location -Path (Join-Path $PSScriptRoot "frontend")

ng serve --open