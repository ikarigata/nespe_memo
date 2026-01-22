import type { ReactNode } from 'react';

interface PerplexitySearchProps {
  children: ReactNode;
}

/**
 * Perplexity検索へのリンクコンポーネント
 *
 * childrenのテキストを使って、ネットワークスペシャリスト試験対策用の
 * プロンプトを自動生成してPerplexityで検索するリンクを作成します。
 *
 * @example
 * ```tsx
 * <PerplexitySearch>VLAN</PerplexitySearch>
 * ```
 */
export default function PerplexitySearch({ children }: PerplexitySearchProps) {
  // childrenからテキストを抽出
  const text = typeof children === 'string' ? children : String(children);

  // プロンプトテンプレート
  const prompt = `ネットワークスペシャリスト試験の対策として、${text}について簡潔に解説して
特に、その技術や概念の歴史的・空間的な文脈での位置づけや、それが解決する課題・抱える課題などについても触れつつ説明してほしい`;

  // URLエンコード
  const encodedQuery = encodeURIComponent(prompt);
  const perplexityUrl = `https://www.perplexity.ai/search?q=${encodedQuery}`;

  return (
    <a
      href={perplexityUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="perplexity-search-link"
      style={{
        color: '#20808d',
        textDecoration: 'underline',
        fontWeight: '500',
      }}
    >
      {children}
    </a>
  );
}
