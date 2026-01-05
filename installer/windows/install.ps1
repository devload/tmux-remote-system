<#
.SYNOPSIS
    SessionCast Agent Windows Installer
.DESCRIPTION
    Installs SessionCast Agent with all dependencies (itmux, Java, Node.js)
.PARAMETER AgentType
    Type of agent to install: 'java', 'node', or 'all' (default: 'all')
.PARAMETER InstallPath
    Installation directory (default: C:\SessionCast)
.PARAMETER Silent
    Run in silent mode without prompts
.PARAMETER SkipJava
    Skip Java installation (use system Java)
.PARAMETER SkipNode
    Skip Node.js installation (use system Node)
.EXAMPLE
    .\install.ps1 -AgentType java -Silent
#>

param(
    [ValidateSet('java', 'node', 'all')]
    [string]$AgentType = 'all',

    [string]$InstallPath = 'C:\SessionCast',

    [switch]$Silent,

    [switch]$SkipJava,

    [switch]$SkipNode
)

# =============================================================================
# Configuration
# =============================================================================

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'  # Faster downloads

$Config = @{
    Version = '1.0.0'

    # Download URLs
    ItmuxUrl = 'https://github.com/itefixnet/itmux/releases/download/v2.0/itmux-2.0.zip'
    JavaUrl = 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.9%2B9/OpenJDK17U-jre_x64_windows_hotspot_17.0.9_9.zip'
    NodeUrl = 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-win-x64.zip'

    # Agent downloads (GitHub releases or direct URLs)
    JavaAgentUrl = 'https://github.com/user/sessioncast/releases/latest/download/sessioncast-agent.jar'
    NodeAgentUrl = 'https://registry.npmjs.org/sessioncast-cli/-/sessioncast-cli-0.1.0.tgz'

    # Subdirectories
    Dirs = @{
        Bin = 'bin'
        Itmux = 'itmux'
        Java = 'java'
        Node = 'node'
        Config = 'config'
        Logs = 'logs'
        Temp = 'temp'
    }
}

# =============================================================================
# Helper Functions
# =============================================================================

function Write-Banner {
    $banner = @"

  ____                _              ____          _
 / ___|  ___  ___ ___(_) ___  _ __  / ___|__ _ ___| |_
 \___ \ / _ \/ __/ __| |/ _ \| '_ \| |   / _` / __| __|
  ___) |  __/\__ \__ \ | (_) | | | | |__| (_| \__ \ |_
 |____/ \___||___/___/_|\___/|_| |_|\____\__,_|___/\__|

 Windows Installer v$($Config.Version)

"@
    Write-Host $banner -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n[*] $Message" -ForegroundColor Green
}

function Write-SubStep {
    param([string]$Message)
    Write-Host "    - $Message" -ForegroundColor Gray
}

function Write-Error2 {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor Red
}

function Write-Warning2 {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "[+] $Message" -ForegroundColor Green
}

function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-UserConfirmation {
    param([string]$Message)

    if ($Silent) { return $true }

    $response = Read-Host "$Message (Y/n)"
    return ($response -eq '' -or $response -eq 'Y' -or $response -eq 'y')
}

function Invoke-Download {
    param(
        [string]$Url,
        [string]$OutFile,
        [string]$Description
    )

    Write-SubStep "Downloading $Description..."

    try {
        # Use BITS for better reliability, fallback to Invoke-WebRequest
        if (Get-Command Start-BitsTransfer -ErrorAction SilentlyContinue) {
            Start-BitsTransfer -Source $Url -Destination $OutFile -ErrorAction Stop
        } else {
            Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
        }

        if (Test-Path $OutFile) {
            $size = (Get-Item $OutFile).Length / 1MB
            Write-SubStep "Downloaded: $([math]::Round($size, 2)) MB"
            return $true
        }
    } catch {
        Write-Error2 "Failed to download $Description : $_"
        return $false
    }

    return $false
}

function Expand-ZipFile {
    param(
        [string]$ZipPath,
        [string]$DestPath
    )

    Write-SubStep "Extracting to $DestPath..."

    if (Test-Path $DestPath) {
        Remove-Item -Recurse -Force $DestPath
    }

    Expand-Archive -Path $ZipPath -DestinationPath $DestPath -Force
}

