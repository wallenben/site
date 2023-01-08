/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
	},
	plugins: [require('@tailwindcss/typography'), require('daisyui')],
	daisyui: {
		themes: [
			{
				emerald: {
					...require('daisyui/src/colors/themes')['[data-theme=emerald]'],
					'.sidebar': {
						'background-color': '#F9FAFB',
					},
				},

				forest: {
					...require('daisyui/src/colors/themes')['[data-theme=forest]'],
					'.sidebar': {
						'background-color': 'hsl(var(--b2))',
					},
				},
			},
		],
	},
};
