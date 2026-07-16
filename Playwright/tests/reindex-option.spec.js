// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PlusMagi Tags Reindex — Reindex option toggle', () => {
    test.setTimeout(180_000);

    const TOOLS_URL = '/wp-admin/tools.php?page=plusmagi-tags-reindex';

    async function gotoTools(page) {
        await page.goto(TOOLS_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await expect(page.locator('#wpadminbar')).toBeVisible();

        const toggle = page.locator('#enable_gap_reindex');
        if ((await toggle.count()) === 0) {
            return false;
        }

        await expect(toggle).toBeVisible();
        return true;
    }

    async function saveGapSetting(page, enabled) {
        const toggle = page.locator('#enable_gap_reindex');
        const checked = await toggle.isChecked();

        if (checked !== enabled) {
            await toggle.click();
        }

        await page.locator('input[name="save_settings"]').click();
        await page.waitForURL(/settings_updated=1/, { timeout: 20_000 });
        await expect(page.locator('#enable_gap_reindex')).toHaveJSProperty('checked', enabled);
    }

    async function readEditorConfigFlag(page) {
        await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await expect(page.locator('#wpadminbar')).toBeVisible();

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
        const hasOption = await gotoTools(page);
        test.skip(!hasOption, 'Environment is not deployed with the new reindex option UI yet (#enable_gap_reindex not found).');

        const initialValue = await page.locator('#enable_gap_reindex').isChecked();

        try {
            await saveGapSetting(page, false);
            await expect(page.locator('#enable_gap_reindex')).not.toBeChecked();
            await expect(await readEditorConfigFlag(page)).toBe(false);

            await gotoTools(page);
            await saveGapSetting(page, true);
            await expect(page.locator('#enable_gap_reindex')).toBeChecked();
            await expect(await readEditorConfigFlag(page)).toBe(true);
        } finally {
            await gotoTools(page);
            await saveGapSetting(page, initialValue);
        }
    });
});
