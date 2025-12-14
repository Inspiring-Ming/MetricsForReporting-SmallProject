# Metrics For Reporting - Docker Management
# Usage: make [target]

.PHONY: help up down restart rebuild build logs logs-backend logs-frontend status health clean ps

# Default target
help: ## Show help information
	@echo "🚀 Metrics For Reporting - Docker Management"
	@echo ""
	@echo "📋 Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## 🚀 Start all services (backend + frontend)
	@echo "🚀 Starting Metrics For Reporting platform..."
	@echo "📊 Services:"
	@echo "   • Backend  - http://localhost:3001"
	@echo "   • Frontend - http://localhost:5173"
	@echo ""
	docker-compose up -d
	@echo ""
	@echo "✅ Platform starting, waiting for services to be ready..."
	@echo "🔍 View logs: make logs"
	@echo "📊 Check status: make status"

down: ## 🛑 Stop all services
	@echo "🛑 Stopping Metrics For Reporting platform..."
	docker-compose down
	@echo "✅ Platform stopped"

restart: ## 🔄 Restart all services
	@echo "🔄 Restarting Metrics For Reporting platform..."
	docker-compose restart
	@echo "✅ Platform restarted"

build: ## 🏗️ Build all images
	@echo "🏗️ Building platform images..."
	docker-compose build --no-cache
	@echo "✅ Build completed"

rebuild: ## 🔨 Rebuild and start all services
	@echo "🔨 Rebuilding and starting platform..."
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "✅ Rebuild completed"

logs: ## 📋 View all service logs (follow mode)
	docker-compose logs -f

logs-backend: ## 🔧 View backend logs
	docker-compose logs -f backend

logs-frontend: ## 🎨 View frontend logs
	docker-compose logs -f frontend

status: ## 📊 View service status
	@echo "📊 Metrics For Reporting service status:"
	@echo ""
	docker-compose ps
	@echo ""
	@echo "🔍 Detailed container information:"
	@docker ps --filter "name=metrics-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

health: ## 🏥 Check service health
	@echo "🏥 Checking service health status..."
	@echo ""
	@echo "🔧 Backend API (http://localhost:3001):"
	@curl -s http://localhost:3001/health >/dev/null 2>&1 && \
		echo "   ✅ Backend is healthy" || echo "   ❌ Backend is unhealthy"
	@echo ""
	@echo "🎨 Frontend (http://localhost:5173):"
	@curl -s http://localhost:5173 >/dev/null 2>&1 && \
		echo "   ✅ Frontend is healthy" || echo "   ❌ Frontend is unhealthy"

ps: ## 📋 List all containers
	docker-compose ps -a

clean: ## 🧹 Remove all containers and volumes
	@echo "🧹 Cleaning up all containers and volumes..."
	docker-compose down -v
	@echo "✅ Cleanup completed"

clean-all: ## 🗑️ Remove containers, volumes, and images
	@echo "🗑️ Removing all containers, volumes, and images..."
	docker-compose down -v --rmi all
	@echo "✅ Complete cleanup finished"
