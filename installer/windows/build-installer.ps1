<#
.SYNOPSIS
    Build SessionCast Windows Installer Package
.DESCRIPTION
    Downloads all dependencies and creates installer package
.EXAMPLE
    .\build-installer.ps1
#>

param(
    [string]$OutputDir = 'output',
    [switch]$SkipDownload
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# =============================================================================
# Configuration
# =============================================================================

$Config = @{
    Version = '1.0.0'

    # Download URLs
    Downloads = @{
        Itmux = @{
            Url = 'https://github.com/itefixnet/itmux/releases/download/v1.0.5/itmux_1.0.5_x64_free.zip'
            File = 'itmux.zip'
            ExtractTo = 'packages\itmux'
        }
        Java = @{
            Url = 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.9%2B9/OpenJDK17U-jre_x64_windows_hotspot_17.0.9_9.zip'
            File = 'java.zip'
            ExtractTo = 'packages\java'
        }
        Node = @{
            Url = 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-win-x64.zip'
            File = 'node.zip'
            ExtractTo = 'packages\node'
        }
    }

    # Inno Setup path
    InnoSetup = @(
        'C:\Program Files (x86)\Inno Setup 6\ISCC.exe',
        'C:\Program Files\Inno Setup 6\ISCC.exe',
        "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
    )
}

# =============================================================================
# Functions
# =============================================================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n[*] $Message" -ForegroundColor Cyan
}

function Write-SubStep {
    param([string]$Message)
    Write-Host "    - $Message" -ForegroundColor Gray
}

function Write-Success {
    param([string]$Message)
    Write-Host "[+] $Message" -ForegroundColor Green
}

function Write-Error2 {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor Red
}

function Invoke-Download {
    param(
        [string]$Url,
        [string]$OutFile
    )

    Write-SubStep "Downloading: $Url"

    try {
        if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
            & curl.exe -L -o $OutFile $Url --progress-bar
        } else {
            Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
        }

        if (Test-Path $OutFile) {
            $size = [math]::Round((Get-Item $OutFile).Length / 1MB, 2)
            Write-SubStep "Downloaded: $size MB"
            return $true
        }
    } catch {
        Write-Error2 "Download failed: $_"
    }

    return $false
}

function Find-InnoSetup {
    foreach ($path in $Config.InnoSetup) {
        if (Test-Path $path) {
            return $path
        }
    }
    return $null
}

# =============================================================================
# Main Build Process
# =============================================================================

