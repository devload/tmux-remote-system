#!/bin/bash
#
# SessionCast Deployment Script
# Usage: ./deploy.sh <environment> <service> [options]
#
# Examples:
#   ./deploy.sh ote web
#   ./deploy.sh ote relay --build
#   ./deploy.sh production web --dry-run
#   ./deploy.sh ote all
#

set -e

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/../config"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# OTE Configuration
OTE_HOST="43.200.173.78"
OTE_USER="ec2-user"
OTE_SSH_KEY="${OTE_SSH_KEY:-$HOME/.ssh/id_rsa}"

# =============================================================================
# Helper Functions
# =============================================================================

log_step() {
    echo -e "${BLUE}[*]${NC} $1"
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

print_banner() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              SessionCast Deployment Tool                   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

ssh_ote() {
    ssh -i "$OTE_SSH_KEY" -o StrictHostKeyChecking=no "$OTE_USER@$OTE_HOST" "$@"
}

scp_ote() {
    scp -i "$OTE_SSH_KEY" -o StrictHostKeyChecking=no "$@"
}

# =============================================================================
# OTE Deployment Functions
# =============================================================================

deploy_ote_web() {
    local build_local="${1:-false}"

    log_step "Deploying Web to OTE..."

    if [[ "$build_local" == "true" ]]; then
        log_step "Building locally..."
        cd "$PROJECT_ROOT/web-react"
        npm run build

        log_step "Uploading build..."
        scp_ote -r dist/* "$OTE_USER@$OTE_HOST:/home/ec2-user/sessioncast-web/"
    else
        log_step "Building on server..."
        ssh_ote << 'EOF'
cd /home/ec2-user/sessioncast-web
git pull origin main
npm install
npm run build
EOF
    fi

    log_step "Restarting nginx..."
    ssh_ote "sudo systemctl restart nginx"

    log_success "Web deployed to OTE"
}

deploy_ote_relay() {
    local build_local="${1:-false}"

    log_step "Deploying Relay to OTE..."

    if [[ "$build_local" == "true" ]]; then
        log_step "Building locally..."
        cd "$PROJECT_ROOT/relay-spring"
        ./gradlew bootJar

        log_step "Uploading JAR..."
        scp_ote build/libs/relay-spring-*.jar "$OTE_USER@$OTE_HOST:/home/ec2-user/sessioncast-relay/"
    else
        log_step "Building on server..."
        ssh_ote << 'EOF'
cd /home/ec2-user/sessioncast-relay
git pull origin main
./gradlew bootJar
EOF
    fi

    log_step "Restarting service..."
    ssh_ote "sudo systemctl restart sessioncast-relay || (cd /home/ec2-user/sessioncast-relay && nohup java -jar build/libs/relay-spring-*.jar > /dev/null 2>&1 &)"

    log_success "Relay deployed to OTE"
}

deploy_ote_agent() {
    log_step "Deploying Agent to OTE..."

    ssh_ote << 'EOF'
cd /home/ec2-user/sessioncast-cli
git pull origin main
npm install
npm run build
pm2 restart sessioncast-agent || pm2 start dist/index.js --name sessioncast-agent -- agent
EOF

    log_success "Agent deployed to OTE"
}

deploy_ote_platform() {
    local build_local="${1:-false}"

    log_step "Deploying Platform to OTE..."

    if [[ "$build_local" == "true" ]]; then
        log_step "Building locally..."
        cd "$PROJECT_ROOT/platform"
        ./gradlew bootJar

        log_step "Uploading JAR..."
        scp_ote build/libs/platform-*.jar "$OTE_USER@$OTE_HOST:/home/ec2-user/sessioncast-platform/"
    else
        log_step "Building on server..."
        ssh_ote << 'EOF'
cd /home/ec2-user/sessioncast-platform
git pull origin main
./gradlew bootJar
EOF
    fi

    log_step "Restarting service..."
    ssh_ote "sudo systemctl restart sessioncast-platform || echo 'Service not configured'"

    log_success "Platform deployed to OTE"
}

# =============================================================================
# Production Deployment Functions (AWS)
# =============================================================================

deploy_prod_web() {
    log_step "Deploying Web to Production..."

    cd "$PROJECT_ROOT/web-react"

    log_step "Building for production..."
    npm run build

    log_step "Syncing to S3..."
    aws s3 sync dist/ s3://sessioncast-web/ --delete

    log_step "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*"

    log_success "Web deployed to Production"
}

deploy_prod_ecs() {
    local service="$1"
    local repository="$2"

    log_step "Deploying $service to Production ECS..."

    # Build and push Docker image
    log_step "Building Docker image..."
    docker build -t "$repository" .

    log_step "Pushing to ECR..."
    aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin "$ECR_REGISTRY"
    docker tag "$repository:latest" "$ECR_REGISTRY/$repository:latest"
    docker push "$ECR_REGISTRY/$repository:latest"

    log_step "Updating ECS service..."
    aws ecs update-service \
        --cluster sessioncast-cluster \
        --service "$service" \
        --force-new-deployment

    log_success "$service deployed to Production"
}

# =============================================================================
# Status Functions
# =============================================================================

check_ote_status() {
    log_step "Checking OTE Status..."

    echo ""
    echo -e "${CYAN}=== OTE Services Status ===${NC}"
    echo ""

    # Check SSH connectivity
    if ssh_ote "echo 'SSH OK'" &>/dev/null; then
        log_success "SSH Connection: OK"
    else
        log_error "SSH Connection: FAILED"
        return 1
    fi

    # Check services
    echo ""
    ssh_ote << 'EOF'
echo "=== Process Status ==="
ps aux | grep -E "(java|node|nginx)" | grep -v grep | head -20

echo ""
echo "=== Port Status ==="
netstat -tlnp 2>/dev/null | grep -E ":(80|8080|8081|3000)" || ss -tlnp | grep -E ":(80|8080|8081|3000)"

echo ""
echo "=== Disk Usage ==="
df -h / | tail -1

echo ""
echo "=== Memory Usage ==="
free -h | head -2
EOF

    log_success "OTE status check complete"
}

# =============================================================================
# Main
# =============================================================================

usage() {
    echo "Usage: $0 <environment> <service> [options]"
    echo ""
    echo "Environments:"
    echo "  ote         Development test server (43.200.173.78)"
    echo "  production  Production (AWS)"
    echo ""
    echo "Services:"
    echo "  web         Frontend (React)"
    echo "  relay       Relay server (Spring Boot)"
    echo "  agent       Agent (Node.js)"
    echo "  platform    Platform API (Spring Boot)"
    echo "  all         All services"
    echo "  status      Check service status"
    echo ""
    echo "Options:"
    echo "  --build     Build locally before deploying"
    echo "  --dry-run   Show what would be done without doing it"
    echo "  -h, --help  Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 ote web"
    echo "  $0 ote relay --build"
    echo "  $0 ote status"
    echo "  $0 production web"
}

main() {
    local environment="$1"
    local service="$2"
    local build_local=false
    local dry_run=false

    # Parse options
    shift 2 2>/dev/null || true
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build)
                build_local=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    if [[ -z "$environment" ]] || [[ -z "$service" ]]; then
        usage
        exit 1
    fi

    print_banner

    echo -e "Environment: ${CYAN}$environment${NC}"
    echo -e "Service: ${CYAN}$service${NC}"
    echo -e "Build Local: ${CYAN}$build_local${NC}"
    echo ""

    if [[ "$dry_run" == "true" ]]; then
        log_warning "DRY RUN MODE - No changes will be made"
        echo ""
    fi

    case "$environment" in
        ote)
            case "$service" in
                web)
                    [[ "$dry_run" != "true" ]] && deploy_ote_web "$build_local"
                    ;;
                relay)
                    [[ "$dry_run" != "true" ]] && deploy_ote_relay "$build_local"
                    ;;
                agent)
                    [[ "$dry_run" != "true" ]] && deploy_ote_agent
                    ;;
                platform)
                    [[ "$dry_run" != "true" ]] && deploy_ote_platform "$build_local"
                    ;;
                all)
                    [[ "$dry_run" != "true" ]] && {
                        deploy_ote_web "$build_local"
                        deploy_ote_relay "$build_local"
                        deploy_ote_agent
                    }
                    ;;
                status)
                    check_ote_status
                    ;;
                *)
                    log_error "Unknown service: $service"
                    exit 1
                    ;;
            esac
            ;;
        production|prod)
            case "$service" in
                web)
                    [[ "$dry_run" != "true" ]] && deploy_prod_web
                    ;;
                relay)
                    [[ "$dry_run" != "true" ]] && deploy_prod_ecs "sessioncast-relay" "sessioncast-relay"
                    ;;
                platform)
                    [[ "$dry_run" != "true" ]] && deploy_prod_ecs "sessioncast-platform" "sessioncast-platform"
                    ;;
                *)
                    log_error "Unknown service: $service"
                    exit 1
                    ;;
            esac
            ;;
        *)
            log_error "Unknown environment: $environment"
            exit 1
            ;;
    esac

    echo ""
    log_success "Deployment complete!"
}

main "$@"
