// @ts-check
const { test, expect } = require('@playwright/test');
const { waitForPluginNotice } = require('./test-helpers');

/**
 * PlusMagi Tags Reindex — Admin Tools tests
 *
 * Tests cover:
 *  1. Admin page renders correctly
 *  2. Import section validates required input
 *  3. Valid comma/newline input inserts tags and shows a success notice
 */

test.describe('PlusMagi Tags Reindex — Admin Tools', () => {

	// Extend max test timeout to 10 minutes (600,000 ms) for slow production processing.
	test.setTimeout(600_000);

	const TOOLS_URL = '/wp-admin/tools.php?page=plusmagi-tags-reindex';

	function findLowestMissingPositive(ids) {
		const set = new Set(ids.filter((id) => Number.isInteger(id) && id > 0));
		let candidate = 1;
		while (set.has(candidate)) {
			candidate += 1;
		}
		return candidate;
	}

	async function fetchAllTagIds(request) {
		const ids = [];
		let pageNum = 1;

		while (true) {
			const res = await request.get(`/wp-json/wp/v2/tags?per_page=100&page=${pageNum}&_fields=id`);
			if (!res.ok()) {
				break;
			}

			const list = await res.json();
			if (!Array.isArray(list) || list.length === 0) {
				break;
			}

			for (const item of list) {
				if (item && Number.isInteger(item.id)) {
					ids.push(item.id);
				}
			}

			if (list.length < 100) {
				break;
			}

			pageNum += 1;
		}

		return ids;
	}

	async function createTagViaWpRest(request, name) {
		const res = await request.post('/wp-json/wp/v2/tags', {
			data: { name },
		});
		expect(res.ok()).toBe(true);
		const body = await res.json();
		expect(body.id).toBeTruthy();
		return body.id;
	}

	async function deleteTagViaWpRest(request, id) {
		await request.delete(`/wp-json/wp/v2/tags/${id}?force=true`);
	}

	async function addTagViaPluginApi(request, name, reindexGaps) {
		const res = await request.post('/wp-json/plusmagi-tags/v1/add-tag', {
			data: {
				name,
				reindex_gaps: reindexGaps,
			},
		});
		expect(res.ok()).toBe(true);
		return res.json();
	}

	async function gotoTools(page) {
		// Navigate to Tools > Tags Reindex.
		await page.goto(TOOLS_URL, { waitUntil: 'domcontentloaded', timeout: 600_000 });

		if (!(await page.locator('#wpadminbar').count())) {
			return { hasAccess: false, hasUI: false };
		}

		const hasUI = (await page.locator('#enable_gap_fill').count()) > 0
			&& (await page.locator('textarea#plusmagi_tags_import_list').count()) > 0;

		return { hasAccess: true, hasUI };
	}

	async function setGapFillEnabled(page, enabled) {
		const toggle = page.locator('#enable_gap_fill');
		await expect(toggle).toBeVisible();
		const checked = await toggle.isChecked();
		if (checked !== enabled) {
			await toggle.click();
		}
		await page.locator('[name="plusmagi_tags_save_settings"]').click();
		await waitForPluginNotice(page, /Gap filling/i);
	}

	test('renders the Tags Reindex settings page correctly', async ({ page }) => {
		const state = await gotoTools(page);
		test.skip(!state.hasAccess, 'Environment user cannot access wp-admin Tools page.');
		test.skip(!state.hasUI, 'Environment is not deployed with the current PlusMagi admin UI yet.');

		await expect(page.locator('h1')).toContainText('PlusMagi Tags Reindex');
		await expect(page.locator('#enable_gap_fill')).toBeVisible();
		await expect(page.locator('textarea#plusmagi_tags_import_list')).toBeVisible();
		await expect(page.locator('[name="plusmagi_tags_import_submit"]')).toBeVisible();
	});

	test('does not submit when import tags textarea is empty', async ({ page }) => {
		const state = await gotoTools(page);
		test.skip(!state.hasAccess, 'Environment user cannot access wp-admin Tools page.');
		test.skip(!state.hasUI, 'Environment is not deployed with the current PlusMagi admin UI yet.');

		const importInput = page.locator('textarea#plusmagi_tags_import_list');
		await importInput.fill('');
		await page.locator('[name="plusmagi_tags_import_submit"]').click();

		// Empty input should not produce a success notice.
		await expect(page).toHaveURL(/tools\.php\?page=plusmagi-tags-reindex/);
		await expect(page.locator('.notice-success').filter({ hasText: 'Successfully inserted' })).toHaveCount(0);
	});

	test('successfully inserts valid tags from comma/newline-separated input', async ({ page }) => {
		const state = await gotoTools(page);
		test.skip(!state.hasAccess, 'Environment user cannot access wp-admin Tools page.');
		test.skip(!state.hasUI, 'Environment is not deployed with the current PlusMagi admin UI yet.');

		// Use unique names to avoid collisions across repeated test runs.
		const ts = Date.now();
		const tagA = `PlaywrightTagA_${ts}`;
		const tagB = `PlaywrightTagB_${ts}`;
		const tagC = `PlaywrightTagC_${ts}`;
		const tagsPayload = `${tagA}, ${tagB}\n${tagC}`;

		await page.locator('textarea#plusmagi_tags_import_list').fill(tagsPayload);
		await page.locator('[name="plusmagi_tags_import_submit"]').click();

		// Filter by our expected message to avoid matching notices from other plugins/themes.
		const successNotice = page.locator('.notice-success').filter({ hasText: 'Successfully inserted' });
		await expect(successNotice).toBeVisible();
		await expect(successNotice).toContainText('Successfully inserted 3 new tag(s)');
	});

	test('replaces missing term_id gaps sequentially when adding new tags', async ({ page, request }) => {
		const state = await gotoTools(page);
		test.skip(!state.hasAccess, 'Environment user cannot access wp-admin Tools page.');
		test.skip(!state.hasUI, 'Environment is not deployed with the current PlusMagi admin UI yet.');

		await setGapFillEnabled(page, true);

		const seedTag = `PlaywrightGapSeed_${Date.now()}`;
		const seedId = await createTagViaWpRest(request, seedTag);
		await deleteTagViaWpRest(request, seedId);

		const idsBefore = await fetchAllTagIds(request);
		const expectedGapId = findLowestMissingPositive(idsBefore);

		const newName = `PlaywrightGapFill_${Date.now()}`;
		const result = await addTagViaPluginApi(request, newName, true);
		expect(Array.isArray(result.ids)).toBe(true);
		expect(result.ids.length).toBeGreaterThan(0);
		expect(result.ids[0]).toBe(expectedGapId);

		await deleteTagViaWpRest(request, result.ids[0]);
	});

	test('falls back gracefully when gap fill is disabled', async ({ page, request }) => {
		const state = await gotoTools(page);
		test.skip(!state.hasAccess, 'Environment user cannot access wp-admin Tools page.');
		test.skip(!state.hasUI, 'Environment is not deployed with the current PlusMagi admin UI yet.');

		await setGapFillEnabled(page, false);

		const idsBefore = await fetchAllTagIds(request);
		const maxBefore = idsBefore.length ? Math.max(...idsBefore) : 0;

		const name = `PlaywrightNoGap_${Date.now()}`;
		const result = await addTagViaPluginApi(request, name, false);
		expect(Array.isArray(result.ids)).toBe(true);
		expect(result.ids.length).toBeGreaterThan(0);
		expect(result.ids[0]).toBeGreaterThan(maxBefore);

		await deleteTagViaWpRest(request, result.ids[0]);
	});

	test('handles duplicate term names cleanly during gap creation', async ({ page, request }) => {
		const state = await gotoTools(page);
		test.skip(!state.hasAccess, 'Environment user cannot access wp-admin Tools page.');
		test.skip(!state.hasUI, 'Environment is not deployed with the current PlusMagi admin UI yet.');

		await setGapFillEnabled(page, true);

		const duplicateName = `PlaywrightDuplicate_${Date.now()}`;
		const existingId = await createTagViaWpRest(request, duplicateName);

		const result = await addTagViaPluginApi(request, duplicateName, true);
		expect(Array.isArray(result.ids)).toBe(true);
		expect(result.ids.length).toBeGreaterThan(0);
		expect(result.ids[0]).toBe(existingId);

		await deleteTagViaWpRest(request, existingId);
	});

	test('Fix Conflicting Slugs button resolves -2 slug suffixes', async ({ page }) => {
		const state = await gotoTools(page);
		test.skip(!state.hasAccess, 'Environment user cannot access wp-admin Tools page.');
		test.skip(!state.hasUI, 'Environment is not deployed with the current PlusMagi admin UI yet.');

		await page.locator('[name="plusmagi_tags_fix_slugs"]').click();
		const notice = await waitForPluginNotice(page, /Successfully fixed/i);
		await expect(notice).toContainText(/Successfully fixed \d+ conflicting tag slug\(s\)\./);
	});
});