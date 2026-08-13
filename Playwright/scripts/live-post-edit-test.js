#!/usr/bin/env node

const path = require('path');
const dotenv = require('dotenv');
const { chromium } = require('playwright');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const BASE = (process.env.WP_BASE_URL || 'https://pitt.plusmagi.com').replace(/\/$/, '');
const TARGET_URL = `${BASE}/wp-admin/post.php?post=4026&action=edit`;
const ADMIN_USER = process.env.WP_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.WP_ADMIN_PASSWORD || process.env.WP_ADMIN_PASS;

const SAMPLE_TAGS = ',Ancestral,Chaco Culture National Historical Park,Equinox,Heating,High Desert,Kiva,Orientation,Passive,Passive Solar,Pueblo Bonito,Puebloans,Solar,Terraced Structure,Thermal Mass,กลางคืน,กลางวัน,กักเก็บ,กักเก็บความร้อน,กันความร้อน,การค้า,การปกครอง,กำแพง,ขนาดใหญ่,ครึ่งวงกลม,ความร้อน,คายความร้อน,โคจร,โคลอสเซียม,จิตวิญญาณ,ชั้น,ชาโค,ชาโคแคนยอน,เชื้อเพลิงใด,ดวงอาทิตย์,ดาราศาสตร์,ดูดซับ,เดี่ยว,ติดลบ,ใต้ดิน,โถงทรงกลม,ทะเลทรายสูง,ทิศใต้,ทิศทาง,ธรรมชาติ,นวัตกรรม,บังลม,โบราณ,ผู้ที่อยู่อาศัย,พลังงาน,พวยโบล,พวยโบล โบนิโต,พาสซีฟ,พิธีกรรมทางศาสนา,ภัยหนาว,ภูมิปัญญา,มวลสาร,เย็นสบาย,ร้อนจัด,รัฐนิวเม็กซิโก,รับแสง,ฤดูร้อน,ฤดูหนาว,ไล่ระดับ,วันวิษุวัต,วางผัง,วิทยาการ,วิทยาศาสตร์,ศตวรรษ,ศูนย์รวมจิตวิญญาณ,สถาปัตยกรรม,สเปน,สภาพอากาศ,สหรัฐอเมริกา,สุดขั้ว,แสงแดด,แสงอาทิตย์,หนาวจัด,หมู่บ้าน,หมู่บ้านที่สวยงาม,ห้อง,ห้องพัก,หิน,หุบเขา,ใหญ่,อบอุ่น,อพาร์ตเมนต์,อเมริกาเหนือ,อยู่อาศัย,อากาศ,อาคาร,อารยธรรม,อาศัย,อุณหภูมิ,อุทยานประวัติศาสตร์แห่งชาติ';

function hasValue(val) {
	return !(val == null || val === '');
}

async function findVisibleButton(page, selectors) {
	for (const selector of selectors) {
		const locator = page.locator(selector).first();
		if (await locator.isVisible({ timeout: 1500 }).catch(() => false)) {
			return locator;
		}
	}
	return null;
}

async function loginIfNeeded(page) {
	await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });

	if (page.url().includes('/wp-login.php')) {
		await page.locator('#user_login').fill(ADMIN_USER);
		await page.locator('#user_pass').fill(ADMIN_PASS);
		await page.locator('#wp-submit').click();
		await page.waitForURL('**/wp-admin/**', { timeout: 90000 });
		await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
	}
}

async function closeWelcomeDialogIfPresent(page) {
	const closeButton = page.locator('.components-modal__header button').first();
	if (await closeButton.isVisible({ timeout: 2500 }).catch(() => false)) {
		await closeButton.click();
	}
}