Write-Host @"

  ____                _              ____          _
 / ___|  ___  ___ ___(_) ___  _ __  / ___|__ _ ___| |_
 \___ \ / _ \/ __/ __| |/ _ \| '_ \| |   / _` / __| __|
  ___) |  __/\__ \__ \ | (_) | | | | |__| (_| \__ \ |_
 |____/ \___||___/___/_|\___/|_| |_|\____\__,_|___/\__|

 Windows Installer Builder v$($Config.Version)

"@ -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptDir

try {
    # Create directories
    Write-Step "Creating directory structure..."

    $dirs = @('downloads', 'packages', 'packages\itmux', 'packages\java', 'packages\node', 'scripts', 'config', $OutputDir)
    foreach ($dir in $dirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-SubStep "Created: $dir"
        }
    }

    # Download dependencies
    if (-not $SkipDownload) {
        Write-Step "Downloading dependencies..."

        foreach ($item in $Config.Downloads.GetEnumerator()) {
            $name = $item.Key
            $info = $item.Value

            $downloadPath = Join-Path 'downloads' $info.File

            if (Test-Path $downloadPath) {
                Write-SubStep "$name already downloaded, skipping..."
            } else {
                Write-SubStep "Downloading $name..."
                if (-not (Invoke-Download -Url $info.Url -OutFile $downloadPath)) {
                    throw "Failed to download $name"
                }
            }

            # Extract
            $extractPath = $info.ExtractTo
            if (-not (Test-Path $extractPath) -or (Get-ChildItem $extractPath | Measure-Object).Count -eq 0) {
                Write-SubStep "Extracting $name..."
                Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force

                # Handle nested directories
                $nested = Get-ChildItem -Path $extractPath -Directory | Select-Object -First 1
                if ($nested -and ((Get-ChildItem $extractPath -Directory).Count -eq 1)) {
                    Get-ChildItem -Path $nested.FullName | Move-Item -Destination $extractPath -Force
                    Remove-Item -Path $nested.FullName -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }

    # Create launcher scripts
    Write-Step "Creating launcher scripts..."

    # Java Agent launcher
    $javaLauncher = @'
@echo off
setlocal

set SESSIONCAST_HOME=%~dp0..
set ITMUX_HOME=%SESSIONCAST_HOME%\itmux

if exist "%SESSIONCAST_HOME%\java\bin\java.exe" (
    set JAVA_HOME=%SESSIONCAST_HOME%\java
) else if defined JAVA_HOME (
    rem Use system JAVA_HOME
) else (
    echo Error: Java not found. Please install Java or set JAVA_HOME.
    exit /b 1
)

"%JAVA_HOME%\bin\java.exe" -jar "%SESSIONCAST_HOME%\bin\sessioncast-agent.jar" %*
'@
    Set-Content -Path 'scripts\sessioncast-agent.cmd' -Value $javaLauncher -Encoding ASCII

    # Node Agent launcher
    $nodeLauncher = @'
@echo off
setlocal

set SESSIONCAST_HOME=%~dp0..
set ITMUX_HOME=%SESSIONCAST_HOME%\itmux

if exist "%SESSIONCAST_HOME%\node\node.exe" (
    set NODE_HOME=%SESSIONCAST_HOME%\node
    set PATH=%NODE_HOME%;%PATH%
) else if exist "%ProgramFiles%\nodejs\node.exe" (
    set NODE_HOME=%ProgramFiles%\nodejs
) else (
    echo Error: Node.js not found. Please install Node.js.
    exit /b 1
)

"%NODE_HOME%\npx.cmd" sessioncast %*
'@
    Set-Content -Path 'scripts\sessioncast-node.cmd' -Value $nodeLauncher -Encoding ASCII

    Write-Success "Launcher scripts created"

    # Create default config
    Write-Step "Creating default configuration..."

    $defaultConfig = @'
# SessionCast Agent Configuration

# Machine identifier (change to a unique name for your machine)
machineId: MY_MACHINE

# Relay server URL
relay: wss://relay.sessioncast.io/ws

# Authentication token (get from https://app.sessioncast.io)
token: YOUR_TOKEN_HERE

# Optional settings
# api:
#   enabled: false
#   agentId: null
'@
    Set-Content -Path 'config\agent-config.yml' -Value $defaultConfig -Encoding UTF8

    # Create placeholder files for Inno Setup
    Write-Step "Creating placeholder files..."

    # LICENSE.txt
    if (-not (Test-Path 'LICENSE.txt')) {
        Set-Content -Path 'LICENSE.txt' -Value @"
SessionCast License Agreement

Copyright (c) 2024 SessionCast

This software is provided for use under the terms of the SessionCast
Terms of Service available at https://sessioncast.io/terms

By installing this software, you agree to these terms.
"@
    }

    # README.txt
    if (-not (Test-Path 'README.txt')) {
        Set-Content -Path 'README.txt' -Value @"
SessionCast Agent for Windows

This installer will set up the SessionCast Agent on your Windows machine.

Components:
- itmux (Windows tmux environment)
- Java Runtime (for Java Agent)
- Node.js Runtime (for Node Agent)

After installation:
1. Edit the configuration file at C:\SessionCast\config\agent-config.yml
2. Set your authentication token from https://app.sessioncast.io
3. Run the agent using sessioncast-agent.cmd or sessioncast-node.cmd

For more information, visit https://sessioncast.io/docs
"@
    }

    # Create simple icon placeholder (you'd replace with actual icon)
    if (-not (Test-Path 'icon.ico')) {
        Write-SubStep "Note: icon.ico not found - using placeholder"
        # Copy a system icon as placeholder
        Copy-Item "$env:SystemRoot\System32\cmd.exe" -Destination 'icon.ico' -ErrorAction SilentlyContinue
    }

    # Build installer with Inno Setup (if available)
    $innoPath = Find-InnoSetup
    if ($innoPath) {
        Write-Step "Building installer with Inno Setup..."
        Write-SubStep "Using: $innoPath"

        & $innoPath "SessionCast.iss"

        if ($LASTEXITCODE -eq 0) {
            Write-Success "Installer built successfully!"
            Write-SubStep "Output: $OutputDir\SessionCast-Setup-$($Config.Version).exe"
        } else {
            Write-Error2 "Inno Setup build failed with exit code $LASTEXITCODE"
        }
    } else {
        Write-Step "Inno Setup not found - skipping GUI installer build"
        Write-SubStep "Install Inno Setup from: https://jrsoftware.org/isinfo.php"
        Write-SubStep "PowerShell installer (install.ps1) is still available"
    }

    # Create portable ZIP
    Write-Step "Creating portable ZIP package..."

    $zipName = "SessionCast-Portable-$($Config.Version).zip"
    $zipPath = Join-Path $OutputDir $zipName

    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }

    # Create temp directory for zip contents
    $zipTemp = Join-Path $OutputDir 'SessionCast'
    if (Test-Path $zipTemp) {
        Remove-Item -Recurse -Force $zipTemp
    }
    New-Item -ItemType Directory -Path $zipTemp | Out-Null

    # Copy files
    Copy-Item -Path 'packages\itmux' -Destination "$zipTemp\itmux" -Recurse
    Copy-Item -Path 'packages\java' -Destination "$zipTemp\java" -Recurse
    Copy-Item -Path 'packages\node' -Destination "$zipTemp\node" -Recurse
    New-Item -ItemType Directory -Path "$zipTemp\bin" | Out-Null
    Copy-Item -Path 'scripts\*' -Destination "$zipTemp\bin"
    New-Item -ItemType Directory -Path "$zipTemp\config" | Out-Null
    Copy-Item -Path 'config\*' -Destination "$zipTemp\config"
    New-Item -ItemType Directory -Path "$zipTemp\logs" | Out-Null

    # Create ZIP
    Compress-Archive -Path $zipTemp -DestinationPath $zipPath -Force
    Remove-Item -Recurse -Force $zipTemp

    Write-Success "Portable ZIP created: $zipPath"

    # Summary
    Write-Host "`n" + "=" * 50 -ForegroundColor Green
    Write-Host " Build Complete!" -ForegroundColor Green
    Write-Host "=" * 50 -ForegroundColor Green
    Write-Host ""
    Write-Host "Output files:" -ForegroundColor White

    Get-ChildItem $OutputDir | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  - $($_.Name) ($size MB)" -ForegroundColor Gray
    }

    Write-Host ""

} finally {
    Pop-Location
}
