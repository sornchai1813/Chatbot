const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// --- 💡 CONFIG: ต้องตรงกับ setGroup ในไฟล์เทสของพี่ ---
const setGroup = "VB_097(Lending)_Ensure"; 
// --------------------------------------------------

async function stitchSmoothReport() {
  console.log(`🧵 กำลังเริ่มภารกิจ "เย็บแชทสมูท" สำหรับชุด: ${setGroup}`);

  const files = fs.readdirSync('./')
    .filter(f => f.startsWith(`chatbot_${setGroup}_Step`) && f.endsWith('.png'))
    .sort((a, b) => {
      const stepA = parseInt(a.match(/Step(\d+)/)[1]);
      const stepB = parseInt(b.match(/Step(\d+)/)[1]);
      return stepA - stepB;
    });

  if (files.length === 0) {
    console.log(`❌ ไม่เจอไฟล์รูปของชุด ${setGroup} เลยครับพี่!`);
    return;
  }

  try {
    const imageMetas = await Promise.all(files.map(file => sharp(file).metadata()));
    const width = imageMetas[0].width;
    const height = imageMetas[0].height;

    // --- 💡 จังหวะชี้ชะตา: กำหนดค่า "ซ้อนทับ" (Overlap) ---
    // พี่ต้องปรับค่านี้ตามขนาดหน้าต่างแชทของพี่ครับ
    // - ลองเริ่มที่ 200px (ประมาณความสูงของ Header และ Input รวมกัน)
    // - ถ้าเห็นรอยต่อซ้ำๆ ให้เพิ่มค่า (เช่น 250, 280)
    // - ถ้าแชทหาย ให้ลดค่า (เช่น 150, 180)
    const overlapValue = 200; // 🎯 ปรับที่นี่ครับพี่!
    // --------------------------------------------------

    const effectiveHeight = height - overlapValue;
    // คำนวณความสูงรวมใหม่แบบมี Overlap
    const totalHeight = (effectiveHeight * (files.length - 1)) + height;

    console.log(`📏 เจอรูป ${files.length} ใบ กำลังเริ่มเย็บแบบ smooth (Overlap: ${overlapValue}px)...`);
    console.log(`📐 ขนาดรูปสุดท้ายจะเป็น: ${width}px x ${totalHeight}px`);

    const compositeList = files.map((file, index) => {
      const position = {
        input: file,
        top: index * effectiveHeight, // 💡 สูตรนี้จะทำให้รูปมันวางทับกันลงมาเรื่อยๆ ครับ
        left: 0
      };
      return position;
    });

    const finalImageName = `Final_Smooth_Report_${setGroup}.png`;

    await sharp({
      create: {
        width: width,
        height: totalHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite(compositeList)
    .toFile(finalImageName);

    console.log(`✅ สำเร็จ! พี่ได้รูป "FULL SMOOTH HISTORY" แผ่นเดียวจบที่: ${finalImageName}`);
  } catch (err) {
    console.log(`❌ พังตรงจังหวะเย็บรูปครับพี่: ${err.message}`);
  }
}

stitchSmoothReport();