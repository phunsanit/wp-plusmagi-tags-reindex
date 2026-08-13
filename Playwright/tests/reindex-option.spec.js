// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PlusMagi Tags Reindex — Reindex option toggle', () => {
	test.setTimeout(180_000);

	const TOOLS_URL = '/wp-admin/tools.php?page=plusmagi-tags-reindex';

	async function canAccessAdmin(page) {
		return (await page.locator('#wpadminbar').count()) > 0;
	}

	async function gotoTools(page) {
		await page.goto(TOOLS_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

		if (!(await canAccessAdmin(page))) {
			return { hasAccess: false, hasOption: false };
		}

		const toggle = page.locator('#enable_gap_fill');
		if ((await toggle.count()) === 0) {
			return { hasAccess: true, hasOption: false };
		}

		await expect(toggle).toBeVisible();
		return { hasAccess: true, hasOption: true };
	}

	async function saveGapSetting(page, enabled) {
		const toggle = page.locator('#enable_gap_fill');
		const checked = await toggle.isChecked();

		if (checked !== enabled) {
			await toggle.click();
		}

		await page.locator('button[name="plusmagi_tags_save_settings"]').click();
		const gapFillNotice = page.locator('.notice-success').filter({ hasText: /Gap filling/i });
		await expect(gapFillNotice).toBeVisible({ timeout: 20_000 });
		await expect(page.locator('#enable_gap_fill')).toHaveJSProperty('checked', enabled);
	}

	async function readEditorConfigFlag(page) {
		await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded', timeout: 60_000 });
		if (!(await canAccessAdmin(page))) {
			return null;
		}

		await page.waitForFunction(() => {
			// eslint-disable-next-line no-undef
			return typeof window.plusmagiTagsEditorConfig !== 'undefined';
		}, undefined, { timeout: 20_000 });

		return page.evaluate(() => {
			// eslint-disable-next-line no-undef
			return Boolean(window.plusmagiTagsEditorConfig && window.plusmagiTagsEditorConfig.reindexEnabled);
		});
	}

	test('can disable and enable gap reindex option with reflected editor config', async ({ page }) => {
		const toolsState = await gotoTools(page);
		test.skip(!toolsState.hasAccess, 'Environment user cannot access wp-admin Tools page.');
		test.skip(!toolsState.hasOption, 'Environment is not deployed with the new reindex option UI yet (#enable_gap_fill not found).');

		const initialValue = await page.locator('#enable_gap_fill').isChecked();

		try {
			await saveGapSetting(page, false);
			await expect(page.locator('#enable_gap_fill')).not.toBeChecked();
			await expect(await readEditorConfigFlag(page)).toBe(false);

			await gotoTools(page);
			await saveGapSetting(page, true);
			await expect(page.locator('#enable_gap_fill')).toBeChecked();
			await expect(await readEditorConfigFlag(page)).toBe(true);
		} finally {
			await gotoTools(page);
			await saveGapSetting(page, initialValue);
		}
	});
});
