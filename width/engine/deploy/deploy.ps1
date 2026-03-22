<#
.SYNOPSIS
    Schwarz Diamond -- Deploy Pipeline (Point Collapse)
    Deploys a single Point artifact to VPS via SSH.

.DESCRIPTION
    1. Builds the Point artifact (all dimensions collapsed to one file)
    2. Verifies connectivity to deploy target
    3. Opens SSH and deploys the Point -- ONLY the artifact, never source
    4. Sets up systemd service for auto-start
    5. Verifies deployment on remote

.NOTES
    Deploy target:  Dynu VPS  100.70.142.122
    Copyright (c) 2024-2026 Kenneth Bingham. CC BY 4.0
#>

param(
    [string]$Target      = "100.70.142.122",
    [string]$TargetName  = "dynu-vps",
    [string]$User        = "butterfly",
    [string]$RemoteDir   = "/opt/schwarz-diamond",
    [int]$SSHPort        = 22,
    [int]$ServePort      = 3000,
    [switch]$DryRun,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$EngineRoot = Split-Path -Parent $ScriptDir
$Artifacts  = Join-Path $ScriptDir "artifacts"
$PointFile  = Join-Path $Artifacts "schwarz-diamond.point.js"
$Manifest   = Join-Path $Artifacts "manifest.json"

Write-Host ""
Write-Host "  SCHWARZ DIAMOND -- Deploy Pipeline"
Write-Host "  Target: $TargetName ($Target)"
Write-Host "  Mode: Point Collapse (single artifact)"
Write-Host "  Rule: Artifacts ONLY -- no source code ships"
Write-Host ""

# -- Step 1: Build the Point ----------------------------------------
if (-not $SkipBuild) {
    Write-Host "[1/4] Building Point artifact..." -ForegroundColor Yellow
    $buildResult = & node "$ScriptDir\build.js" 2>&1
    $buildResult | ForEach-Object { Write-Host "  $_" }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  FAIL: Build failed. Aborting deploy." -ForegroundColor Red
        exit 1
    }
    Write-Host ""
} else {
    Write-Host "[1/4] Skipping build (SkipBuild flag set)" -ForegroundColor DarkGray
    if (-not (Test-Path $PointFile)) {
        Write-Host "  FAIL: No Point artifact found. Run build first." -ForegroundColor Red
        exit 1
    }
}

# -- Step 2: Verify Connectivity ------------------------------------
Write-Host "[2/5] Checking connectivity to $TargetName ($Target)..." -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName $Target -Count 2 -Quiet
    if (-not $ping) { throw "unreachable" }
    Write-Host "  OK: $TargetName ($Target) reachable" -ForegroundColor Green
} catch {
    Write-Host "  FAIL: Cannot reach $Target. Check network." -ForegroundColor Red
    exit 1
}
Write-Host ""

# -- Step 3: Deploy the Point via SCP ------------------------------
Write-Host "[3/5] Deploying Point to $TargetName..." -ForegroundColor Yellow

$pointSize = (Get-Item $PointFile).Length
Write-Host "  Point artifact: $pointSize bytes" -ForegroundColor DarkGray

if ($DryRun) {
    Write-Host "  DRY RUN -- would deploy:" -ForegroundColor Magenta
    Write-Host "    schwarz-diamond.point.js -> $RemoteDir/" -ForegroundColor DarkGray
    Write-Host "    manifest.json -> $RemoteDir/" -ForegroundColor DarkGray
} else {
    Write-Host "  Creating remote directory..." -ForegroundColor DarkGray
    & ssh -o StrictHostKeyChecking=no -p $SSHPort "${User}@${Target}" "mkdir -p $RemoteDir"

    Write-Host "  Uploading Point artifact..." -ForegroundColor DarkGray
    & scp -o StrictHostKeyChecking=no -P $SSHPort $PointFile "${User}@${Target}:${RemoteDir}/schwarz-diamond.point.js"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: schwarz-diamond.point.js" -ForegroundColor Green
    } else {
        Write-Host "  FAIL: Point artifact upload failed" -ForegroundColor Red
        exit 1
    }

    & scp -o StrictHostKeyChecking=no -P $SSHPort $Manifest "${User}@${Target}:${RemoteDir}/manifest.json"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: manifest.json" -ForegroundColor Green
    } else {
        Write-Host "  WARN: Manifest upload failed (non-fatal)" -ForegroundColor Yellow
    }
}
Write-Host ""

