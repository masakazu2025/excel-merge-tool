---
id: TASK-005
title: バックエンドエラーハンドリング実装
type: impl
status: ready
refs:
  - docs/requirements/backend/REQ-006_error_handling/behaviors/B-030.md
  - docs/requirements/backend/REQ-006_error_handling/errors.md
files:
  - backend/src/extractor.py
  - backend/src/api/compare.py
  - backend/src/api/reports.py
---

## やること

B-030 の全振舞を実装する。

- カスタム例外クラス `AppError(error_code, message)` を定義
- `extractor.py` に E001〜E005 のエラーハンドリングを追加
- `compare.py` で AppError を HTTPException に変換して返す
- `reports.py` で E006・E007 を返す

## やらないこと

- フロントエンドの変更
- ログファイルへの永続化（print/logging で標準出力のみ）

## 完了条件

- [ ] 不正な拡張子のファイルで E001 が返る
- [ ] 壊れた ZIP で E002 が返る
- [ ] workbook.xml なしで E002 が返る
- [ ] 全シートが見つからない場合に E003 が返る
- [ ] XML パース失敗で E004 が返る
- [ ] 予期せぬ例外で E005 が返る（元例外はログ出力）
- [ ] 存在しない report_id で E006 が返る
- [ ] JSON 読み込み失敗で E007 が返る
