// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * PlusMagi Tags Reindex — Admin Tools tests
 *
 * Tests cover:
 *  1. Admin page renders correctly
 *  2. Empty or invalid JSON shows an error notice
 *  3. Valid JSON array inserts tags and shows a success notice
 */

test.describe('PlusMagi Tags Reindex — Admin Tools', () => {

    // ขยายเวลา Test สูงสุดเป็น 10 นาที (600,000 ms) สำหรับเว็บ Production ที่ประมวลผลช้า
    test.setTimeout(600_000);

    const TOOLS_URL = '/wp-admin/tools.php?page=plusmagi-tags-reindex';

    test.beforeEach(async ({ page }) => {
        // นำทางไปยังหน้า Tools > Tags Reindex
        await page.goto(TOOLS_URL, { waitUntil: 'domcontentloaded', timeout: 600_000 });
    });

    test('renders the Tags Reindex settings page correctly', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('PlusMagi Tags Reindex');
        await expect(page.locator('textarea#tags_json')).toBeVisible();
        await expect(page.locator('input[type="submit"]')).toBeVisible();
    });

    test('shows an error notice for invalid JSON format', async ({ page }) => {
        await page.locator('textarea#tags_json').fill('invalid plain text data');
        await page.locator('input[type="submit"]').click();

        // คาดหวังว่าจะเจอข้อความ Error
        const errorNotice = page.locator('.notice-error');
        await expect(errorNotice).toBeVisible();
        await expect(errorNotice).toContainText('Invalid JSON format or empty tags.');
    });

    test('shows an error notice for an empty JSON array', async ({ page }) => {
        await page.locator('textarea#tags_json').fill('[]');
        await page.locator('input[type="submit"]').click();

        const errorNotice = page.locator('.notice-error');
        await expect(errorNotice).toBeVisible();
        await expect(errorNotice).toContainText('Invalid JSON format or empty tags.');
    });

    test('successfully inserts valid JSON tags', async ({ page }) => {
        // สุ่มชื่อ Tag เพื่อป้องกันปัญหาข้อมูลซ้ำในการรันเทสหลายรอบ
        const uniqueTag = `PlaywrightTag_${Date.now()}`;
        await page.locator('textarea#tags_json').fill(JSON.stringify([uniqueTag]));
        await page.locator('input[type="submit"]').click();

        // กรองหาเฉพาะกล่องที่มีข้อความของเรา เพื่อป้องกันไปชนกับ Notice ของปลั๊กอิน/ธีมอื่น
        const successNotice = page.locator('.notice-success').filter({ hasText: 'Successfully inserted' });
        await expect(successNotice).toBeVisible();
        await expect(successNotice).toContainText('Successfully inserted 1 new tags and filled the gaps.');
    });
});