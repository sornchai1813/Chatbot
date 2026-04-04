import { test, expect } from '@playwright/test';
import fs from 'fs';

test('CLICX Chatbot - v1.03 (Yong Version)', async ({ page }) => {

  // 🔥 กัน timeout
  test.setTimeout(180000);

  const URL = 'https://live-chat-static.sprinklr.com/test-html/index.html?appId=6950dbcf3047873387304feb_app_1111009341&env=prod11&skin=MODERN&locale=th';

// 📁 ใช้ path.join เพื่อให้รันได้ทุกเครื่อง และสร้างโฟลเดอร์ในโปรเจกต์ปัจจุบัน
  const path = require('path');
  const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // 👉 ตั้งชื่อไฟล์ไม่ซ้ำ
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = `${SCREENSHOT_DIR}/CLICX_Chatbot_${now}.png`;

  // ====== VIEWPORT ======
  let currentHeight = 2400;
  const WIDTH = 500;

  await page.setViewportSize({ width: WIDTH, height: currentHeight });

  // ====== OPEN ======
  await page.goto(URL);
  await expect(page).toHaveTitle(/Sprinklr Live Chat/);

  await page.getByRole('button', { name: 'เปิดแชท ' }).click();

  const frame = page.frameLocator('iframe[name="spr-chat__box-frame"]');

  await frame.getByRole('button', { name: /เริ่มแชทกับ CLICX/ }).click();

  const textbox = frame.getByRole('textbox', {
    name: /Type your message here.../,
  });

  await expect(textbox).toBeVisible();

  const messages = frame.locator('[aria-label="ข้อความในการสนทนา"] p');
  const chat = frame.locator('[aria-label="ข้อความในการสนทนา"]');

  const realFrame = page.frame({ name: 'spr-chat__box-frame' });
  if (!realFrame) throw new Error('Frame not found');

  // ====== FUNCTION ======
  const sendMessage = async (msg) => {
    await textbox.fill(msg);

    const beforeCount = await messages.count();

    const consentBtn = frame.getByRole('button', { name: 'ยินยอม' });

    if (await consentBtn.isVisible().catch(() => false)) {
      await consentBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    await expect
      .poll(async () => await messages.count(), { timeout: 80000 })
      .toBeGreaterThan(beforeCount)
      .catch(() => console.log('⚠️ bot ไม่ตอบ แต่ไปต่อ'));

    const typing = frame.getByText('บอทกำลังพิมพ์');
    if (await typing.isVisible().catch(() => false)) {
      await expect(typing).toBeHidden({ timeout: 60000 }).catch(() => {});
    }

    await page.waitForTimeout(300);
  };

  // ====== QUESTIONS ======
  await sendMessage('ถอนเงินไม่ใช้บัตรคือ');
  await sendMessage('ถอนเงินไม่ใช้บัตรได้กี่ครั้งต่อวัน');
  await sendMessage('ถอนเงินไม่ใช้บัตรได้สูงสุดวันละเท่าไหร่');
  await sendMessage('เยี่ยม');

  // ====== AUTO EXPAND VIEWPORT ======
  let hasScroll = true;
  const maxHeight = 6000;

  while (hasScroll && currentHeight < maxHeight) {
    hasScroll = await chat.evaluate((el) => {
      return el.scrollHeight > el.clientHeight;
    });

    if (hasScroll) {
      currentHeight += 300;

      await page.setViewportSize({
        width: WIDTH,
        height: currentHeight,
      });

      await chat.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      await page.waitForTimeout(300);
    }
  }

  // ====== FORCE EXPAND UI ======
  await realFrame.evaluate(() => {
    let el = document.querySelector('[aria-label="ข้อความในการสนทนา"]');

    while (el) {
      el.style.height = 'auto';
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';
      el = el.parentElement;
    }

    document.body.style.height = 'auto';
    document.body.style.maxHeight = 'none';
    document.body.style.overflow = 'visible';
  }).catch(() => console.log('⚠️ expand UI ไม่ได้'));

  await page.waitForTimeout(500);

  // ====== scroll ลงสุด ======
  await chat.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });

  await page.waitForTimeout(1000);

  // ====== scroll กลับขึ้น ======
  await chat.evaluate((el) => {
    el.scrollTop = 0;
  });

  await page.waitForTimeout(1000);

  // ====== FINAL SCREENSHOT ======
  console.log('🔥 กำลังแคป:', filePath);

  await chat.screenshot({
    path: filePath,
  });

  console.log('📸 saved:', filePath);
});

