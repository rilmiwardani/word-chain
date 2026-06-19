export function getIndonesianOverlapSuffix(word) {
    const w = word.toLowerCase();
    const vowels = /[aeiou]/gi;
    const lastVowelMatch = [...w.matchAll(vowels)].pop();
    if (!lastVowelMatch) return w.slice(-2);
    if (lastVowelMatch.index === w.length - 1) return w.slice(Math.max(0, w.length - 2));
    return w.slice(lastVowelMatch.index);
}

export function getSuffixOrRule(word, options) {
    const { gameMode, overlapLength, targetRhyme, language, syllableMap, getEnglishSyllableSuffix } = options;
    const overlap = overlapLength;
    if (gameMode === "CITIES" || gameMode === "LAST_LETTER" || gameMode === "DYNAMIC") return word.slice(-overlap);
    if (gameMode === "RHYME") return targetRhyme || word.slice(-2);
    if (gameMode === "PHRASE_CHAIN") return word;
    if (gameMode === "MIRROR") return word.slice(0, overlap);
    if (gameMode === "WRAP_AROUND") return `${word.slice(-overlap)}...${word.slice(0, overlap)}`;
    if (gameMode === "STEP_UP") return word.slice(-overlap);
    if (gameMode === "SECOND_LETTER") return word.length >= 2 ? word[1] : "";
    if (gameMode === "LONGER_WORD") return word.slice(-overlap);
    if ((language === "ID" || language === "MIX") && gameMode === "SYLLABLE") {
        const data = syllableMap[word.toLowerCase()];
        if (data && data.nama) return data.nama.split(".").pop();
        const overlapData = getIndonesianOverlapSuffix(word);
        return overlapData.length > 0 ? overlapData : word.slice(-2);
    }
    return getEnglishSyllableSuffix(word);
}

export function getRecoverySuffix(word, options) {
    const { language, getEnglishSyllableSuffix } = options;
    return (language === "ID" || language === "MIX") ? getIndonesianOverlapSuffix(word) : getEnglishSyllableSuffix(word);
}

export function getRuleDisplay(word, options) {
    const { gameMode, overlapLength, activeChallenge, targetRhyme, language, getEnglishSyllableSuffix, syllableMap } = options;
    const target = getSuffixOrRule(word, options).toUpperCase();
    const action = "AWALAN:";
    const labelID = (challenge) => ((language === "ID" || language === "MIX") && challenge?.labelID) ? challenge.labelID : challenge?.label;
    const overlap = overlapLength;

    if (gameMode === "FILL_BLANK") return { label: "Cari Pola Kata", target: word.toUpperCase(), desc: `Cari kata yang sesuai pola huruf ini`, action: "POLA:" };
    if (gameMode === "CITIES") return { label: "City Chain", target, desc: `Sebutkan NAMA KOTA berawalan huruf di atas`, action };
    if (gameMode === "WRAP_AROUND") return { label: "Wrap Around", target: `${word.slice(-overlap).toUpperCase()}...${word.slice(0, overlap).toUpperCase()}`, desc: `Ketik kata dgn AWALAN & AKHIRAN ini`, action: "POLA:" };
    if (gameMode === "PHRASE_CHAIN") return { label: "Phrase Chain", target, desc: `Lanjutkan frasa ini agar masuk akal`, action: "KATA BERIKUTNYA:" };
    if (gameMode === "DYNAMIC") return { label: `Dynamic Chaos (${overlap})`, target, desc: activeChallenge ? `Tantangan: ${labelID(activeChallenge)}` : `Sambung kata dari huruf di atas`, action };
    if (gameMode === "RHYME") return { label: "Rhyme Rush", target: (targetRhyme || "").toUpperCase(), desc: `Cari kata yang AKHIRANNYA berbunyi ini`, action: "AKHIRAN:" };
    if (gameMode === "MIRROR") return { label: `Mirror Chain (${overlap})`, target, desc: `Kata baru harus BERAKHIRAN huruf di atas`, action: "AKHIRAN:" };
    if (gameMode === "INFIKS") return { label: "Infiks", target: word.toUpperCase(), desc: `Ketik kata yang MENGANDUNG pola huruf di atas`, action: "MENGANDUNG:" };

    if (gameMode === "STEP_UP") {
        const nextLen1 = Math.max(3, overlap + 1);
        const nextLen2 = Math.max(4, overlap + 2);
        return { label: word.length >= 10 ? "Step Up (Reset)" : `Step Up (${overlap})`, target, desc: `Ketik kata berawalan '${target}' dengan PANJANG ${(word.length >= 10 ? `${nextLen1}/${nextLen2}` : word.length + 1)} huruf!`, action };
    }
    if (gameMode === "LONGER_WORD") {
        const resetLen = Math.max(4, overlap + 1);
        return { label: word.length >= 10 ? "Longer Word (Reset)" : `Longer (${overlap})`, target: `> ${word.length >= 10 ? (resetLen - 1) + ' huruf' : word.length}`, desc: `Ketik kata berawalan '${target}' dan LEBIH PANJANG!`, action };
    }

    if (gameMode === "LAST_LETTER") return { label: `Last Letter(s) [${overlap}]`, target, desc: `Ketik kata yang BERAWALAN huruf di atas`, action };
    if (gameMode === "SECOND_LETTER") return { label: "2nd Letter", target, desc: `Ketik kata berawalan HURUF KE-2 di atas`, action };

    return { label: "Last Syllable", target, desc: `Sambung kata dari SUKU KATA di atas`, action };
}

