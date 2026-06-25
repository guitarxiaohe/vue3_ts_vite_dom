#!/usr/bin/env bash
# XiaoHe 前端一键 Docker 部署：本地打包、上传服务器、远程重建容器
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
AI_CHAT_DIR="$(cd "$REPO_DIR/../xiaohe-AI chat" && pwd)"
DEPLOY_DIR="$REPO_DIR/.deploy/vue"
ARCHIVE_PATH="$REPO_DIR/.deploy/xiaohe-vue-deploy.tar.gz"

DEPLOY_HOST="${DEPLOY_HOST:-110.42.237.20}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-/home/ubuntu/project/vue}"
REMOTE_ARCHIVE="/tmp/xiaohe-vue-deploy.tar.gz"
AI_CHAT_BASE_PATH="${AI_CHAT_BASE_PATH:-/aichat/}"
AI_CHAT_API_BASE_URL="${AI_CHAT_API_BASE_URL:-https://www.guitarxiaohe.top}"
AI_CHAT_PARENT_ORIGIN="${AI_CHAT_PARENT_ORIGIN:-https://www.guitarxiaohe.top}"

SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
SSH_OPTS=(-p "$DEPLOY_PORT")
SCP_OPTS=(-P "$DEPLOY_PORT")

echo "==> 构建前端产物..."
cd "$REPO_DIR"
pnpm build:prod

echo "==> 构建 AI 客服产物..."
cd "$AI_CHAT_DIR"
VITE_APP_BASE="$AI_CHAT_BASE_PATH" \
VITE_API_BASE_URL="$AI_CHAT_API_BASE_URL" \
VITE_PARENT_ORIGIN="$AI_CHAT_PARENT_ORIGIN" \
pnpm build

echo "==> 准备 Docker 部署包..."
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
cp -R "$REPO_DIR/dist" "$DEPLOY_DIR/dist"
cp -R "$AI_CHAT_DIR/dist" "$DEPLOY_DIR/aichat-dist"
cp "$REPO_DIR/deploy/vue/Dockerfile" "$DEPLOY_DIR/Dockerfile"
cp "$REPO_DIR/deploy/vue/docker-compose.yml" "$DEPLOY_DIR/docker-compose.yml"
cp "$REPO_DIR/deploy/vue/nginx.conf" "$DEPLOY_DIR/nginx.conf"

mkdir -p "$(dirname "$ARCHIVE_PATH")"
tar -C "$DEPLOY_DIR" -czf "$ARCHIVE_PATH" .

echo "==> 上传到服务器：$SSH_TARGET:$REMOTE_DIR"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "mkdir -p '$REMOTE_DIR'"
scp "${SCP_OPTS[@]}" "$ARCHIVE_PATH" "$SSH_TARGET:$REMOTE_ARCHIVE"

echo "==> 远程解压并部署 Docker 容器..."
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "
  set -e
  mkdir -p '$REMOTE_DIR'
  tar -xzf '$REMOTE_ARCHIVE' -C '$REMOTE_DIR'
  cd '$REMOTE_DIR'
  docker compose up -d --build
  docker compose ps
"

echo "==> 前端部署完成：https://$DEPLOY_HOST"
