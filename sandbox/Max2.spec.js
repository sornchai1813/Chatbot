import { test, expect } from '@playwright/test';
import fs from 'fs';

test('CLICX Chatbot - Basic Flow (v1.00 - stable)', async ({ page }) => {
  // ====== CONFIG ======
  const URL = 'https://live-chat-static.sprinklr.com/test-html/index.html?appId=6950dbcf3047873387304feb_app_1111009341&env=prod11&skin=MODERN&locale=th';
  const SCREENSHOT_DIR = 'testclick/cap';

  // สร้าง Folder ถ้ายังไม่มี
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // ====== STEP 0: VIEWPORT ======
  await page.setViewportSize({ width: 500, height: 1500 });

  // ====== STEP 1 ======
  await page.goto(URL);
  await expect(page).toHaveTitle(/Sprinklr Live Chat/);

  // ====== STEP 2 ======
  await page.getByRole('button', { name: 'เปิดแชท ' }).click();

  const frame = page.frameLocator('iframe[name="spr-chat__box-frame"]');

  // รอให้ปุ่มเริ่มแชทขึ้นมาค่อยกด
  const startBtn = frame.getByRole('button', { name: /เริ่มแชทกับ CLICX/ });
  await startBtn.waitFor({ state: 'visible' });
  await startBtn.click();

  const textbox = frame.getByRole('textbox', {
    name: /Type your message here.../,
  });

  await expect(textbox).toBeVisible();

  // ====== FUNCTION (ปรับปรุงใหม่) ======
  const sendMessage = async (message) => {
    await textbox.fill(message);
    await page.keyboard.press('Enter'); // 💡 กด Enter ชัวร์กว่า

    // 💡 ถ้ามีปุ่ม "ยินยอม" ค่อยกด (กัน Error ข้อความที่ 2)
    const consentBtn = frame.getByRole('button', { name: 'ยินยอม' });
    if (await consentBtn.isVisible()) {
      await consentBtn.click();
    }
  };

  // ====== STEP 3 ======
  console.log('>>> ส่งคำถามที่ 1');
  await sendMessage('วิธีการใช้วงเงินสินเชื่อCLICX');

  await expect(
    frame.locator('p', { hasText: 'การใช้วงเงินสินเชื่อ CLICX' }).first()
  ).toBeVisible({ timeout: 60000 });

  // ====== STEP 4 ======
  console.log('>>> ส่งคำถามที่ 2');
  await sendMessage('ใช้วงเงินจ่ายบิลยังไง');

  await expect(
    frame.locator('p', { hasText: 'วิธีใช้วงเงินสินเชื่อ CLICX' }).first()
  ).toBeVisible({ timeout: 60000 });

  // ====== STEP 5: WAIT BOT FINISH ======
  await expect(
    frame.getByText('บอทกำลังพิมพ์')
  ).toBeHidden({ timeout: 30000 });
  
  await page.waitForTimeout(2000); // พักนิดนึงให้ภาพนิ่ง

  // ====== STEP 6: EXPAND BODY (พยายามถ่างหน้าจอ) ======
  await frame.locator('body').evaluate((el) => {
    el.style.height = 'auto';
    el.style.overflow = 'visible';
  });

  // ====== STEP 7: FINAL SCREENSHOT ======
  await frame.locator('body').screenshot({
    path: `${SCREENSHOT_DIR}/chat-final.png`,
  });

  console.log('✅ รันจบแล้วครับพี่! ไฟล์อยู่ที่:', `${SCREENSHOT_DIR}/chat-final.png`);
  
  await page.pause(); // ค้างจอไว้ดูผล
});

