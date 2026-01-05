#!/bin/bash
#
# SessionCast Agent Installer for macOS
# Downloads and installs all dependencies (tmux, Java, Node.js)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/user/sessioncast/main/installer/macos/install.sh | bash
#   or
#   ./install.sh [options]
#
# Options:
#   --agent-type    java|node|all (default: all)
#   --install-path  Installation directory (default: /usr/local/sessioncast)
#   --skip-java     Skip Java installation
#   --skip-node     Skip Node.js installation
#   --skip-tmux     Skip tmux installation
#   --uninstall     Remove SessionCast
#

set -e

# =============================================================================
# Configuration
# =============================================================================

VERSION="1.0.0"
DEFAULT_INSTALL_PATH="/usr/local/sessioncast"

# Download URLs
JAVA_URL_ARM64="https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.17%2B10/OpenJDK17U-jre_aarch64_mac_hotspot_17.0.17_10.tar.gz"
JAVA_URL_X64="https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.17%2B10/OpenJDK17U-jre_x64_mac_hotspot_17.0.17_10.tar.gz"
NODE_URL_ARM64="https://nodejs.org/dist/v20.10.0/node-v20.10.0-darwin-arm64.tar.gz"
NODE_URL_X64="https://nodejs.org/dist/v20.10.0/node-v20.10.0-darwin-x64.tar.gz"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================

print_banner() {
    echo -e "${CYAN}"
    cat << 'EOF'
  ____                _              ____          _
 / ___|  ___  ___ ___(_) ___  _ __  / ___|__ _ ___| |_
 \___ \ / _ \/ __/ __| |/ _ \| '_ \| |   / _` / __| __|
  ___) |  __/\__ \__ \ | (_) | | | | |__| (_| \__ \ |_
 |____/ \___||___/___/_|\___/|_| |_|\____\__,_|___/\__|

EOF
    echo -e " macOS Installer v${VERSION}${NC}"
    echo ""
}

log_step() {
    echo -e "${BLUE}[*]${NC} $1"
}

log_substep() {
    echo -e "    ${CYAN}-${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_command() {
    command -v "$1" &> /dev/null
}

get_arch() {
    local arch=$(uname -m)
    case $arch in
        arm64|aarch64)
            echo "arm64"
            ;;
        x86_64|amd64)
            echo "x64"
            ;;
        *)
            log_error "Unsupported architecture: $arch"
            exit 1
            ;;
    esac
}

download_file() {
    local url="$1"
    local output="$2"

    log_substep "Downloading: $(basename "$output")"

    if check_command curl; then
        curl -fsSL "$url" -o "$output"
    elif check_command wget; then
        wget -q "$url" -O "$output"
    else
        log_error "Neither curl nor wget found"
        exit 1
    fi
}

# =============================================================================
# Installation Functions
# =============================================================================