function Set-EnvironmentVariable {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Scope = 'User'
    )

    [Environment]::SetEnvironmentVariable($Name, $Value, $Scope)
    Write-SubStep "Set $Name = $Value"
}

function Add-ToPath {
    param(
        [string]$Path,
        [string]$Scope = 'User'
    )

    $currentPath = [Environment]::GetEnvironmentVariable('PATH', $Scope)

    if ($currentPath -notlike "*$Path*") {
        $newPath = "$currentPath;$Path"
        [Environment]::SetEnvironmentVariable('PATH', $newPath, $Scope)
        Write-SubStep "Added to PATH: $Path"
    }
}

# =============================================================================
# Installation Functions
# =============================================================================

function Install-Itmux {
    Write-Step "Installing itmux (Windows tmux)..."

    $tempZip = Join-Path $tempDir 'itmux.zip'
    $itmuxPath = Join-Path $InstallPath $Config.Dirs.Itmux

    # Download
    if (-not (Invoke-Download -Url $Config.ItmuxUrl -OutFile $tempZip -Description 'itmux')) {
        throw "Failed to download itmux"
    }

    # Extract
    Expand-ZipFile -ZipPath $tempZip -DestPath $itmuxPath

    # Handle nested directory if exists
    $nested = Get-ChildItem -Path $itmuxPath -Directory | Select-Object -First 1
    if ($nested -and (Test-Path (Join-Path $nested.FullName 'bin'))) {
        Get-ChildItem -Path $nested.FullName | Move-Item -Destination $itmuxPath -Force
        Remove-Item -Path $nested.FullName -Force
    }

    # Verify installation
    $tmuxExe = Join-Path $itmuxPath 'bin\tmux.exe'
    if (-not (Test-Path $tmuxExe)) {
        # Try alternative path
        $tmuxExe = Join-Path $itmuxPath 'bin\bash.exe'
    }

    if (Test-Path $tmuxExe) {
        Write-Success "itmux installed successfully"
        Set-EnvironmentVariable -Name 'ITMUX_HOME' -Value $itmuxPath
    } else {
        Write-Warning2 "itmux may not be installed correctly"
    }
}

function Install-Java {
    if ($SkipJava) {
        Write-Step "Skipping Java installation (using system Java)"

        # Check system Java
        $javaVersion = & java -version 2>&1 | Select-Object -First 1
        if ($javaVersion) {
            Write-SubStep "System Java: $javaVersion"
        } else {
            Write-Warning2 "Java not found in PATH. Java Agent may not work."
        }
        return
    }

    Write-Step "Installing Java (Temurin 17)..."

    $tempZip = Join-Path $tempDir 'java.zip'
    $javaPath = Join-Path $InstallPath $Config.Dirs.Java

    # Download
    if (-not (Invoke-Download -Url $Config.JavaUrl -OutFile $tempZip -Description 'Java 17')) {
        throw "Failed to download Java"
    }

    # Extract
    Expand-ZipFile -ZipPath $tempZip -DestPath $javaPath

    # Handle nested directory
    $nested = Get-ChildItem -Path $javaPath -Directory | Select-Object -First 1
    if ($nested) {
        $javaHome = $nested.FullName
    } else {
        $javaHome = $javaPath
    }

    # Verify installation
    $javaExe = Join-Path $javaHome 'bin\java.exe'
    if (Test-Path $javaExe) {
        Write-Success "Java installed successfully"
        Set-EnvironmentVariable -Name 'JAVA_HOME' -Value $javaHome
        Write-SubStep "JAVA_HOME = $javaHome"
    } else {
        Write-Warning2 "Java may not be installed correctly"
    }
}

