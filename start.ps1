# ─────────────────────────────────────────────
# MIRAGE – One-click launcher
# Run:  .\start.ps1
# ─────────────────────────────────────────────

$projectRoot = $PSScriptRoot          # folder where this script lives
$backendDir  = Join-Path $projectRoot "backend"

# ── 1. Activate Python venv & start FastAPI backend ──
$venvActivate = Join-Path $backendDir ".venv\Scripts\Activate.ps1"

if (-not (Test-Path $venvActivate)) {
    Write-Host "❌  Python venv not found at $venvActivate" -ForegroundColor Red
    Write-Host "   Create it first:  cd backend && python -m venv .venv && .\.venv\Scripts\Activate.ps1 && pip install -r requirements.txt"
    exit 1
}

Write-Host "🚀  Starting FastAPI backend..." -ForegroundColor Cyan
$backendJob = Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "& '$venvActivate'; Set-Location '$projectRoot'; uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"
) -PassThru

# ── 2. Start Next.js frontend ──
Write-Host "🚀  Starting Next.js frontend..." -ForegroundColor Cyan
$frontendJob = Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$projectRoot'; npm run dev"
) -PassThru

# ── 3. Wait a moment, then open the browser ──
Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✅  MIRAGE is running!" -ForegroundColor Green
Write-Host "   Frontend → http://localhost:3000"
Write-Host "   Backend  → http://localhost:8000"
Write-Host ""
Write-Host "Close the two spawned terminal windows to stop the servers." -ForegroundColor Yellow
