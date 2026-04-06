#!/bin/bash
# TunaAtlas 部署脚本
# 支持：前端构建、Cloudflare Pages / Cloudflare Workers 部署
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log()  { echo -e "${GREEN}[部署]${NC} $1"; }
warn() { echo -e "${YELLOW}[警告]${NC} $1"; }
err()  { echo -e "${RED}[错误]${NC} $1" >&2; }

# === 前端构建 ===
build_frontend() {
    log "构建前端..."
    cd "$SCRIPT_DIR"
    npm install
    npm run build
    log "前端构建完成 ✓（输出: dist/）"
}

# === Cloudflare Pages 部署 ===
deploy_cf_pages() {
    log "部署到 Cloudflare Pages..."
    cd "$SCRIPT_DIR"
    if [ ! -d "dist" ]; then
        err "dist/ 目录不存在，请先运行: $0 frontend"
        return 1
    fi
    if command -v wrangler &> /dev/null; then
        wrangler pages deploy dist --project-name=tuna-atlas
    else
        warn "wrangler 未安装，跳过 Cloudflare Pages"
        warn "请手动执行: wrangler pages deploy dist --project-name=tuna-atlas"
    fi
    log "Cloudflare Pages 部署完成 ✓"
}

# === Cloudflare Workers 部署（后端 API）===
deploy_cf_workers() {
    log "部署到 Cloudflare Workers..."
    if [ ! -d "workers" ]; then
        warn "workers/ 目录不存在，跳过后端部署"
        return
    fi
    cd "$SCRIPT_DIR/workers"
    if command -v wrangler &> /dev/null; then
        wrangler deploy
    else
        warn "wrangler 未安装，跳过 Workers 部署"
    fi
    log "Cloudflare Workers 部署完成 ✓"
}

# === 全量部署 ===
deploy_all() {
    log "开始全量部署 TunaAtlas..."
    build_frontend
    deploy_cf_pages
    deploy_cf_workers
    echo ""
    echo "✅ TunaAtlas 部署完成！"
    echo "   前端 (Pages): https://tuna-atlas.pages.dev"
    echo "   后端 (Workers): https://tuna-atlas.workers.dev"
}

# === 主逻辑 ===
ACTION="${1:-help}"
case "$ACTION" in
    frontend|build) build_frontend ;;
    cf|cf-pages)    deploy_cf_pages ;;
    workers|cf-workers) deploy_cf_workers ;;
    all)            deploy_all ;;
    *)
        echo "用法: $0 {frontend|build|cf|cf-pages|workers|all}"
        echo ""
        echo "  frontend  - 构建前端 (npm install + vite build)"
        echo "  cf        - 部署前端到 Cloudflare Pages"
        echo "  workers   - 部署后端到 Cloudflare Workers（如有 workers/ 目录）"
        echo "  all       - 全量部署"
        echo ""
        echo "示例:"
        echo "  $0 all      # 全量构建 + 部署"
        echo "  $0 frontend # 仅构建前端"
        echo "  $0 cf       # 仅部署到 CF Pages"
        ;;
esac
