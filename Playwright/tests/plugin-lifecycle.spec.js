// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PlusMagi Tags Reindex — Activation lifecycle', () => {
	test.setTimeout(240_000);

	async function gotoTools(page) {
		await page.goto('/wp-admin/tools.php?page=plusmagi-tags-reindex', {
			waitUntil: 'domcontentloaded',
			timeout: 90_000,
		});
	}

	async function setGapFill(page, enabled) {
		const toggle = page.locator('#enable_gap_fill');
		await expect(toggle).toBeVisible({ timeout: 30_000 });
		const checked = await toggle.isChecked();
		if (checked !== enabled) {
			await toggle.click();
		}
		await page.locator('[name="plusmagi_tags_save_settings"]').click();
		await expect(page.locator('.notice-success').filter({ hasText: /Gap filling/i })).toBeVisible({ timeout: 20_000 });
	}

	async function openPlugins(page) {
		await page.goto('/wp-admin/plugins.php?s=plusmagi-tags-reindex', {
			waitUntil: 'domcontentloaded',
			timeout: 90_000,
		});
	}

	test('gap fill setting persists after deactivate and reactivate', async ({ page }) => {
		await gotoTools(page);
		test.skip(!(await page.locator('#wpadminbar').count()), 'Environment user cannot access wp-admin.');

		const initialValue = await page.locator('#enable_gap_fill').isChecked();

		try {
			await setGapFill(page, false);

			await openPlugins(page);
			const pluginRow = page.locator('tr[id^="plusmagi-tags-reindex"]').first();
			test.skip(!(await pluginRow.count()), 'Plugin row not found on plugins.php');

			const deactivateLink = pluginRow.locator('a').filter({ hasText: /^Deactivate$/i }).first();
			if (await deactivateLink.isVisible({ timeout: 5000 }).catch(() => false)) {
				await Promise.all([
					page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => null),
					deactivateLink.click(),
				]);
			}

			await openPlugins(page);
			const pluginRowAfterDeactivate = page.locator('tr[id^="plusmagi-tags-reindex"]').first();
			const activateLink = pluginRowAfterDeactivate.locator('a').filter({ hasText: /^Activate$/i }).first();
			await expect(activateLink).toBeVisible({ timeout: 30_000 });

			await Promise.all([
				page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => null),
				activateLink.click(),
			]);

			await gotoTools(page);
			await expect(page.locator('#enable_gap_fill')).not.toBeChecked();
		} finally {
			await gotoTools(page);
			await setGapFill(page, initialValue);
		}
	});
});
