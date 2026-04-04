const { test } = require('@playwright/test');

test('Step 1: Open Sprinklr with Permissions', async ({ browser }) => {
  // 1. สร้าง Context พร้อมกำหนดสิทธิ์ล่วงหน้า (Permissions)
  const context = await browser.newContext({
    permissions: ['microphone', 'notifications'], // อนุญาตไมค์และการแจ้งเตือน
    viewport: { width: 1280, height: 720 }        // กำหนดขนาดหน้าจอ
  });

  // 2. ใส่ Cookie เพื่อข้ามหน้า Login (ใช้ตัวเดิมที่คุณมี)
  const cookieString = "SPR_STICKINESS=1774839321.736.823.359102|935c7dcb81a00314ea56a3b1f4989107; JSESSIONID=8B93717C094334CF8EF94C027C7E12D6; _mkto_trk=id:386-OOV-110&token:_mch-sprinklr.com-5ea07ccc3f545f7cd13fa0258bbfeff; __adroll_fpc=989f38c5382e312550ef9ffef04152af-1774423694298; user.env.type=ENTERPRISE; connect.sid=s%3AX6xMKgTyG5O01EClZYIB6luSmK09WhNJ.s3FVRzqe72FBPd9do74RbeLM9c6VLitMWclLeVaOddM; SPR_AT=Z0s0RjJ6emJDb0dVTW1qaEpDbjZ5; connect.token=eyJ2M1Nlc3Npb25VcGRhdGVkIjoidHJ1ZSIsImFjY2Vzc1Rva2VuIjoiZXlKaGJHY2lPaUpTVXpJMU5pSjkuZXlKemRXSWlPaUpCWTJObGMzTWdWRzlyWlc0Z1IyVnVaWEpoZEdWa0lFSjVJRk53Y21sdWEyeHlJaXdpWTJ4cFpXNTBTV1FpT2pFeE5qQXlNVEVzSW14dloybHVUV1YwYUc5a0lqb2lVMUJTWDFCQlUxTlhUMUpFWDB4UFIwbE9JaXdpYjNSaFNXUWlPaUkyT1dNNVpUWXhOakU0TlRVMk1qQXdNVFkzTjJabVpUUWlMQ0pwYzNNaU9pSlRVRkpKVGt0TVVpSXNJblI1Y0NJNklrcFhWQ0lzSW5WelpYSkpaQ0k2TVRFeE1UQXpNemMyT1N3aWRYVnBaQ0k2SW1aa01qRTVZak0zTFdNMk16SXROR1k1TUMwNU1qUXdMVEl3Tmpnd05XRmlaak0wTVRveU1UY3dNamsyTmpVek1qY3lPVFlpTENKaGRXUWlPaUpUVUZKSlRrdE1VaUlzSW01aVppSTZNVGMzTkRnek9ERXhPU3dpYzJOdmNHVWlPbHNpVWtWQlJDSXNJbGRTU1ZSRklsMHNJbkJoY25SdVpYSkpaQ0k2TVRFd01EQXhORGdzSW1WNGNDSTZNVGMzTkRnMU16Y3hPU3dpWVhWMGFGUjVjR1VpT2lKVFVGSmZTMFZaWDFCQlUxTmZURTlIU1U0aUxDSjBiMnRsYmxSNWNHVWlPaUpCUTBORlUxTWlMQ0pwWVhRaU9qRTNOelE0TXprek1Ua3NJbXAwYVNJNkluTndjbWx1YTJ4eUlpd2liV2xqY205VFpYSjJhV05sSWpvaWMzQnlJbjAuaDNENHpCYUdpMEoyZGtuVXMyamhGYzBaV09WQV9kWGUwNDRicHlCNUhiRlc2b2phcmFrS3R0bXQ1dnlsOXYwUlF5SGpFcXFRcFI3T1NPeV9rc1F6Zkl2eEhSZ3U0aC1HX0pGdDNNN2FGekljbFRVb09fcXl6OHJxUDJONEk3LXQtYnBtb3JvTVpXWXowZU54QjdqLVpZMGRpMHF2alYxODZ2N3haVnZQY3hKMzNMLUxSZXlmVHFNUVB5WlFOSFF3QTdDNUtCcWJJc3ZtWVNHbUhRUmhzaWdtVEhWWWY1UXh5TnV6b2RGd1MyV0tSdmRpZTVwTE14eTBibHJwcHRkSWlZZHdPX2JYeVFHdlR1cmxfdURCeFU1eVVkVjBTQ1VhelFvYmdJSENVRHhZVGYzYlp2RHBjUGgzeG94MndBdzY5cUp6dWRMcmlNS0pmM3NNR2NnS2FBIn0.cJlcDCsOuxoGSX95g4EsGdrEAOWyy9jYoxc24jPMvSI; sess-exp-time=Tue, 31 Mar 2026 03:03:17 GMT";

  const cookies = cookieString.split('; ').map(pair => {
    const [name, ...valueParts] = pair.split('=');
    return { 
        name: name.trim(), 
        value: valueParts.join('='), 
        domain: '.sprinklr.com', 
        path: '/' 
    };
  });
  await context.addCookies(cookies);

  // 3. เปิดหน้าใหม่และไปยัง URL ที่ต้องการ
  const page = await context.newPage();
  console.log('🚀 กำลังเปิดหน้าเว็บ Sprinklr...');
  
  await page.goto('https://space-prod11.sprinklr.com/app/console', { 
    waitUntil: 'domcontentloaded',
    timeout: 60000 
  });

  console.log('✅ เปิดเว็บสำเร็จและตั้งค่า Permission เรียบร้อย');
  console.log('📌 หน้าจอจะค้างไว้เพื่อให้คุณตรวจสอบสิทธิ์และหน้าเว็บ...');

  // 4. หยุดค้างหน้าจอไว้ (ห้ามลบบรรทัดนี้ถ้าต้องการดูหน้าจอ)
  await page.pause();
});

