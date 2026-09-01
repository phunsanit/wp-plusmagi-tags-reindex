// @ts-check
const { test, expect, request } = require('@playwright/test');
const { normalizeWpUrl } = require('../wordpress-config');

const RUN_ROLE_ACCESS = String(process.env.WP_RUN_ROLE_ACCESS || 'false') === 'true';

test.describe('PlusMagi Tags Reindex - role access', () => {
	test('editor Application Password follows the protected REST route policy', async () => {
		test.skip(!RUN_ROLE_ACCESS, 'Set WP_RUN_ROLE_ACCESS=true to run role policy assertions.');

		const username = process.env.WP_EDITOR_USER || '';
		const applicationPassword = process.env.WP_EDITOR_APPLICATION_PASSWORD || '';
		test.skip(!username || !applicationPassword, 'WP_EDITOR_USER and WP_EDITOR_APPLICATION_PASSWORD are required.');

		const context = await request.newContext({
			baseURL: normalizeWpUrl(process.env.WP_URL),
			extraHTTPHeaders: {
				Authorization: `Basic ${Buffer.from(`${username}:${applicationPassword}`).toString('base64')}`,
			},
		});

		try {
			const identityResponse = await context.get('/wp-json/wp/v2/users/me');
			expect(identityResponse.status()).toBe(200);

			const statsResponse = await context.get('/wp-json/plusmagi-tags/v1/terms-with-stats?ids=1');
			expect(statsResponse.status()).toBe(200);
		} finally {
			await context.dispose();
		}
	});
});
