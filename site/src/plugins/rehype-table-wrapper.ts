import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * rehypeプラグイン: テーブルを横スクロール可能なdivでラップする
 */
export default function rehypeTableWrapper() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'table' && parent && typeof index === 'number') {
        const wrapper: Element = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrapper'] },
          children: [node],
        };
        parent.children[index] = wrapper;
      }
    });
  };
}
