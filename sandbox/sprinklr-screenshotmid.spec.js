import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import sessions from '../data/question.data.js'; 

// --- 💡 CONFIG: ชื่อชุดคำถามใน JSON ---
const setGroup = "VB_062"; 

test('CLICX Chatbot - v1.03 (Yong Style + JSON + High Performance Expand)', async ({ page }) => {

  // 0. เตรียมข้อมูลจาก JSON
  const data = sessions[0]; 
  const questionsToRun = data[setGroup]; 

  if (!questionsToRun) {
    throw new Error(`❌ ไม่พบชุดคำถาม "${setGroup}" ในไฟล์ JSON!`);
  }

  // 🔥 กัน timeout เพิ่มเป็น 10 นาที เผื่อ 5 ข้อขึ้นไปบอทตอบนาน
  test.setTimeout(600000); 

  const URL = 'https://live-chat-static.sprinklr.com/test-html/index.html?appId=6950dbcf3047873387304feb_app_1111009341&env=prod11&skin=MODERN&locale=th';

  // 📁 จัดการโฟลเดอร์ Screenshot
  const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = `${SCREENSHOT_DIR}/CLICX_${setGroup}_${now}.png`;

  // ====== VIEWPORT แรกเริ่ม (สไตล์พี่) ======
  let currentHeight = 2400;
  const WIDTH = 500;
  await page.setViewportSize({ width: WIDTH, height: currentHeight });

  // ====== OPEN & START ======
  await page.goto(URL);
  await expect(page).toHaveTitle(/Sprinklr Live Chat/);

  await page.getByRole('button', { name: 'เปิดแชท ' }).click();
  const frame = page.frameLocator('iframe[name="spr-chat__box-frame"]');
  const realFrame = page.frame({ name: 'spr-chat__box-frame' });

  await frame.getByRole('button', { name: /เริ่มแชทกับ CLICX/ }).click();
  const textbox = frame.getByRole('textbox', { name: /Type your message here.../ });
  const messages = frame.locator('[aria-label="ข้อความในการสนทนา"] p');
  const chat = frame.locator('[aria-label="ข้อความในการสนทนา"]');

  // ====== 🛠️ FUNCTION ส่งข้อความ (อิงตามพี่เป๊ะๆ) ======
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

    // รอให้บอทตอบ (อิงตามพี่)
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

  // ====== 💬 1. วนลูปส่งคำถามตาม JSON ======
  console.log(`>>> เริ่มส่งคำถามชุด: ${setGroup} (${questionsToRun.length} ข้อ)`);
  for (const item of questionsToRun) {
    await sendMessage(item.q);
  }

  // ====== 📏 2. AUTO EXPAND VIEWPORT (ฉบับแก้ขาดล่างสำหรับ 5 ข้อ) ======
  console.log('📏 กำลังคำนวณความสูงจริงเพื่อยืดหน้าจอ...');

  // 💡 สั่งให้แชทรูดลงล่างสุดเพื่อให้ Browser คายค่าความสูงที่แท้จริงออกมา
  await chat.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(1500);

  // 💡 ดึงค่าความสูงของเนื้อหาทั้งหมดมาเลย
  const fullScrollHeight = await chat.evaluate((el) => el.scrollHeight);
  console.log(`📏 ความสูงแชทจริง: ${fullScrollHeight}px`);

  // 💡 ยืด Viewport ให้ยาวกว่าแชทจริง + เผื่อระยะขอบล่าง 1000px (กันเหนียว)
  currentHeight = Math.max(2400, fullScrollHeight + 1000); 
  
  // ปรับเพดานสูงสุดเป็น 20,000px เผื่อแชทยาวเว่อร์
  if (currentHeight > 20000) currentHeight = 20000; 

  await page.setViewportSize({ width: WIDTH, height: currentHeight });
  console.log(`↕️ ปรับความสูงหน้าจอใหม่เป็น: ${currentHeight}px`);

  await page.waitForTimeout(1000);

  // ====== 🪄 3. FORCE EXPAND UI (ต้นฉบับพี่เป๊ะๆ) ======
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

  // ====== 🧼 4. SCRUBBING (รูดขึ้น-ลง เพื่อให้ Render ครบ) ======
  console.log('🧼 กำลังรูดแชทขึ้น-ลง เพื่อบังคับให้โหลดข้อความทั้งหมด...');
  await chat.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(1500);
  await chat.evaluate((el) => { el.scrollTop = 0; });
  await page.waitForTimeout(2000); // รอให้ Content บนสุดโหลดกลับมาทัน

  // ====== 📸 5. FINAL SCREENSHOT ======
  console.log('🔥 กำลังบันทึกภาพยาว:', filePath);
  await chat.screenshot({ path: filePath });
  console.log('📸 saved:', filePath);

  // ====== 🛑 6. ค้างหน้าจอไว้ตรวจสอบ ======
  console.log('✅ รันจบแล้วครับพี่! ลองเช็คไฟล์รูปดู 5 ข้อมาครบแน่นอน');
  await page.pause(); 
});

