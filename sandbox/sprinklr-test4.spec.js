import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import sessions from '../data/question.data.js'; 

const setGroup = "VB_118_Ensure"; 

test('CLICX Chatbot - v1.13 (Format Q&A Report)', async ({ page }) => {

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

  const WIDTH = 500;
  await page.setViewportSize({ width: WIDTH, height: 2400 });

  await page.goto(URL);
  await expect(page).toHaveTitle(/Sprinklr Live Chat/);

  await page.getByRole('button', { name: 'เปิดแชท ' }).click();
  const frame = page.frameLocator('iframe[name="spr-chat__box-frame"]');
  const realFrame = page.frame({ name: 'spr-chat__box-frame' });

  await frame.getByRole('button', { name: /เริ่มแชทกับ CLICX/ }).click();
  const textbox = frame.getByRole('textbox', { name: /Type your message here.../ });
  const messages = frame.locator('[aria-label="ข้อความในการสนทนา"] p');
  const chat = frame.locator('[aria-label="ข้อความในการสนทนา"]');

  let qaResults = [];

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

    const lastAnswer = await messages.last().innerText().catch(() => "N/A");
    return lastAnswer;
  };

  // 💬 1. วนลูปส่งคำถาม
  for (const item of questionsToRun) {
    const answer = await sendMessage(item.q);
    qaResults.push({ q: item.q, a: answer });
  }

  // ====== 🔍 2. ดึงหมายเลขเคส 5 หลัก ======
  const caseIdText = await frame.locator('text=/หมายเลขเคส/').last().innerText().catch(() => "");
  const caseNumber = caseIdText.replace(/[^0-9]/g, '') || "Unknown"; 

  // ====== 📝 3. บันทึกผลลัพธ์ลง CSV (Format ตามที่พี่ต้องการ) ======
  const csvFileName = `Log_${caseNumber}_${setGroup}.csv`;
  const csvPath = path.join(SCREENSHOT_DIR, csvFileName);
  
  // \ufeff เพื่อให้ Excel อ่านภาษาไทยออก
  let csvContent = "\ufeff#หมายเลขเคส: " + caseNumber + "\n\n";
  
  qaResults.forEach((res, index) => {
    const qNum = index + 1;
    // ใช้เครื่องหมายคำพูดครอบเนื้อหาไว้ เพื่อให้เวลาเปิดใน Excel มันรวมเป็น Cell เดียวแม้จะมีหลายบรรทัด
    csvContent += `Q${qNum}: "${res.q}"\n`;
    csvContent += `A${qNum}: "${res.a}"\n\n`; // เว้นบรรทัดหลังจบคำตอบแต่ละข้อ
  });

  fs.writeFileSync(csvPath, csvContent);
  console.log(`✅ บันทึก Log เรียบร้อย: ${csvFileName}`);

  // ====== 📏 4. AUTO EXPAND & SCRUBBING ======
  await chat.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(1500);
  const totalBodyHeight = await realFrame.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: WIDTH, height: Math.min(20000, totalBodyHeight + 300) });

  await realFrame.evaluate(() => {
    let el = document.querySelector('[aria-label="ข้อความในการสนทนา"]');
    while (el) {
      el.style.height = 'auto'; el.style.maxHeight = 'none'; el.style.overflow = 'visible';
      el = el.parentElement;
    }
    document.body.style.height = 'auto';
  });

  await chat.evaluate(async (el) => {
    for (let y = 0; y <= el.scrollHeight; y += 500) { el.scrollTop = y; await new Promise(r => setTimeout(r, 100)); }
    for (let y = el.scrollHeight; y >= 0; y -= 500) { el.scrollTop = y; await new Promise(r => setTimeout(r, 100)); }
    el.scrollTop = 0;
  });

  await page.waitForTimeout(2000);

  // ====== 📸 5. FINAL SCREENSHOT ======
  const finalName = caseNumber !== "Unknown" ? `${caseNumber}.png` : `Case_${Date.now()}.png`;
  await realFrame.locator('body').screenshot({ path: path.join(SCREENSHOT_DIR, finalName) });
  
  await page.pause(); 
});