install_homebrew() {
    if ! check_command brew; then
        log_step "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        # Add to PATH for Apple Silicon
        if [[ $(get_arch) == "arm64" ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
    else
        log_substep "Homebrew already installed"
    fi
}

install_tmux() {
    log_step "Installing tmux..."

    if check_command tmux; then
        local tmux_version=$(tmux -V | cut -d' ' -f2)
        log_substep "tmux $tmux_version already installed"
        return 0
    fi

    install_homebrew
    brew install tmux

    log_success "tmux installed: $(tmux -V)"
}

install_java() {
    local install_path="$1"
    local arch=$(get_arch)

    log_step "Installing Java 17..."

    # Check if Java already exists in install path
    if [[ -f "$install_path/java/bin/java" ]]; then
        log_substep "Java already installed in $install_path/java"
        return 0
    fi

    # Check system Java
    if check_command java; then
        local java_version=$(java -version 2>&1 | head -1 | cut -d'"' -f2)
        log_substep "System Java found: $java_version"
        log_substep "Installing bundled Java anyway for isolation..."
    fi

    local java_url
    if [[ "$arch" == "arm64" ]]; then
        java_url="$JAVA_URL_ARM64"
    else
        java_url="$JAVA_URL_X64"
    fi

    local tmp_file="/tmp/java-$$.tar.gz"
    download_file "$java_url" "$tmp_file"

    log_substep "Extracting Java..."
    mkdir -p "$install_path/java"
    tar -xzf "$tmp_file" -C "$install_path/java" --strip-components=1
    rm -f "$tmp_file"

    log_success "Java installed: $("$install_path/java/bin/java" -version 2>&1 | head -1)"
}

install_node() {
    local install_path="$1"
    local arch=$(get_arch)

    log_step "Installing Node.js 20..."

    # Check if Node already exists in install path
    if [[ -f "$install_path/node/bin/node" ]]; then
        log_substep "Node.js already installed in $install_path/node"
        return 0
    fi

    # Check system Node
    if check_command node; then
        local node_version=$(node -v)
        log_substep "System Node.js found: $node_version"
        log_substep "Installing bundled Node.js anyway for isolation..."
    fi

    local node_url
    if [[ "$arch" == "arm64" ]]; then
        node_url="$NODE_URL_ARM64"
    else
        node_url="$NODE_URL_X64"
    fi

    local tmp_file="/tmp/node-$$.tar.gz"
    download_file "$node_url" "$tmp_file"

    log_substep "Extracting Node.js..."
    mkdir -p "$install_path/node"
    tar -xzf "$tmp_file" -C "$install_path/node" --strip-components=1
    rm -f "$tmp_file"

    log_success "Node.js installed: $("$install_path/node/bin/node" -v)"
}

create_launcher_scripts() {
    local install_path="$1"

    log_step "Creating launcher scripts..."

    mkdir -p "$install_path/bin"

    # Java Agent launcher
    cat > "$install_path/bin/sessioncast-agent" << 'LAUNCHER'
#!/bin/bash
SESSIONCAST_HOME="$(cd "$(dirname "$0")/.." && pwd)"
export SESSIONCAST_HOME

# Use bundled Java if available
if [[ -f "$SESSIONCAST_HOME/java/bin/java" ]]; then
    JAVA_HOME="$SESSIONCAST_HOME/java"
    export JAVA_HOME
    JAVA="$JAVA_HOME/bin/java"
elif [[ -n "$JAVA_HOME" ]]; then
    JAVA="$JAVA_HOME/bin/java"
else
    JAVA="java"
fi

exec "$JAVA" -jar "$SESSIONCAST_HOME/lib/sessioncast-agent.jar" "$@"
LAUNCHER
    chmod +x "$install_path/bin/sessioncast-agent"

    # Node Agent launcher
    cat > "$install_path/bin/sessioncast-node" << 'LAUNCHER'
#!/bin/bash
SESSIONCAST_HOME="$(cd "$(dirname "$0")/.." && pwd)"
export SESSIONCAST_HOME

# Use bundled Node if available
if [[ -f "$SESSIONCAST_HOME/node/bin/node" ]]; then
    NODE_HOME="$SESSIONCAST_HOME/node"
    export PATH="$NODE_HOME/bin:$PATH"
fi

exec npx sessioncast "$@"
LAUNCHER
    chmod +x "$install_path/bin/sessioncast-node"

    log_success "Launcher scripts created"
}

create_default_config() {
    local install_path="$1"

    log_step "Creating default configuration..."

    mkdir -p "$install_path/config"

    if [[ ! -f "$install_path/config/agent-config.yml" ]]; then
        cat > "$install_path/config/agent-config.yml" << 'CONFIG'
# SessionCast Agent Configuration

# Machine identifier (change to a unique name for your machine)
machineId: MY_MAC

# Relay server URL
relay: wss://relay.sessioncast.io/ws

# Authentication token (get from https://app.sessioncast.io)
token: YOUR_TOKEN_HERE

# Optional settings
# api:
#   enabled: false
#   agentId: null
CONFIG
        log_substep "Created: $install_path/config/agent-config.yml"
    else
        log_substep "Config already exists, skipping..."
    fi
}

setup_shell_profile() {
    local install_path="$1"

    log_step "Setting up shell profile..."

    local profile_line="export PATH=\"$install_path/bin:\$PATH\""
    local sessioncast_home="export SESSIONCAST_HOME=\"$install_path\""

    # Detect shell
    local shell_name=$(basename "$SHELL")
    local profile_file

    case "$shell_name" in
        zsh)
            profile_file="$HOME/.zshrc"
            ;;
        bash)
            if [[ -f "$HOME/.bash_profile" ]]; then
                profile_file="$HOME/.bash_profile"
            else
                profile_file="$HOME/.bashrc"
            fi
            ;;
        *)
            profile_file="$HOME/.profile"
            ;;
    esac

    # Add to profile if not already present
    if ! grep -q "SESSIONCAST_HOME" "$profile_file" 2>/dev/null; then
        echo "" >> "$profile_file"
        echo "# SessionCast" >> "$profile_file"
        echo "$sessioncast_home" >> "$profile_file"
        echo "$profile_line" >> "$profile_file"
        log_substep "Added to $profile_file"
    else
        log_substep "Already configured in $profile_file"
    fi
}

