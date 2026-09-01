// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { getWordPressConfig } = require('./wordpress-config');

/**
 * Playwright configuration for PlusMagi Tags Reindex plugin tests.
 * Target: WP_URL (live WordPress site with plugin installed)
 *
 * Run all guest tests:       npx playwright test
 * Run with UI:               npx playwright test --ui
 * Run authenticated tests:   npx playwright test --project=admin  (uses .env)
 * Show HTML report:          npx playwright show-report
 */

const wordpress = getWordPressConfig();

module.exports = defineConfig({
    testDir: './tests',
    timeout: 60_000,

    /* Retry once on CI, never locally */
    retries: process.env.CI ? 1 : 0,

    /* Run tests in parallel by default */
    fullyParallel: true,

    /* Reporter */
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list'],
    ],

    /* Shared settings for every test */
    use: {
        baseURL: wordpress.baseURL,

        /* Allow up to 60s for any navigation on this ad-heavy live site */
        navigationTimeout: 60_000,
        actionTimeout: 15_000,

        /* Capture screenshot only on failure */
        screenshot: 'only-on-failure',

        /* Record a video only when retrying a failed test */
        video: 'on-first-retry',

        /* Keep traces on failures for debugging */
        trace: 'on-first-retry',
    },

    projects: [
        // ------------------------------------------------------------------
        // Guest tests — no authentication required (3 browsers)
        // ------------------------------------------------------------------
        {
            name: 'chromium',
            testIgnore: /(authenticated-api|block-tags|reindex-option|tags-reindex|post-4026|plugin-install|role-access|api-error-path|plugin-lifecycle)\.spec\.js/,
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            testIgnore: /(authenticated-api|block-tags|reindex-option|tags-reindex|post-4026|plugin-install|role-access|api-error-path|plugin-lifecycle)\.spec\.js/,
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            testIgnore: /(authenticated-api|block-tags|reindex-option|tags-reindex|post-4026|plugin-install|role-access|api-error-path|plugin-lifecycle)\.spec\.js/,
            use: { ...devices['Desktop Safari'] },
        },

        // ------------------------------------------------------------------
        // Authenticated REST tests (requires WP_APPLICATION_PASSWORD)
        // ------------------------------------------------------------------
        {
            name: 'admin',
            testMatch: /(authenticated-api|role-access)\.spec\.js/,
            use: {
                ...devices['Desktop Chrome'],
                extraHTTPHeaders: wordpress.extraHTTPHeaders,
            },
        },
    ],
});
