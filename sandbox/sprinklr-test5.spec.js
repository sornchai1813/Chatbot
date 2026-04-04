const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const sessions = require('../data/question.data.js'); 

// 1. ระบุชุดคำถามที่ต้องการรัน
const setGroup = "VB_062_Ensure"; 

test('CLICX Chatbot Automation - Stable v2.0', async ({ page }) => {
  const data = sessions[0]; 
  const questionsToRun = data[setGroup]; 

  if (!questionsToRun) {
    throw new Error(`❌ ไม่พบชุดคำถาม "${setGroup}" ในไฟล์ JSON`);
  }

  // ตั้งเวลา Timeout รวม (10 นาที)
  test.setTimeout(600000); 

  const URL = 'https://live-chat-static.sprinklr.com/test-html/index.html?appId=6950dbcf3047873387304feb_app_1111009341&env=prod11&skin=MODERN&locale=th';
  const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // --- เริ่มการทำงาน ---
  await page.goto(URL);
  await page.getByRole('button', { name: 'เปิดแชท ' }).click();
  
  const frame = page.frameLocator('iframe[name="spr-chat__box-frame"]');
  const realFrame = page.frame({ name: 'spr-chat__box-frame' });

  // กดเริ่มแชท
  await frame.getByRole('button', { name: /เริ่มแชทกับ CLICX/ }).click();
  const textbox = frame.getByRole('textbox', { name: /Type your message here.../ });
  
  // Selector หลัก: แชทแต่ละก้อนข้อความในหน้าใหม่ของ Sprinklr
  const conversationItems = frame.locator('[aria-label="ข้อความในการสนทนา"] .chat-conversation-item');

  let qaResults = [];

  const getConversationItems = async () => {
    const items = await conversationItems.evaluateAll((nodes) =>
      nodes.map((node) => {
        const text = (node.querySelector('.messagePayload')?.innerText || node.innerText || '').trim();
        const type = node.querySelector('[data-testid="sr-user-msg"]')
          ? 'user'
          : node.querySelector('[data-testid="sr-brand-msg"]')
            ? 'bot'
            : 'unknown';

        return { type, text };
      })
    ).catch(() => []);

    return items.filter((item) => item.text);
  };

  const normalizeText = (s = '') => s.replace(/\s+/g, ' ').trim();

  // 🛠 ฟังก์ชันส่งข้อความที่ "ฉลาดและใจเย็น"
  const sendMessage = async (msg) => {
    // เก็บ snapshot ก่อนส่ง เพื่อจับคู่คำตอบกับคำถามนี้เท่านั้น
    const itemsBefore = await getConversationItems();
    const beforeLen = itemsBefore.length;

    await textbox.fill(msg);
    await textbox.press('Enter');
    console.log(`📤 ถาม: "${msg}"`);

    // ⏳ รอให้มี user message นี้ แล้วค่อยหาคำตอบที่นิ่งแล้วจากฝั่ง non-user
    let botAnswer = '';
    let lastNewItemsLen = -1;
    let lastChangeAt = Date.now();
    await expect.poll(async () => {
      const itemsAfter = await getConversationItems();
      const newItems = itemsAfter.slice(beforeLen);

      if (newItems.length !== lastNewItemsLen) {
        lastNewItemsLen = newItems.length;
        lastChangeAt = Date.now();
      }

      const userIdx = newItems.findIndex((item) => {
        if (item.type !== 'user') return false;
        const a = normalizeText(item.text);
        const b = normalizeText(msg);
        return a === b || a.includes(b) || b.includes(a);
      });

      // บางเคส user bubble อาจจับ type ไม่ติด ให้ fallback ไปรอข้อความ non-user ใหม่แทน
      const scanStart = userIdx === -1 ? 0 : userIdx + 1;

      const replyAfterUser = newItems
        .slice(scanStart)
        .find((item) => {
          const text = normalizeText(item.text);
          if (!text) return false;
          if (item.type === 'user') return false;
          if (/กำลังพิมพ์|typing/i.test(text)) return false;
          // กันกรณีระบบ echo ข้อความเดิมของเรา
          return text !== normalizeText(msg);
        });

      botAnswer = replyAfterUser ? normalizeText(replyAfterUser.text) : '';
      if (!botAnswer) return '';

      // ให้ข้อความนิ่งก่อน แล้วค่อยถือว่าเป็นคำตอบจริง เพื่อลดการถามข้อใหม่ไวเกินไป
      if (Date.now() - lastChangeAt < 1200) return '';

      const typing = frame.getByText('บอทกำลังพิมพ์');
      if (await typing.isVisible().catch(() => false)) return '';

      return botAnswer;
    }, { 
      message: `❌ บอทไม่ตอบสำหรับคำถาม: ${msg}`,
      timeout: 90000 
    }).not.toEqual('');

    const typing = frame.getByText('บอทกำลังพิมพ์');
    if (await typing.isVisible().catch(() => false)) {
      await expect(typing).toBeHidden({ timeout: 60000 });
    }

    await page.waitForTimeout(1500);

    return botAnswer;
  };

  // 💬 เริ่มวนลูปถามคำถาม
  for (const item of questionsToRun) {
    const answer = await sendMessage(item.q);
    qaResults.push({ q: item.q, a: answer });
    console.log(`✅ ตอบแล้ว: ${answer.substring(0, 30)}...`);
    
    // พักหายใจ 1.5 วิ ก่อนไปข้อถัดไป เพื่อป้องกันระบบรวน
    await page.waitForTimeout(1500);
  }

  // --- สรุปผลและบันทึกข้อมูล ---
  const caseIdText = await frame.locator('text=/หมายเลขเคส/').last().innerText().catch(() => "");
  const caseNumber = caseIdText.replace(/[^0-9]/g, '') || `Case_${Date.now()}`; 

  // บันทึก CSV
  const csvPath = path.join(SCREENSHOT_DIR, `Log_${caseNumber}.csv`);
  let csvContent = "\ufeff#หมายเลขเคส: " + caseNumber + "\n\n";
  qaResults.forEach((res, index) => {
    const q = res.q.replace(/"/g, '""').replace(/\n/g, ' ');
    const a = res.a.replace(/"/g, '""').replace(/\n/g, ' ');
    csvContent += `Q${index+1}: "${q}"\nA${index+1}: "${a}"\n\n`;
  });
  fs.writeFileSync(csvPath, csvContent);

  // แคปภาพหลักฐาน (ปรับความยาวตามเนื้อหาจริง)
  await page.setViewportSize({ width: 500, height: 2000 });
  await page.waitForTimeout(2000);
  const totalHeight = await realFrame.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 500, height: Math.min(30000, totalHeight + 200) });
  
  await realFrame.locator('body').screenshot({ path: path.join(SCREENSHOT_DIR, `${caseNumber}.png`) });

  console.log(`🏁 ภารกิจเสร็จสิ้น! บันทึกไฟล์ Log และ Screenshot เรียบร้อย`);
  await page.pause(); 
});