# -- Step 4: Setup systemd service ---------------------------------
Write-Host "[4/5] Setting up systemd service on $TargetName..." -ForegroundColor Yellow

$serviceUnit = @"
[Unit]
Description=Schwarz Diamond Point (manifold server)
After=network.target

[Service]
Type=simple
User=$User
WorkingDirectory=$RemoteDir
Environment=PORT=$ServePort
ExecStart=/usr/bin/node $RemoteDir/schwarz-diamond.point.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"@

if ($DryRun) {
    Write-Host "  DRY RUN -- would create schwarz-diamond.service" -ForegroundColor Magenta
} else {
    # Write service file to remote
    $escapedUnit = $serviceUnit -replace '"', '\"'
    & ssh -o StrictHostKeyChecking=no -p $SSHPort "${User}@${Target}" "cat > /tmp/schwarz-diamond.service << 'SVCEOF'
$serviceUnit
SVCEOF
sudo mv /tmp/schwarz-diamond.service /etc/systemd/system/schwarz-diamond.service
sudo systemctl daemon-reload
sudo systemctl enable schwarz-diamond
sudo systemctl restart schwarz-diamond"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: schwarz-diamond.service enabled and started" -ForegroundColor Green
    } else {
        Write-Host "  WARN: systemd setup failed -- start manually with: node $RemoteDir/schwarz-diamond.point.js" -ForegroundColor Yellow
    }
}
Write-Host ""

# -- Step 5: Verify Deployment -------------------------------------
Write-Host "[5/5] Verifying deployment on $TargetName..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "  DRY RUN -- skipping verification" -ForegroundColor Magenta
} else {
    $remoteSize = & ssh -o StrictHostKeyChecking=no -p $SSHPort "${User}@${Target}" "wc -c < $RemoteDir/schwarz-diamond.point.js 2>/dev/null"
    if ($remoteSize) {
        $remoteTrimmed = $remoteSize.Trim()
        Write-Host "  Remote Point size: $remoteTrimmed bytes" -ForegroundColor DarkGray
        if ($remoteTrimmed -eq "$pointSize") {
            Write-Host "  OK: Size matches. Point intact." -ForegroundColor Green
        } else {
            Write-Host "  WARN: Size mismatch (local=$pointSize remote=$remoteTrimmed)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  WARN: Could not verify remote file" -ForegroundColor Yellow
    }

    # Check if the service is running
    Start-Sleep -Seconds 2
    $svcStatus = & ssh -o StrictHostKeyChecking=no -p $SSHPort "${User}@${Target}" "systemctl is-active schwarz-diamond 2>/dev/null"
    if ($svcStatus -and $svcStatus.Trim() -eq "active") {
        Write-Host "  OK: Service is running on port $ServePort" -ForegroundColor Green
        Write-Host "  Endpoint: http://${Target}:${ServePort}/" -ForegroundColor Cyan
    } else {
        Write-Host "  WARN: Service not active yet. Check: ssh ${User}@${Target} journalctl -u schwarz-diamond -f" -ForegroundColor Yellow
    }
}

Write-Host ""
if ($DryRun) {
    Write-Host "  DRY RUN COMPLETE -- no files were deployed" -ForegroundColor Magenta
} else {
    Write-Host "  DEPLOY COMPLETE -- $TargetName ($Target)" -ForegroundColor Green
    Write-Host "  Endpoint: http://${Target}:${ServePort}/" -ForegroundColor Cyan
}
Write-Host "  One Point. All dimensions. No source code shipped."
Write-Host ""

