// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PlusMagi Tags Reindex — Block Editor', () => {

    // ขยายเวลาเผื่อเว็บโหลดช้า
    test.setTimeout(600_000);

    test.beforeEach(async ({ page }) => {
        // นำทางไปยังหน้าสร้างบทความใหม่
        await page.goto('/wp-admin/post-new.php', { waitUntil: 'domcontentloaded', timeout: 600_000 });

        // รอให้โครงสร้างของ Editor โหลดขึ้นมาให้เสร็จก่อน
        await page.locator('.edit-post-layout').waitFor({ state: 'visible', timeout: 60_000 });
        await page.waitForTimeout(2000); // รอจังหวะให้ React ฝั่ง Gutenberg สร้าง UI ครบ

        // ปิด popup Welcome ของ Gutenberg (ถ้ามีเด้งขึ้นมาบัง)
        const welcomeClose = page.locator('button[aria-label="Close dialog"], button[aria-label="ปิดกล่องโต้ตอบ"]').first();
        if (await welcomeClose.isVisible({ timeout: 5000 }).catch(() => false)) {
            await welcomeClose.click();
        }

        // กดที่แท็บ "Post" (บทความ) บน Sidebar เพื่อให้ Panel ของปลั๊กอินแสดงขึ้นมา
        const postTab = page.locator('button.edit-post-sidebar__panel-tab[data-label="Post"], button.edit-post-sidebar__panel-tab:has-text("บทความ"), button.edit-post-sidebar__panel-tab:has-text("Post")').first();
        if (await postTab.isVisible()) {
            await postTab.click();
        }
    });

    test('Custom Tags Panel renders and auto-splits comma-separated tags', async ({ page }) => {
        // หา Panel "Tags (กำหนดเอง)" โดยใช้ Regex เผื่อกรณีมีการเว้นวรรค
        const panelToggle = page.locator('button.components-panel__body-toggle').filter({ hasText: /Tags\s*\(กำหนดเอง\)/i });

        await expect(panelToggle).toBeVisible({ timeout: 30_000 });

        // ตรวจสอบว่า Panel ถูกพับอยู่หรือไม่ ถ้าพับอยู่ให้คลิกเปิด
        const isExpanded = await panelToggle.getAttribute('aria-expanded');
        if (isExpanded === 'false') {
            await panelToggle.click();
        }

        // หาช่อง Input สำหรับกรอก Tag
        const tagInput = page.locator('input[placeholder="เพิ่ม Tag ใหม่..."]');
        await expect(tagInput).toBeVisible();

        // ทดสอบจำลองการพิมพ์ข้อความ (สุ่มชื่อเพื่อกันการซ้ำในการเทสหลายรอบ)
        const uniqueId = Date.now();

        // 1. ทดสอบเพิ่ม Tag ด้วยการกด Enter
        await tagInput.fill(`PlaywrightTagA_${uniqueId}`);
        await page.waitForTimeout(100); // ให้เวลา React ดึงค่า State ไปอัปเดตก่อน
        await tagInput.press('Enter');
        await expect(tagInput).toHaveValue('');

        // 2. ทดสอบเพิ่ม Tag ด้วยการพิมพ์คอมม่า (,)
        // ให้ Playwright กรอกคอมม่าลงไปพร้อมข้อความเลย เพื่อหลีกเลี่ยงบั๊กคีย์บอร์ดของ Playwright ที่ตีกับ React
        await tagInput.fill(`PlaywrightTagB_${uniqueId},`);
        await expect(tagInput).toHaveValue('');

        // 3. ทดสอบเพิ่ม Tag ด้วยการกดปุ่ม "เพิ่ม"
        await tagInput.fill(`PlaywrightTagC_${uniqueId}`);
        await page.waitForTimeout(100);
        await page.locator('button:has-text("เพิ่ม")').click();
        await expect(tagInput).toHaveValue('');

        // คาดหวังว่าจะมีชื่อ Tag ทั้ง 3 ตัว ปรากฏขึ้นมาแสดงใน Panel ทันที
        await expect(page.locator(`strong:has-text("PlaywrightTagA_${uniqueId}")`)).toBeVisible({ timeout: 15_000 });
        await expect(page.locator(`strong:has-text("PlaywrightTagB_${uniqueId}")`)).toBeVisible({ timeout: 15_000 });
        await expect(page.locator(`strong:has-text("PlaywrightTagC_${uniqueId}")`)).toBeVisible({ timeout: 15_000 });
    });
});