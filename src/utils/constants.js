// ==========================================
// 1. TRANSLATIONS & CONSTANTS
// ==========================================
const TRANSLATIONS = {
    EN: {
        waiting: "WAITING FOR PLAYERS...", type_join: "Type !join", game_over: "GAME OVER",
        new_game: "New Game", current_word: "CURRENT WORD", winner: "WINNER!",
        draw: "DRAW!", play_again: "PLAY AGAIN", score: "Score", sound: "Sound",
        language: "Language", end_condition: "End Condition", turn_time: "Turn Time",
        players: "Players", load_json: "Load JSON", add_host: "+Host", add_bot: "+Bot",
        mode: "Mode", start_game: "START GAME", reset_game: "RESET GAME", simulation: "Simulation",
        footer: "Use !join to play • !unjoin to leave • !surrend to give up",
        supporter: "Supporter", sent: "sent", log_invalid: "invalid word",
        log_used: "already used", log_bad_link: "bad link", log_correct: "Correct!",
        log_eliminated: "eliminated!", log_joined: "joined!", log_stumped: "is stumped!",
        log_reset: "Game Reset!", log_lobby_full: "Lobby Full! Auto-starting...",
        log_need_players: "Need at least 2 players.", log_goes_first: "goes first!",
        log_rule_change: "RULE CHANGE", log_pts: "Pts", log_lobby_cleared: "Lobby Cleared!",
        clear_lobby: "KICK ALL / CLEAR LOBBY", rule_start: "Start with", rule_end: "Ends with",
        rule_mirror: "Ends with Start of", rule_ladder: "Length +1", rule_ladder_reset: "Reset Length",
        rule_contains: "Contains", rule_syllable: "Syllable", rule_no_doubles: "No Double Letters",
        rule_unique: "Unique Letters", rule_min: "Min", rule_max: "Max", rule_odd: "Odd Length",
        rule_even: "Even Length", rule_phrase: "Complete Phrase", target: "Target",
        round: "Round", hall_of_fame: "HALL OF FAME", stats_wins: "Wins",
        stats_games: "Games", stats_kills: "Combos", stats_rate: "Win Rate",
        most_killer: "TOP COMBO", tier_legend: "Tier Progression", no_data: "No player data found yet.",
        close: "Close", click_to_accept: "Click to Accept", chain_broken: "CHAIN BROKEN!",
        reconnecting: "Reconnecting...", rhyme_target: "RHYME TARGET", rhyme_change: "RHYME CHANGED",
        log_unjoin: "left the lobby.", log_surrender: "surrendered!", log_ban_rejoin: "Rejoin limit reached (Max 1x).",
        log_cant_unjoin: "Cannot unjoin while playing.", starting_in: "Starting in", auto_restart: "Auto Restart"
    },
    ID: {
        waiting: "MENUNGGU PEMAIN...", type_join: "Ketik !join", game_over: "PERMAINAN SELESAI",
        new_game: "Main Lagi", current_word: "KATA SAAT INI", winner: "PEMENANG!",
        draw: "SERI!", play_again: "MAIN LAGI", score: "Skor", sound: "Suara",
        language: "Bahasa", end_condition: "End Condition", turn_time: "Waktu Giliran",
        players: "Pemain", load_json: "Muat JSON", add_host: "+Host", add_bot: "+Bot",
        mode: "Mode", start_game: "MULAI GAME", reset_game: "RESET GAME", simulation: "Simulasi",
        footer: "Ketik !join (main) • !unjoin (keluar) • !surrend (nyerah)",
        supporter: "Pendukung", sent: "mengirim", log_invalid: "tidak ada di kamus",
        log_used: "sudah dipakai", log_bad_link: "tidak nyambung", log_correct: "Benar!",
        log_eliminated: "tereliminasi!", log_joined: "bergabung!", log_stumped: "bingung!",
        log_reset: "Game Direset!", log_lobby_full: "Lobby Penuh! Otomatis mulai...",
        log_need_players: "Butuh minimal 2 pemain.", log_goes_first: "jalan duluan!",
        log_rule_change: "GANTI ATURAN", log_pts: "Poin", log_lobby_cleared: "Lobby Dibersihkan!",
        clear_lobby: "USIR SEMUA / BERSIHKAN", rule_start: "Mulai dgn", rule_end: "Akhiran",
        rule_mirror: "Akhiran = Awal", rule_ladder: "Panjang +1", rule_ladder_reset: "Reset Panjang",
        rule_contains: "Mengandung", rule_syllable: "Suku Kata", rule_no_doubles: "Tanpa Huruf Ganda",
        rule_unique: "Huruf Unik", rule_min: "Min", rule_max: "Maks", rule_odd: "Panjang Ganjil",
        rule_even: "Panjang Genap", rule_phrase: "Lengkapi Frasa", target: "Target",
        round: "Ronde", hall_of_fame: "AULA KETENARAN", stats_wins: "Menang",
        stats_games: "Main", stats_kills: "Combo", stats_rate: "Rasio Menang",
        most_killer: "JUARA COMBO", tier_legend: "Urutan Pangkat (Tier)", no_data: "Belum ada data pemain.",
        close: "Tutup", click_to_accept: "Klik untuk Terima", chain_broken: "RANTAI PUTUS!",
        reconnecting: "Menyambung...", rhyme_target: "TARGET RIMA", rhyme_change: "RIMA BERUBAH",
        log_unjoin: "keluar dari lobby.", log_surrender: "menyerah!", log_ban_rejoin: "Batas rejoin habis (Maks 1x).",
        log_cant_unjoin: "Sedang main tidak bisa unjoin.", starting_in: "Mulai dalam", auto_restart: "Mulai Otomatis"
    }
};

