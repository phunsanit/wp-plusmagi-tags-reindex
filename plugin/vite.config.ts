// plugin/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		outDir: '../SVN/trunk/js', // Output ไปที่โฟลเดอร์ที่ PHP โหลด
		emptyOutDir: false, // อย่าลบไฟล์อื่นในโฟลเดอร์
		lib: {
			entry: '../SVN/trunk/js/plusmagi-tags-reindex.tsx',
			name: 'plusmagiTagsReindex',
			formats: ['iife'],
			fileName: () => 'plusmagi-tags-reindex.js',
		},
		rollupOptions: {
			external: [
				'react',
				'react-dom',
				/^@wordpress\//,
			],
			output: {
				globals: {
					'react': 'React',
					'react-dom': 'ReactDOM',
					'@wordpress/element': 'wp.element',
					'@wordpress/components': 'wp.components',
					'@wordpress/data': 'wp.data',
					'@wordpress/api-fetch': 'wp.apiFetch',
					'@wordpress/i18n': 'wp.i18n',
					'@wordpress/plugins': 'wp.plugins',
					'@wordpress/editor': 'wp.editor',
					'@wordpress/edit-post': 'wp.editPost',
				},
			},
		},
	},
});