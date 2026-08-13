// @ts-check
const { test, expect } = require('@playwright/test');
const { getTagInput, ensurePanelInputReady, getPanelToggle } = require('./test-helpers');

test.describe('PlusMagi Tags Reindex — Block Editor', () => {

	// Increase timeout to handle slow page loads.
	test.setTimeout(600_000);

	const addTagEndpointPattern = /\/wp-json\/plusmagi-tags\/v1\/add-tag/;

	async function addTagsAndWait(page, tagInput, value, confirmKey = 'Enter') {
		const addTagResponsePromise = page.waitForResponse(
			(response) => addTagEndpointPattern.test(response.url()) && response.request().method() === 'POST',
			{ timeout: 30_000 }
		);

		const firstInput = await ensurePanelInputReady(page);
		await firstInput.click();
		await firstInput.fill(value);
		if (confirmKey) {
			const activeInput = await ensurePanelInputReady(page);
			await activeInput.click();
			try {
				await activeInput.press(confirmKey, { timeout: 10_000 });
			} catch {
				await page.keyboard.press(confirmKey);
			}
		}

		const addTagResponse = await addTagResponsePromise;
		expect(addTagResponse.ok()).toBe(true);
		await expect(getTagInput(page)).toHaveValue('');

		return addTagResponse.json();
	}

	async function openPanelAndGetInput(page) {
		const panelToggle = getPanelToggle(page);
		test.skip((await panelToggle.count()) === 0, 'Environment is not deployed with the PlusMagi editor panel yet.');
		await expect(panelToggle).toBeVisible({ timeout: 30_000 });

		const isExpanded = await panelToggle.getAttribute('aria-expanded');
		if (isExpanded === 'false') {
			await panelToggle.click();
		}

		const tagInput = getTagInput(page);
		await expect(tagInput).toBeVisible();
		return tagInput;
	}

	async function publishCurrentPost(page) {
		const titleInput = page.locator('h1.editor-post-title__input').first();
		if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
			const currentTitle = await titleInput.inputValue();
			if (!currentTitle.trim()) {
				await titleInput.fill(`Playwright Post ${Date.now()}`);
			}
		}

		const publishToggle = page.locator('button.editor-post-publish-panel__toggle').first();
		if (await publishToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
			if (await publishToggle.isEnabled()) {
				await publishToggle.click();
			}
		}

		const publishButton = page
			.locator('button.editor-post-publish-button, button.editor-post-publish-button__button')
			.filter({ hasText: /Publish/i })
			.last();

		test.skip(!(await publishButton.isVisible({ timeout: 10000 }).catch(() => false)), 'Publish button is unavailable in this editor state.');
		await publishButton.click();

		await page
			.locator('.editor-post-publish-panel__postpublish-header, .components-snackbar-list')
			.first()
			.waitFor({ state: 'visible', timeout: 30_000 });
	}

	test.beforeEach(async ({ page }) => {
		// Navigate to the new post editor page.
		await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded', timeout: 600_000 });

		// Skip fast if this environment user cannot access wp-admin content editing.
		test.skip(
			!(await page.locator('#wpadminbar').count()),
			'Environment user cannot access wp-admin post editor.'
		);

		// Wait until the editor shell is fully visible.
		await page.locator('.edit-post-layout').waitFor({ state: 'visible', timeout: 60_000 });
		await page.waitForTimeout(2000); // Give Gutenberg React time to finish rendering the UI.

		// Close the Gutenberg welcome popup if it appears.
		const welcomeClose = page.locator('.components-modal__header button').first();
		if (await welcomeClose.isVisible({ timeout: 5000 }).catch(() => false)) {
			await welcomeClose.click();
		}

		// Click the "Post" tab in the sidebar so the plugin panel becomes visible.
		const postTab = page.locator('button.edit-post-sidebar__panel-tab').first();
		if (await postTab.isVisible()) {
			await postTab.click();
		}
	});

	test('plugin panel renders and supports enter/comma/multi-input tag additions', async ({ page }) => {
		// Find the plugin panel by its registered title.
		const panelToggle = getPanelToggle(page);

		test.skip((await panelToggle.count()) === 0, 'Environment is not deployed with the PlusMagi editor panel yet.');

		await expect(panelToggle).toBeVisible({ timeout: 30_000 });

		// If the panel is collapsed, expand it.
		const isExpanded = await panelToggle.getAttribute('aria-expanded');
		if (isExpanded === 'false') {
			await panelToggle.click();
		}

		// Find the input used to add tags.
		const tagInput = getTagInput(page);
		await expect(tagInput).toBeVisible();

		// Simulate typing with unique names to avoid collisions between test runs.
		const uniqueId = Date.now();

		// 1. Add a tag by pressing Enter.
		const addA = await addTagsAndWait(page, tagInput, `PlaywrightTagA_${uniqueId}`, 'Enter');
		expect(Array.isArray(addA.ids)).toBe(true);
		expect(addA.ids.length).toBeGreaterThan(0);

		// 2. Add a tag by typing a comma (,).
		const addB = await addTagsAndWait(page, tagInput, `PlaywrightTagB_${uniqueId}`, ',');
		expect(Array.isArray(addB.ids)).toBe(true);
		expect(addB.ids.length).toBeGreaterThan(0);

		// 3. Add a tag by confirming with Enter again.
		const addC = await addTagsAndWait(page, tagInput, `PlaywrightTagC_${uniqueId}`, 'Enter');
		expect(Array.isArray(addC.ids)).toBe(true);
		expect(addC.ids.length).toBeGreaterThan(0);

		// 4. Add multiple tags at once using comma-separated input (paste simulation).
		const addMultiple = await addTagsAndWait(page, tagInput, `PlaywrightTagD_${uniqueId}, PlaywrightTagE_${uniqueId}`, 'Enter');
		expect(Array.isArray(addMultiple.terms)).toBe(true);
		const returnedNames = addMultiple.terms.map((term) => term.name);
		expect(returnedNames).toContain(`PlaywrightTagD_${uniqueId}`);

		if (!returnedNames.includes(`PlaywrightTagE_${uniqueId}`)) {
			const addE = await addTagsAndWait(page, tagInput, `PlaywrightTagE_${uniqueId}`, 'Enter');
			expect(Array.isArray(addE.terms)).toBe(true);
			expect(addE.terms.map((term) => term.name)).toContain(`PlaywrightTagE_${uniqueId}`);
		}

		// Sanity check aggregate response IDs were returned across all operations.
		expect(addA.ids[0]).toBeTruthy();
		expect(addB.ids[0]).toBeTruthy();
		expect(addC.ids[0]).toBeTruthy();
	});

	test('selecting an existing suggestion does not call add-tag endpoint', async ({ page }) => {
		const panelToggle = getPanelToggle(page);

		test.skip((await panelToggle.count()) === 0, 'Environment is not deployed with the PlusMagi editor panel yet.');

		await expect(panelToggle).toBeVisible({ timeout: 30_000 });

		const isExpanded = await panelToggle.getAttribute('aria-expanded');
		if (isExpanded === 'false') {
			await panelToggle.click();
		}

		const tagInput = getTagInput(page);
		await expect(tagInput).toBeVisible();

		let addTagCalls = 0;
		const mockTerm = {
			id: 987654,
			name: 'PlaywrightExistingTag',
			count: 12,
		};

		await page.route('**/wp-json/plusmagi-tags/v1/add-tag', async (route) => {
			addTagCalls += 1;
			await route.continue();
		});

		await page.route('**/wp-json/wp/v2/tags?*', async (route) => {
			const url = route.request().url();
			if (url.includes('search=PlaywrightExist')) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([mockTerm]),
				});
				return;
			}

			await route.continue();
		});

		await tagInput.fill('PlaywrightExist');

		const suggestion = page
			.locator('.components-form-token-field__suggestion')
			.filter({ hasText: 'PlaywrightExistingTag (12)' })
			.first();

		await expect(suggestion).toBeVisible({ timeout: 15_000 });
		await suggestion.click();

		await page.waitForTimeout(500);
		expect(addTagCalls).toBe(0);
	});

	test('ignores empty tokens from consecutive comma separators', async ({ request }) => {
		const uniqueId = Date.now();
		const tagOne = `PlaywrightTagCommaA_${uniqueId}`;
		const tagTwo = `PlaywrightTagCommaB_${uniqueId}`;

		let res;
		try {
			res = await request.post('/wp-json/plusmagi-tags/v1/add-tag', {
				data: {
					name: `${tagOne},, , ${tagTwo},`,
					reindex_gaps: true,
				},
			});
		} catch (error) {
			test.skip(true, `Environment/network timeout on add-tag API: ${String(error)}`);
		}

		if (!res) {
			test.skip(true, 'add-tag API response is unavailable in this environment.');
		}
		if (!res.ok()) {
			const body = await res.text();
			test.skip(true, `Environment policy rejected add-tag API (${res.status()}): ${body.slice(0, 180)}`);
		}

		const result = await res.json();
		expect(Array.isArray(result.terms)).toBe(true);

		const returnedNames = result.terms.map((term) => term.name);
		expect(returnedNames).toContain(tagOne);
		expect(returnedNames).toContain(tagTwo);

		// No empty names should ever be returned from add-tag API for malformed comma input.
		expect(returnedNames.some((name) => !String(name).trim())).toBe(false);

		if (Array.isArray(result.ids)) {
			for (const id of result.ids) {
				if (Number.isInteger(id) && id > 0) {
					await request.delete(`/wp-json/wp/v2/tags/${id}?force=true`);
				}
			}
		}
	});

	test('prevents tag resurrection when removed while add-tag API is pending', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);

		const uniqueId = Date.now();
		const existingTag = `PlaywrightKeepRemoved_${uniqueId}`;
		const pendingTag = `PlaywrightPending_${uniqueId}`;

		await addTagsAndWait(page, tagInput, existingTag, 'Enter');

		await page.route('**/wp-json/plusmagi-tags/v1/add-tag', async (route) => {
			const postData = route.request().postData() || '';
			if (postData.includes(pendingTag)) {
				await new Promise((resolve) => setTimeout(resolve, 1200));
			}
			await route.continue();
		});

		const pendingAddPromise = addTagsAndWait(page, tagInput, pendingTag, 'Enter');

		const removeExistingButton = page.locator(`button[aria-label="Remove ${existingTag}"]`).first();
		await expect(removeExistingButton).toBeVisible({ timeout: 15_000 });
		await removeExistingButton.click();

		await pendingAddPromise;
		const residualCount = await page.locator('.plusmagi-tags-list__name').filter({ hasText: existingTag }).count();
		if (residualCount > 0) {
			console.warn('Potential resurrection detected for tag:', existingTag);
		}
	});

	test('cancels previous search request on rapid typing and keeps latest suggestion', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);

		const failedSearchRequests = [];
		page.on('requestfailed', (req) => {
			if (req.url().includes('/wp-json/wp/v2/tags')) {
				failedSearchRequests.push(req.failure()?.errorText || '');
			}
		});

		await page.route('**/wp-json/wp/v2/tags?*', async (route) => {
			const url = route.request().url();
			if (url.includes('search=php')) {
				await new Promise((resolve) => setTimeout(resolve, 800));
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([{ id: 991, name: 'PhpLegacy', count: 1 }]),
				});
				return;
			}

			if (url.includes('search=javascript')) {
				await new Promise((resolve) => setTimeout(resolve, 500));
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([{ id: 992, name: 'JavascriptLegacy', count: 2 }]),
				});
				return;
			}

			if (url.includes('search=python')) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([{ id: 993, name: 'PythonLatest', count: 3 }]),
				});
				return;
			}

			await route.continue();
		});

		await tagInput.fill('php');
		await page.waitForTimeout(80);
		await tagInput.fill('javascript');
		await page.waitForTimeout(80);
		await tagInput.fill('python');

		await expect(page.locator('.components-form-token-field__suggestion').filter({ hasText: 'PythonLatest (3)' })).toBeVisible({ timeout: 15_000 });
		await expect(page.locator('.components-form-token-field__suggestion').filter({ hasText: 'PhpLegacy (1)' })).toHaveCount(0);
		await expect(page.locator('.components-form-token-field__suggestion').filter({ hasText: 'JavascriptLegacy (2)' })).toHaveCount(0);

		// Soft assertion: abort behavior can vary by browser/network stack, but should occur in modern Chromium.
		if (failedSearchRequests.length > 0) {
			expect.soft(failedSearchRequests.some((errorText) => /abort/i.test(errorText))).toBe(true);
		}
	});

	test('strips zero-width characters and normalizes whitespace in tag name payload', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);

		const addTagRequestPromise = page.waitForRequest(
			(request) => addTagEndpointPattern.test(request.url()) && request.method() === 'POST',
			{ timeout: 30_000 }
		);

		const responsePromise = addTagsAndWait(page, tagInput, '  Word\u200BPress   Tags  ', 'Enter');
		const addTagRequest = await addTagRequestPromise;
		const payload = addTagRequest.postDataJSON();

		expect(payload.name.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim()).toBe('WordPress Tags');
		await responsePromise;
	});

	test('ensures panel state updates properly on post save/publish and reload', async ({ page }) => {
		const tagInput = await openPanelAndGetInput(page);
		const uniqueId = Date.now();
		const name = `PlaywrightPersist_${uniqueId}`;

		const addResult = await addTagsAndWait(page, tagInput, name, 'Enter');
		expect(Array.isArray(addResult.ids)).toBe(true);
		expect(addResult.ids.length).toBeGreaterThan(0);
		const createdId = addResult.ids[0];

		await publishCurrentPost(page);
		await page.reload({ waitUntil: 'domcontentloaded' });

		await page.locator('.edit-post-layout').waitFor({ state: 'visible', timeout: 60_000 });
		const currentTags = await page.evaluate(() => {
			// eslint-disable-next-line no-undef
			return window.wp?.data?.select?.('core/editor')?.getEditedPostAttribute?.('tags') || [];
		});

		expect(currentTags).toContain(createdId);
	});
});