// ==========================================
// TIER SYSTEM LOGIC
// ==========================================
const TIER_LEVELS = [
    { level: 1, name: "Novice", class: "bg-slate-700 text-white border-slate-600", req: (s) => true },
    { level: 2, name: "Scholar", class: "bg-emerald-600 text-white border-emerald-800 shadow-sm", req: (s) => s.wins >= 1 || s.games >= 5 },
    { level: 3, name: "Linguist", class: "bg-sky-600 text-white border-sky-800 shadow-[0_0_5px_rgba(56,189,248,0.3)]", req: (s) => s.wins >= 5 || s.kills >= 10 },
    { level: 4, name: "Philologist", class: "bg-indigo-600 text-white border-indigo-800 shadow-[0_0_8px_rgba(99,102,241,0.5)]", req: (s) => s.wins >= 15 || s.kills >= 30 },
    { level: 5, name: "Lexicographer", class: "bg-purple-600 text-white border-purple-800 shadow-[0_0_12px_rgba(168,85,247,0.7)]", req: (s) => s.wins >= 30 || s.kills >= 70 },
    { level: 6, name: "Polymath", class: "bg-amber-500 text-slate-900 border-amber-700 shadow-[0_0_15px_rgba(251,191,36,1)]", req: (s) => s.wins >= 50 || s.kills >= 150 }
];

const getPlayerTier = (stats) => {
    if (!stats) return TIER_LEVELS[0];
    let highestTier = TIER_LEVELS[0];
    for (let i = 1; i < TIER_LEVELS.length; i++) {
        if (TIER_LEVELS[i].req(stats)) highestTier = TIER_LEVELS[i];
    }
    return highestTier;
};

