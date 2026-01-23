import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import remarkDirective from 'remark-directive';

/**
 * remarkプラグイン: Zenn風のカスタムディレクティブを処理
 *
 * サポートするディレクティブ:
 * 1. :::message ... ::: - 情報メッセージボックス
 * 2. :::message alert ... ::: - 警告メッセージボックス
 * 3. :::details タイトル ... ::: - 折りたたみ可能なセクション
 *
 * 使用例:
 *   :::message
 *   これは情報メッセージです
 *   :::
 *
 *   :::message alert
 *   これは警告メッセージです
 *   :::
 *
 *   :::details クリックして詳細を表示
 *   ここに詳細な内容が入ります
 *   :::
 */
const remarkZennDirectives: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      // containerDirective (:::) の処理
      if (node.type === 'containerDirective') {
        const data = node.data || (node.data = {});

        // :::message または :::message alert
        if (node.name === 'message') {
          const isAlert = node.attributes?.alert !== undefined ||
                         (node.children[0]?.type === 'paragraph' &&
                          node.children[0]?.children[0]?.value === 'alert');

          // 最初のテキストが "alert" の場合は削除
          if (isAlert && node.children[0]?.type === 'paragraph' &&
              node.children[0]?.children[0]?.value === 'alert') {
            node.children[0].children.shift();
            // 空になったparagraphを削除
            if (node.children[0].children.length === 0) {
              node.children.shift();
            }
          }

          data.hName = 'div';
          data.hProperties = {
            className: isAlert ? 'zenn-message zenn-message-alert' : 'zenn-message',
          };
        }

        // :::details タイトル
        else if (node.name === 'details') {
          // タイトルを取得（最初のparagraphから）
          let title = 'Details';
          if (node.children[0]?.type === 'paragraph') {
            const firstChild = node.children[0].children[0];
            if (firstChild?.type === 'text') {
              title = firstChild.value;
              node.children.shift(); // タイトル部分を削除
            }
          }

          // <details> タグに変換
          data.hName = 'details';
          data.hProperties = {
            className: 'zenn-details',
          };

          // <summary> タグを追加
          node.children.unshift({
            type: 'paragraph',
            data: {
              hName: 'summary',
              hProperties: {
                className: 'zenn-details-summary',
              },
            },
            children: [
              {
                type: 'text',
                value: title,
              },
            ],
          });
        }
      }
    });
  };
};

/**
 * プラグインのエクスポート
 * directiveプラグインと組み合わせて使用する必要がある
 */
export default remarkZennDirectives;
export { remarkDirective };
