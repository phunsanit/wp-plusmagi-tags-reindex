// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PlusMagi Tags Reindex - authenticated REST API', () => {
	test('authenticates with the configured Application Password', async ({ request }) => {
		const response = await request.get('/wp-json/wp/v2/users/me?context=edit');

		expect(response.status()).toBe(200);
		const user = await response.json();
		expect(user.id).toBeGreaterThan(0);
		expect(user.slug).toBeTruthy();
	});

	test('accesses the protected term statistics endpoint', async ({ request }) => {
		const response = await request.get('/wp-json/plusmagi-tags/v1/terms-with-stats?ids=1');

		expect(response.status()).toBe(200);
		expect(Array.isArray(await response.json())).toBe(true);
	});

	test('adds and removes a tag through authenticated REST requests', async ({ request }) => {
		const name = `PlaywrightApplicationPassword_${Date.now()}`;
		const addResponse = await request.post('/wp-json/plusmagi-tags/v1/add-tag', {
			data: { name, reindex_gaps: false },
		});

		expect(addResponse.status()).toBe(200);
		const result = await addResponse.json();
		expect(result.ids).toHaveLength(1);

		const deleteResponse = await request.delete(`/wp-json/wp/v2/tags/${result.ids[0]}?force=true`);
		expect(deleteResponse.status()).toBe(200);
	});
});