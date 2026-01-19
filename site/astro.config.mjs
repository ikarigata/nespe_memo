// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	integrations: [
		mermaid({
			theme: 'dark',
			// @ts-ignore
			autoTheme: false,
		}),
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
		react(),
	],
});
