# MetricsForReporting - Root Coordinator Makefile
# Usage: make [target]

.PHONY: help up down restart logs status health clean up-esg up-reporting down-esg down-reporting

help: ## Show help information
	@echo "🚀 MetricsForReporting - Project Coordinator"
	@echo ""
	@echo "📋 Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: up-esg up-reporting ## 🚀 Start all services (ESG Platform + Reporting System)

up-esg: ## 🌐 Start ESG Knowledge Graph Platform
	@echo "🌐 Starting ESG Knowledge Graph Platform..."
	@cd esg-kg-platform && $(MAKE) up

up-reporting: ## 📊 Start Reporting System
	@echo "📊 Starting Reporting System..."
	@cd reporting-system && $(MAKE) up

down: down-reporting down-esg ## 🛑 Stop all services

down-esg: ## 🛑 Stop ESG Platform
	@echo "🛑 Stopping ESG Platform..."
	@cd esg-kg-platform && $(MAKE) down

down-reporting: ## 🛑 Stop Reporting System
	@echo "🛑 Stopping Reporting System..."
	@cd reporting-system && $(MAKE) down

restart: ## 🔄 Restart all services
	@echo "🔄 Restarting all services..."
	@cd esg-kg-platform && $(MAKE) restart
	@cd reporting-system && $(MAKE) restart

logs: ## 📋 View logs from all services
	@echo "📋 Viewing logs (press Ctrl+C to exit)..."
	@echo ""
	@echo "Choose which logs to view:"
	@echo "  1. ESG Platform logs:     cd esg-kg-platform && make logs"
	@echo "  2. Reporting System logs: cd reporting-system && make logs"

status: ## 📊 Show status of all services
	@echo "📊 ESG Knowledge Graph Platform Status:"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@cd esg-kg-platform && $(MAKE) status || true
	@echo ""
	@echo "📊 Reporting System Status:"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@cd reporting-system && $(MAKE) status || true

health: ## 🏥 Check health of all services
	@echo "🏥 Checking health of all services..."
	@echo ""
	@echo "━━━ ESG Knowledge Graph Platform ━━━"
	@cd esg-kg-platform && $(MAKE) health || true
	@echo ""
	@echo "━━━ Reporting System ━━━"
	@cd reporting-system && $(MAKE) health || true

clean: ## 🧹 Clean all containers and volumes
	@echo "🧹 Cleaning all services..."
	@cd esg-kg-platform && $(MAKE) clean || true
	@cd reporting-system && $(MAKE) clean || true

build: ## 🏗️ Build all images
	@echo "🏗️ Building all images..."
	@cd esg-kg-platform && $(MAKE) build
	@cd reporting-system && $(MAKE) build

rebuild: ## 🔨 Rebuild all services
	@echo "🔨 Rebuilding all services..."
	@cd esg-kg-platform && $(MAKE) rebuild
	@cd reporting-system && $(MAKE) rebuild
