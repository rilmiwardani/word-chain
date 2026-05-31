const fs = require('fs');
let s = fs.readFileSync('src/utils/constants.js', 'utf8');

const map = {
  'â€¢': '•',
  'ðŸ“': '📏',
  '1\u00ef\u00b8\u008f\u00e2\u0192\u00a3': '1\uFE0F\u20E3',
  '2\u00ef\u00b8\u008f\u00e2\u0192\u00a3': '2\uFE0F\u20E3',
  '3\u00ef\u00b8\u008f\u00e2\u0192\u00a3': '3\uFE0F\u20E3',
  '5\u00ef\u00b8\u008f\u00e2\u0192\u00a3': '5\uFE0F\u20E3',
  '6\u00ef\u00b8\u008f\u00e2\u0192\u00a3': '6\uFE0F\u20E3',
  'ðŸ‘¯': '👯',
  'ðŸ”¤': '🔤',
  'ðŸš«': '🚫',
  'ðŸ§±': '🧱',
  'ðŸ…°\u00ef\u00b8\u008f': '🅰️',
  'ðŸ…¾\u00ef\u00b8\u008f': '🅾️',
  'ðŸ’€': '💀',
  'ðŸ”„': '🔁',
  'ðŸŒŸ': '🌟',
  'ðŸ” ': '🔠',
  'ðŸŽ¯': '🎯',
  'â€™': ''',
  'â€œ': '"',
  'â€': '"',
};

let count = 0;
for (const [bad, good] of Object.entries(map)) {
  let idx = 0;
  while ((idx = s.indexOf(bad, idx)) !== -1) {
    s = s.substring(0, idx) + good + s.substring(idx + bad.length);
    idx += good.length;
    count++;
  }
}

fs.writeFileSync('src/utils/constants.js', s, 'utf8');
console.log('Total replacements:', count);
