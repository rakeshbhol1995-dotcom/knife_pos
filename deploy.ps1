# =========================================================================
# KNIFE POS AUTOMATED AWS DEPLOYMENT SCRIPT (deploy.ps1)
# =========================================================================
# Deploys to AWS EC2: 43.204.221.67 in Mumbai

$ErrorActionPreference = "Stop"
$IP = "43.204.221.67"
$PEM_PATH = "C:\Users\BUNTY\Desktop\petpooja\devops\terraform\petpooja-key.pem"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Initializing KNIFE POS Cloud Deployment..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Verification checks
if (-not (Test-Path $PEM_PATH)) {
    Write-Host "Error: SSH private key not found at $PEM_PATH" -ForegroundColor Red
    Exit
}

# 2. Build local frontend React assets
Write-Host "Compiling frontend React assets..." -ForegroundColor Yellow
npm run build

# 3. Create deploy directory
$TempDir = "deploy_temp"
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Copy required backend files (excluding node_modules)
New-Item -ItemType Directory -Path "$TempDir/backend" -Force | Out-Null
Get-ChildItem -Path "backend" -Force | Where-Object { $_.Name -ne "node_modules" } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination "$TempDir/backend/" -Recurse -Force
}

# Copy frontend build output (dist)
New-Item -ItemType Directory -Path "$TempDir/dist" -Force | Out-Null
Copy-Item -Path "dist/*" -Destination "$TempDir/dist" -Recurse -Force

# Create environment variable configuration on remote
$RemoteEnv = "MONGODB_URI=mongodb://127.0.0.1:27017/petpooja`nPORT=5000`n"
$RemoteEnv | Out-File -FilePath "$TempDir/backend/.env" -Encoding utf8 -Force

# Create ZIP archive
$ZipPath = "petpooja-deploy.zip"
if (Test-Path $ZipPath) { Remove-Item -Force $ZipPath }
Compress-Archive -Path "$TempDir/*" -DestinationPath $ZipPath

# Clean up temp dir
if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }

# 4. Upload ZIP and remote script
Write-Host "Uploading deployment archive to AWS EC2..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=no -i $PEM_PATH $ZipPath deploy.sh "ubuntu@$IP`:/home/ubuntu/"

# Cleanup local ZIP
Remove-Item -Force $ZipPath

# 5. Remote execution
Write-Host "Executing remote deployment..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no -i $PEM_PATH "ubuntu@$IP" "chmod +x /home/ubuntu/deploy.sh && /home/ubuntu/deploy.sh"

Write-Host "==================================================" -ForegroundColor Green
Write-Host "SUCCESS! KNIFE POS is now Live on AWS EC2!" -ForegroundColor Green
Write-Host "Web Access Address: http://$IP" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
