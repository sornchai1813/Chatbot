const fs = require('fs');
const path = require('path');

const sessions = require('../data/question.data.js');
const outputPath = path.join(__dirname, '..', 'data', 'questions_from_question_data.csv');

const escapeCsv = (value = '') => {
  const s = String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return `"${s.replace(/"/g, '""')}"`;
};

const root = Array.isArray(sessions) && sessions.length ? sessions[0] : {};
const rows = [];

Object.entries(root).forEach(([setGroup, value]) => {
  if (!Array.isArray(value)) return;

  value.forEach((item, idx) => {
    const q = item && typeof item === 'object' ? item.q : '';
    if (!q) return;
    rows.push([
      setGroup,
      idx + 1,
      q,
      'TRUE',
      '',
      ''
    ]);
  });
});

rows.sort((a, b) => {
  if (a[0] < b[0]) return -1;
  if (a[0] > b[0]) return 1;
  return Number(a[1]) - Number(b[1]);
});

const header = ['setGroup', 'order', 'q', 'enabled', 'assertType', 'expected'];
const csvLines = [header.join(',')]
  .concat(rows.map((cols) => cols.map((c) => escapeCsv(c)).join(',')));

fs.writeFileSync(outputPath, `\ufeff${csvLines.join('\r\n')}\r\n`, 'utf8');
console.log(`Created: ${outputPath}`);
console.log(`Rows: ${rows.length}`);