export function getDisplayParts(word, options) {
    if (!word) return { pre: "", high: "", post: "" };
    const { gameMode, overlapLength, targetRhyme } = options;

    if (gameMode === "FILL_BLANK") {
        const pat = word.toUpperCase();
        if (pat.startsWith("...") && pat.endsWith("...")) {
            return { pre: "...", high: pat.replace(/\.\.\./g, ""), post: "..." };
        } else if (pat.startsWith("...")) {
            return { pre: "...", high: pat.replace("...", ""), post: "" };
        } else if (pat.endsWith("...")) {
            return { pre: "", high: pat.replace("...", ""), post: "..." };
        } else if (pat.includes("...")) {
            const [pref, suf] = pat.split("...");
            return { pre: pref, high: "...", post: suf };
        }
        return { pre: "", high: pat, post: "" };
    }

    const overlap = overlapLength;
    if (gameMode === "PHRASE_CHAIN") return { pre: "", high: word, post: "..." };
    if (gameMode === "RHYME") {
        const tr = targetRhyme;
        if (tr && word.toLowerCase().endsWith(tr)) {
            const splitIdx = word.length - tr.length;
            return { pre: word.slice(0, splitIdx), high: word.slice(splitIdx), post: "" };
        }
    }
    if (gameMode === "MIRROR") return word.length < overlap ? { pre: "", high: word, post: "" } : { pre: "", high: word.slice(0, overlap), post: word.slice(overlap) };
    if (gameMode === "SECOND_LETTER") return word.length < 2 ? { pre: word, high: "", post: "" } : { pre: word.slice(0, 1), high: word.slice(1, 2), post: word.slice(2) };
    if (gameMode === "WRAP_AROUND") return { pre: word.slice(0, -overlap), high: word.slice(-overlap), post: "" };
    if (gameMode === "INFIKS") return { pre: "", high: word, post: "" };
    const suffix = getSuffixOrRule(word, options);
    const prefixLen = Math.max(0, word.length - suffix.length);
    return { pre: word.slice(0, prefixLen), high: suffix, post: "" };
}

export function validateConnection(prev, next, options) {
    const { gameMode, overlapLength, phraseDictionary, activeChallenge, targetRhyme, language, syllableMap, getEnglishSyllableSuffix } = options;
    if (!prev && gameMode !== "RHYME") return true;
    const p = prev ? prev.toLowerCase() : "";
    const n = next.toLowerCase();
    const overlap = overlapLength;

    if (gameMode === "FILL_BLANK") {
        const pat = p.toLowerCase();
        if (pat.startsWith('...') && pat.endsWith('...')) {
            const mid = pat.replace(/\.\.\./g, '');
            return n.slice(1, -1).includes(mid);
        } else if (pat.startsWith('...')) {
            const suf = pat.replace(/\.\.\./g, '');
            return n.endsWith(suf) && n.length > suf.length;
        } else if (pat.endsWith('...')) {
            const pref = pat.replace(/\.\.\./g, '');
            return n.startsWith(pref) && n.length > pref.length;
        } else if (pat.includes('...')) {
            const [pref, suf] = pat.split('...');
            return n.startsWith(pref) && n.endsWith(suf) && n.length > pref.length + suf.length;
        }
        return false;
    }

    if (gameMode === "PHRASE_CHAIN") return phraseDictionary.has(`${p} ${n}`);
    if (gameMode === "WRAP_AROUND") return n !== p && n.length >= overlap * 2 && n.startsWith(p.slice(-overlap)) && n.endsWith(p.slice(0, overlap));
    if (gameMode === "INFIKS") return n.includes(p) && n !== p;
    if (gameMode === "DYNAMIC") {
        const suffix = p.slice(-overlap);
        if (n === suffix || !n.startsWith(suffix)) return false;
        if (activeChallenge?.check && !activeChallenge.check(n)) {
            return false;
        }
        return true;
    }

    let requiredSuffix = "";

    if (gameMode === "MIRROR") {
        requiredSuffix = p.slice(0, overlap);
        return n !== requiredSuffix && n.endsWith(requiredSuffix);
    }

    if (gameMode === "STEP_UP") {
        requiredSuffix = p.slice(-overlap);
        if (n === requiredSuffix || !n.startsWith(requiredSuffix)) return false;
        const nextLen1 = Math.max(3, overlap + 1);
        const nextLen2 = Math.max(4, overlap + 2);
        return p.length >= 10 ? (n.length === nextLen1 || n.length === nextLen2) : n.length === p.length + 1;
    }

    if (gameMode === "RHYME") return n !== targetRhyme && n.endsWith(targetRhyme);
    if (["CITIES", "LAST_LETTER"].includes(gameMode)) {
        requiredSuffix = p.slice(-overlap); return n !== requiredSuffix && n.startsWith(requiredSuffix);
    }
    if (gameMode === "SECOND_LETTER") {
        if (p.length < 2) return false; const targetChar = p[1]; return n !== targetChar && n.startsWith(targetChar);
    }

    if (gameMode === "LONGER_WORD") {
        if (!n.startsWith(p.slice(-overlap))) return false;
        const resetLen = Math.max(4, overlap + 1);
        return p.length >= 10 ? n.length >= resetLen : n.length > p.length;
    }

    if (gameMode === "SYLLABLE") {
        let connectionPart = "";
        if (language === "EN") {
            connectionPart = getEnglishSyllableSuffix(p);
        } else {
            const prevData = syllableMap[p];
            if (prevData?.nama) {
                connectionPart = prevData.nama.split(".").pop();
            } else {
                const overlapData = getIndonesianOverlapSuffix(p);
                connectionPart = overlapData.length > 0 ? overlapData : p.slice(-2);
            }
        }
        return n.startsWith(connectionPart) && n !== connectionPart;
    }
    return false;
}
