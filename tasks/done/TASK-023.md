---
id: TASK-023
title: ロガー実装
type: impl
status: done
refs: []
files:
  - backend/config/logging.yaml
  - backend/src/logger.py
  - backend/src/main.py
---

## やること

- config/logging.yaml でレベル・ローテーション設定を管理
- コンソール WARNING 以上、ファイル INFO 以上
- app.log を日次ローテーション（app_YYYY-MM-DD.log）、backupCount 設定可能
- エラー時はファイルにスタックトレースを出力（logger.exception）
- main.py 起動時にロガーを初期化する

## やらないこと

- 各モジュールへのログ出力追加（別途議論）
- フロントエンドのログ
- 構造化ログ（JSON形式）

## 完了条件

- [ ] config/logging.yaml が作成されている
- [ ] backend/src/logger.py が作成されている
- [ ] main.py 起動時にロガーが初期化される
- [ ] ローテーション後のファイル名が app_YYYY-MM-DD.log になる
