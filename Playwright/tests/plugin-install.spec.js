// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('PlusMagi Tags Reindex — Plugin install/update', () => {
	test.setTimeout(180_000);

	function pickLatestZip(dirPath) {
		if (!fs.existsSync(dirPath)) {
			return null;
		}

		const files = fs
			.readdirSync(dirPath)
			.filter((name) => name.endsWith('.zip') && name.includes('plusmagi-tags-reindex'))
			.map((name) => {
				const absPath = path.join(dirPath, name);
				const stat = fs.statSync(absPath);
				return { absPath, mtime: stat.mtimeMs };
			})
			.sort((a, b) => b.mtime - a.mtime);

		return files.length ? files[0].absPath : null;
	}

	test('can upload plugin zip and complete install flow', async ({ page }) => {
		const zipDir = path.resolve(__dirname, '../../wp-assets');
		const zipPath = pickLatestZip(zipDir);
		test.skip(!zipPath, 'No plugin zip found in wp-assets. Run build.sh first.');

		await page.goto('/wp-admin/plugin-install.php?tab=upload', {
			waitUntil: 'domcontentloaded',
			timeout: 90_000,
		});

		test.skip(!(await page.locator('#wpadminbar').count()), 'Environment user cannot access wp-admin plugin installer.');

		await expect(page.locator('#pluginzip')).toBeVisible({ timeout: 30_000 });
		await page.locator('#pluginzip').setInputFiles(zipPath);
		await page.locator('#install-plugin-submit').click({ noWaitAfter: true });
		await page.waitForLoadState('domcontentloaded');

		const overwriteButton = page.locator('a.update-from-upload-overwrite');
		if (await overwriteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
			await Promise.all([
				page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => null),
				overwriteButton.click(),
			]);
		}

		const successText = page.getByText(/plugin updated successfully|plugin installed successfully/i);
		const successNotice = page.locator('.notice-success');
		await expect(successText.or(successNotice)).toBeVisible({ timeout: 30_000 });
	});
});
