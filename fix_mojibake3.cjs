const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

const cross = String.fromCharCode(226, 157, 338);
c = c.split(cross).join('❌');

const match = c.match(/shadow-sm">([^<]+)<\/div>\s*<\/div>\s*<div className="text-left/);
if (match) {
    c = c.replace(match[1], '⭐');
}

fs.writeFileSync('src/App.jsx', c);
console.log('Done!');
