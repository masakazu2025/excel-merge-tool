---
id: TASK-026
title: 各モジュールにログ出力追加
type: impl
status: done
refs:
  - backend/CLAUDE.md
files:
  - backend/src/main.py
  - backend/src/extractor.py
  - backend/src/api/compare.py
  - backend/src/api/reports.py
---

## やること

ログ出力規約に従い、各モジュールに logger を追加する。

| モジュール | INFO | WARNING | ERROR |
|-----------|------|---------|-------|
| main.py | サーバー起動 | — | — |
| extractor.py | 抽出開始・完了 | — | E002〜E005（exception）|
| compare.py | 比較開始・完了（ファイル名、差分数） | — | AppError 発生時 |
| reports.py | レポート取得 | — | E006/E007 発生時 |

## やらないこと

- logger.py の変更
- テストコードの変更

## 完了条件

- [ ] 各モジュールで `get_logger(__name__)` を使用している
- [ ] INFO / ERROR が規約通りに出力される
