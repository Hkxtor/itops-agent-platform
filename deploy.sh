#!/bin/bash
# ============================================================
# ITOps Agent Platform - Quick Deploy Script
# ============================================================
# Usage:
#   ./deploy.sh [OPTIONS]
#
# Examples:
#   # Deploy with default settings
#   ./deploy.sh
#
#   # Deploy with custom image registry
#   ./deploy.sh --username your-username
#
#   # Deploy specific version on custom ports
#   ./deploy.sh --username your-username --version v1.0.0 --backend-port 8000 --frontend-port 9000
# ============================================================

set -euo pipefail

# Default values
REGISTRY="docker.io"
USERNAME=""
VERSION="latest"
BACKEND_PORT="3001"
FRONTEND_PORT="8080"
JWT_SECRET=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --username)
            USERNAME="$2"
            shift 2
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --backend-port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        --jwt-secret)
            JWT_SECRET="$2"
            shift 2
            ;;
        --help)
            echo "==========================================="
            echo " ITOps Agent Platform - Deploy Script"
            echo "==========================================="
            echo ""
            echo "Usage:"
            echo "  ./deploy.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --registry       Container registry (default: docker.io)"
            echo "  --username       Registry username (required if not using default images)"
            echo "  --version        Image version tag (default: latest)"
            echo "  --backend-port   Backend API port (default: 3001)"
            echo "  --frontend-port  Frontend web port (default: 8080)"
            echo "  --jwt-secret     JWT secret key (auto-generated if not provided)"
            echo "  --help           Show this help message"
            echo ""
            echo "Examples:"
            echo "  # Deploy with default settings"
            echo "  ./deploy.sh"
            echo ""
            echo "  # Deploy with custom images"
            echo "  ./deploy.sh --username your-dockerhub-username"
            echo ""
            echo "  # Deploy specific version on custom ports"
            echo "  ./deploy.sh --username your-username --version v1.0.0 --backend-port 8000 --frontend-port 9000"
            echo "==========================================="
            exit 0
            ;;
        *)
            error "Unknown argument: $1"
            ;;
    esac
done

# Check prerequisites
info "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first: https://docs.docker.com/get-docker/"
fi
success "Docker is installed"

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    error "Docker Compose is not available. Please install Docker Desktop or docker-compose-plugin."
fi
success "Docker Compose is available"

# Check if ports are available
info "Checking port availability..."

if command -v lsof &> /dev/null; then
    if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        error "Port $BACKEND_PORT is already in use. Please choose a different port with --backend-port"
    fi
    if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        error "Port $FRONTEND_PORT is already in use. Please choose a different port with --frontend-port"
    fi
elif command -v ss &> /dev/null; then
    if ss -tlnp | grep -q ":$BACKEND_PORT "; then
        error "Port $BACKEND_PORT is already in use. Please choose a different port with --backend-port"
    fi
    if ss -tlnp | grep -q ":$FRONTEND_PORT "; then
        error "Port $FRONTEND_PORT is already in use. Please choose a different port with --frontend-port"
    fi
fi

success "Ports are available"

# Generate JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
    info "Generated JWT secret (will be saved to .env)"
fi

# Create .env file
info "Creating .env file..."
cat > .env << EOF
# ITOps Agent Platform - Environment Configuration
# Generated on $(date '+%Y-%m-%d %H:%M:%S')

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# LLM API Configuration (configure at least one)
# Doubao (豆包)
DOUBAO_API_KEY=
DOUBAO_API_BASE=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=doubao-4o

# OpenAI
OPENAI_API_KEY=
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o

# Server Configuration
ALLOWED_ORIGINS=http://localhost:$FRONTEND_PORT
EOF

success ".env file created"

# Determine image names
if [ -z "$USERNAME" ]; then
    BACKEND_IMAGE="itops-backend:$VERSION"
    FRONTEND_IMAGE="itops-frontend:$VERSION"
    warn "Using local images. If you want to pull from registry, specify --username"
else
    BACKEND_IMAGE="$REGISTRY/$USERNAME/itops-backend:$VERSION"
    FRONTEND_IMAGE="$REGISTRY/$USERNAME/itops-frontend:$VERSION"
fi

# Create docker-compose.deploy.yml
info "Creating deployment configuration..."
cat > docker-compose.deploy.yml << EOF
version: '3.8'

services:
  backend:
    image: $BACKEND_IMAGE
    container_name: itops-backend
    ports:
      - "$BACKEND_PORT:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - HOST=0.0.0.0
      - DATABASE_PATH=/app/data/app.db
      - JWT_SECRET=\${JWT_SECRET}
      - DOUBAO_API_KEY=\${DOUBAO_API_KEY:-}
      - DOUBAO_API_BASE=\${DOUBAO_API_BASE:-https://ark.cn-beijing.volces.com/api/v3}
      - DOUBAO_MODEL=\${DOUBAO_MODEL:-doubao-4o}
      - OPENAI_API_KEY=\${OPENAI_API_KEY:-}
      - OPENAI_API_BASE=\${OPENAI_API_BASE:-https://api.openai.com/v1}
      - OPENAI_MODEL=\${OPENAI_MODEL:-gpt-4o}
      - ALLOWED_ORIGINS=\${ALLOWED_ORIGINS:-http://localhost:$FRONTEND_PORT}
    volumes:
      - itops-data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  frontend:
    image: $FRONTEND_IMAGE
    container_name: itops-frontend
    ports:
      - "$FRONTEND_PORT:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  itops-data:
    driver: local

networks:
  default:
    driver: bridge
EOF

success "Deployment configuration created"

# Pull images if username specified
if [ -n "$USERNAME" ]; then
    info "Pulling images from $REGISTRY..."
    docker pull $BACKEND_IMAGE || error "Failed to pull backend image"
    success "Backend image pulled"

    docker pull $FRONTEND_IMAGE || error "Failed to pull frontend image"
    success "Frontend image pulled"
fi

# Start services
info "Starting ITOps Agent Platform..."
docker compose -f docker-compose.deploy.yml up -d || error "Failed to start services"

# Wait for services to be ready
info "Waiting for services to start..."
sleep 10

# Check health
max_retries=30
retry_count=0
backend_ready=false

while [ $retry_count -lt $max_retries ]; do
    if curl -sf http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        backend_ready=true
        break
    fi
    sleep 2
    retry_count=$((retry_count + 1))
    echo -n "."
done

echo ""

if [ "$backend_ready" = true ]; then
    success "ITOps Agent Platform is ready!"
else
    warn "Backend service might still be starting. Check with: docker compose -f docker-compose.deploy.yml ps"
fi

# Show access information
echo ""
echo -e "${CYAN}===========================================${NC}"
echo -e "${GREEN} ITOps Agent Platform Deployed Successfully!${NC}"
echo -e "${CYAN}===========================================${NC}"
echo ""
echo -e "${YELLOW}Access URLs:${NC}"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo "  Health:   http://localhost:$BACKEND_PORT/health"
echo ""
echo -e "${YELLOW}Default Credentials:${NC}"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${YELLOW}Quick Commands:${NC}"
echo "  View logs:        docker compose -f docker-compose.deploy.yml logs -f"
echo "  Stop services:    docker compose -f docker-compose.deploy.yml down"
echo "  Restart services: docker compose -f docker-compose.deploy.yml restart"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Visit http://localhost:$FRONTEND_PORT in your browser"
echo "  2. Login with admin/admin123"
echo "  3. Configure your LLM API keys in Settings"
echo "  4. Start creating agents and workflows!"
echo ""
echo -e "${CYAN}===========================================${NC}"
