#!/usr/bin/env node
/**
 * Mermaid構文検証スクリプト
 *
 * ビルド前に実行してMermaidコードブロックの構文エラーを検出する
 * 使用方法: node scripts/validate-mermaid.mjs
 */

import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DOCS_DIR = join(__dirname, '../src/content/docs');

// jsdomでブラウザ環境をシミュレート
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  pretendToBeVisual: true,
});

// グローバルオブジェクトを設定（読み取り専用プロパティに注意）
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;

// navigatorはglobalではなくwindowから参照されるようにする
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  writable: false,
  configurable: true,
});

// SVGElementのモック
if (!globalThis.window.SVGElement) {
  globalThis.window.SVGElement = globalThis.window.Element;
}

/**
 * ディレクトリを再帰的に探索してファイルを取得
 */
async function* walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
      yield fullPath;
    }
  }
}

/**
 * Mermaidコードブロックを抽出
 */
function extractMermaidBlocks(content, filePath) {
  const blocks = [];
  const regex = /```mermaid\s*\n([\s\S]*?)```/g;
  let match;
  let lineNumber = 1;

  while ((match = regex.exec(content)) !== null) {
    // マッチ位置までの行数を計算
    const beforeMatch = content.substring(0, match.index);
    lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

    blocks.push({
      code: match[1].trim(),
      line: lineNumber,
      file: filePath,
    });
  }

  return blocks;
}

/**
 * Mermaid構文を検証
 */
async function validateMermaid(blocks) {
  // mermaidを動的にインポート（jsdom環境設定後）
  const mermaid = (await import('mermaid')).default;

  mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true,
  });

  const errors = [];

  for (const block of blocks) {
    try {
      await mermaid.parse(block.code, { suppressErrors: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push({
        file: block.file,
        line: block.line,
        code: block.code,
        message: errorMessage,
      });
    }
  }

  return errors;
}

/**
 * メイン処理
 */
async function main() {
  console.log('Mermaid構文検証を開始...\n');

  const allBlocks = [];

  // すべてのMarkdownファイルからMermaidブロックを収集
  for await (const filePath of walkDir(DOCS_DIR)) {
    const content = await readFile(filePath, 'utf-8');
    const blocks = extractMermaidBlocks(content, relative(DOCS_DIR, filePath));
    allBlocks.push(...blocks);
  }

  console.log(`検出されたMermaidブロック: ${allBlocks.length}件\n`);

  if (allBlocks.length === 0) {
    console.log('Mermaidブロックが見つかりませんでした。');
    process.exit(0);
  }

  // 構文検証
  const errors = await validateMermaid(allBlocks);

  if (errors.length === 0) {
    console.log('すべてのMermaidブロックの構文が正常です。');
    process.exit(0);
  }

  // エラー出力
  console.error(`\n🚨 Mermaid構文エラーが検出されました (${errors.length}件)\n`);

  for (const error of errors) {
    console.error(`┌─ Mermaid Syntax Error ─────────────────────────`);
    console.error(`│ File: ${error.file}:${error.line}`);
    console.error(`│ Error: ${error.message}`);
    console.error(`│ Code:`);
    const codeLines = error.code.split('\n').slice(0, 5);
    for (const line of codeLines) {
      console.error(`│   ${line}`);
    }
    if (error.code.split('\n').length > 5) {
      console.error(`│   ...`);
    }
    console.error(`└────────────────────────────────────────────────\n`);
  }

  process.exit(1);
}

main().catch((error) => {
  console.error('検証スクリプトでエラーが発生しました:', error);
  process.exit(1);
});
