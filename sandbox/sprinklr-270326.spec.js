import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import sessions from '../data/question.data.js'; 

const setGroup = "VB_062"; 

test('CLICX Chatbot - v1.11 (5-Digit Case ID Filename)', async ({ page }) => {

  const data = sessions[0]; 
  const questionsToRun = data[setGroup]; 

  if (!questionsToRun) {
    throw new Error(`❌ ไม่พบชุดคำถาม "${setGroup}" ในไฟล์ JSON!`);
  }

  test.setTimeout(600000); 

  const URL = 'https://live-chat-static.sprinklr.com/test-html/index.html?appId=6950dbcf3047873387304feb_app_1111009341&env=prod11&skin=MODERN&locale=th';

  const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // const WIDTH = 500;
  // await page.setViewportSize({ width: WIDTH, height: 2400 });

  await page.goto(URL);
  await expect(page).toHaveTitle(/Sprinklr Live Chat/);

  await page.getByRole('button', { name: 'เปิดแชท ' }).click();
  const frame = page.frameLocator('iframe[name="spr-chat__box-frame"]');
  const realFrame = page.frame({ name: 'spr-chat__box-frame' });

  await frame.getByRole('button', { name: /เริ่มแชทกับ CLICX/ }).click();
  const textbox = frame.getByRole('textbox', { name: /Type your message here.../ });
  const messages = frame.locator('[aria-label="ข้อความในการสนทนา"] p');
  const chat = frame.locator('[aria-label="ข้อความในการสนทนา"]');

  const sendMessage = async (msg) => {
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

    await expect
      .poll(async () => await messages.count(), { timeout: 80000 })
      .toBeGreaterThan(beforeCount)
      .catch(() => console.log(`⚠️ bot ไม่ตอบคำถาม: ${msg}`));

    const typing = frame.getByText('บอทกำลังพิมพ์');
    if (await typing.isVisible().catch(() => false)) {
      await expect(typing).toBeHidden({ timeout: 60000 }).catch(() => {});
    }
    await page.waitForTimeout(1000); 
  };

  for (const item of questionsToRun) {
    await sendMessage(item.q);
  }

  // ====== 📏 2. AUTO EXPAND VIEWPORT ======
  await chat.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(1500);

  const totalBodyHeight = await realFrame.evaluate(() => document.body.scrollHeight);
  let currentHeight = Math.max(2400, totalBodyHeight + 300); 
  if (currentHeight > 20000) currentHeight = 20000; 

  await page.setViewportSize({ width: WIDTH, height: currentHeight });

  // ====== 🪄 3. FORCE EXPAND UI ======
  await realFrame.evaluate(() => {
    let el = document.querySelector('[aria-label="ข้อความในการสนทนา"]');
    while (el) {
      el.style.height = 'auto';
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';
      el = el.parentElement;
    }
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';
  }).catch(() => {});

  await page.waitForTimeout(1000);

  // ====== 🧼 4. SCRUBBING (Yong Style) ======
  await chat.evaluate(async (el) => {
    for (let y = 0; y <= el.scrollHeight; y += 500) {
      el.scrollTop = y;
      await new Promise(r => setTimeout(r, 100));
    }
    for (let y = el.scrollHeight; y >= 0; y -= 500) {
      el.scrollTop = y;
      await new Promise(r => setTimeout(r, 100));
    }
    el.scrollTop = 0;
  });

  await page.waitForTimeout(2000);

  // ====== 🆔 5. ดึงเลขเคส 5 หลักมาตั้งชื่อไฟล์ (เน้นตัวเลขเพียวๆ) ======
  console.log('🔍 กำลังดึงหมายเลขเคส...');
  
  // สั่งให้ดึง Text จากจุดที่มีคำว่า "หมายเลขเคส"
  const caseIdText = await frame.locator('text=/หมายเลขเคส/').last().innerText().catch(() => "");

  // กรองเอาเฉพาะตัวเลข (เช่น 68905)
  const caseNumber = caseIdText.replace(/[^0-9]/g, ''); 
  
  // ตั้งชื่อไฟล์เป็นตัวเลขอย่างเดียว (ถ้าดึงไม่ได้ให้ใช้ timestamp กันไฟล์ซ้ำ)
  const finalName = caseNumber ? `${caseNumber}.png` : `Case_${Date.now()}.png`;
  const finalPath = path.join(SCREENSHOT_DIR, finalName);

  // ====== 📸 6. FINAL SCREENSHOT ======
  console.log('🔥 บันทึกภาพชื่อ:', finalName);
  await realFrame.locator('body').screenshot({ path: finalPath });
  
  console.log('📸 บันทึกสำเร็จที่: ', finalPath);

  await page.pause(); 
});

