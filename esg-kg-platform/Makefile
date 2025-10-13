# ESG Knowledge Graph Platform - Complete Docker Management
# Usage: make [target]

.PHONY: help up down restart build logs logs-all status clean reset health dev test

# Default target
help: ## 显示帮助信息
	@echo "🚀 ESG Knowledge Graph Platform - Complete Docker Management"
	@echo ""
	@echo "🎯 一键启动："
	@echo "  make up     - 启动完整平台（GraphDB + Backend + Frontend）"
	@echo ""
	@echo "📋 可用命令:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## 🚀 启动完整平台（GraphDB + Backend + Frontend）
	@echo "🚀 启动ESG Knowledge Graph完整平台..."
	@echo "📊 包含服务："
	@echo "   • GraphDB     - http://localhost:7200"
	@echo "   • Backend API - http://localhost:3000" 
	@echo "   • Frontend    - http://localhost:3001"
	@echo ""
	docker-compose up -d
	@echo ""
	@echo "✅ 平台启动中，请等待所有服务就绪..."
	@echo "🔍 查看日志: make logs"
	@echo "📊 检查状态: make status"

down: ## 🛑 停止所有服务
	@echo "🛑 停止ESG Knowledge Graph平台..."
	docker-compose down
	@echo "✅ 平台已停止"

restart: ## 🔄 重启所有服务
	@echo "🔄 重启ESG Knowledge Graph平台..."
	docker-compose restart
	@echo "✅ 平台已重启"

build: ## 🏗️ 构建所有镜像
	@echo "🏗️ 构建ESG平台镜像..."
	docker-compose build --no-cache
	@echo "✅ 镜像构建完成"

rebuild: ## 🔨 重新构建并启动
	@echo "🔨 重新构建并启动平台..."
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "✅ 重建完成"

logs: ## 📋 查看所有服务日志
	docker-compose logs -f

logs-all: ## 📋 查看所有服务的完整日志
	docker-compose logs --tail=100

logs-graphdb: ## 📊 查看GraphDB日志
	docker-compose logs -f graphdb

logs-backend: ## 🔧 查看Backend日志
	docker-compose logs -f backend

logs-frontend: ## 🎨 查看Frontend日志
	docker-compose logs -f frontend

logs-init: ## 📥 查看数据初始化日志
	docker-compose logs init-loader

status: ## 📊 查看所有服务状态
	@echo "📊 ESG平台服务状态:"
	@echo ""
	docker-compose ps
	@echo ""
	@echo "🔍 详细容器信息:"
	@docker ps --filter "name=esg-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"

health: ## 🏥 检查所有服务健康状态
	@echo "🏥 检查服务健康状态..."
	@echo ""
	@echo "📊 GraphDB (http://localhost:7200):"
	@curl -s http://localhost:7200/rest/repositories >/dev/null 2>&1 && \
		echo "   ✅ GraphDB 正常" || echo "   ❌ GraphDB 异常"
	@echo ""
	@echo "🔧 Backend API (http://localhost:3000):"
	@curl -s http://localhost:3000/health >/dev/null 2>&1 && \
		echo "   ✅ Backend 正常" || echo "   ❌ Backend 异常"
	@echo ""
	@echo "🎨 Frontend (http://localhost:3001):"
	@curl -s http://localhost:3001 >/dev/null 2>&1 && \
		echo "   ✅ Frontend 正常" || echo "   ❌ Frontend 异常"
	@echo ""
	@echo "📈 GraphDB 数据统计:"
	@curl -s http://localhost:7200/repositories/esg-repo/size 2>/dev/null | \
		awk '{print "   📊 ESG仓库包含 " $$0 " 条数据"}' || echo "   ❌ 无法获取数据统计"

clean: ## 🧹 停止服务并清理数据
	@echo "🧹 清理ESG平台数据..."
	docker-compose down -v
	sudo rm -rf graphDB/data/
	@echo "✅ 数据已清理"

reset: clean up ## 🔄 重置：清理数据并重新启动
	@echo "� 重置完成，正在重新启动..."
	@echo "⏳ 请等待2-3分钟让所有服务完全启动..."

dev: ## 🛠️ 开发模式：启动并显示日志
	@echo "🛠️ 开发模式启动..."
	make up
	@sleep 5
	@echo "📋 显示实时日志（Ctrl+C停止查看日志，服务继续运行）:"
	make logs

test: ## 🧪 运行健康检查和基本测试
	@echo "🧪 运行平台测试..."
	@sleep 2
	make health

# 服务特定操作
up-graphdb: ## 📊 只启动GraphDB
	docker-compose up -d graphdb init-loader

up-backend: ## 🔧 只启动Backend
	docker-compose up -d backend

up-frontend: ## 🎨 只启动Frontend  
	docker-compose up -d frontend

# 快捷命令别名
start: up
stop: down
ps: status