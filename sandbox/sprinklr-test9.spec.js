const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const runConfig = require('../config/test-run.config.js');

const SHEET_CSV_URL = process.env.GSHEET_CSV_URL || 'https://docs.google.com/spreadsheets/d/1i2FvHJ58pCtuQs9ZYhAl1z35eqn0qu-WtO_giIsUCrc/export?format=csv&gid=0';
const SHEET_NAME = process.env.GSHEET_NAME || 'questions';

const getSheetIdFromUrl = (url = '') => {
  const m = String(url).match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : '';
};

const getGidFromUrl = (url = '') => {
  const m = String(url).match(/[?&]gid=(\d+)/);
  return m ? m[1] : '0';
};

const parseCsv = (csvText = '') => {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const c = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        value += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }

    if (c === ',') {
      row.push(value);
      value = '';
      continue;
    }

    if (c === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    if (c === '\r') {
      continue;
    }

    value += c;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
};

const parseRequestedSetGroups = (raw = '') => String(raw)
  .split(',')
  .map((g) => g.trim())
  .filter(Boolean);

const isAllGroupsRequest = (requestedGroups = []) => {
  if (!requestedGroups.length) return true;
  return requestedGroups.some((g) => {
    const v = String(g || '').trim().toLowerCase();
    return v === '*' || v === 'all';
  });
};

const resolveSetGroups = (requestedGroups = [], availableGroups = []) => {
  const available = Array.from(new Set(availableGroups.map((g) => String(g || '').trim()).filter(Boolean)));

  if (isAllGroupsRequest(requestedGroups)) {
    return available;
  }

  // Match by exact group name only.
  // Example: VB_134_Ensure and VB_134_Ensure2 are treated as different groups.
  return Array.from(new Set(requestedGroups.map((g) => String(g || '').trim()).filter(Boolean)))
    .filter((name) => available.includes(name));
};

const normalizeHeader = (h = '') => String(h || '')
  .replace(/^\ufeff/, '')
  .trim()
  .toLowerCase();

const csvRowsToObjects = (rows = []) => {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => normalizeHeader(h));

  return rows.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      obj[header] = String(cells[idx] || '').trim();
    });

    // alias keys for mixed naming from different templates
    obj.setGroup = obj.setgroup || obj.set_group || obj.group || '';
    obj.order = obj.order || obj.seq || obj.no || '';
    obj.q = obj.q || obj.question || obj.prompt || '';
    obj.enabled = obj.enabled || obj.active || 'true';

    return obj;
  });
};

const isRowEnabled = (raw = '') => {
  const v = String(raw || 'true').trim().toLowerCase();
  return !['false', '0', 'no', 'n'].includes(v);
};

const fetchSheetCsvText = async () => {
  const direct = SHEET_CSV_URL;
  const sheetId = getSheetIdFromUrl(SHEET_CSV_URL);
  const gid = getGidFromUrl(SHEET_CSV_URL);
  const candidates = [direct];

  if (sheetId) {
    const encodedSheetName = encodeURIComponent(SHEET_NAME);
    candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodedSheetName}`);
    candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
    candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`);
  }

  let lastError = '';
  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        lastError = `HTTP ${response.status} @ ${url}`;
        continue;
      }

      const csvText = await response.text();
      if (!csvText.trim()) {
        lastError = `CSV ว่าง @ ${url}`;
        continue;
      }

      return { csvText, sourceUrl: url };
    } catch (error) {
      lastError = `${error.message} @ ${url}`;
    }
  }

  throw new Error(`โหลด Google Sheet ไม่สำเร็จ: ${lastError || 'unknown error'}`);
};

const loadQuestionsFromSheet = async (requestedGroups = []) => {
  const { csvText, sourceUrl } = await fetchSheetCsvText();
  const rows = csvRowsToObjects(parseCsv(csvText));
  const availableGroups = Array.from(new Set(rows.map((r) => String(r.setGroup || '').trim()).filter(Boolean)));
  const resolvedGroups = resolveSetGroups(requestedGroups, availableGroups);

  if (!isAllGroupsRequest(requestedGroups) && requestedGroups.length && !resolvedGroups.length) {
    const preview = availableGroups.slice(0, 20).join(', ');
    throw new Error(
      `ไม่พบ setGroup ใน Google Sheet: ${requestedGroups.join(', ')} | groups ที่เจอ: ${preview || '(ไม่มีข้อมูล setGroup)'}`
    );
  }

  const groupIndex = new Map(resolvedGroups.map((g, idx) => [g, idx]));

  const list = rows
    .filter((r) => resolvedGroups.includes(String(r.setGroup || '').trim()))
    .filter((r) => isRowEnabled(r.enabled))
    .sort((a, b) => {
      const gDiff = (groupIndex.get(String(a.setGroup || '').trim()) ?? 999) - (groupIndex.get(String(b.setGroup || '').trim()) ?? 999);
      if (gDiff !== 0) return gDiff;
      return Number(a.order || 0) - Number(b.order || 0);
    })
    .map((r) => ({
      q: String(r.q || '').trim(),
      order: Number(r.order || 0),
      setGroup: String(r.setGroup || '').trim(),
    }))
    .filter((r) => r.q);

  const groupedQuestions = resolvedGroups.reduce((acc, groupName) => {
    acc[groupName] = [];
    return acc;
  }, {});

  list.forEach((item) => {
    if (!groupedQuestions[item.setGroup]) {
      groupedQuestions[item.setGroup] = [];
    }
    groupedQuestions[item.setGroup].push(item);
  });

  const nonEmptyGroups = resolvedGroups.filter((g) => (groupedQuestions[g] || []).length > 0);

  console.log(`📥 CSV source: ${sourceUrl}`);

  return { groupedQuestions, resolvedGroups: nonEmptyGroups, sourceUrl };
};

