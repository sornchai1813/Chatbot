import { test, expect } from '@playwright/test';
import sessions from '../data/question.data.js'; 

// --- 💡 CONFIG: ชื่อต้องตรงกับในไฟล์ JSON (เช่น VB_032, VB_140) ---
const setGroup = "VB_132"; 

test.setTimeout(420000); // เพิ่มเวลาเป็น 7 นาที เผื่อบอทตอบช้าในบางช่วง

test('Main Test - ยิงคำถามสินเชื่อแบบ Step-by-Step (ฉบับเน้นความชัวร์)', async ({ page }) => {
  const data = sessions[0]; 
  const questionsToRun = data[setGroup]; 

  if (!questionsToRun) {
    const availableKeys = Object.keys(data).filter(k => k !== 'sessionId');
    throw new Error(`\n❌ หาชุดคำถาม "${setGroup}" ไม่เจอครับพี่!\nในไฟล์พี่มีชุด: [${availableKeys.join(', ')}]`);
  }

  console.log(`>>> เริ่มรันชุดคำถาม: ${setGroup} (จำนวน ${questionsToRun.length} ข้อ)`);

  await page.goto('https://live-chat-static.sprinklr.com/test-html/index.html?appId=6950dbcf3047873387304feb_app_1111009341&env=prod11&skin=MODERN&locale=th');
  
  await page.getByRole('button', { name: 'เปิดแชท ' }).click();
  const frame = page.frameLocator('iframe[name="spr-chat__box-frame"]');
  
  await expect(frame.getByRole('button', { name: /เริ่มแชทกับ CLICX/ })).toBeVisible();
  await frame.getByRole('button', { name: /เริ่มแชทกับ CLICX/ }).click();
  
  const chatInput = frame.getByRole('textbox', { name: /Type your message here.../ });
  await expect(chatInput).toBeVisible();

  for (let i = 0; i < questionsToRun.length; i++) {
    const task = questionsToRun[i];
    const stepNum = i + 1;

    // 0. เช็คจำนวนข้อความก่อนส่ง (ใช้เปรียบเทียบว่าบอทเริ่มตอบหรือยัง)
    const countBeforeSend = await frame.locator('#spr_richText p, .spr-chat-msg-text').count();

    console.log(`[Step ${stepNum}] กำลังส่ง: ${task.q}`);

    // A. ล้างช่องพิมพ์ให้เกลี้ยง (กันคำถามเบิ้ล)
    await chatInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);

    // B. พิมพ์คำถามและส่ง
    await chatInput.fill(task.q, { force: true });
    await page.keyboard.press('Enter');

    // C. 💡 Logic: รอให้บอทเริ่มพ่นคำตอบ (Wait for First Response)
    console.log(`   > รอให้บอทเริ่มขยับ...`);
    try {
      await expect(async () => {
        const currentCount = await frame.locator('#spr_richText p, .spr-chat-msg-text').count();
        if (currentCount <= countBeforeSend) {
          throw new Error("บอทยังไม่เริ่มตอบ...");
        }
      }).toPass({ timeout: 10000 }); // รอสูงสุด 10 วิ
      console.log(`   > บอทเริ่มตอบแล้ว... กำลังเช็คว่าพิมพ์จบหรือยัง`);
    } catch (e) {
      console.log(`   > [Warning] บอทดูเหมือนจะไม่ตอบใน 10 วิ แต่จะลองรอตามลูปปกติครับ`);
    }

    // D. 💡 Logic: เช็คความนิ่ง (Wait for Stillness)
    let isStillTyping = true;
    let retryCount = 0;
    while (isStillTyping && retryCount < 8) { 
        const count1 = await frame.locator('#spr_richText p, .spr-chat-msg-text').count();
        await page.waitForTimeout(3500); // พัก 3.5 วิ เพื่อดูว่ามีก้อนใหม่โผล่มาไหม
        const count2 = await frame.locator('#spr_richText p, .spr-chat-msg-text').count();
        
        // ถ้าจำนวนเท่าเดิม และ มีข้อความใหม่โผล่มาแล้ว (หรือรอจนสุดทางแล้ว) ถึงจะปล่อยผ่าน
        if (count1 === count2 && (count1 > countBeforeSend || retryCount >= 5)) {
            isStillTyping = false; 
        } else {
            retryCount++;
            console.log("   ...บอทยังพิมพ์ไม่จบ หรือยังไม่มีก้อนใหม่โผล่มา รอต่ออีกนิด...");
        }
    }

    // E. บอทนิ่งสนิทแล้ว แคปจอเลย
    await frame.locator('body').screenshot({ path: `chatbot_${setGroup}_Step${stepNum}.png` });
    console.log(`[Step ${stepNum}] บอทนิ่งแล้ว แคปจอเรียบร้อย!`);
    
    // F. Cooldown 3 วิ ก่อนขึ้นข้อใหม่ (กันแชทซ้อน 100%)
    console.log(`[Step ${stepNum}] >>> พักหายใจ 3 วิ ก่อนขึ้นข้อถัดไป...`);
    await page.waitForTimeout(3000); 
  }

  console.log(`--- จบการเทสชุด ${setGroup} เรียบร้อย ---`);
  await page.pause();
});