const FALLBACK_DICTIONARY_EN = new Set([
    "apple", "ant", "arrow", "axe", "area", "art", "arm", "air", "act", "age", "aim", "aid",
    "ball", "bat", "bear", "bed", "bee", "bell", "bird", "blue", "boat", "book", "box", "boy", "bread", "bus", "baby",
    "cat", "car", "cup", "cow", "coat", "cake", "city", "cloud", "class", "chair", "chicken", "child", "clock", "cold",
    "dog", "day", "door", "desk", "duck", "doll", "dress", "dark", "date", "dance", "dream", "drink", "drive", "dust",
    "egg", "eye", "ear", "end", "east", "earth", "event", "exam", "edge", "exit", "energy", "engine", "eagle", "elephant",
    "fish", "fan", "farm", "fat", "fire", "fly", "food", "foot", "fox", "frog", "fun", "face", "flag", "flower", "forest",
    "goat", "gold", "girl", "game", "glass", "grass", "green", "gun", "gift", "gate", "group", "guitar", "ghost", "glove",
    "hat", "hen", "hot", "house", "hill", "hand", "head", "home", "hair", "heart", "horse", "hour", "happy", "hero",
    "ice", "ink", "iron", "idea", "island", "image", "item", "insect", "inside", "issue", "input", "index", "icon",
    "jam", "jar", "jet", "job", "joy", "juice", "joke", "jump", "jacket", "jeep", "jungle", "jewel", "judge", "joint",
    "key", "king", "kite", "knee", "knife", "knot", "kick", "kid", "kitchen", "keyboard", "lamp", "leg", "lip", "lock",
    "log", "love", "low", "light", "lake", "leaf", "life", "line", "lion", "list", "man", "map", "mat", "moon",
    "milk", "mouse", "mouth", "money", "music", "mother", "monkey", "market", "metal", "magic", "net", "nut", "nose",
    "neck", "name", "night", "north", "nurse", "nest", "news", "noise", "note", "number", "nature", "owl", "oil", "orange",
    "ocean", "office", "onion", "open", "order", "oven", "owner", "object", "opera", "orbit", "out", "oops", "ooze",
    "pen", "pig", "pin", "pot", "pan", "park", "part", "past", "path", "pay", "peace", "people", "pie", "picture", "paper",
    "queen", "quiz", "quick", "quiet", "queue", "quest", "quality", "quote", "quarter", "rat", "red", "run", "rain",
    "rice", "road", "rock", "roof", "room", "rope", "rose", "ring", "river", "radio", "rabbit", "sun", "sea", "sky", "son",
    "star", "ship", "shoe", "shop", "snow", "sock", "song", "soup", "sand", "school", "sheep", "sister", "top", "toy",
    "tree", "tea", "tie", "toe", "time", "table", "tail", "tank", "tape", "taxi", "team", "tent", "test", "tiger",
    "umbrella", "uncle", "unit", "use", "user", "uniform", "union", "update", "urban", "urge", "upset", "under", "van",
    "vase", "vest", "view", "voice", "village", "video", "value", "virus", "visit", "wall", "way", "web", "well", "wind",
    "wolf", "wood", "water", "watch", "week", "white", "window", "woman", "world", "xray", "xenon", "xerox", "yak", "yam",
    "year", "yellow", "yes", "you", "young", "yard", "yacht", "yogurt", "youth", "zebra", "zoo", "zone", "zinc", "zipper", "zoom"
]);

const FALLBACK_PHRASES_ID = [
    "ahli gizi", "ahli waris", "ahli nujum", "ahli kubur", "ahli bahasa", "ahli bedah", "ahli hukum",
    "gizi buruk", "gizi seimbang", "gizi baik", "buruk sangka", "buruk rupa", "buruk siku", "buruk hati",
    "sangka baik", "sangka buruk", "mata hati", "mata kaki", "mata pisau", "mata duitan", "mata pencaharian",
    "kaki lima", "kaki tangan", "kaki ayam", "kaki langit", "kaki bukit", "lima benua", "lima waktu",
    "tangan panjang", "tangan besi", "tangan dingin", "tangan hampa", "tangan kanan", "tangan kosong",
    "panjang tangan", "panjang akal", "panjang umur", "panjang lebar", "akal bulus", "akal sehat",
    "sehat walafiat", "sehat jasmani", "sehat rohani", "rumah sakit", "rumah makan", "rumah tangga",
    "sakit hati", "sakit jiwa", "sakit gigi", "sakit kepala", "hati nurani", "hati kecil", "hati batu",
    "kecil hati", "kecil mulut", "batu besar", "batu nisan", "batu akik", "batu api", "besar kepala",
    "mulut manis", "mulut besar", "mulut buaya", "manis jari", "manis mulut", "manis daging", "jari manis",
    "tengah hari", "tengah malam", "tengah jalan", "malam minggu", "malam jumat", "malam buta",
    "minggu depan", "minggu tenang", "depan mata", "depan rumah", "pintu gerbang", "pintu masuk",
    "air mata", "air terjun", "air tawar", "air asin", "anak emas", "anak buah", "anak angkat",
    "kambing hitam", "kambing congek", "meja hijau", "meja makan", "buah tangan", "buah bibir",
    "bunga desa", "bunga bank", "kabar angin", "kabar burung", "naik daun", "naik darah", "naik haji",
    "turun tangan", "turun harga", "jual mahal", "jual aksi", "jual bangsa"
];