uninstall() {
    local install_path="$1"

    log_step "Uninstalling SessionCast..."

    if [[ -d "$install_path" ]]; then
        rm -rf "$install_path"
        log_success "Removed $install_path"
    else
        log_warning "Installation not found at $install_path"
    fi

    log_warning "Note: Shell profile entries need to be removed manually"
    log_substep "Remove SESSIONCAST_HOME and PATH entries from your shell profile"
}

# =============================================================================
# Main
# =============================================================================

main() {
    local agent_type="all"
    local install_path="$DEFAULT_INSTALL_PATH"
    local skip_java=false
    local skip_node=false
    local skip_tmux=false
    local do_uninstall=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --agent-type)
                agent_type="$2"
                shift 2
                ;;
            --install-path)
                install_path="$2"
                shift 2
                ;;
            --skip-java)
                skip_java=true
                shift
                ;;
            --skip-node)
                skip_node=true
                shift
                ;;
            --skip-tmux)
                skip_tmux=true
                shift
                ;;
            --uninstall)
                do_uninstall=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --agent-type    java|node|all (default: all)"
                echo "  --install-path  Installation directory (default: $DEFAULT_INSTALL_PATH)"
                echo "  --skip-java     Skip Java installation"
                echo "  --skip-node     Skip Node.js installation"
                echo "  --skip-tmux     Skip tmux installation"
                echo "  --uninstall     Remove SessionCast"
                echo "  -h, --help      Show this help"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    print_banner

    # Handle uninstall
    if [[ "$do_uninstall" == true ]]; then
        uninstall "$install_path"
        exit 0
    fi

    echo -e "Installation path: ${CYAN}$install_path${NC}"
    echo -e "Agent type: ${CYAN}$agent_type${NC}"
    echo -e "Architecture: ${CYAN}$(get_arch)${NC}"
    echo ""

    # Check if running with sufficient permissions
    if [[ "$install_path" == /usr/* ]] && [[ $EUID -ne 0 ]]; then
        log_warning "Installing to $install_path requires sudo"
        exec sudo "$0" "$@"
    fi

    # Create installation directory
    log_step "Creating installation directory..."
    mkdir -p "$install_path"/{bin,lib,config,logs}

    # Install tmux
    if [[ "$skip_tmux" != true ]]; then
        install_tmux
    fi

    # Install Java
    if [[ "$skip_java" != true ]] && [[ "$agent_type" == "all" || "$agent_type" == "java" ]]; then
        install_java "$install_path"
    fi

    # Install Node.js
    if [[ "$skip_node" != true ]] && [[ "$agent_type" == "all" || "$agent_type" == "node" ]]; then
        install_node "$install_path"
    fi

    # Create launcher scripts
    create_launcher_scripts "$install_path"

    # Create default config
    create_default_config "$install_path"

    # Setup shell profile (only for non-root user)
    if [[ $EUID -ne 0 ]] || [[ -n "$SUDO_USER" ]]; then
        if [[ -n "$SUDO_USER" ]]; then
            # Run as original user
            sudo -u "$SUDO_USER" bash -c "$(declare -f setup_shell_profile); setup_shell_profile '$install_path'"
        else
            setup_shell_profile "$install_path"
        fi
    fi

    # Summary
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN} Installation Complete!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Installation path: ${CYAN}$install_path${NC}"
    echo ""
    echo -e "Next steps:"
    echo -e "  1. ${YELLOW}Restart your terminal${NC} or run: source ~/.zshrc"
    echo -e "  2. Edit config: ${CYAN}$install_path/config/agent-config.yml${NC}"
    echo -e "  3. Set your token from ${CYAN}https://app.sessioncast.io${NC}"
    echo -e "  4. Run: ${CYAN}sessioncast-agent${NC} or ${CYAN}sessioncast-node${NC}"
    echo ""
}

main "$@"
