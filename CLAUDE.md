# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

**Astro** と **Starlight** で構築されたネットワークスペシャリスト試験の学習メモサイト。Mermaid図によるネットワーク概念の可視化をサポート。

## コマンド

すべてのコマンドは `/workspaces/nespe_memo/site` ディレクトリで実行:

```bash
npm install          # 依存関係のインストール
npm run dev          # 開発サーバー起動 (localhost:4321)
npm run build        # 本番用ビルド (./dist/ に出力) ※Mermaid構文検証を含む
npm run preview      # 本番ビルドのプレビュー
npm run astro check  # TypeScript型チェック
npm run validate:mermaid  # Mermaid構文のみ検証
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

### Mermaid構文検証

`npm run build` 実行時にMermaid構文エラーがあるとビルドが失敗する。エラー時はファイル名・行番号・詳細が表示される。

**注意すべき特殊文字:**
- **セミコロン `;`** - sequenceDiagramで行終端として解釈される → 全角 `；` を使用
- **括弧 `()`** - ノード形状として解釈される → ラベルを引用符で囲む `["テキスト(補足)"]`

```mermaid
# NG: セミコロンがあるとエラー
DNS-->>Receiver: v=DKIM1; p=公開鍵

# OK: 全角セミコロンを使用
DNS-->>Receiver: v=DKIM1；p=公開鍵

# NG: 括弧がノード形状として解釈される
TAG[802.1Qタグ(4バイト)]

# OK: 引用符で囲む
TAG["802.1Qタグ(4バイト)"]
```

## TCP/IP シミュレータ (`site/src/lib/tcpip_sim/`)

ネットワークプロトコルの動作をシミュレートするTypeScriptライブラリ。

### ドキュメント

| ファイル | 内容 |
|----------|------|
| `doc.md` | 設計ドキュメント（全体方針、データモデル、ロードマップ） |
| `IMPLEMENTATION.md` | 実装ドキュメント（実装済み機能、使用方法、API） |
| `TODO.md` | 改善点・今後のTODOリスト |
| `layer3/README.md` | Layer 3（ネットワーク層）実装TODO・設計メモ |

### 基本方針

**適度に抽象化しつつも、現実世界と大きな齟齬がないようにする**

1. **プロトコル仕様（RFC等）に忠実であること**
   - パケット構造は現実のプロトコルと対応させる
   - 動作フローは実際のネットワーク機器と同じにする
   - 例：ARPのRequestとReplyは同じフレーム構造で`operation`フィールドのみで区別（RFC 826準拠）

2. **教育目的での適切な簡略化**
   - 固定値フィールド（Hardware Type、Protocol Typeなど）は省略可
   - 学習の本質に関わらない部分は抽象化してよい
   - ただし、コメントで「何を省略したか」を明記すること

3. **現実との対応を明示**
   - 実際のパケット構造を図やコメントで示す
   - バイナリ表現は型システムで抽象化してよいが、概念は保持する
   - Wiresharkでキャプチャした場合の見え方を想像できる設計にする

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
