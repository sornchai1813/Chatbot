const { test, expect } = require('@playwright/test');
const { caseIDs, testData, cookieString } = require('../config/testData');

test('Sprinklr Full Process - Codegen Style with Variables', async ({ browser }) => {
  // ---------------------------------------------------------
  // 🪄 1. ส่วนตัวแปร (ดึงมาจาก config/testData.js)
  // ---------------------------------------------------------
  const selectedCategory = 'cat1'; // เปลี่ยนเป็น cat2, cat3, cat4 ตามต้องการ
  const myCaseID = caseIDs.case1;               // เลขเคส
  const expectedText1 = testData[selectedCategory].expectedText1;   // ค่าที่ตรวจช่อง 5098
  const expectedText2 = testData[selectedCategory].expectedText2;   // ค่าที่ตรวจช่อง 5099
  // ---------------------------------------------------------

  // 1. Setup Context & Permissions
  const context = await browser.newContext({
    permissions: ['microphone', 'notifications'],
    viewport: { width: 1280, height: 720 }
  });

  // 2. 🍪 ใส่ Cookie (ชุดเดิมของคุณ)
  const cookieString = "SPR_STICKINESS=1774839321.736.823.359102|935c7dcb81a00314ea56a3b1f4989107; JSESSIONID=8B93717C094334CF8EF94C027C7E12D6; _mkto_trk=id:386-OOV-110&token:_mch-sprinklr.com-5ea07ccc3f545f7cd13fa0258bbfeff; __adroll_fpc=989f38c5382e312550ef9ffef04152af-1774423694298; user.env.type=ENTERPRISE; connect.sid=s%3AX6xMKgTyG5O01EClZYIB6luSmK09WhNJ.s3FVRzqe72FBPd9do74RbeLM9c6VLitMWclLeVaOddM; SPR_AT=Z0s0RjJ6emJDb0dVTW1qaEpDbjZ5; connect.token=eyJ2M1Nlc3Npb25VcGRhdGVkIjoidHJ1ZSIsImFjY2Vzc1Rva2VuIjoiZXlKaGJHY2lPaUpTVXpJMU5pSjkuZXlKemRXSWlPaUpCWTJObGMzTWdWRzlyWlc0Z1IyVnVaWEpoZEdWa0lFSjVJRk53Y21sdWEyeHlJaXdpWTJ4cFpXNTBTV1FpT2pFeE5qQXlNVEVzSW14dloybHVUV1YwYUc5a0lqb2lVMUJTWDFCQlUxTlhUMUpFWDB4UFIwbE9JaXdpYjNSaFNXUWlPaUkyT1dNNVpUWXhOakU0TlRVMk1qQXdNVFkzTjJabVpUUWlMQ0pwYzNNaU9pSlRVRkpKVGt0TVVpSXNJblI1Y0NJNklrcFhWQ0lzSW5WelpYSkpaQ0k2TVRFeE1UQXpNemMyT1N3aWRYVnBaQ0k2SW1aa01qRTVZak0zTFdNMk16SXROR1k1TUMwNU1qUXdMVEl3Tmpnd05XRmlaak0wTVRveU1UY3dNamsyTmpVek1qY3lPVFlpTENKaGRXUWlPaUpUVUZKSlRrdE1VaUlzSW01aVppSTZNVGMzTkRnek9ERXhPU3dpYzJOdmNHVWlPbHNpVWtWQlJDSXNJbGRTU1ZSRklsMHNJbkJoY25SdVpYSkpaQ0k2TVRFd01EQXhORGdzSW1WNGNDSTZNVGMzTkRnMU16Y3hPU3dpWVhWMGFGUjVjR1VpT2lKVFVGSmZTMFZaWDFCQlUxTmZURTlIU1U0aUxDSjBiMnRsYmxSNWNHVWlPaUpCUTBORlUxTWlMQ0pwWVhRaU9qRTNOelE0TXprek1Ua3NJbXAwYVNJNkluTndjbWx1YTJ4eUlpd2liV2xqY205VFpYSjJhV05sSWpvaWMzQnlJbjAuaDNENHpCYUdpMEoyZGtuVXMyamhGYzBaV09WQV9kWGUwNDRicHlCNUhiRlc2b2phcmFrS3R0bXQ1dnlsOXYwUlF5SGpFcXFRcFI3T1NPeV9rc1F6Zkl2eEhSZ3U0aC1HX0pGdDNNN2FGekljbFRVb09fcXl6OHJxUDJONEk3LXQtYnBtb3JvTVpXWXowZU54QjdqLVpZMGRpMHF2alYxODZ2N3haVnZQY3hKMzNMLUxSZXlmVHFNUVB5WlFOSFF3QTdDNUtCcWJJc3ZtWVNHbUhRUmhzaWdtVEhWWWY1UXh5TnV6b2RGd1MyV0tSdmRpZTVwTE14eTBibHJwcHRkSWlZZHdPX2JYeVFHdlR1cmxfdURCeFU1eVVkVjBTQ1VhelFvYmdJSENVRHhZVGYzYlp2RHBjUGgzeG94MndBdzY5cUp6dWRMcmlNS0pmM3NNR2NnS2FBIn0.cJlcDCsOuxoGSX95g4EsGdrEAOWyy9jYoxc24jPMvSI; sess-exp-time=Tue, 31 Mar 2026 03:03:17 GMT";

  const cookies = cookieString.split('; ').map(pair => {
    const [name, ...valueParts] = pair.split('=');
    if (!name) return null;
    return { name: name.trim(), value: valueParts.join('='), domain: '.sprinklr.com', path: '/' };
  }).filter(c => c !== null);
  await context.addCookies(cookies);

  const page = await context.newPage();
  
  // 3. เริ่มเข้าหน้าเว็บ
  console.log('🚀 กำลังเปิด Sprinklr...');
  await page.goto('https://space-prod11.sprinklr.com/app/console', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000); 

  // 4. ปิด Dismiss Popup
  try {
    const dismissBtn = page.getByRole('button', { name: /Dismiss/i });
    if (await dismissBtn.isVisible({ timeout: 5000 })) {
      await dismissBtn.click();
      await page.waitForTimeout(2000); 
    }
  } catch (e) {}

  // 5. Logic: เปิด Search
  const noCaseFound = await page.getByText('No case selected').isVisible();
  const searchInput = page.getByRole('combobox', { name: 'Search Cases' });

  if (noCaseFound) {
    await page.getByRole('button', { name: 'Search cases' }).first().click();
    await page.locator('div').filter({ hasText: /^Search Cases$/ }).first().click();
  }

  // 6. กรอกเลขเคส
  await searchInput.click();
  await searchInput.fill(`#${myCaseID}`);
  await searchInput.press('Enter');

 // 7. คลิกเลือกเคส (Code จาก Codegen ของคุณ)
  console.log('⏳ กำลังคลิกเลือกเคส...');
  await page.getByLabel(`Case number ${myCaseID}`).click();

  // 8. ตรวจสอบข้อมูล (Assert Text)
  console.log('🛡️ กำลังตรวจสอบข้อมูลใน Snapshot...');
  
  // ตรวจสอบหัวข้อ (ใส่ Timeout กันเหนียว)
  await expect(page.getByRole('heading', { name: 'Customer Snapshot ‏' })).toBeVisible({ timeout: 15000 });
  
  // ตรวจสอบค่าใน Container ต่างๆ
  await expect(page.locator('#container-for-CUSTOM_FIELD_5098')).toContainText(expectedText1);
  await expect(page.locator('#container-for-CUSTOM_FIELD_5099')).toContainText(expectedText2);

  // 9. หยุดค้างหน้าจอไว้
  console.log('🎉 เสร็จสิ้น! หน้าจอหยุดค้างไว้ที่หน้า Case แล้วครับ');
  await page.pause(); 
});