async function findTagInput(page, runtimeErrors) {
	const panelToggle = page.locator('button.components-panel__body-toggle').filter({ hasText: /PlusMagi Tags Reindex/i });
	const panelCount = await panelToggle.count();

	if (panelCount > 0) {
		const expanded = await panelToggle.getAttribute('aria-expanded');
		if (expanded === 'false') {
			await panelToggle.click();
		}

		const customInput = page
			.locator('.plusmagi-tags-reindex-panel .components-form-token-field__input, .plusmagi-tags-reindex-panel input[type="text"]')
			.first();
		await customInput.waitFor({ state: 'visible', timeout: 30000 });
		return { input: customInput, mode: 'custom-panel' };
	}

	const hasConfig = await page.evaluate(() => typeof window.plusmagiTagsEditorConfig !== 'undefined');
	throw new Error(
		`PlusMagi panel not found. Strict mode enabled. ${JSON.stringify({ hasConfig, runtimeErrors })}`
	);
}

async function saveGutenbergPost(page) {
	const primaryButton = await findVisibleButton(page, [
		'button.editor-post-publish-button',
		'button.editor-post-publish-panel__toggle',
		'button.editor-post-save-draft',
		'.interface-interface-skeleton__header button.components-button.is-primary',
	]);

	if (primaryButton) {
		await primaryButton.click();
	} else {
		// Fallback for highly customized admin UI where button selectors differ.
		await page.keyboard.press('Meta+s');
	}

	const confirmButton = await findVisibleButton(page, [
		'.editor-post-publish-panel button.editor-post-publish-button',
		'.editor-post-publish-panel__header-publish-button',
	]);
	if (confirmButton) {
		await confirmButton.click();
	}

	const saveSignals = page.locator('.components-snackbar, .editor-post-saved-state, .is-saved');
	await saveSignals.first().waitFor({ state: 'visible', timeout: 30000 });
}

async function run() {
	if (!hasValue(ADMIN_PASS)) {
		throw new Error('Missing WP_ADMIN_PASSWORD or WP_ADMIN_PASS in .env');
	}

	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext();
	const page = await context.newPage();
	const runtimeErrors = [];

	page.on('pageerror', (err) => {
		runtimeErrors.push(String(err && err.message ? err.message : err));
	});

	try {
		await loginIfNeeded(page);

		if (!(await page.locator('#wpadminbar').count())) {
			throw new Error('Current account has no permission to edit post=660');
		}

		const hasGutenbergLayout = (await page.locator('.edit-post-layout').count()) > 0;

		if (hasGutenbergLayout) {
			await page.locator('.edit-post-layout').waitFor({ state: 'visible', timeout: 90000 });
			await closeWelcomeDialogIfPresent(page);

			const { input: tagInput, mode } = await findTagInput(page, runtimeErrors);
			const uniqueTag = `LivePost660_${Date.now()}`;
			await tagInput.fill(`${SAMPLE_TAGS},${uniqueTag}`);
			await page.waitForTimeout(400);

			const inputVal = await tagInput.inputValue();
			if ((inputVal || '').length > 0) {
				await tagInput.press('Enter');
			}

			await saveGutenbergPost(page);

			if (mode === 'custom-panel') {
				console.log('SUCCESS: Gutenberg flow passed on post=4026 (custom panel + update).');
			} else {
				console.log('SUCCESS: Gutenberg flow passed on post=4026 (default tags fallback + update).');
			}
		} else {
			const classicTagInput = page.locator('#new-tag-post_tag');
			const classicUpdateButton = page.locator('#publish');

			if ((await classicTagInput.count()) === 0 || (await classicUpdateButton.count()) === 0) {
				throw new Error('Cannot find Gutenberg layout or classic editor tag/update controls on post=4026');
			}

			await classicTagInput.fill(SAMPLE_TAGS);

			const addTagButton = page.locator('.tagadd, #post_tag .howto + p .button').first();
			if ((await addTagButton.count()) > 0) {
				await addTagButton.click();
			} else {
				await classicTagInput.press('Enter');
			}

			await classicUpdateButton.click();
			await page.waitForLoadState('domcontentloaded');

			const updatedClassic = page.locator('#message.updated, .notice-success');
			await updatedClassic.first().waitFor({ state: 'visible', timeout: 30000 });

			console.log('SUCCESS: Classic editor fallback passed on post=4026 (tags added + post updated).');
		}
	} finally {
		await context.close();
		await browser.close();
	}
}

run().catch((err) => {
	console.error(`FAILED: ${err.message}`);
	process.exit(1);
});