const FALLBACK_PHRASES_EN = [
    "high school", "school bus", "bus stop", "stop sign", "sign language", "language barrier", "barrier reef",
    "ice cream", "cream cheese", "cheese cake", "cake walk", "walk away", "hot dog", "dog house", "house party",
    "party animal", "animal kingdom", "kingdom come", "fire truck", "truck driver", "driver license",
    "license plate", "plate glass", "glass house", "apple pie", "pie chart", "chart topper", "black hole",
    "hole in one", "one way", "way out", "out side", "side walk", "full moon", "moon light", "light bulb",
    "bulb garden", "garden party", "star wars", "wars zone", "zone out", "time out", "out loud", "loud speaker",
    "speaker phone", "phone call", "call back", "back door", "door bell", "bell pepper", "pepper spray",
    "spray paint", "paint brush", "brush off", "sea shell", "shell fish", "fish tank", "tank top", "top hat",
    "hat trick", "trick shot", "shot gun", "gun powder", "powder room", "room mate", "grand father",
    "father figure", "figure out", "out run", "run away", "water fall", "fall down", "down town", "town hall",
    "hall way", "gold fish", "fish net", "net work", "work out", "out door", "rain bow", "bow tie", "tie dye",
    "sun flower", "flower pot", "pot luck", "luck out", "key board", "board game", "game over", "over time", "time zone"
];

const FALLBACK_DICTIONARY_ID_DATA = {
    makan: { nama: "ma.kan", def: "Memasukkan makanan ke dalam mulut serta mengunyah dan menelannya." },
    minum: { nama: "mi.num", def: "Memasukkan air (benda cair) ke dalam mulut dan meneguknya." },
    lari: { nama: "la.ri", def: "Melangkah dengan kecepatan tinggi (lebih dari berjalan)." },
    jalan: { nama: "ja.lan", def: "Tempat untuk lalu lintas orang, kendaraan, dsb." },
    hutan: { nama: "hu.tan", def: "Tanah luas yang ditumbuhi pohon-pohon (biasanya tidak dipelihara orang)." },
    langit: { nama: "la.ngit", def: "Ruang luas yang terbentang di atas bumi tempat beradanya bintang, bulan, dan matahari." },
    tanah: { nama: "ta.nah", def: "Permukaan bumi atau lapisan bumi yang di atas sekali." },
    api: { nama: "a.pi", def: "Panas dan cahaya yang berasal dari sesuatu yang terbakar; nyala." },
    air: { nama: "a.ir", def: "Cairan jernih tidak berwarna, tidak berasa, dan tidak berbau yang terdapat di seluruh bumi." },
    udara: { nama: "u.da.ra", def: "Campuran berbagai gas yang tidak berwarna dan tidak berbau yang memenuhi ruang di atas bumi." },
    eretan: { nama: "e.ret.an", def: "Alat untuk menyeberangkan orang (barang dsb) di sungai; rakit penyeberang." },
    tanam: { nama: "ta.nam", def: "Menaruh (bibit, benih, stek, dsb) di dalam tanah supaya tumbuh." },
    nama: { nama: "na.ma", def: "Kata untuk menyebut atau memanggil orang, tempat, barang, binatang, dsb." },
    mana: { nama: "ma.na", def: "Kata tanya untuk menanyakan tempat atau sesuatu." },
    nanas: { nama: "na.nas", def: "Tanaman tropis yang buahnya berbentuk silinder, berkulit sisik bersabut, dan berwarna kuning." },
    nasib: { nama: "na.sib", def: "Sesuatu yang sudah ditentukan oleh Tuhan atas diri seseorang; takdir." },
    ibu: { nama: "i.bu", def: "Wanita yang telah melahirkan seseorang; sebutan untuk wanita yang sudah bersuami." },
    budi: { nama: "bu.di", def: "Alat batin yang merupakan paduan akal dan perasaan untuk menimbang baik dan buruk." },
    ikan: { nama: "i.kan", def: "Binatang bertulang belakang yang hidup dalam air, berdarah dingin." },
    kancil: { nama: "kan.cil", def: "Binatang menyusui berkuku genap, mirip pelanduk tetapi lebih besar." }
};

const FALLBACK_CITIES = [
    { name: "Tokyo", region: "Japan" }, { name: "Jakarta", region: "Indonesia" }, { name: "New York", region: "USA" },
    { name: "London", region: "UK" }, { name: "Paris", region: "France" }, { name: "Berlin", region: "Germany" },
    { name: "Moscow", region: "Russia" }, { name: "Beijing", region: "China" }, { name: "Sydney", region: "Australia" },
    { name: "Cairo", region: "Egypt" }, { name: "Istanbul", region: "Turkey" }, { name: "Lima", region: "Peru" },
    { name: "Amsterdam", region: "Netherlands" }, { name: "Madrid", region: "Spain" }, { name: "Dubai", region: "UAE" }
];

