// @ts-check
const { test: setup, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * Setup project: log in to WordPress admin and save storage state
 * for the admin test project.
 * Skips automatically when admin-state.json already exists and WP_ADMIN_PASS is unset.
 */
const STATE_PATH = path.resolve(__dirname, '../../auth/admin-state.json');

setup('authenticate as WordPress admin', async ({ page }) => {
    const user = process.env.WP_ADMIN_USER || 'admin';
    const pass = process.env.WP_ADMIN_PASSWORD || process.env.WP_ADMIN_PASS;

    if (!pass) {
        // If state file already exists, reuse it without re-logging in.
        if (fs.existsSync(STATE_PATH)) {
            console.log('admin-state.json already exists — skipping login.');
            return;
        }
        throw new Error(
            'WP_ADMIN_PASSWORD environment variable is required for admin tests.\n' +
            'Set WP_ADMIN_PASSWORD in .env or run: WP_ADMIN_PASSWORD=yourpassword npx playwright test --project=setup'
        );
    }

    await page.goto('/wp-login.php', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    await page.locator('#user_login').fill(user);
    await page.locator('#user_pass').fill(pass);
    await page.locator('#wp-submit').click({ timeout: 60_000 });

    // รอดูว่ามีแถบ Admin Bar สีดำด้านบนโผล่ขึ้นมาหรือไม่ (รอสูงสุด 60 วินาที)
    // วิธีนี้ครอบคลุมทั้งกรณีที่เว็บ Redirect เข้าหลังบ้าน หรือเด้งไปหน้าแรก
    await expect(page.locator('#wpadminbar')).toBeVisible({ timeout: 60_000 });

    await page.context().storageState({ path: STATE_PATH });
});
