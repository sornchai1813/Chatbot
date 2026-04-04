// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './',
  testMatch: ['tests/**/*.spec.js', 'sandbox/**/*.spec.js'],
  /* รันเทสพร้อมกันหลายไฟล์ */
  fullyParallel: true,
  /* ป้องกันการเผลอทิ้ง test.only ไว้ตอนรันระบบใหญ่ */
  forbidOnly: !!process.env.CI,

  /* รันบนเครื่องตัวเองแค่ครั้งเดียว ไม่ retry ซ้ำ */
  retries: process.env.CI ? 2 : 0,

  /* จำนวนคนช่วยรัน (Workers) */
  workers: process.env.CI ? 3 : undefined,
  /* สร้าง Report เป็น HTML */
  reporter: 'html',

  /* 🛠 ตั้งค่าการใช้งานหลัก */
  use: {
    /* 🟢 จุดที่ 2: เปลี่ยนเป็น retain-on-failure เพื่อให้เก็บหลักฐานทันทีที่พัง */
    trace: 'retain-on-failure',      // เก็บประวัติการรัน Step-by-Step ไว้ดูย้อนหลัง
    screenshot: 'only-on-failure',   // ถ่ายรูปหน้าจอเฉพาะตอนที่เทสพัง
    video: 'retain-on-failure',      // อัดวิดีโอหน้าจอไว้ให้ดู (ถ้าพังจะเซฟไฟล์ให้ทันที)

    /* ตั้งค่า Browser พื้นฐาน */
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  /* 🌐 เลือก Browser ที่ใช้ทดสอบ */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome' // ใช้ Google Chrome ตัวจริงรัน
      },
    },
    // ถ้าอยากเทส Browser อื่น (Firefox/Safari) ให้เอาคอมเมนต์ออกได้ในอนาคตครับ
  ],
});