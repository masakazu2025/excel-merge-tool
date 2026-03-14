# Excel Merge Tool - 全体概要

## 目的

3つのExcelファイル（マージ元、ファイルB、ファイルC）を比較し、
差分を人間が確認できるWebアプリを提供する。

## 対象ファイル

- 形式: `.xlsx`
- 想定サイズ: 約5MB
- 想定シート数: 20シート程度

## 比較対象（網羅性）

- セル（値・数式）
- 標準コメント
- 図形・オブジェクト
- 図形内のテキスト

---

## アーキテクチャ

```
[ブラウザ]
  ├── ① Excelファイル3つをアップロード
  └── ③ 差分レビュー画面（シートタブ・フィルター・差分テーブル）

      ↕ HTTP (localhost)

[FastAPI サーバー (Python)]
  ├── POST /api/compare   → Step 1 実行 → diff.json 保存
  ├── GET  /api/reports   → 保存済みレポート一覧
  ├── GET  /api/reports/{id} → diff.json 取得
  └── GET  /*             → React ビルド成果物を静的配信

[Step 1: Python コアロジック]
  └── ZIP解凍 → XML比較 → 差分抽出 → diff.json

[output/]
  └── {timestamp}_diff.json  （比較結果の保存先）
```

---

## 実装ステップ一覧

| Step | 担当技術 | 主な処理 | 詳細ドキュメント |
|------|----------|----------|-----------------|
| 1 | Python | ZIP解凍・XMLパース・差分抽出 | [step1.md](feature/step1_python_extraction.md) |
| 2 | FastAPI | APIエンドポイント・静的ファイル配信 | [step2_fastapi_server.md](feature/step2_fastapi_server.md) |
| 3 | React + Vite + Tailwind | アップロード画面・差分レビューUI | [step3_frontend_ui.md](feature/step3_frontend_ui.md) |

---

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| バックエンド | Python / FastAPI / uvicorn |
| フロントエンド | React 18 / Vite / TypeScript / Tailwind CSS |
| Excel解析 | Python 標準ライブラリ（zipfile / xml.etree） |
| 実行方法 | `python src/main.py` → `http://localhost:8080` |

---

## 未確認・要議論の前提事項

- [ ] ファイルBとCの関係: 同一マージ元から独立して編集した2人分の変更か？
- [ ] 競合ルール: BとCが同じセルを異なる値に変更した場合の扱い（UI上での選択 or 優先順位ルール）
- [ ] 利用環境: Excel for Windows のみか / Mac Excel・オフライン環境の考慮
- [ ] 実行頻度: 一度きりのツールか / 繰り返し使う運用か
- [ ] 書式変更の扱い: 値は同じで書式だけ変わったセルをマージ対象にするか
