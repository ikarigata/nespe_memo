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

## TCP/IP シミュレータ (`site/src/lib/tcpip_sim/`)

ネットワークプロトコルの動作をシミュレートするTypeScriptライブラリ。

### ドキュメント

| ファイル | 内容 |
|----------|------|
| `doc.md` | 設計ドキュメント（全体方針、データモデル、ロードマップ） |
| `IMPLEMENTATION.md` | 実装ドキュメント（実装済み機能、使用方法、API） |
| `TODO.md` | 改善点・今後のTODOリスト |

### 作業ルール

**重要: `tcpip_sim` ディレクトリに修正を加えた場合、必ず以下のドキュメントも更新すること:**

1. **`IMPLEMENTATION.md`** - 新機能追加時は使用例とAPIを追記
2. **`TODO.md`** - 完了したタスクのチェック、新規課題の追加
3. **更新履歴** - `IMPLEMENTATION.md` 末尾の更新履歴に日付と内容を追記

### ディレクトリ構成

```
tcpip_sim/
├── layer1/          # 物理層 (Signal, Port, LanCable, Hub)
├── layer2/          # データリンク層 (Ethernet, NIC, Switch, ARP)
├── layer3/          # ネットワーク層 (未実装)
├── layer4/          # トランスポート層 (未実装)
└── Utils.ts         # ユーティリティ関数
```

### 型チェック

```bash
npm run astro check  # tcpip_sim の型チェックも含む
```
