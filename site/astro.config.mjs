// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import react from '@astrojs/react';
import remarkPerplexitySearch from './src/plugins/remark-google-search.ts';
import rehypeTableWrapper from './src/plugins/rehype-table-wrapper.ts';
import remarkZennDirectives, { remarkDirective } from './src/plugins/remark-zenn-directives.ts';

// https://astro.build/config
export default defineConfig({
	markdown: {
		remarkPlugins: [remarkDirective, remarkZennDirectives, remarkPerplexitySearch],
		rehypePlugins: [rehypeTableWrapper],
	},
	integrations: [
		starlight({
			title: 'ネスぺ学習メモ',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: '知識編',
					autogenerate: { directory: 'knowledges' },
				},
				{
					label: 'テクニック編',
					autogenerate: { directory: 'skills' },
				},
				{
					label: 'サンプル',
					autogenerate: { directory: 'samples' },
				},
			],
		}),
		mermaid(),
		react(),
	],
});