function Install-Node {
    if ($SkipNode) {
        Write-Step "Skipping Node.js installation (using system Node)"

        # Check system Node
        $nodeVersion = & node --version 2>&1
        if ($nodeVersion) {
            Write-SubStep "System Node.js: $nodeVersion"
        } else {
            Write-Warning2 "Node.js not found in PATH. Node Agent may not work."
        }
        return
    }

    Write-Step "Installing Node.js 20 LTS..."

    $tempZip = Join-Path $tempDir 'node.zip'
    $nodePath = Join-Path $InstallPath $Config.Dirs.Node

    # Download
    if (-not (Invoke-Download -Url $Config.NodeUrl -OutFile $tempZip -Description 'Node.js 20')) {
        throw "Failed to download Node.js"
    }

    # Extract
    Expand-ZipFile -ZipPath $tempZip -DestPath $nodePath

    # Handle nested directory
    $nested = Get-ChildItem -Path $nodePath -Directory | Select-Object -First 1
    if ($nested) {
        $nodeHome = $nested.FullName
    } else {
        $nodeHome = $nodePath
    }

    # Verify installation
    $nodeExe = Join-Path $nodeHome 'node.exe'
    if (Test-Path $nodeExe) {
        Write-Success "Node.js installed successfully"
        Set-EnvironmentVariable -Name 'NODE_HOME' -Value $nodeHome
        Add-ToPath -Path $nodeHome
    } else {
        Write-Warning2 "Node.js may not be installed correctly"
    }
}

function Install-JavaAgent {
    Write-Step "Installing SessionCast Java Agent..."

    $binPath = Join-Path $InstallPath $Config.Dirs.Bin
    $jarPath = Join-Path $binPath 'sessioncast-agent.jar'

    # For now, create a placeholder (replace with actual download)
    # Invoke-Download -Url $Config.JavaAgentUrl -OutFile $jarPath -Description 'Java Agent'

    # Create launcher script
    $javaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User')
    if (-not $javaHome) {
        $javaHome = Join-Path $InstallPath "$($Config.Dirs.Java)\jdk-17.0.9+9-jre"
    }

    $launcherContent = @"
@echo off
setlocal

set SESSIONCAST_HOME=$InstallPath
set ITMUX_HOME=%SESSIONCAST_HOME%\itmux
set JAVA_HOME=$javaHome

"%JAVA_HOME%\bin\java.exe" -jar "%SESSIONCAST_HOME%\bin\sessioncast-agent.jar" %*
"@

    $launcherPath = Join-Path $binPath 'sessioncast-agent.cmd'
    Set-Content -Path $launcherPath -Value $launcherContent -Encoding ASCII

    Write-Success "Java Agent launcher created: $launcherPath"
}

function Install-NodeAgent {
    Write-Step "Installing SessionCast Node Agent..."

    $binPath = Join-Path $InstallPath $Config.Dirs.Bin
    $nodeHome = [Environment]::GetEnvironmentVariable('NODE_HOME', 'User')
    if (-not $nodeHome) {
        $nodeHome = Join-Path $InstallPath "$($Config.Dirs.Node)\node-v20.10.0-win-x64"
    }

    # Install via npm
    $npmPath = Join-Path $nodeHome 'npm.cmd'
    if (Test-Path $npmPath) {
        Write-SubStep "Installing sessioncast-cli via npm..."
        & $npmPath install -g sessioncast-cli 2>&1 | Out-Null
    }

    # Create launcher script
    $launcherContent = @"
@echo off
setlocal

set SESSIONCAST_HOME=$InstallPath
set ITMUX_HOME=%SESSIONCAST_HOME%\itmux
set NODE_HOME=$nodeHome
set PATH=%NODE_HOME%;%PATH%

"%NODE_HOME%\npx.cmd" sessioncast %*
"@

    $launcherPath = Join-Path $binPath 'sessioncast-node.cmd'
    Set-Content -Path $launcherPath -Value $launcherContent -Encoding ASCII

    Write-Success "Node Agent launcher created: $launcherPath"
}

function New-DefaultConfig {
    Write-Step "Creating default configuration..."

    $configPath = Join-Path $InstallPath $Config.Dirs.Config
    $configFile = Join-Path $configPath 'agent-config.yml'

    $configContent = @"
# SessionCast Agent Configuration
# Generated by Windows Installer

# Machine identifier (change this to a unique name)
machineId: $env:COMPUTERNAME

# Relay server URL
relay: wss://relay.sessioncast.io/ws

# Authentication token (get from https://app.sessioncast.io)
token: YOUR_TOKEN_HERE

# Optional: API configuration for advanced features
# api:
#   enabled: false
#   agentId: null
"@

    Set-Content -Path $configFile -Value $configContent -Encoding UTF8
    Write-SubStep "Config file: $configFile"
    Write-Warning2 "Please edit $configFile and set your authentication token"
}

