
# Fail on first error
$ErrorActionPreference = "Stop"

# Check if requirements.txt exists
if (-Not (Test-Path "requirements.txt")) {
    Write-Error "requirements.txt not found in current directory."
    exit 1
}

# Create virtual environment
python -m venv venv

# Activate virtual environment
. .\venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

Write-Host "✅ Virtual environment created and requirements installed successfully!"
