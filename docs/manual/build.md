# ビルド手順

## 前提条件

以下のツールが Windows にインストールされていること。

| ツール | バージョン | ダウンロード | 確認コマンド |
|--------|-----------|------------|------------|
| Python | 3.12 以上 | [python.org/downloads](https://www.python.org/downloads/) | `python --version` |
| Node.js | 18 以上（LTS推奨） | [nodejs.org/download](https://nodejs.org/en/download) | `node --version` |
| Git | 任意 | [git-scm.com](https://git-scm.com/downloads) | `git --version` |

---

## 手順

### 1. リポジトリを取得する

**Git を使う場合：**
```
git clone https://github.com/masakazu2025/excel-merge-tool.git
cd excel-merge-tool
```

**zip でダウンロードする場合：**

GitHub のリポジトリページから「Code → Download ZIP」でダウンロードし、任意のフォルダに展開する。

---

### 2. build.bat を実行する

プロジェクトフォルダ直下の `build.bat` をダブルクリックする。

以下の処理が自動的に実行される：

| ステップ | 内容 |
|---------|------|
| [0] | Python 仮想環境の作成と依存パッケージのインストール（初回のみ） |
| [1] | フロントエンド（React）のビルド |
| [2] | 前回のビルド成果物を削除 |
| [3] | PyInstaller で exe をビルド |
| [4] | リリースパッケージを `dist/v0.1_YYYYMMDDHHMMSS/` に集約 |
| [5] | 中間ファイルを削除 |

> 初回は依存パッケージのインストールがあるため、数分かかる場合がある。

---

### 3. 出力物を確認する

ビルド完了後、以下のフォルダが生成される。

```
dist/
└── v0.1_20260315192059/
    └── excel-merge-tool/
        ├── excel-merge-tool.exe   ← 起動ファイル
        ├── config/
        │   └── logging.yaml       ← ログ設定（編集可）
        └── _internal/             ← ランタイムファイル（変更不要）
```

`excel-merge-tool/` フォルダをまるごとコピーして配布できる。

---

## トラブルシューティング

**`python` が見つからない**
: Python のインストール時に「Add Python to PATH」にチェックを入れていない。Python を再インストールするか、PATH を手動で追加する。

**`npm` が見つからない**
: Node.js がインストールされていない。[nodejs.org/en/download](https://nodejs.org/en/download) からインストールする。

**PyInstaller でエラーが出る**
: `backend\.venv_win` フォルダを削除してから `build.bat` を再実行すると、仮想環境が作り直される。
