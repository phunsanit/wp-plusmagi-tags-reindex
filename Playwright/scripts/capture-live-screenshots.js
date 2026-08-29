#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { chromium } = require('playwright');

dotenv.config({ path: path.join(__dirname, '../../.env'), quiet: true });

const base = (process.env.WP_BASE_URL || 'https://pitt.plusmagi.com').replace(/\/$/, '');
const user = process.env.WP_ADMIN_USER || 'admin';
const password = process.env.WP_ADMIN_PASSWORD || process.env.WP_ADMIN_PASS;
const outputDir = path.join(__dirname, '../test-results/live-screenshots');
const postId = process.env.WP_SCREENSHOT_POST_ID || '4101';

async function login(page) {
	await page.goto(`${base}/wp-login.php`, { waitUntil: 'domcontentloaded', timeout: 90000 });
	await page.locator('#user_login').fill(user);
	await page.locator('#user_pass').fill(password);
	await page.locator('#wp-submit').click();
	await page.waitForURL('**/wp-admin/**', { timeout: 90000 });
}

async function openPluginPanel(page) {
	const input = page.locator('input[placeholder="Add new tag"]').first();
	if (await input.isVisible({ timeout: 15000 }).catch(() => false)) {
		return page.locator('button.components-panel__body-toggle').filter({
			hasText: /PlusMagi Tags Reindex/i,
		}).first();
	}

	const sidebar = page.locator('.interface-interface-skeleton__sidebar').first();
	if (!(await sidebar.isVisible().catch(() => false))) {
		const settingsButton = page.locator(
			'button[aria-label="Settings"], button[aria-label="ตั้งค่า"], button[aria-label*="settings" i]'
		).first();
		if (await settingsButton.isVisible({ timeout: 3000 }).catch(() => false)) {
			await settingsButton.click();
		}
	}

	const panelToggle = page.locator('button.components-panel__body-toggle').filter({
		hasText: /PlusMagi Tags Reindex/i,
	}).first();
	await panelToggle.waitFor({ state: 'visible', timeout: 30000 });
	if ((await panelToggle.getAttribute('aria-expanded')) === 'false') {
		await panelToggle.click();
	}

	await input.waitFor({ state: 'visible', timeout: 30000 });
	return panelToggle;
}

async function run() {
	if (!password) {
		throw new Error('Missing WP_ADMIN_PASSWORD or WP_ADMIN_PASS in .env');
	}

	fs.mkdirSync(outputDir, { recursive: true });
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
	const page = await context.newPage();

	try {
		await login(page);

		await page.goto(`${base}/wp-admin/options-general.php?page=plusmagi-tags-reindex`, {
			waitUntil: 'networkidle',
			timeout: 90000,
		});
		await page.locator('#enable_gap_fill').waitFor({ state: 'visible', timeout: 30000 });
		await page.locator('.notice, .update-nag').evaluateAll((elements) => {
			for (const element of elements) {
				element.style.display = 'none';
			}
		});
		await page.screenshot({ path: path.join(outputDir, 'screenshot-1.png') });

		await page.goto(`${base}/wp-admin/post.php?post=${postId}&action=edit`, {
			waitUntil: 'domcontentloaded',
			timeout: 90000,
		});
		const welcomeClose = page.locator('.components-modal__header button').first();
		if (await welcomeClose.isVisible({ timeout: 2500 }).catch(() => false)) {
			await welcomeClose.click();
		}

		const panelToggle = await openPluginPanel(page);
		await panelToggle.evaluate((element) => element.scrollIntoView({ block: 'start' }));
		await page.waitForTimeout(750);
		await page.screenshot({ path: path.join(outputDir, 'screenshot-2.png') });

		const summary = page.locator('.plusmagi-tags-list').first();
		await summary.waitFor({ state: 'visible', timeout: 30000 });
		await summary.scrollIntoViewIfNeeded();
		await page.screenshot({ path: path.join(outputDir, 'screenshot-3.png') });

		console.log(`Captured screenshots in ${outputDir}`);
	} finally {
		await context.close();
		await browser.close();
	}
}

run().catch((error) => {
	console.error(`FAILED: ${error.message}`);
	process.exit(1);
});