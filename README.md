# ネットワークスペシャリスト学習メモ (nespe_memo)

ネットワークスペシャリスト試験（NW）合格に向けた学習メモサイトのリポジトリです。
知識の整理、試験対策テクニック、関連技術のまとめなどを掲載しています。

## 概要

このプロジェクトは静的サイトジェネレーター [Astro](https://astro.build/) と、ドキュメントテーマ [Starlight](https://starlight.astro.build/) を使用して構築されています。

### 主なコンテンツ

- **知識編 (Knowledge)**: ネットワーク技術の基礎から応用まで、試験範囲を網羅的に学習するためのメモ。
- **テクニック編 (Skill)**: 午後試験の記述対策や、問題文の読み解き方などの実践的なテクニック。
- **サンプル (Samples)**: サイト内で使用しているコンポーネント（Mermaid図、クイズなど）の動作サンプル。

## 開発環境のセットアップ

このリポジトリをクローンした後、以下の手順でローカル開発環境を立ち上げることができます。
サイトのソースコードは `site/` ディレクトリ配下にあります。

### 前提条件

- Node.js (推奨バージョン: v18以上)

### インストールと起動

1. `site` ディレクトリに移動します。
   ```bash
   cd site
   ```

2. 依存関係をインストールします。
   ```bash
   npm install
   ```

3. 開発サーバーを起動します。
   ```bash
   npm run dev
   ```

   ブラウザで `http://localhost:4321` にアクセスすると、プレビューが表示されます。

## 技術スタック

- **Framework**: [Astro](https://astro.build/)
- **Theme**: [Starlight](https://starlight.astro.build/)
- **UI Library**: React
- **Diagrams**: Mermaid (via `astro-mermaid`)

## ディレクトリ構成

```text
.
├── site/               # Astroプロジェクト本体
│   ├── src/
│   │   ├── content/    # 記事コンテンツ (Markdown/MDX)
│   │   ├── components/ # Reactコンポーネント
│   │   └── ...
│   ├── public/         # 静的アセット
│   └── ...
├── todo.md             # 記事作成TODOリスト
└── README.md           # このファイル
```
