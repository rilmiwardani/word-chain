const fs = require('fs');
let buf = fs.readFileSync('src/utils/constants.js');

const replacements = [
  ['c3b0c5b8e2809cc28f', 'f09f938f'],
  ['c3b0c5b8e28098c2af', 'f09f91af'],
  ['c3b0c5b8e2809dc2a4', 'f09f94a4'],
  ['c3b0c5b8c5a1c2ab', 'f09f9aab'],
  ['c3b0c5b8c2a7c2b1', 'f09fa7b1'],
  ['c3b0c5b8e280a6c2b0c3afc2b8c28fc3b0c5b8e280a6c2bec3afc2b8c28f', 'f09f85b0efb88ff09f85beefb88f'],
  ['c3b0c5b827e282ac', 'f09f9280'],
  ['c3b0c5b8e2809de2809e', 'f09f9484'],
  ['c3b0c5b8c592c5b8', 'f09f8c9f'],
  ['c3b0c5b8e2809dc2a0', 'f09f94a0'],
  ['c3b0c5b8c5bdc2af', 'f09f8eaf'],
  ['31c3afc2b8c28fc3a2c692c2a3', '31efb88fe283a3'],
  ['32c3afc2b8c28fc3a2c692c2a3', '32efb88fe283a3'],
  ['33c3afc2b8c28fc3a2c692c2a3', '33efb88fe283a3'],
  ['35c3afc2b8c28fc3a2c692c2a3', '35efb88fe283a3'],
  ['36c3afc2b8c28fc3a2c692c2a3', '36efb88fe283a3'],
];

let total = 0;
for (const [badHex, goodHex] of replacements) {
  const bad = Buffer.from(badHex, 'hex');
  const good = Buffer.from(goodHex, 'hex');
  let idx = 0;
  while ((idx = buf.indexOf(bad, idx)) !== -1) {
    const before = buf.slice(0, idx);
    const after = buf.slice(idx + bad.length);
    buf = Buffer.concat([before, good, after]);
    idx += good.length;
    total++;
  }
}

fs.writeFileSync('src/utils/constants.js', buf);
console.log('Total emoji replacements:', total);
