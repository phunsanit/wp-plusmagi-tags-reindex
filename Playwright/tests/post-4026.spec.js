// @ts-check
const { test, expect } = require('@playwright/test');
const { getPanelToggle, ensurePanelInputReady } = require('./test-helpers');

test.describe('PlusMagi Tags Reindex — Post 4026', () => {
	test.setTimeout(180_000);

	const POST_URL = '/wp-admin/post.php?post=4026&action=edit';
	const addTagEndpointPattern = /\/wp-json\/plusmagi-tags\/v1\/add-tag/;

	async function findVisibleButton(page, selectors) {
		for (const selector of selectors) {
			const locator = page.locator(selector).first();
			if (await locator.isVisible({ timeout: 1500 }).catch(() => false)) {
				return locator;
			}
		}
		return null;
	}

	async function saveGutenbergPost(page) {
		const primaryButton = await findVisibleButton(page, [
			'button.editor-post-publish-button',
			'button.editor-post-publish-panel__toggle',
			'button.editor-post-save-draft',
			'.interface-interface-skeleton__header button.components-button.is-primary',
		]);

		if (primaryButton && (await primaryButton.isEnabled().catch(() => false))) {
			await primaryButton.click();
		} else {
			await page.keyboard.press('Meta+s');
		}

		const confirmButton = await findVisibleButton(page, [
			'.editor-post-publish-panel button.editor-post-publish-button',
			'.editor-post-publish-panel__header-publish-button',
		]);
		if (confirmButton && (await confirmButton.isEnabled().catch(() => false))) {
			await confirmButton.click();
		}

		await page.waitForFunction(() => {
			// eslint-disable-next-line no-undef
			return typeof window.wp !== 'undefined'
				&& typeof window.wp.data !== 'undefined'
				&& window.wp.data.select('core/editor')
				&& window.wp.data.select('core/editor').isEditedPostDirty
				&& window.wp.data.select('core/editor').isEditedPostDirty() === false;
		}, undefined, { timeout: 45_000 }).catch(() => null);
	}

	test('can open post 4026, add tags, and save', async ({ page }) => {
		await page.goto(POST_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });

		test.skip(!(await page.locator('#wpadminbar').count()), 'Environment user cannot access wp-admin post editor.');

		const hasGutenbergLayout = (await page.locator('.edit-post-layout').count()) > 0;
		const uniqueTag = `PlaywrightPost4026_${Date.now()}`;

		if (hasGutenbergLayout) {
			await page.locator('.edit-post-layout').waitFor({ state: 'visible', timeout: 90_000 });

			const welcomeClose = page.locator('.components-modal__header button').first();
			if (await welcomeClose.isVisible({ timeout: 2500 }).catch(() => false)) {
				await welcomeClose.click();
			}

			const postTab = page.locator('button.edit-post-sidebar__panel-tab').first();
			if (await postTab.isVisible({ timeout: 3000 }).catch(() => false)) {
				await postTab.click();
			}

			const panelToggle = getPanelToggle(page);
			await expect(panelToggle).toBeVisible({ timeout: 30_000 });

			const expanded = await panelToggle.getAttribute('aria-expanded');
			if (expanded === 'false') {
				await panelToggle.click();
			}

			const tagInput = await ensurePanelInputReady(page);

			let addTagCalls = 0;
			page.on('request', (req) => {
				if (req.method() === 'POST' && addTagEndpointPattern.test(req.url())) {
					addTagCalls += 1;
				}
			});

			await tagInput.fill(uniqueTag);
			await tagInput.press(',');
			await page.waitForTimeout(1000);
			expect(addTagCalls).toBeGreaterThan(0);

			await saveGutenbergPost(page);
			await page.reload({ waitUntil: 'domcontentloaded', timeout: 90_000 });
			await page.locator('.edit-post-layout').waitFor({ state: 'visible', timeout: 60_000 });
		} else {
			const classicTagInput = page.locator('#new-tag-post_tag');
			const classicUpdateButton = page.locator('#publish');

			await expect(classicTagInput).toBeVisible({ timeout: 30_000 });
			await expect(classicUpdateButton).toBeVisible({ timeout: 30_000 });

			await classicTagInput.fill(uniqueTag);

			const addTagButton = page.locator('.tagadd, #post_tag .howto + p .button').first();
			if (await addTagButton.isVisible({ timeout: 5000 }).catch(() => false)) {
				await addTagButton.click();
			} else {
				await classicTagInput.press('Enter');
			}

			await classicUpdateButton.click();
			await page.waitForLoadState('domcontentloaded');

			const updatedClassic = page.locator('#message.updated, .notice-success');
			await updatedClassic.first().waitFor({ state: 'visible', timeout: 30_000 });
		}
	});
});