const DYNAMIC_CHALLENGES = [
    // Tier 1 (Mudah)
    { id: "MIN_5", label: "📏 Min 5 Letters", labelID: "📏 Min 5 Huruf", check: (w) => w.length >= 5, tier: 1 },
    { id: "MAX_5", label: "📏 Max 5 Letters", labelID: "📏 Maks 5 Huruf", check: (w) => w.length <= 5, tier: 1 },
    { id: "ODD", label: "1️⃣3️⃣5️⃣ Odd Length", labelID: "1️⃣3️⃣5️⃣ Panjang Ganjil", check: (w) => w.length % 2 !== 0, tier: 1 },
    { id: "EVEN", label: "2️⃣4️⃣6️⃣ Even Length", labelID: "2️⃣4️⃣6️⃣ Panjang Genap", check: (w) => w.length % 2 === 0, tier: 1 },
    { id: "EXACT_4", label: "📏 Exactly 4 Letters", labelID: "📏 Tepat 4 Huruf", check: (w) => w.length === 4, tier: 1 },

    // Tier 2 (Menengah)
    { id: "HAS_DOUBLE", label: "👯 Double Letters", labelID: "👯 Ada Huruf Ganda", check: (w) => /(.)\1/.test(w), tier: 2 },
    { id: "END_VOWEL", label: "🔤 End: Vowel", labelID: "🔤 Akhir: Vokal", check: (w) => /[aeiou]$/i.test(w), tier: 2 },
    { id: "END_CONS", label: "🔤 End: Consonant", labelID: "🔤 Akhir: Konsonan", check: (w) => /[^aeiou]$/i.test(w), tier: 2 },
    { id: "NO_S_R", label: "🚫 No 'S' or 'R'", labelID: "🚫 Tanpa 'S' atau 'R'", check: (w) => !/[sr]/i.test(w), tier: 2 },
    { id: "EXACT_6", label: "📏 Exactly 6 Letters", labelID: "📏 Tepat 6 Huruf", check: (w) => w.length === 6, tier: 2 },
    { id: "START_END_CONS", label: "🧱 Consonant Ends", labelID: "🧱 Awal & Akhir Konsonan", check: (w) => w.length > 1 && /^[^aeiou].*[^aeiou]$/i.test(w), tier: 2 },
    { id: "HAS_CONSECUTIVE_VOWELS", label: "🅰️🅾️ Consecutive Vowels", labelID: "🅰️🅾️ Vokal Beruntun", check: (w) => /[aeiou]{2}/i.test(w), tier: 2 },

    // Tier 3 (Sulit)
    { id: "NO_A_I", label: "🚫 No 'A' or 'I'", labelID: "🚫 Tanpa 'A' atau 'I'", check: (w) => !/[ai]/i.test(w), tier: 3 },
    { id: "NO_E_O", label: "🚫 No 'E' or 'O'", labelID: "🚫 Tanpa 'E' atau 'O'", check: (w) => !/[eo]/i.test(w), tier: 3 },
    { id: "MAX_1_VOWEL", label: "1️⃣ Max 1 Vowel", labelID: "1️⃣ Maks 1 Vokal", check: (w) => (w.match(/[aeiou]/gi) || []).length <= 1, tier: 3 },
    { id: "MUST_3_VOWELS", label: "🔤 Min 3 Vowels", labelID: "🔤 Min 3 Vokal", check: (w) => (w.match(/[aeiou]/gi) || []).length >= 3, tier: 3 },
    { id: "MIN_7", label: "📏 Min 7 Letters", labelID: "📏 Min 7 Huruf", check: (w) => w.length >= 7, tier: 3 },
    { id: "EXACT_2_VOWELS", label: "2️⃣ Exactly 2 Vowels", labelID: "2️⃣ Tepat 2 Vokal", check: (w) => (w.match(/[aeiou]/gi) || []).length === 2, tier: 3 },
    { id: "NO_E", label: "🚫 No 'E' (Hard)", labelID: "🚫 Tanpa Huruf 'E'", check: (w) => !/e/i.test(w), tier: 3 },
    { id: "NO_A", label: "🚫 No 'A' (Hard)", labelID: "🚫 Tanpa Huruf 'A'", check: (w) => !/a/i.test(w), tier: 3 },

    // Tier 4 (Ekstrem / Chaos)
    { id: "NO_VOWELS", label: "💀 No Vowels (Abbr)", labelID: "💀 Tanpa Vokal (Singkatan)", check: (w) => !/[aeiou]/i.test(w), tier: 4 },
    { id: "SAME_START_END", label: "🔄 Start = End", labelID: "🔄 Awal = Akhir", check: (w) => w.length > 1 && w[0].toLowerCase() === w[w.length - 1].toLowerCase(), tier: 4 },
    { id: "UNIQUE", label: "🌟 Unique Letters Only", labelID: "🌟 Huruf Unik Saja", check: (w) => new Set(w).size === w.length, tier: 4 },
    { id: "SECOND_VOWEL", label: "🔤 2nd Letter: Vowel", labelID: "🔤 Huruf Ke-2: Vokal", check: (w) => w.length > 1 && /[aeiou]/.test(w[1]), tier: 4 },
    { id: "CONTAINS_Y_Z_X", label: "🔠 Contains Y, Z, or X", labelID: "🔠 Mengandung Y, Z, atau X", check: (w) => /[yzx]/i.test(w), tier: 4 },
    { id: "HAS_CONSECUTIVE_CONS", label: "🧱 3+ Consonants in Row", labelID: "🧱 3+ Konsonan Beruntun", check: (w) => /[^aeiou]{3}/i.test(w), tier: 4 },
    { id: "MIDDLE_VOWEL", label: "🎯 Middle Letter is Vowel", labelID: "🎯 Huruf Tengah Vokal", check: (w) => w.length >= 3 && /[aeiou]/i.test(w[Math.floor(w.length / 2)]), tier: 4 }
];

