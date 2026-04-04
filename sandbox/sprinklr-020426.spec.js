const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const sessions = require('../data/question.data.js'); 

// 1. ระบุชุดคำถามที่ต้องการรัน
const setGroup = "VB_134_Ensure"; 

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
  const preserveMessageLayout = (s = '') => s
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();
  const escapeCsvField = (s = '') => preserveMessageLayout(s)
    .replace(/"/g, '""')
    .replace(/\n/g, '\r\n');

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

      botAnswer = replyAfterUser ? preserveMessageLayout(replyAfterUser.text) : '';
      if (!normalizeText(botAnswer)) return '';

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
  let csvContent = `\ufeff#หมายเลขเคส: ${caseNumber}\r\n\r\n`;
  qaResults.forEach((res, index) => {
    const q = escapeCsvField(res.q);
    const a = escapeCsvField(res.a);
    csvContent += `Q${index+1}: "${q}"\r\nA${index+1}: "${a}"\r\n\r\n`;
  });
  fs.writeFileSync(csvPath, csvContent);

  // แคปภาพหลักฐานโดยขยาย iframe ทั้งก้อนก่อน เพื่อให้หัวแชทโผล่ครบแม้บทสนทนายาวมาก
  const WIDTH = 500;
  const MIN_VIEW_HEIGHT = 2400;
  const chat = realFrame.locator('[aria-label="ข้อความในการสนทนา"]');

  await page.setViewportSize({ width: WIDTH, height: MIN_VIEW_HEIGHT });
  await page.waitForTimeout(1000);

  await chat.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  }).catch(() => null);
  await page.waitForTimeout(1500);

  await realFrame.evaluate(() => {
    const chatRoot = document.querySelector('[aria-label="ข้อความในการสนทนา"]');
    if (!chatRoot) return;

    let el = chatRoot;
    while (el) {
      el.style.height = 'auto';
      el.style.maxHeight = 'none';
      el.style.minHeight = '0';
      el.style.overflow = 'visible';
      el.style.alignItems = 'stretch';
      el.style.justifyContent = 'flex-start';
      el = el.parentElement;
    }

    const itemsHost = chatRoot.querySelector('.chat-conversation-item')?.parentElement;
    if (itemsHost) {
      itemsHost.style.alignContent = 'flex-start';
      itemsHost.style.justifyContent = 'flex-start';
    }

    chatRoot.scrollTop = 0;
    document.body.style.height = 'auto';
    document.body.style.maxHeight = 'none';
    document.body.style.overflow = 'visible';
    document.documentElement.style.height = 'auto';
    document.documentElement.style.maxHeight = 'none';
    document.documentElement.style.overflow = 'visible';
    window.scrollTo(0, 0);
  }).catch(() => console.log('⚠️ expand UI ไม่ได้'));

  await page.waitForTimeout(1200);

  await chat.evaluate(async (el) => {
    for (let y = 0; y <= el.scrollHeight; y += 500) {
      el.scrollTop = y;
      await new Promise((r) => setTimeout(r, 100));
    }

    for (let y = el.scrollHeight; y >= 0; y -= 500) {
      el.scrollTop = y;
      await new Promise((r) => setTimeout(r, 120));
    }

    el.scrollTop = 0;
  }).catch(() => null);

  await page.waitForTimeout(1800);

  const totalBodyHeight = await realFrame.evaluate(() => (
    Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    )
  ));

  const finalViewportHeight = Math.min(30000, Math.max(MIN_VIEW_HEIGHT, totalBodyHeight + 300));
  await page.setViewportSize({ width: WIDTH, height: finalViewportHeight });
  await page.waitForTimeout(1000);

  const finalPath = path.join(SCREENSHOT_DIR, `${caseNumber}.png`);
  const chatBody = realFrame.locator('body');
  await chatBody.screenshot({ path: finalPath, animations: 'disabled' });

  console.log(`🏁 ภารกิจเสร็จสิ้น! บันทึกไฟล์ Log และ Screenshot เรียบร้อย`);
  await page.pause(); 
});

