# บันทึกการเปลี่ยนแปลง

เอกสารนี้บันทึกการเปลี่ยนแปลงสำคัญของระบบทดสอบอัตโนมัติ โดยจัดรูปแบบแบบ Conventional Changelog สำหรับใช้งานกับกระบวนการออกเวอร์ชันอัตโนมัติ

หมายเหตุการนับเวอร์ชัน:
- เลขเวอร์ชันผูกกับเลขไฟล์เทสต์หลัก
- ตัวอย่าง: test9 = 9.0.0, test8 = 8.0.0
- ระบุไฟล์ที่เกี่ยวข้องไว้ในหัวข้อ chore ของแต่ละเวอร์ชัน

กติกาใช้งานแบบตายตัว:
- ไฟล์หลัก `sandbox/sprinklr-testN.spec.js` ให้เริ่มที่เวอร์ชัน `N.0.0`
- การแก้แบบ backward-compatible ในไฟล์ testN เดิม ให้เพิ่ม minor เป็น `N.1.0`, `N.2.0`
- การแก้บั๊กอย่างเดียวในไฟล์ testN เดิม ให้เพิ่ม patch เป็น `N.1.1`, `N.1.2`
- ถ้ามีการเปลี่ยนไฟล์หลักจาก testN ไป test(N+1) ให้เริ่มใหม่ที่ `N+1.0.0`

## [10.0.0] - ยังไม่ปล่อย
### feat
- (เติมรายการฟีเจอร์ใหม่ของ test10)

### fix
- (เติมรายการแก้บั๊กของ test10)

### refactor
- (เติมรายการปรับโครงสร้างของ test10)

### chore
- ขอบเขตไฟล์: sandbox/sprinklr-test10.spec.js

## [9.0.0] - 2026-04-03
### feat
- เพิ่มการอ่านชุดคำถามจาก Google Sheet โดยระบุชื่อชีทผ่านตัวแปร `GSHEET_NAME`
- เพิ่มลำดับสำรองในการอ่าน CSV จากหลายปลายทาง: URL ตรง, gviz ตามชื่อชีท, gviz ตาม gid, และ export CSV

### refactor
- ปรับโค้ด parse ข้อมูลจากชีทให้ทนทานขึ้นด้วยการ normalize header และ alias mapping
- ปรับ log ระหว่างรันให้เห็น source URL และสถานะว่าใช้ข้อมูลจากชีทหรือ local fallback
- คงผลลัพธ์หลักฐานไว้เป็นไฟล์ local รูปแบบ CSV และ PNG

### chore
- ตัดขอบเขตงาน export ผลกลับ Google Sheet ออกจากเวอร์ชันนี้
- ขอบเขตไฟล์: sandbox/sprinklr-test9.spec.js, CHANGELOG.md

## [8.0.0] - 2026-04-03
### feat
- เพิ่มรูปแบบการตั้งชื่อไฟล์ผลลัพธ์ให้มี `setGroup` และวันที่แบบ `DDMMYY`
- เพิ่มการตั้งค่าชื่อชีทสำหรับแหล่งคำถาม

### fix
- แก้การใช้งาน evaluate ใน browser context โดยส่งค่า scrub step เข้า callback อย่างถูกต้อง

### chore
- ขอบเขตไฟล์: sandbox/sprinklr-test7.spec.js, sandbox/sprinklr-test8.spec.js

## [7.0.0] - 2026-04-03
### feat
- เพิ่มความสามารถเริ่มต้นในการอ่านชุดคำถามจาก Public Google Sheet CSV
- เพิ่ม local fallback ไปยัง `question.data.js` เมื่อโหลดชีทไม่สำเร็จ

### refactor
- ปรับกลไกทำให้คำตอบบอทนิ่งก่อนเริ่มคำถามถัดไป
- ปรับ flow การแคปหลักฐานสำหรับบทสนทนายาวให้เสถียรขึ้น

### chore
- ขอบเขตไฟล์: sandbox/sprinklr-test6.spec.js, sandbox/sprinklr-test7.spec.js, sandbox/sprinklr-test8.spec.js

## [6.1.0] - 2026-04-03
### feat
- เพิ่มการบันทึกผลรายเคสเป็นไฟล์ CSV และหลักฐานภาพ PNG
- เพิ่มการตั้งค่า timeout และ wait ผ่านไฟล์ config

### chore
- ขอบเขตไฟล์: config/test-run.config.js, sandbox/sprinklr-test6.spec.js

## [6.0.0] - 2026-04-03
### feat
- เพิ่มโครงสร้างพื้นฐานของการทดสอบแชตบอทอัตโนมัติ
- เพิ่มการวนถามคำถามตามชุดที่กำหนด

### chore
- ขอบเขตไฟล์: data/question.data.js, sandbox/sprinklr-test6.spec.js