const runSetGroupInSeparateContext = async ({ browser, setGroup, questionsToRun, loadedFrom, roundLabel, slotLabel }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  const URL = runConfig.chat.url;
  const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

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

  try {
    console.log(`🚀 ${roundLabel} ${slotLabel}: เริ่มรัน ${setGroup} | source=${loadedFrom} | q=${questionsToRun.length}`);

    await page.goto(URL);
    await page.getByRole('button', { name: 'เปิดแชท ' }).click();

    const frame = page.frameLocator('iframe[name="spr-chat__box-frame"]');
    const realFrame = page.frame({ name: 'spr-chat__box-frame' });

    await frame.getByRole('button', { name: /เริ่มแชทกับ CLICX/ }).click();
    const textbox = frame.getByRole('textbox', { name: /Type your message here.../ });
    const conversationItems = frame.locator('[aria-label="ข้อความในการสนทนา"] .chat-conversation-item');

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

    const sendMessage = async (msg) => {
      const itemsBefore = await getConversationItems();
      const beforeLen = itemsBefore.length;

      await textbox.fill(msg);
      await textbox.press('Enter');
      console.log(`📤 ${slotLabel} ${setGroup} ถาม: "${msg}"`);

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

        const scanStart = userIdx === -1 ? 0 : userIdx + 1;
        const replyAfterUser = newItems
          .slice(scanStart)
          .find((item) => {
            const text = normalizeText(item.text);
            if (!text) return false;
            if (item.type === 'user') return false;
            if (/กำลังพิมพ์|typing/i.test(text)) return false;
            return text !== normalizeText(msg);
          });

        botAnswer = replyAfterUser ? preserveMessageLayout(replyAfterUser.text) : '';
        if (!normalizeText(botAnswer)) return '';

        if (Date.now() - lastChangeAt < 1200) return '';

        const typing = frame.getByText('บอทกำลังพิมพ์');
        if (await typing.isVisible().catch(() => false)) return '';

        return botAnswer;
      }, {
        message: `❌ บอทไม่ตอบสำหรับคำถาม: ${msg}`,
        timeout: runConfig.timeouts.botReplyMs,
      }).not.toEqual('');

      const typing = frame.getByText('บอทกำลังพิมพ์');
      if (await typing.isVisible().catch(() => false)) {
        await expect(typing).toBeHidden({ timeout: runConfig.timeouts.typingHiddenMs });
      }

      await page.waitForTimeout(runConfig.waits.afterSendMs);
      return botAnswer;
    };

    const qaResults = [];
    for (const item of questionsToRun) {
      const answer = await sendMessage(item.q);
      qaResults.push({ q: item.q, a: answer });
      console.log(`✅ ${slotLabel} ${setGroup} ตอบแล้ว: ${answer.substring(0, 30)}...`);
      await page.waitForTimeout(runConfig.waits.betweenQuestionsMs);
    }

    const caseIdText = await frame.locator('text=/หมายเลขเคส/').last().innerText().catch(() => '');
    const caseNumber = caseIdText.replace(/[^0-9]/g, '') || `Case_${Date.now()}`;

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const dateSuffix = `${dd}${mm}${yy}`;
    const outputGroupTag = String(setGroup).replace(/[^a-zA-Z0-9_+\-]/g, '_');

    const csvPath = path.join(SCREENSHOT_DIR, `Log_${caseNumber}_${outputGroupTag}_${dateSuffix}.csv`);
    let csvContent = `\ufeff#หมายเลขเคส: ${caseNumber}\r\n#setGroup: ${setGroup}\r\n\r\n`;
    qaResults.forEach((res, index) => {
      const q = escapeCsvField(res.q);
      const a = escapeCsvField(res.a);
      csvContent += `Q${index + 1}: "${q}"\r\nA${index + 1}: "${a}"\r\n\r\n`;
    });
    fs.writeFileSync(csvPath, csvContent);

    const WIDTH = runConfig.screenshot.width;
    const MIN_VIEW_HEIGHT = runConfig.screenshot.minViewHeight;
    const chat = realFrame.locator('[aria-label="ข้อความในการสนทนา"]');

    await page.setViewportSize({ width: WIDTH, height: MIN_VIEW_HEIGHT });
    await page.waitForTimeout(runConfig.waits.afterInitialViewportMs);

    await chat.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    }).catch(() => null);
    await page.waitForTimeout(runConfig.waits.afterScrollBottomMs);

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

    await page.waitForTimeout(runConfig.waits.afterExpandUiMs);

    const scrubStepPx = runConfig.screenshot.scrubStepPx;
    await chat.evaluate(async (el, stepPx) => {
      for (let y = 0; y <= el.scrollHeight; y += stepPx) {
        el.scrollTop = y;
        await new Promise((r) => setTimeout(r, 100));
      }

      for (let y = el.scrollHeight; y >= 0; y -= stepPx) {
        el.scrollTop = y;
        await new Promise((r) => setTimeout(r, 120));
      }

      el.scrollTop = 0;
    }, scrubStepPx).catch(() => null);

    await page.waitForTimeout(runConfig.waits.afterScrubMs);

    const totalBodyHeight = await realFrame.evaluate(() => (
      Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      )
    ));

    const finalViewportHeight = Math.min(
      runConfig.screenshot.maxViewHeight,
      Math.max(MIN_VIEW_HEIGHT, totalBodyHeight + runConfig.screenshot.extraBottomPx)
    );
    await page.setViewportSize({ width: WIDTH, height: finalViewportHeight });
    await page.waitForTimeout(runConfig.waits.afterFinalViewportMs);

    const finalPath = path.join(SCREENSHOT_DIR, `${caseNumber}_${outputGroupTag}_${dateSuffix}.png`);
    const chatBody = realFrame.locator('body');
    await chatBody.screenshot({ path: finalPath, animations: 'disabled' });

    console.log(`🏁 ${roundLabel} ${slotLabel}: เสร็จสิ้น ${setGroup} | case ${caseNumber} | CSV: Log_${caseNumber}_${outputGroupTag}_${dateSuffix}.csv | PNG: ${caseNumber}_${outputGroupTag}_${dateSuffix}.png`);
  } finally {
    await context.close().catch(() => null);
  }
};

