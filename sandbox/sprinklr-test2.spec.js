import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import sessions from '../data/question.data.js'; // 👈 1. ดึงข้อมูล JSON

// --- 💡 CONFIG ---
const setGroup = "VB_062_Ensure"; // ชื่อชุดคำถามใน JSON

test('CLICX Chatbot - v1.03 (Full Content JSON Version)', async ({ page }) => {

  // 0. ดึงชุดคำถามจาก JSON มาเตรียมไว้
  const data = sessions[0]; 
  const questionsToRun = data[setGroup]; 

  if (!questionsToRun) {
    throw new Error(`❌ หาชุดคำถาม "${setGroup}" ในไฟล์ JSON ไม่เจอครับ!`);
  }

  // 🔥 กัน timeout
  test.setTimeout(480000); // เพิ่มเป็น 8 นาที เผื่อคำถามเยอะ

  const URL = 'https://live-chat-static.sprinklr.com/test-html/index.html?appId=6950dbcf3047873387304feb_app_1111009341&env=prod11&skin=MODERN&locale=th';

  // 📁 จัดการโฟลเดอร์
  const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // 👉 ตั้งชื่อไฟล์ตามชุดคำถาม
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = `${SCREENSHOT_DIR}/CLICX_${setGroup}_${now}.png`;

  // ====== VIEWPORT แรกเริ่ม ======
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

  // ====== 🛠️ FUNCTION ส่งข้อความ (ดึงจากโค้ดหลักของพี่) ======
  const sendMessage = async (msg) => {
    // ล้างข้อความเก่าก่อนพิมพ์ (กันเหนียว)
    await textbox.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');

    await textbox.fill(msg);

    const beforeCount = await messages.count();
    const consentBtn = frame.getByRole('button', { name: 'ยินยอม' });

    if (await consentBtn.isVisible().catch(() => false)) {
      await consentBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    // รอจนกว่าข้อความใหม่จะขึ้น
    await expect
      .poll(async () => await messages.count(), { timeout: 80000 })
      .toBeGreaterThan(beforeCount)
      .catch(() => console.log(`⚠️ บอทไม่ตอบข้อความ: ${msg}`));

    const typing = frame.getByText('บอทกำลังพิมพ์');
    if (await typing.isVisible().catch(() => false)) {
      await expect(typing).toBeHidden({ timeout: 60000 }).catch(() => {});
    }

    await page.waitForTimeout(1000); // พักนิดนึงให้ UI นิ่ง
  };

  // ====== 💬 2. วนลูปถามตาม JSON (ดึง Data มาใช้ตรงนี้) ======
  console.log(`>>> เริ่มรันชุดคำถาม: ${setGroup} (${questionsToRun.length} ข้อ)`);
  
  for (const item of questionsToRun) {
    await sendMessage(item.q);
  }

  // ====== 📏 3. AUTO EXPAND VIEWPORT (ต้นฉบับพี่) ======
  console.log('📏 กำลังยืดหน้าจอ...');
  let hasScroll = true;
  const maxHeight = 10000; // เพิ่มเพดานเผื่อแชทยาวมาก

  while (hasScroll && currentHeight < maxHeight) {
    hasScroll = await chat.evaluate((el) => {
      return el.scrollHeight > el.clientHeight;
    });

    if (hasScroll) {
      currentHeight += 500; // ยืดทีละ 500 จะได้เร็วขึ้น
      await page.setViewportSize({
        width: WIDTH,
        height: currentHeight,
      });

      await chat.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await page.waitForTimeout(400);
    }
  }

  // ====== 🪄 4. FORCE EXPAND UI (ต้นฉบับพี่) ======
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

  await page.waitForTimeout(1000);

  // ====== scroll ลง-ขึ้น (ต้นฉบับพี่) ======
  await chat.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(1000);
  await chat.evaluate((el) => { el.scrollTop = 0; });
  await page.waitForTimeout(1000);

  // ====== 📸 5. FINAL SCREENSHOT ======
  console.log('🔥 กำลังแคปรูปยาว:', filePath);
  await chat.screenshot({ path: filePath });
  console.log('📸 บันทึกสำเร็จ: ', filePath);

  // ====== 🛑 6. ไม่ปิดเว็บตอนท้าย (ค้างไว้ตรวจสอบ) ======
  console.log('✅ รันจบแล้วครับพี่! ค้างหน้าจอไว้ให้แล้วนะ');
  await page.pause(); 
});

