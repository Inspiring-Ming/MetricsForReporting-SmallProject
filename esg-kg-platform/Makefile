# ESG Knowledge Graph Platform - Development Makefile
# Required tools: Node.js LTS, pnpm, Go 1.22+, Docker Desktop, Make

.PHONY: help up down gen dev-public dev-internal build test clean install deps check-tools

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

help: ## Show this help message
	@echo "$(BLUE)ESG Knowledge Graph Platform$(RESET)"
	@echo "$(YELLOW)Available targets:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

check-tools: ## Check if required tools are installed
	@echo "$(BLUE)Checking required tools...$(RESET)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)✗ Node.js is required but not installed$(RESET)"; echo "$(YELLOW)Install from: https://nodejs.org/$(RESET)"; exit 1; }
	@command -v pnpm >/dev/null 2>&1 || { echo "$(RED)✗ pnpm is required but not installed$(RESET)"; echo "$(YELLOW)Install with: npm install -g pnpm$(RESET)"; exit 1; }
	@command -v go >/dev/null 2>&1 || { echo "$(RED)✗ Go is required but not installed$(RESET)"; echo "$(YELLOW)Install from: https://golang.org/dl/$(RESET)"; exit 1; }
	@if ! command -v docker >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then \
		echo "$(RED)✗ Docker is required but not installed$(RESET)"; \
		echo "$(YELLOW)Install Docker Desktop from: https://www.docker.com/products/docker-desktop/$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ All required tools are available$(RESET)"

install: check-tools ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	pnpm install
	cd apps/api-internal && go mod download
	@echo "$(GREEN)✓ Dependencies installed$(RESET)"

deps: install ## Alias for install

up: ## Start all services (GraphDB, Redis, etc.)
	@echo "$(BLUE)Starting infrastructure services...$(RESET)"
	@if command -v docker-compose >/dev/null 2>&1; then \
		docker-compose -f infra/compose.yml up -d; \
	elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then \
		docker compose -f infra/compose.yml up -d; \
	else \
		echo "$(RED)Docker or Docker Compose not found. Please install Docker Desktop$(RESET)"; \
		echo "$(YELLOW)Download from: https://www.docker.com/products/docker-desktop/$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Services started$(RESET)"
	@echo "$(YELLOW)GraphDB will be available at http://localhost:7200$(RESET)"

down: ## Stop all services
	@echo "$(BLUE)Stopping services...$(RESET)"
	@if command -v docker-compose >/dev/null 2>&1; then \
		docker-compose -f infra/compose.yml down; \
	elif command -v docker >/dev/null 2>&1; then \
		docker compose -f infra/compose.yml down; \
	else \
		echo "$(YELLOW)Docker not available - no services to stop$(RESET)"; \
	fi
	@echo "$(GREEN)✓ Services stopped$(RESET)"

gen: ## Generate client code from OpenAPI specs
	@echo "$(BLUE)Generating client code...$(RESET)"
	./scripts/gen-internal-client.sh
	@echo "$(GREEN)✓ Client code generated$(RESET)"

dev-public: ## Start public API in development mode
	@echo "$(BLUE)Starting Public API (Write Service) in development mode...$(RESET)"
	cd apps/api-public && pnpm dev

dev-internal: ## Start internal API in development mode
	@echo "$(BLUE)Starting Internal API (Read Service) in development mode...$(RESET)"
	cd apps/api-internal && make dev

build: ## Build all services
	@echo "$(BLUE)Building all services...$(RESET)"
	@echo "Building TypeScript packages..."
	pnpm build
	@echo "Building Go service..."
	cd apps/api-internal && make build
	@echo "$(GREEN)✓ All services built$(RESET)"

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(RESET)"
	@echo "Running TypeScript tests..."
	pnpm test
	@echo "Running Go tests..."
	cd apps/api-internal && make test
	@echo "$(GREEN)✓ All tests completed$(RESET)"

lint: ## Run linters for all services
	@echo "$(BLUE)Running linters...$(RESET)"
	pnpm lint
	cd apps/api-internal && make lint
	@echo "$(GREEN)✓ Linting completed$(RESET)"

format: ## Format code for all services
	@echo "$(BLUE)Formatting code...$(RESET)"
	pnpm format
	cd apps/api-internal && make format
	@echo "$(GREEN)✓ Code formatted$(RESET)"

clean: ## Clean build artifacts and dependencies
	@echo "$(BLUE)Cleaning up...$(RESET)"
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf apps/*/dist
	cd apps/api-internal && make clean
	docker compose -f infra/compose.yml down -v --remove-orphans
	@echo "$(GREEN)✓ Cleanup completed$(RESET)"

logs: ## Show logs from all running services
	docker compose -f infra/compose.yml logs -f

backup-db: ## Backup GraphDB data
	./scripts/backup-graphdb.sh

restore-db: ## Restore GraphDB data
	./scripts/restore-graphdb.sh

# Development workflow shortcuts
dev: up ## Start infrastructure and show development commands
	@echo "$(GREEN)✓ Infrastructure is running$(RESET)"
	@echo "$(YELLOW)Next steps:$(RESET)"
	@echo "  make dev-public   # Start Public API (TypeScript/Fastify)"
	@echo "  make dev-internal # Start Internal API (Go)"

setup: install up ## Complete setup: install dependencies and start services
	@echo "$(GREEN)✓ Setup completed! Platform is ready for development$(RESET)"