function New-UninstallScript {
    Write-Step "Creating uninstall script..."

    $binPath = Join-Path $InstallPath $Config.Dirs.Bin

    $uninstallContent = @"
@echo off
echo SessionCast Uninstaller
echo ======================
echo.
echo This will remove SessionCast and all its components.
echo Installation path: $InstallPath
echo.
set /p confirm="Are you sure? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    exit /b 0
)

echo.
echo Removing files...
rmdir /s /q "$InstallPath"

echo Removing environment variables...
setx SESSIONCAST_HOME ""
setx ITMUX_HOME ""

echo.
echo SessionCast has been uninstalled.
echo Note: PATH variable may need manual cleanup.
pause
"@

    $uninstallPath = Join-Path $binPath 'uninstall.cmd'
    Set-Content -Path $uninstallPath -Value $uninstallContent -Encoding ASCII

    Write-SubStep "Uninstall script: $uninstallPath"
}

# =============================================================================
# Main Installation
# =============================================================================

function Start-Installation {
    Write-Banner

    # Check administrator
    if (-not (Test-Administrator)) {
        Write-Warning2 "Running without administrator privileges."
        Write-Warning2 "Some features may not work correctly."
        if (-not $Silent) {
            if (-not (Get-UserConfirmation "Continue anyway?")) {
                exit 1
            }
        }
    }

    # Show installation summary
    Write-Host "Installation Summary:" -ForegroundColor White
    Write-Host "  Install Path : $InstallPath" -ForegroundColor Gray
    Write-Host "  Agent Type   : $AgentType" -ForegroundColor Gray
    Write-Host "  Skip Java    : $SkipJava" -ForegroundColor Gray
    Write-Host "  Skip Node    : $SkipNode" -ForegroundColor Gray
    Write-Host ""

    if (-not $Silent) {
        if (-not (Get-UserConfirmation "Proceed with installation?")) {
            Write-Host "Installation cancelled."
            exit 0
        }
    }

    # Create directories
    Write-Step "Creating installation directories..."

    $directories = @(
        $InstallPath,
        (Join-Path $InstallPath $Config.Dirs.Bin),
        (Join-Path $InstallPath $Config.Dirs.Config),
        (Join-Path $InstallPath $Config.Dirs.Logs)
    )

    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-SubStep "Created: $dir"
        }
    }

    # Create temp directory
    $script:tempDir = Join-Path $InstallPath $Config.Dirs.Temp
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

    try {
        # Install itmux (always required)
        Install-Itmux

        # Install based on agent type
        switch ($AgentType) {
            'java' {
                Install-Java
                Install-JavaAgent
            }
            'node' {
                Install-Node
                Install-NodeAgent
            }
            'all' {
                Install-Java
                Install-Node
                Install-JavaAgent
                Install-NodeAgent
            }
        }

        # Create config and uninstall script
        New-DefaultConfig
        New-UninstallScript

        # Set environment variables
        Write-Step "Setting environment variables..."
        Set-EnvironmentVariable -Name 'SESSIONCAST_HOME' -Value $InstallPath
        Add-ToPath -Path (Join-Path $InstallPath $Config.Dirs.Bin)

        # Cleanup
        Write-Step "Cleaning up..."
        if (Test-Path $tempDir) {
            Remove-Item -Recurse -Force $tempDir
        }

        # Success message
        Write-Host ""
        Write-Host "=============================================" -ForegroundColor Green
        Write-Host " Installation Complete!" -ForegroundColor Green
        Write-Host "=============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor White
        Write-Host "  1. Edit configuration file:" -ForegroundColor Gray
        Write-Host "     $InstallPath\config\agent-config.yml" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  2. Set your authentication token from:" -ForegroundColor Gray
        Write-Host "     https://app.sessioncast.io" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  3. Start the agent:" -ForegroundColor Gray
        if ($AgentType -eq 'java' -or $AgentType -eq 'all') {
            Write-Host "     sessioncast-agent.cmd" -ForegroundColor Cyan
        }
        if ($AgentType -eq 'node' -or $AgentType -eq 'all') {
            Write-Host "     sessioncast-node.cmd" -ForegroundColor Cyan
        }
        Write-Host ""
        Write-Host "  4. Open a new terminal to use updated PATH" -ForegroundColor Yellow
        Write-Host ""

    } catch {
        Write-Error2 "Installation failed: $_"

        # Cleanup on failure
        if (Test-Path $tempDir) {
            Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
        }

        exit 1
    }
}

# Run installation
Start-Installation
