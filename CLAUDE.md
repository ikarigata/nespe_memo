# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

**Astro** と **Starlight** で構築されたネットワークスペシャリスト試験の学習メモサイト。Mermaid図によるネットワーク概念の可視化をサポート。

## コマンド

すべてのコマンドは `/workspaces/nespe_memo/site` ディレクトリで実行:

```bash
npm install          # 依存関係のインストール
npm run dev          # 開発サーバー起動 (localhost:4321)
npm run build        # 本番用ビルド (./dist/ に出力)
npm run preview      # 本番ビルドのプレビュー
npm run astro check  # TypeScript型チェック
```

## アーキテクチャ

- **フレームワーク**: Astro v5 + Starlight ドキュメントテーマ
- **コンテンツ配置**: `site/src/content/docs/` - Markdown/MDXファイルが自動的にページとしてルーティング
- **Mermaid対応**: Markdown内で ` ```mermaid` コードブロックを使用して図を描画
- **サイドバー設定**: `notes/` ディレクトリから自動生成 (`astro.config.mjs` で設定)

## コンテンツ作成

`site/src/content/docs/notes/` に `.md` または `.mdx` ファイルを追加。各ファイルには最低限 `title` フィールドを含むフロントマターが必要:

```markdown
---
title: ページタイトル
---

コンテンツ...
```

Mermaid図のラベルには日本語テキストが使用可能。
