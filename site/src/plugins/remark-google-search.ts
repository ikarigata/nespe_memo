import { visit } from 'unist-util-visit';
import type { Root, Text, Link } from 'mdast';
import type { Plugin } from 'unified';

/**
 * remarkプラグイン: [[用語]] をPerplexity検索リンクに変換
 *
 * 使用例:
 *   [[TCP]] → Perplexity検索リンク（ネットワークスペシャリスト試験対策用プロンプト付き）
 */
const remarkPerplexitySearch: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;

      const text = node.value;
      const pattern = /\[\[([^\]]+)\]\]/g;

      // [[...]] パターンが含まれていない場合はスキップ
      if (!pattern.test(text)) return;

      // パターンをリセット
      pattern.lastIndex = 0;

      const newNodes: (Text | Link)[] = [];
      let lastIndex = 0;
      let match;

      // [[用語]] を検出してリンクノードに変換
      while ((match = pattern.exec(text)) !== null) {
        const searchTerm = match[1];
        const matchStart = match.index;
        const matchEnd = pattern.lastIndex;

        // マッチの前のテキスト
        if (matchStart > lastIndex) {
          newNodes.push({
            type: 'text',
            value: text.slice(lastIndex, matchStart),
          });
        }

        // Perplexity検索リンクノード（ネットワークスペシャリスト試験対策用プロンプト）
        const prompt = `ネットワークスペシャリスト試験の対策として、${searchTerm}について解説してほしい

その際は
・登場時の歴史的な文脈
・概念的なレイヤー関係
・その技術が解決した課題
・その技術が抱える課題
・隣接する諸概念とのその関係性
・ネットワークスペシャリストの過去問での問われ方

について各50字〜200字で触れて

また、上記の記載にあたっては
・箇条書きを多用する
・体言止めは避け、文の形で書く

を意識して`;
        const searchUrl = `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`;
        newNodes.push({
          type: 'link',
          url: searchUrl,
          children: [
            {
              type: 'text',
              value: searchTerm,
            },
          ],
        });

        lastIndex = matchEnd;
      }

      // 残りのテキスト
      if (lastIndex < text.length) {
        newNodes.push({
          type: 'text',
          value: text.slice(lastIndex),
        });
      }

      // 親ノードの子要素を置き換え
      parent.children.splice(index, 1, ...newNodes);
    });
  };
};

export default remarkPerplexitySearch;