const BOT_PROFILES = [
    { name: "Bot Balita", diff: 1 }, { name: "Bot AFK", diff: 1 }, { name: "Bot Nyasar", diff: 1 },
    { name: "Bot Tolol", diff: 2 }, { name: "Bot Plenger", diff: 2 },
    { name: "Bot Santai", diff: 3 }, { name: "Bot Pelajar", diff: 3 },
    { name: "Bot Normal", diff: 4 }, { name: "Bot Magang", diff: 4 },
    { name: "Bot Sepuh", diff: 5 }, { name: "Bot Suhu", diff: 5 },
    { name: "Bot Psikopat", diff: 6 }, { name: "Bot Terminator", diff: 6 }, { name: "Bot Citter", diff: 6 }
];


// ==========================================
// 2. UTILITY FUNCTIONS & MANAGERS
// ==========================================
const getRandomColor = () => {
    const colors = ["#FCA5A5", "#FCD34D", "#86EFAC", "#93C5FD", "#A5B4FC", "#C4B5FD", "#F9A8D4", "#5EEAD4"];
    return colors[Math.floor(Math.random() * colors.length)];
};

const getAvatarUrl = (id) => `https://api.dicebear.com/9.x/adventurer/svg?seed=${id}`;

const normalizeWord = (word) => {
    if (typeof word !== "string") return "";
    return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z\s]/g, "").trim();
};

