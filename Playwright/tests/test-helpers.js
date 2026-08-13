// @ts-check
const { expect } = require('@playwright/test');

const PANEL_TITLE = /PlusMagi Tags Reindex/i;

function getPanelToggle(page) {
	return page.locator('button.components-panel__body-toggle').filter({ hasText: PANEL_TITLE }).first();
}

function getTagInput(page) {
	return page
		.locator('.plusmagi-tags-reindex-panel .components-form-token-field__input, .plusmagi-tags-reindex-panel input[type="text"], input[placeholder="Add new tag"]')
		.first();
}

async function ensurePanelInputReady(page) {
	const panelToggle = getPanelToggle(page);
	if ((await panelToggle.count()) > 0) {
		const expanded = await panelToggle.getAttribute('aria-expanded');
		if (expanded === 'false') {
			await panelToggle.click();
		}
	}

	const input = getTagInput(page);
	await expect(input).toBeVisible({ timeout: 15_000 });
	return input;
}

async function waitForPluginNotice(page, textMatcher) {
	const notice = page.locator('.notice-success').filter({ hasText: textMatcher });
	await expect(notice).toBeVisible({ timeout: 20_000 });
	return notice;
}

module.exports = {
	PANEL_TITLE,
	getPanelToggle,
	getTagInput,
	ensurePanelInputReady,
	waitForPluginNotice,
};