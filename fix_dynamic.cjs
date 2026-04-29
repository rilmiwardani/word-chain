const fs = require('fs');
let code = fs.readFileSync('src/utils/constants.js', 'utf8');

const challengesReplacement = \const DYNAMIC_CHALLENGES = [
    // Tier 1 (Mudah)
    { id: "MIN_5", label: "?? Min 5 Letters", labelID: "?? Min 5 Huruf", check: (w) => w.length >= 5, tier: 1 },
    { id: "MAX_5", label: "?? Max 5 Letters", labelID: "?? Maks 5 Huruf", check: (w) => w.length <= 5, tier: 1 },
    { id: "ODD", label: "1??3??5?? Odd Length", labelID: "1??3??5?? Panjang Ganjil", check: (w) => w.length % 2 !== 0, tier: 1 },
    { id: "EVEN", label: "2??4??6?? Even Length", labelID: "2??4??6?? Panjang Genap", check: (w) => w.length % 2 === 0, tier: 1 },
    { id: "EXACT_4", label: "?? Exactly 4 Letters", labelID: "?? Tepat 4 Huruf", check: (w) => w.length === 4, tier: 1 },

    // Tier 2 (Menengah)
    { id: "HAS_DOUBLE", label: "?? Double Letters", labelID: "?? Ada Huruf Ganda", check: (w) => /(.)\\1/.test(w), tier: 2 },
    { id: "END_VOWEL", label: "?? End: Vowel", labelID: "?? Akhir: Vokal", check: (w) => /[aeiou]$/i.test(w), tier: 2 },
    { id: "END_CONS", label: "?? End: Consonant", labelID: "?? Akhir: Konsonan", check: (w) => /[^aeiou]$/i.test(w), tier: 2 },
    { id: "NO_S_R", label: "?? No 'S' or 'R'", labelID: "?? Tanpa 'S' atau 'R'", check: (w) => !/[sr]/i.test(w), tier: 2 },
    { id: "EXACT_6", label: "?? Exactly 6 Letters", labelID: "?? Tepat 6 Huruf", check: (w) => w.length === 6, tier: 2 },
    { id: "START_END_CONS", label: "?? Consonant Ends", labelID: "?? Awal & Akhir Konsonan", check: (w) => w.length > 1 && /^[^aeiou].*[^aeiou]$/i.test(w), tier: 2 },
    { id: "HAS_CONSECUTIVE_VOWELS", label: "?????? Consecutive Vowels", labelID: "?????? Vokal Beruntun", check: (w) => /[aeiou]{2}/i.test(w), tier: 2 },

    // Tier 3 (Sulit)
    { id: "NO_A_I", label: "?? No 'A' or 'I'", labelID: "?? Tanpa 'A' atau 'I'", check: (w) => !/[ai]/i.test(w), tier: 3 },
    { id: "NO_E_O", label: "?? No 'E' or 'O'", labelID: "?? Tanpa 'E' atau 'O'", check: (w) => !/[eo]/i.test(w), tier: 3 },
    { id: "MAX_1_VOWEL", label: "1?? Max 1 Vowel", labelID: "1?? Maks 1 Vokal", check: (w) => (w.match(/[aeiou]/gi) || []).length <= 1, tier: 3 },
    { id: "MUST_3_VOWELS", label: "?? Min 3 Vowels", labelID: "?? Min 3 Vokal", check: (w) => (w.match(/[aeiou]/gi) || []).length >= 3, tier: 3 },
    { id: "MIN_7", label: "?? Min 7 Letters", labelID: "?? Min 7 Huruf", check: (w) => w.length >= 7, tier: 3 },
    { id: "EXACT_2_VOWELS", label: "2?? Exactly 2 Vowels", labelID: "2?? Tepat 2 Vokal", check: (w) => (w.match(/[aeiou]/gi) || []).length === 2, tier: 3 },
    { id: "NO_E", label: "?? No 'E' (Hard)", labelID: "?? Tanpa Huruf 'E'", check: (w) => !/e/i.test(w), tier: 3 },
    { id: "NO_A", label: "?? No 'A' (Hard)", labelID: "?? Tanpa Huruf 'A'", check: (w) => !/a/i.test(w), tier: 3 },

    // Tier 4 (Ekstrem / Chaos)
    { id: "NO_VOWELS", label: "?? No Vowels (Abbr)", labelID: "?? Tanpa Vokal (Singkatan)", check: (w) => !/[aeiou]/i.test(w), tier: 4 },
    { id: "SAME_START_END", label: "?? Start = End", labelID: "?? Awal = Akhir", check: (w) => w.length > 1 && w[0].toLowerCase() === w[w.length - 1].toLowerCase(), tier: 4 },
    { id: "UNIQUE", label: "?? Unique Letters Only", labelID: "?? Huruf Unik Saja", check: (w) => new Set(w).size === w.length, tier: 4 },
    { id: "SECOND_VOWEL", label: "?? 2nd Letter: Vowel", labelID: "?? Huruf Ke-2: Vokal", check: (w) => w.length > 1 && /[aeiou]/.test(w[1]), tier: 4 },
    { id: "CONTAINS_Y_Z_X", label: "?? Contains Y, Z, or X", labelID: "?? Mengandung Y, Z, atau X", check: (w) => /[yzx]/i.test(w), tier: 4 },
    { id: "HAS_CONSECUTIVE_CONS", label: "?? 3+ Consonants in Row", labelID: "?? 3+ Konsonan Beruntun", check: (w) => /[^aeiou]{3}/i.test(w), tier: 4 },
    { id: "MIDDLE_VOWEL", label: "?? Middle Letter is Vowel", labelID: "?? Huruf Tengah Vokal", check: (w) => w.length % 2 !== 0 && /[aeiou]/i.test(w[Math.floor(w.length / 2)]), tier: 4 }
];\;

const startIdx = code.indexOf('const DYNAMIC_CHALLENGES = [');
const endIdx = code.indexOf('];', startIdx) + 2;

code = code.substring(0, startIdx) + challengesReplacement + code.substring(endIdx);
fs.writeFileSync('src/utils/constants.js', code);