function generatePattern(baseWord, dict, currentUsed, lastType = null) {
    const w = baseWord.toLowerCase();
    const wLen = w.length;

    // Helper: cek apakah pattern punya cukup jawaban di kamus
    const hasEnoughMatches = (isValidMatch) => {
        let matches = 0;
        for (const word of dict) {
            if (!currentUsed.has(word) && word !== w && isValidMatch(word)) {
                matches++;
                if (matches > 1) return true;
            }
        }
        return false;
    };

    // Helper: panjang random dengan distribusi berbobot (lebih sering pendek, kadang panjang)
    const randLen = (min, max) => {
        // Distribusi: 50% min, 30% min+1, 20% sisanya
        const range = max - min;
        if (range <= 0) return min;
        const r = Math.random();
        if (r < 0.50) return min;
        if (r < 0.80) return Math.min(min + 1, max);
        return min + Math.floor(Math.random() * (range + 1));
    };

    let types = ["WRAP", "MIDDLE", "DOUBLE", "SKELETON"];
    if (lastType) {
        types = types.filter(t => t !== lastType);
    }
    if (types.length === 0) types = ["WRAP", "MIDDLE", "DOUBLE", "SKELETON"];
    types.sort(() => Math.random() - 0.5);

    const testPattern = (patStr, word) => {
        const parts = patStr.toLowerCase().split('...').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp('^' + parts.join('.+') + '$', 'i');
        return regex.test(word);
    };

    for (const type of types) {
        // Tiap tipe dicoba beberapa kali dengan parameter berbeda
        const attempts = 5;
        for (let attempt = 0; attempt < attempts; attempt++) {
            let patternStr = "";
            let isValidMatch = null;

            if (type === "MIDDLE" && wLen >= 4) {
                // Panjang tengah: 1-2 huruf
                const maxMid = Math.min(wLen - 2, 2);
                const midLen = Math.max(1, Math.floor(Math.random() * maxMid) + 1);
                const maxStart = wLen - midLen - 1;
                if (maxStart < 1) continue;
                const startIdx = Math.floor(Math.random() * maxStart) + 1;
                const mid = w.slice(startIdx, startIdx + midLen);
                patternStr = `...${mid}...`;
                isValidMatch = (word) => word.includes(mid) && !word.startsWith(mid) && !word.endsWith(mid) && word.length > mid.length + 1;
            }
            else if (type === "WRAP" && wLen >= 3) {
                const preLen = randLen(1, Math.min(2, Math.floor(wLen / 2)));
                const sufLen = randLen(1, Math.min(2, Math.floor(wLen / 2)));
                if (preLen + sufLen >= wLen) continue;
                const prefix = w.slice(0, preLen);
                const suffix = w.slice(-sufLen);
                if (prefix === suffix && wLen > 3) continue;
                patternStr = `${prefix}...${suffix}`;
                isValidMatch = (word) => word.startsWith(prefix) && word.endsWith(suffix) && word.length > preLen + sufLen;
            }
            else if (type === "DOUBLE" && wLen >= 6) {
                if (Math.random() < 0.5) {
                    const seg1 = w.slice(0, 2);
                    const midIdx = Math.floor(Math.random() * (wLen - 5)) + 3;
                    const seg2 = w.slice(midIdx, midIdx + 2);
                    patternStr = `${seg1}...${seg2}...`;
                } else {
                    const midIdx = Math.floor(Math.random() * (wLen - 5)) + 1;
                    const seg1 = w.slice(midIdx, midIdx + 2);
                    const seg2 = w.slice(-2);
                    patternStr = `...${seg1}...${seg2}`;
                }
                isValidMatch = (word) => testPattern(patternStr, word);
            }
            else if (type === "SKELETON" && wLen >= 5) {
                const first = w[0];
                const last = w.slice(-2);
                const midIdx = Math.floor(Math.random() * (wLen - 4)) + 2;
                const midChar = w[midIdx];
                patternStr = `${first}...${midChar}...${last}`;
                isValidMatch = (word) => testPattern(patternStr, word);
            }

            if (!patternStr || !isValidMatch) continue;
            if (hasEnoughMatches(isValidMatch)) {
                return { display: patternStr, type };
            }
        }
    }

    // Fallback berformat WRAP
    return { display: `${w[0]}...${w.slice(-1)}`, type: "WRAP" };
}


const getEnglishSyllableSuffix = (word) => {
    if (!word) return "";
    const w = word.toLowerCase();
    const vowelRegex = /[aeiouy]+/gi;
    const matches = [...w.matchAll(vowelRegex)];
    const isLeEnding = /[^aeiouy]le$/.test(w);
    let relevantMatches = matches;

    if (w.endsWith("e") && !isLeEnding && matches.length > 1) {
        const lastMatch = matches[matches.length - 1];
        if (lastMatch.index >= w.length - 1) relevantMatches = matches.slice(0, -1);
    }

    if (relevantMatches.length <= 1) {
        if (!isLeEnding) {
            if (relevantMatches.length > 0) {
                let rime = w.slice(relevantMatches[0].index);
                if (rime.length >= 3 && /^[aeiouy]{2}/.test(rime)) return rime.slice(1);
                return rime;
            }
            return w;
        }
    }

    let lastVowelMatch = isLeEnding ? matches[matches.length - 1] : relevantMatches[relevantMatches.length - 1];
    let prevVowelMatch = isLeEnding ? matches[matches.length - 2] : relevantMatches[relevantMatches.length - 2];

    if (!prevVowelMatch || !lastVowelMatch) return w;

    const bridgeStart = prevVowelMatch.index + prevVowelMatch[0].length;
    const bridgeEnd = lastVowelMatch.index;
    const bridge = w.slice(bridgeStart, bridgeEnd);

    let consonantsToTake = 0;
    if (bridge.length === 0) consonantsToTake = 0;
    else if (bridge.length === 1) consonantsToTake = 1;
    else {
        if (isLeEnding && bridge.length <= 2) consonantsToTake = bridge.length;
        else consonantsToTake = Math.ceil(bridge.length / 2);
    }

    const suffixStart = bridgeEnd - consonantsToTake;
    return w.slice(suffixStart);
};