// 1. ระบุชุดคำถามที่ต้องการรัน
const requestedSetGroups = parseRequestedSetGroups(runConfig.setGroup);
const maxParallelGroups = Math.max(1, Number(runConfig.maxParallelGroups || 3));

test('CLICX Chatbot Automation - Stable v2.0', async ({ browser }, testInfo) => {
  let questionsByGroup = {};
  let resolvedSetGroups = [];
  const loadedFrom = 'sheet';

  const sheetResult = await loadQuestionsFromSheet(requestedSetGroups);
  questionsByGroup = sheetResult.groupedQuestions;
  resolvedSetGroups = sheetResult.resolvedGroups;
  const totalQuestions = resolvedSetGroups.reduce((sum, g) => sum + (questionsByGroup[g] || []).length, 0);
  console.log(`📄 โหลดคำถามจาก Google Sheet สำเร็จ: ${totalQuestions} ข้อ`);

  if (!resolvedSetGroups.length) {
    throw new Error(`❌ ไม่พบชุดคำถาม "${requestedSetGroups.join(', ')}" ใน Google Sheet`);
  }

  const roundNumber = testInfo.repeatEachIndex + 1;
  const roundLabel = `round ${roundNumber}`;

  const runGroupLabel = resolvedSetGroups.join(', ');
  console.log(`📚 ใช้คำถามจาก: ${loadedFrom} | setGroup=${runGroupLabel} | จำนวน=${totalQuestions}`);

  test.setTimeout(runConfig.timeouts.testMs);

  console.log(`🚀 ${roundLabel}: เริ่มรันชุดคำถามแยกเว็บต่อ setGroup (${resolvedSetGroups.length} groups, parallel=${maxParallelGroups})`);

  for (let i = 0; i < resolvedSetGroups.length; i += maxParallelGroups) {
    const batch = resolvedSetGroups.slice(i, i + maxParallelGroups);
    await Promise.all(
      batch.map((groupName, batchIndex) => {
        const globalIndex = i + batchIndex;
        const questionsToRun = questionsByGroup[groupName] || [];
        const slotLabel = `[${globalIndex + 1}/${resolvedSetGroups.length}]`;

        return runSetGroupInSeparateContext({
          browser,
          setGroup: groupName,
          questionsToRun,
          loadedFrom,
          roundLabel,
          slotLabel,
        });
      })
    );
  }
});

