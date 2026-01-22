import { visit } from 'unist-util-visit';
import type { Root, Text, Link } from 'mdast';
import type { Plugin } from 'unified';

/**
 * remarkプラグイン: [[用語]] をGoogle検索リンクに変換
 *
 * 使用例:
 *   [[TCP]] → <a href="https://www.google.com/search?q=ネットワークスペシャリスト TCP">TCP</a>
 */
const remarkGoogleSearch: Plugin<[], Root> = () => {
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

        // Google検索リンクノード
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`ネットワークスペシャリスト ${searchTerm}`)}`;
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

export default remarkGoogleSearch;
