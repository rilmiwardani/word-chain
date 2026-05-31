const fs = require('fs');
const c = fs.readFileSync('src/App.jsx', 'utf8');
const idx = c.indexOf('addLog("Game", `â');
console.log('Match found at:', idx);
if (idx > -1) {
    const sub = c.slice(idx, idx + 30);
    for (let i = 0; i < sub.length; i++) {
        console.log(sub[i], sub.charCodeAt(i));
    }
}
