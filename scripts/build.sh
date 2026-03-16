#!/bin/bash
# excel-merge-tool ビルドスクリプト
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== 1. フロントエンドビルド ==="
cd "$ROOT/frontend"
npm run build

echo "=== 2. PyInstaller ビルド ==="
cd "$ROOT/backend"
.venv/bin/python -m PyInstaller excel_merge_tool.spec --clean --noconfirm

echo "=== 完了 ==="
echo "出力先: $ROOT/backend/dist/excel-merge-tool"
