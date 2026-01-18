// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'ネスぺ学習メモ',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			sidebar: [
				{
					label: 'ALL NOTES',
					autogenerate: { directory: 'notes' },
				},
			],
		}),
		mermaid(),
	],
});
