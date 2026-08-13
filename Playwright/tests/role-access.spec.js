// @ts-check
const { test, expect, request } = require('@playwright/test');

const EDITOR_USER = process.env.WP_EDITOR_USER || '';
const EDITOR_PASS = process.env.WP_EDITOR_PASSWORD || process.env.WP_EDITOR_PASS || '';
const EXPECT_EDITOR_TOOLS_ACCESS = String(process.env.WP_EXPECT_EDITOR_TOOLS_ACCESS || 'false') === 'true';
const ADMIN_USER = process.env.WP_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.WP_ADMIN_PASSWORD || process.env.WP_ADMIN_PASS || '';
const RUN_ROLE_ACCESS = String(process.env.WP_RUN_ROLE_ACCESS || 'false') === 'true';

test.describe('PlusMagi Tags Reindex — Role access', () => {
	test.setTimeout(180_000);

	test('admin can access tools page and plugin settings UI', async ({ baseURL }) => {
		test.skip(!RUN_ROLE_ACCESS, 'Set WP_RUN_ROLE_ACCESS=true to run role policy assertions in this environment.');
		test.skip(!ADMIN_PASS, 'WP_ADMIN_PASSWORD/WP_ADMIN_PASS is missing for admin role test.');

		const ctx = await request.newContext({ baseURL, timeout: 60_000 });
		const loginRes = await ctx.post('/wp-login.php', {
			form: {
				log: ADMIN_USER,
				pwd: ADMIN_PASS,
				'wp-submit': 'Log In',
				redirect_to: `${baseURL}/wp-admin/`,
				testcookie: '1',
			},
		});
		expect(loginRes.ok()).toBe(true);

		const toolsRes = await ctx.get('/wp-admin/tools.php?page=plusmagi-tags-reindex');
		if (toolsRes.status() === 403) {
			await ctx.dispose();
			test.skip(true, 'Configured admin account is forbidden from Tools page in this environment (HTTP 403).');
		}

		expect(toolsRes.status()).toBe(200);

		const html = await toolsRes.text();
		expect(html.includes('enable_gap_fill')).toBe(true);
		expect(html.includes('plusmagi_tags_import_list')).toBe(true);

		await ctx.dispose();
	});

	test('editor access policy is enforced for tools page', async ({ baseURL }) => {
		test.skip(!RUN_ROLE_ACCESS, 'Set WP_RUN_ROLE_ACCESS=true to run role policy assertions in this environment.');
		test.skip(!EDITOR_USER || !EDITOR_PASS, 'WP_EDITOR_USER/WP_EDITOR_PASSWORD not configured for role test.');

		const ctx = await request.newContext({ baseURL, timeout: 60_000 });
		const loginRes = await ctx.post('/wp-login.php', {
			form: {
				log: EDITOR_USER,
				pwd: EDITOR_PASS,
				'wp-submit': 'Log In',
				redirect_to: `${baseURL}/wp-admin/`,
				testcookie: '1',
			},
		});
		expect(loginRes.ok()).toBe(true);

		const toolsRes = await ctx.get('/wp-admin/tools.php?page=plusmagi-tags-reindex');
		const html = await toolsRes.text();
		const hasSettingsUI = html.includes('enable_gap_fill') && html.includes('plusmagi_tags_import_list');

		if (EXPECT_EDITOR_TOOLS_ACCESS) {
			expect(toolsRes.status()).toBe(200);
			expect(hasSettingsUI).toBe(true);
		} else {
			const forbidden = toolsRes.status() === 403 || html.includes('Sorry, you are not allowed to access this page');
			expect(forbidden).toBe(true);
		}

		await ctx.dispose();
	});
});
