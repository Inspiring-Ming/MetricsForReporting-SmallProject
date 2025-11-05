# ESG Knowledge Graph Platform - Complete Docker Management
# Usage: make [target]

.PHONY: help up down restart build rebuild logs logs-all logs-graphdb logs-backend logs-frontend logs-init status health clean reset dev test start stop ps up-graphdb up-backend up-frontend

# Default target
help: ## Show help information
	@echo "🚀 ESG Knowledge Graph Platform - Complete Docker Management"
	@echo ""
	@echo "🎯 Quick Start:"
	@echo "  make up     - Start complete platform (GraphDB + Backend + Frontend)"
	@echo ""
	@echo "📋 Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## 🚀 Start complete platform (GraphDB + Backend + Frontend)
	@echo "🚀 Starting ESG Knowledge Graph complete platform..."
	@echo "📊 Included services:"
	@echo "   • GraphDB     - http://localhost:7200"
	@echo "   • Backend API - http://localhost:3000" 
	@echo "   • Frontend    - http://localhost:5172"
	@echo ""
	docker-compose up -d
	@echo ""
	@echo "✅ Platform starting, please wait for all services to be ready..."
	@echo "🔍 View logs: make logs"
	@echo "📊 Check status: make status"

down: ## 🛑 Stop all services
	@echo "🛑 Stopping ESG Knowledge Graph platform..."
	docker-compose down
	@echo "✅ Platform stopped"

restart: ## 🔄 Restart all services
	@echo "🔄 Restarting ESG Knowledge Graph platform..."
	docker-compose restart
	@echo "✅ Platform restarted"

build: ## 🏗️ Build all images
	@echo "🏗️ Building ESG platform images..."
	docker-compose build --no-cache
	@echo "✅ Image build completed"

rebuild: ## 🔨 Rebuild and start
	@echo "🔨 Rebuilding and starting platform..."
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "✅ Rebuild completed"

logs: ## 📋 View all service logs
	docker-compose logs -f

logs-all: ## 📋 View complete logs of all services
	docker-compose logs --tail=100

logs-graphdb: ## 📊 View GraphDB logs
	docker-compose logs -f graphdb

logs-backend: ## 🔧 View Backend logs
	docker-compose logs -f backend

logs-frontend: ## 🎨 View Frontend logs
	docker-compose logs -f frontend

logs-init: ## 📥 View data initialization logs
	docker-compose logs init-loader

status: ## 📊 View all service status
	@echo "📊 ESG platform service status:"
	@echo ""
	docker-compose ps
	@echo ""
	@echo "🔍 Detailed container information:"
	@docker ps --filter "name=esg-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"

health: ## 🏥 Check health status of all services
	@echo "🏥 Checking service health status..."
	@echo ""
	@echo "📊 GraphDB (http://localhost:7200):"
	@curl -s http://localhost:7200/rest/repositories >/dev/null 2>&1 && \
		echo "   ✅ GraphDB is healthy" || echo "   ❌ GraphDB is unhealthy"
	@echo ""
	@echo "🔧 Backend API (http://localhost:3000):"
	@curl -s http://localhost:3000/health >/dev/null 2>&1 && \
		echo "   ✅ Backend is healthy" || echo "   ❌ Backend is unhealthy"
	@echo ""
	@echo "🎨 Frontend (http://localhost:5172):"
	@curl -s http://localhost:5172 >/dev/null 2>&1 && \
		echo "   ✅ Frontend is healthy" || echo "   ❌ Frontend is unhealthy"
	@echo ""
	@echo "📈 GraphDB data statistics:"
	@curl -s http://localhost:7200/repositories/esg-repo/size 2>/dev/null | \
		awk '{print "   📊 ESG repository contains " $$0 " data entries"}' || echo "   ❌ Unable to get data statistics"

clean: ## 🧹 Stop services and clean data
	@echo "🧹 Cleaning ESG platform data..."
	docker-compose down -v
	sudo rm -rf graphDB/data/
	@echo "✅ Data cleaned"

reset: clean up ## 🔄 Reset: clean data and restart
	@echo "🔄 Reset completed, restarting..."
	@echo "⏳ Please wait 2-3 minutes for all services to fully start..."

dev: ## 🛠️ Development mode: start and show logs
	@echo "🛠️ Starting in development mode..."
	make up
	@sleep 5
	@echo "📋 Displaying real-time logs (Ctrl+C to stop viewing logs, services continue running):"
	make logs

test: ## 🧪 Run health checks and basic tests
	@echo "🧪 Running platform tests..."
	@sleep 2
	make health

# Service-specific operations
up-graphdb: ## 📊 Start only GraphDB
	docker-compose up -d graphdb init-loader

up-backend: ## 🔧 Start only Backend
	docker-compose up -d backend

up-frontend: ## 🎨 Start only Frontend  
	docker-compose up -d frontend

# Command aliases
start: up
stop: down
ps: status