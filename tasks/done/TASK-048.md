---
id: TASK-048
title: README をポートフォリオ向けに整える
type: docs
status: done
refs:
  - docs/purpose.md
  - docs/workflow.md
files:
  - README.md
---

# TASK-048 README をポートフォリオ向けに整える

## やること

README に次の3点を追加する。
1. **現状とマージ機能の位置付け**：冒頭に「目的は3ファイルのマージ支援（docs/purpose.md）。現在は差分比較・閲覧まで実装済みで、マージ機能は今後の予定」と明記する
2. **スクリーンショット**：`docs/manual/screenshots/report.png` を1枚貼る
3. **開発の進め方**：要件 → 振舞 → タスク → 実装の流れ、`docs/` の構造、CLAUDE.md の運用（1指示1タスク、`files:` のみ変更）を数行で説明し、`docs/workflow.md` へリンクする

## やらないこと

- リポジトリ名の変更（目的がマージ支援なので名前は据え置く）
- docs/ 配下の既存ドキュメントの変更

## 完了条件

- [x] README を読めば「何のツールか・今どこまでできているか・どう開発しているか」が分かる
- [x] 画像とリンクが GitHub 上で表示される
