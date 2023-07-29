/* eslint-env node */
module.exports = {
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	root: true,
	env: {
		node: true,
		browser: true,
		es6: true,
	},
	ignorePatterns: ['snap/snaps-webpack-plugin/*.js', '**/dist'],
	rules: {
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/no-var-requires': 'off',
		'@typescript-eslint/ban-ts-comment': 'off',
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': [
			'warn', // or "error"
		],
	},
};
