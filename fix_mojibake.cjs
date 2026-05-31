const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');
content = content.replace(/â\s*Œ/g, '❌');
content = content.replace(/â\s*œ\s*…/g, '✅');
content = content.replace(/â\s*­/g, '⭐');
content = content.replace(/\u00E2\u0080\u008C/g, '❌');
content = content.replace(/â Œ/g, '❌');
fs.writeFileSync('src/App.jsx', content);
