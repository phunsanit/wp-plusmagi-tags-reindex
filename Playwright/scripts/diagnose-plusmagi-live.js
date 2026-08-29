const path = require('path');
const dotenv = require('dotenv');
const { chromium } = require('playwright');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const base = (process.env.WP_BASE_URL || 'https://pitt.plusmagi.com').replace(/\/$/, '');
const user = process.env.WP_ADMIN_USER || 'admin';
const pass = process.env.WP_ADMIN_PASSWORD || process.env.WP_ADMIN_PASS;

function isEmpty(val) {
	return val == null || val === '';
}

async function run() {
	if (isEmpty(pass)) {
	throw new Error('Missing WP_ADMIN_PASSWORD/WP_ADMIN_PASS in .env');
	}

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext();
	const page = await context.newPage();

	await page.goto(`${base}/wp-login.php`, { waitUntil: 'domcontentloaded', timeout: 60000 });
	await page.locator('#user_login').fill(user);
	await page.locator('#user_pass').fill(pass);
	await page.locator('#wp-submit').click();
	await page.waitForURL('**/wp-admin/**', { timeout: 60000 });

	await page.goto(`${base}/wp-admin/options-general.php?page=plusmagi-tags-reindex`, { waitUntil: 'domcontentloaded', timeout: 60000 });
	const hasSettings = await page.locator('#enable_gap_fill').count();
	const deniedTools = (await page.locator('#wpadminbar').count()) === 0;

	await page.goto(`${base}/wp-admin/post.php?post=660&action=edit`, { waitUntil: 'domcontentloaded', timeout: 90000 });
	const hasLayout = await page.locator('.edit-post-layout').count();
	const hasPanel = await page.locator('button.components-panel__body-toggle').filter({ hasText: /PlusMagi Tags Reindex/i }).count();
	const hasConfig = await page.evaluate(() => {
	return window.plusmagiTagsEditorConfig !== undefined;
	});
	const deniedPost = (await page.locator('#wpadminbar').count()) === 0;

	console.log(JSON.stringify({ hasSettings, deniedTools, hasLayout, hasPanel, hasConfig, deniedPost }, null, 2));

	await context.close();
	await browser.close();
}

run().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
