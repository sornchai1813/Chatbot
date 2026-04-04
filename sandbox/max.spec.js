import { test, expect } from '@playwright/test';

test('open google', async ({ page }) => {
  // เปิดเว็บหน้า Chat bot
  await page.goto('https://live-chat-static.sprinklr.com/test-html/index.html?appId=6950dbcf3047873387304feb_app_1111009341&env=prod11&skin=MODERN&locale=th');
  // ตรวจสอบ Title แสดง Sprinklr Live Chat
  await expect(page).toHaveTitle(/Sprinklr Live Chat/);
  // คลิกเปิด Chat Bot ขวาล่าง
  await page.getByRole('button',{name:'เปิดแชท '}).click();
  // คำสั่งชี้ให้ Locator ไปค้นหาใน frame
  const frame = page.frameLocator('iframe[name="spr-chat__box-frame"]');
  // ตรวจสอบ มีปุ่ม เริ่มแชทกับ CLICX
  await expect(frame.getByRole('button', { name: /เริ่มแชทกับ CLICX/ })).toBeVisible();
  // คลิก เริ่มแชทกับ CLICX
  await frame.getByRole('button', { name: /เริ่มแชทกับ CLICX/ }).click();
  // ตรวจสอบว่าระบบคลิกเปิดแล้ว และมี Holder ข้อความ Type your message here
  await expect(frame.getByRole('textbox', { name: /Type your message here.../ })).toBeVisible();
    // ใส่คำถาม หลัง fill
    await frame.getByRole('textbox', { name: /Type your message here.../ }).fill('วิธีการใช้วงเงินสินเชื่อCLICX');
    await frame.locator('textarea').press('Enter');
    // Expected คำตอบ หลัง toContainText
    await expect(frame.locator('#spr_richText p').last()).toContainText('การใช้วงเงินสินเชื่อ CLICX', { timeout: 30000 });
    await page.waitForTimeout(5000);
    const chatbox = frame.locator('body');
    await chatbox.screenshot({ path: 'chatbotA1.png' });

    // ใส่คำถาม หลัง fill
    await frame.getByRole('textbox', { name: /Type your message here.../ }).fill('ใช้วงเงินจ่ายบิลยังไง');
    await frame.locator('textarea').press('Enter');
    // Expected คำตอบ หลัง toContainText
    await expect(frame.locator('#spr_richText p').last()).toContainText('การใช้วงเงินสินเชื่อ CLICX', { timeout: 30000 });
    await page.waitForTimeout(5000);
    await chatbox.screenshot({ path: 'chatbotA2.png' });
    await frame.locator('body').screenshot({ path: 'chat-full.png' });
});
 

