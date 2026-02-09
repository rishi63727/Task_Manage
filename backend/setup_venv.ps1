# Backend venv setup — use Python 3.11 (recommended).
# Run from repo root: .\backend\setup_venv.ps1
# Or from backend: .\setup_venv.ps1

$backendDir = if ($PSScriptRoot) { $PSScriptRoot } else { "C:\Autonomize.ai\backend" }
Set-Location $backendDir

Write-Host "Step 1: Removing old venv (if any)..."
if (Test-Path venv) {
    Remove-Item -Recurse -Force venv
    Write-Host "  Done."
} else {
    Write-Host "  No venv folder found."
}

Write-Host "Step 2: Creating venv with Python 3.11..."
py -3.11 -m venv venv
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Failed. Run 'py -0' to see installed Python versions."
    exit 1
}
Write-Host "  Done."

Write-Host ""
Write-Host "Step 3: Activate and install (run these in your terminal):"
Write-Host "  venv\Scripts\activate"
Write-Host "  pip install --upgrade pip"
Write-Host "  pip install -r requirements.txt"
Write-Host ""
Write-Host "Step 4: Run backend:"
Write-Host "  python -m uvicorn app.main:app --reload"
