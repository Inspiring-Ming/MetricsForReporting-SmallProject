# ESG Knowledge Graph Platform - Complete Docker Management
# Usage: make [target]

.PHONY: help up down restart build rebuild logs logs-all logs-graphdb logs-backend logs-frontend logs-init status health clean reset dev test start stop ps up-graphdb up-backend up-frontend test-up test-down test-reset test-status test-verify test-logs

# Default target
help: ## Show help information
	@echo "🚀 ESG Knowledge Graph Platform - Complete Docker Management"
	@echo ""
	@echo "🎯 Quick Start:"
	@echo "  make up          - Start complete platform (GraphDB + Backend + Frontend)"
	@echo "  make test-up     - Start test environment"
	@echo ""
	@echo "📋 Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

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

# ==============================================================================
# 🧪 Test Environment Management
# ==============================================================================

test-up: ## 🧪 Start test GraphDB container
	@echo "🧪 Starting test GraphDB container..."
	@echo "📊 Test GraphDB will be available at: http://localhost:7201"
	@echo ""
	docker-compose --profile test up graphdb-test -d
	@echo ""
	@echo "⏳ Waiting for test container to be healthy (max 60s)..."
	@timeout=60; elapsed=0; \
	while [ $$elapsed -lt $$timeout ]; do \
		if docker inspect esg-graphdb-test --format='{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then \
			echo "✅ Test container is healthy"; \
			break; \
		fi; \
		sleep 2; \
		elapsed=$$((elapsed + 2)); \
		printf "."; \
	done; \
	echo ""
	@echo ""
	@echo "📥 Initializing test repository..."
	docker-compose --profile test up init-loader-test
	@echo ""
	@echo "✅ Test environment is ready!"
	@echo "🔍 View status: make test-status"
	@echo "🔍 Verify: make test-verify"

test-down: ## 🛑 Stop test GraphDB container
	@echo "🛑 Stopping test GraphDB container..."
	docker-compose --profile test down
	@echo "✅ Test container stopped"

test-reset: ## 🔄 Reset test environment (delete all test data)
	@echo "⚠️  Warning: This will delete all test data!"
	@echo "🔄 Resetting test environment..."
	docker-compose --profile test down -v
	@if [ -d "graphDB/test-data" ]; then \
		rm -rf graphDB/test-data/*; \
		echo "🧹 Test data directory cleaned"; \
	fi
	@echo ""
	@echo "🚀 Restarting test environment..."
	@$(MAKE) test-up

test-status: ## 📊 Show test container status
	@echo "📊 Test Container Status:"
	@echo ""
	@if docker ps --format '{{.Names}}' | grep -q "esg-graphdb-test"; then \
		echo "✅ Test container is running"; \
		echo ""; \
		echo "🏥 Health Status:"; \
		health=$$(docker inspect esg-graphdb-test --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown"); \
		echo "   Status: $$health"; \
		echo ""; \
		echo "📊 Repository Status:"; \
		if curl -s http://localhost:7201/rest/repositories 2>/dev/null | grep -q "esg-repo-test"; then \
			echo "   ✅ Test repository 'esg-repo-test' exists"; \
			count=$$(curl -s http://localhost:7201/repositories/esg-repo-test/size 2>/dev/null || echo "0"); \
			echo "   📈 Triples count: $$count"; \
		else \
			echo "   ❌ Test repository not found"; \
		fi; \
	else \
		echo "❌ Test container is not running"; \
		echo ""; \
		echo "💡 Start test container with: make test-up"; \
	fi

test-verify: ## 🔍 Verify test environment
	@echo "🔍 Verifying test environment..."
	@echo ""
	@# Check if container is running
	@if ! docker ps --format '{{.Names}}' | grep -q "esg-graphdb-test"; then \
		echo "❌ Test container is not running"; \
		echo "💡 Run: make test-up"; \
		exit 1; \
	fi
	@echo "✅ Container is running"
	@echo ""
	@# Test GraphDB connection
	@echo "🔗 Testing GraphDB connection..."
	@if curl -sf http://localhost:7201/rest/repositories > /dev/null; then \
		echo "✅ GraphDB connection OK"; \
	else \
		echo "❌ Cannot connect to GraphDB"; \
		exit 1; \
	fi
	@echo ""
	@# Test repository
	@echo "📊 Testing test repository..."
	@if curl -s http://localhost:7201/rest/repositories | grep -q "esg-repo-test"; then \
		echo "✅ Test repository exists"; \
	else \
		echo "❌ Test repository not found"; \
		exit 1; \
	fi
	@echo ""
	@# Test SPARQL query
	@echo "🔍 Testing SPARQL query..."
	@response=$$(curl -s -X POST http://localhost:7201/repositories/esg-repo-test \
		-H "Content-Type: application/sparql-query" \
		-H "Accept: application/sparql-results+json" \
		-d "SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o }"); \
	if echo "$$response" | grep -q "count"; then \
		echo "✅ SPARQL query OK"; \
		count=$$(echo "$$response" | grep -o '"value":"[0-9]*"' | head -1 | grep -o '[0-9]*'); \
		echo "📈 Current triples: $$count"; \
	else \
		echo "❌ SPARQL query failed"; \
		exit 1; \
	fi
	@echo ""
	@echo "✅ Test environment verification passed!"

test-logs: ## 📋 View test container logs
	docker-compose --profile test logs -f graphdb-test

test-clean: ## 🧹 Clean test data (keep container running)
	@echo "🧹 Cleaning test repository data..."
	@curl -s -X POST http://localhost:7201/repositories/esg-repo-test/statements \
		-H "Content-Type: application/sparql-update" \
		-d "DELETE { ?s ?p ?o } WHERE { ?s ?p ?o }" > /dev/null 2>&1 && \
		echo "✅ Test data cleaned" || \
		echo "❌ Failed to clean test data (is the container running?)"