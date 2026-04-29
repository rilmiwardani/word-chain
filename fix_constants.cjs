const fs = require('fs');
let code = fs.readFileSync('src/utils/constants.js', 'utf8');

code = code.replace(/� /g, '??')
           .replace(/👯/g, '??')
           .replace(/🔤/g, '??')
           .replace(/🚫/g, '??')
           .replace(/🧱/g, '??')
           .replace(/🅰� 🅾� /g, '??????')
           .replace(/💀/g, '??')
           .replace(/🔄/g, '??')
           .replace(/🌟/g, '??')
           .replace(/� /g, '??')
           .replace(/🎯/g, '??')
           .replace(/\?/g, '�')
           .replace(/1,\?3,\?5,\?/g, '1,3,5...')
           .replace(/2,\?4,\?6,\?/g, '2,4,6...')
           .replace(/1,\?/g, '1??')
           .replace(/2,\?/g, '2??');

fs.writeFileSync('src/utils/constants.js', code);
