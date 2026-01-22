import type { Root, Element, Text } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * rehypeプラグイン: テーブルを横スクロール可能なdivでラップする
 *
 * - デフォルト: 左列固定 (table-wrapper--sticky)
 * - 最初のセルが「~」で始まる場合: 左列固定しない (table-wrapper--no-sticky)
 *   例: | ~項目 | 説明 |
 */
export default function rehypeTableWrapper() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'table' && parent && typeof index === 'number') {
        const { noSticky, firstTextNode } = checkNoStickyMarker(node);

        // マーカーを削除
        if (noSticky && firstTextNode) {
          firstTextNode.value = firstTextNode.value.slice(1);
        }

        const wrapper: Element = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['table-wrapper', noSticky ? 'table-wrapper--no-sticky' : 'table-wrapper--sticky']
          },
          children: [node],
        };
        parent.children[index] = wrapper;
      }
    });
  };
}

/**
 * テーブルの最初のセルが「~」で始まるかチェック
 */
function checkNoStickyMarker(table: Element): { noSticky: boolean; firstTextNode: Text | null } {
  // thead > tr > th の最初のテキストノードを探す
  const thead = table.children.find(
    (child): child is Element => child.type === 'element' && child.tagName === 'thead'
  );

  if (!thead) return { noSticky: false, firstTextNode: null };

  const tr = thead.children.find(
    (child): child is Element => child.type === 'element' && child.tagName === 'tr'
  );

  if (!tr) return { noSticky: false, firstTextNode: null };

  const firstCell = tr.children.find(
    (child): child is Element => child.type === 'element' && (child.tagName === 'th' || child.tagName === 'td')
  );

  if (!firstCell) return { noSticky: false, firstTextNode: null };

  // 最初のテキストノードを探す（再帰的に）
  const textNode = findFirstTextNode(firstCell);

  if (textNode && textNode.value.startsWith('~')) {
    return { noSticky: true, firstTextNode: textNode };
  }

  return { noSticky: false, firstTextNode: null };
}

/**
 * 要素内の最初のテキストノードを再帰的に探す
 */
function findFirstTextNode(element: Element): Text | null {
  for (const child of element.children) {
    if (child.type === 'text') {
      return child;
    }
    if (child.type === 'element') {
      const found = findFirstTextNode(child);
      if (found) return found;
    }
  }
  return null;
}