const StatsManager = {
    load: (uniqueId) => {
        try {
            const data = localStorage.getItem("word_chain_stats");
            const stats = data ? JSON.parse(data) : {};
            return stats[uniqueId] || { wins: 0, games: 0, kills: 0 };
        } catch (e) {
            return { wins: 0, games: 0, kills: 0 };
        }
    },
    loadAll: () => {
        try {
            const data = localStorage.getItem("word_chain_stats");
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    },
    update: (uniqueId, isWin, incrementGame = true, nickname = "Player") => {
        try {
            const data = localStorage.getItem("word_chain_stats");
            const allStats = data ? JSON.parse(data) : {};
            const playerStats = allStats[uniqueId] || { wins: 0, games: 0, kills: 0, nickname: nickname };

            if (playerStats.kills === undefined) playerStats.kills = 0;
            if (nickname) playerStats.nickname = nickname;
            if (incrementGame) playerStats.games += 1;
            if (isWin) playerStats.wins += 1;

            allStats[uniqueId] = playerStats;
            localStorage.setItem("word_chain_stats", JSON.stringify(allStats));
            return playerStats;
        } catch (e) {
            return { wins: 0, games: 0, kills: 0 };
        }
    },
    addKill: (uniqueId) => {
        try {
            const data = localStorage.getItem("word_chain_stats");
            const allStats = data ? JSON.parse(data) : {};
            if (allStats[uniqueId]) {
                allStats[uniqueId].kills = (allStats[uniqueId].kills || 0) + 1;
                localStorage.setItem("word_chain_stats", JSON.stringify(allStats));
            }
        } catch (e) { }
    }
};

const SoundManager = {
    ctx: null,
    init: () => {
        if (!SoundManager.ctx) SoundManager.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    playTone: (freq, type, duration, vol = 0.1, slideTo = null) => {
        if (!SoundManager.ctx) SoundManager.init();
        const ctx = SoundManager.ctx;
        if (ctx.state === "suspended") ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);

        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    },
    play: (effect) => {
        switch (effect) {
            case "join":
                SoundManager.playTone(600, "sine", 0.1, 0.04);
                setTimeout(() => SoundManager.playTone(800, "sine", 0.1, 0.04), 100);
                break;
            case "correct":
                SoundManager.playTone(523.25, "triangle", 0.1, 0.04);
                setTimeout(() => SoundManager.playTone(659.25, "triangle", 0.1, 0.04), 100);
                setTimeout(() => SoundManager.playTone(783.99, "triangle", 0.3, 0.04), 200);
                break;
            case "wrong":
                SoundManager.playTone(150, "sawtooth", 0.3, 0.04);
                setTimeout(() => SoundManager.playTone(100, "sawtooth", 0.3, 0.04), 150);
                break;
            case "eliminate":
                SoundManager.playTone(400, "sawtooth", 0.5, 0.04, 100);
                break;
            case "tick":
                SoundManager.playTone(800, "square", 0.05, 0.03);
                break;
            case "start":
                SoundManager.playTone(440, "sine", 0.1, 0.04);
                setTimeout(() => SoundManager.playTone(880, "sine", 0.4, 0.04), 200);
                break;
            case "win":
                [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((freq, i) => {
                    setTimeout(() => SoundManager.playTone(freq, "square", 0.2, 0.04), i * 150);
                });
                break;
            case "notification":
                SoundManager.playTone(600, "sine", 0.1, 0.04);
                setTimeout(() => SoundManager.playTone(1200, "sine", 0.2, 0.04), 100);
                break;
            default: break;
        }
    }
};


export { TRANSLATIONS, TIER_LEVELS, getPlayerTier, FALLBACK_DICTIONARY_EN, FALLBACK_PHRASES_ID, FALLBACK_PHRASES_EN, FALLBACK_DICTIONARY_ID_DATA, FALLBACK_CITIES, DYNAMIC_CHALLENGES, BOT_PROFILES, getRandomColor, getAvatarUrl, normalizeWord, generatePattern, getEnglishSyllableSuffix, StatsManager, SoundManager };
