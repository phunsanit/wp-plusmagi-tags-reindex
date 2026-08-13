// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PlusMagi Tags Reindex — API error path', () => {
	test.setTimeout(180_000);

	test('handles add-tag API 500 response without crashing editor panel', async ({ page }) => {
		await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded', timeout: 90_000 });

		test.skip(!(await page.locator('#wpadminbar').count()), 'Environment user cannot access wp-admin post editor.');
		await page.locator('.edit-post-layout').waitFor({ state: 'visible', timeout: 90_000 });

		const welcomeClose = page.locator('.components-modal__header button').first();
		if (await welcomeClose.isVisible({ timeout: 2500 }).catch(() => false)) {
			await welcomeClose.click();
		}

		const panelToggle = page.locator('button.components-panel__body-toggle').filter({ hasText: /PlusMagi Tags Reindex/i });
		await expect(panelToggle).toBeVisible({ timeout: 30_000 });
		if ((await panelToggle.getAttribute('aria-expanded')) === 'false') {
			await panelToggle.click();
		}

		const tagInput = page
			.locator('.plusmagi-tags-reindex-panel .components-form-token-field__input, .plusmagi-tags-reindex-panel input[type="text"], input[placeholder="Add new tag"]')
			.first();
		await expect(tagInput).toBeVisible({ timeout: 30_000 });

		const failingTag = `PlaywrightApiError_${Date.now()}`;
		let requestCount = 0;

		await page.route('**/*plusmagi-tags/v1/add-tag*', async (route) => {
			requestCount += 1;
			await route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ code: 'internal_error', message: 'Simulated error' }),
			});
		});

		const requestPromise = page.waitForRequest(
			(req) => req.method() === 'POST' && req.url().includes('/plusmagi-tags/v1/add-tag'),
			{ timeout: 20_000 }
		);

		await tagInput.fill(failingTag);
		await tagInput.press(',');
		await requestPromise;
		await page.waitForTimeout(800);

		expect(requestCount).toBeGreaterThan(0);
		await expect(panelToggle).toBeVisible();

		const maybeAdded = page.locator('.plusmagi-tags-list__name').filter({ hasText: failingTag });
		await expect(maybeAdded).toHaveCount(0);
	});
});
