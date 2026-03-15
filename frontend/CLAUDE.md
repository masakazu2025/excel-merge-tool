# CLAUDE.md - Frontend

## 技術スタック

- React 18 + TypeScript
- Vite（ビルドツール）
- Tailwind CSS（スタイリング）
- vitest + @testing-library（テスト）

## ディレクトリ構成

```
frontend/src/
├── main.tsx            # エントリポイント
├── App.tsx             # ルーティング
├── types/
│   └── diff.ts         # 差分スキーマの型定義（バックエンドと同期）
├── components/
│   ├── DiffGrid.tsx    # 差分グリッド（色分け表示）
│   └── CellDetailModal.tsx  # セル詳細モーダル
├── pages/
│   ├── Home.tsx        # ファイル選択・比較実行
│   ├── Report.tsx      # 差分レポート表示
│   └── History.tsx     # 比較履歴一覧
└── tests/
    └── *.test.tsx      # 振舞ごとのテストファイル
```

## コーディング規約

### 型
- `types/diff.ts` の型定義はバックエンドのスキーマと常に同期する
- `any` は使用禁止、`unknown` + 型ガードを使う

### API 呼び出し
- fetch エラーは F001（ネットワーク）/ F002（APIエラー）/ F003（JSON不正）に分けて処理
- エラーメッセージは `data?.detail?.message` から取得する

### スタイリング
- Tailwind CSS のユーティリティクラスのみ使用
- インラインスタイルは使用禁止
- カスタム CSS は最小限に留める

### テスト
- 振舞ファイル（B-XXX.md）1つにつきテストファイル1つ
- API 呼び出しは `vi.stubGlobal('fetch', ...)` でモックする
- コンポーネントのレンダリングは `@testing-library/react` の `render` を使用
