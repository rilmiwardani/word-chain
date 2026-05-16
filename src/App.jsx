import React, { useState, useEffect, useRef } from "react";
import {
    AlertTriangle, BarChart2, Bot, Clock, Crown, Delete, FastForward,
    FileJson, Flag, FlipHorizontal, Gamepad2, Gift, Globe, GripHorizontal, Hash, Heart, Info,
    Keyboard, Link, MapPin, Maximize, Medal, Minimize, Minus,
    MoveUpRight, Plus, RefreshCw, Repeat2, Send, Settings,
    Star, Target, TrendingUp as TrendingUpIcon, Trophy, Unlink,
    User, Users, Volume2, VolumeX, X, Sparkles, MessageSquare, MessageSquareOff,
    Pause, Play
} from "lucide-react";

import { TRANSLATIONS, TIER_LEVELS, getPlayerTier, FALLBACK_DICTIONARY_EN, FALLBACK_PHRASES_ID, FALLBACK_PHRASES_EN, FALLBACK_DICTIONARY_ID_DATA, FALLBACK_CITIES, DYNAMIC_CHALLENGES, BOT_PROFILES, getRandomColor, getAvatarUrl, normalizeWord, generatePattern, getEnglishSyllableSuffix, StatsManager, SoundManager } from "./utils/constants";
// ==========================================
import { PlayerTimer, GlobalTimer } from "./components/Timers";
import { getIndonesianOverlapSuffix, getSuffixOrRule, getRecoverySuffix, getRuleDisplay, getDisplayParts, validateConnection } from "./utils/gameLogic";
import MusicPlayer from "./components/MusicPlayer";
// 3. MAIN COMPONENT
// ==========================================
export default function App() {
    // === STATE ===
    const [players, setPlayers] = useState([]);
    const [gameState, setGameState] = useState("WAITING");
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [currentWord, setCurrentWord] = useState("");
    const [usedWords, setUsedWords] = useState(new Set());
    const [gameMode, setGameMode] = useState("LAST_LETTER");
    const [language, setLanguage] = useState("EN");
    const [targetRhyme, setTargetRhyme] = useState("");
    const [tableStatus, setTableStatus] = useState("idle");
    const [feedbackMessage, setFeedbackMessage] = useState(null);

    const [actionCardsEnabled, setActionCardsEnabled] = useState(false);
    const [pointMode, setPointMode] = useState("OFF"); // OFF, LENGTH, SCRABBLE, VOWELS
    const [musicState, setMusicState] = useState(null);

    const [isReversed, setIsReversed] = useState(false);
    const [overlapLength, setOverlapLength] = useState(1);
    const [overlapMode, setOverlapMode] = useState("FIXED"); // FIXED, RANDOM, SEQUENTIAL
    const [maxWordLength, setMaxWordLength] = useState(0);
    const [autoRestartEnabled, setAutoRestartEnabled] = useState(false);
    const [restartCountdown, setRestartCountdown] = useState(null);
    const [waitingCountdown, setWaitingCountdown] = useState(null);
    const [playerQueue, setPlayerQueue] = useState([]);
    const [showcaseWords, setShowcaseWords] = useState([]);
    const [lastPlay, setLastPlay] = useState(null);

    const [showStats, setShowStats] = useState(false);
    const [allStats, setAllStats] = useState([]);
    const [activeChallenge, setActiveChallenge] = useState(null);
    const [turnCount, setTurnCount] = useState(0);
    const turnCountRef = useRef(0);
    const [challengeQueue, setChallengeQueue] = useState([]);
    const [turnKey, setTurnKey] = useState(0);

    const [gameDuration, setGameDuration] = useState(60);
    const [targetScore, setTargetScore] = useState(50);
    const [targetRounds, setTargetRounds] = useState(3);
    const [winCondition, setWinCondition] = useState("TIME");
    const [globalTimer, setGlobalTimer] = useState(null);
    const [roundStarterId, setRoundStarterId] = useState(null);

    const [dictionary, setDictionary] = useState(FALLBACK_DICTIONARY_EN);
    const [syllableMap, setSyllableMap] = useState({});
    const [tiktokUsername, setTiktokUsername] = useState("");
    const [cityMetadata, setCityMetadata] = useState({});
    const [logs, setLogs] = useState([]);
    const [activeEffects, setActiveEffects] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState("disconnected");

    const [maxPlayers, setMaxPlayers] = useState(8);
    const [turnDuration, setTurnDuration] = useState(15);
    const [timer, setTimer] = useState(turnDuration);
    const [manualInput, setManualInput] = useState("");
    const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState("rules");
    const [wsHost, setWsHost] = useState(() => localStorage.getItem("word_chain_ws_host") || "");
    const [dictLoadedInfo, setDictLoadedInfo] = useState("Default (EN)");

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showLogs, setShowLogs] = useState(true);
    const [showPointGuide, setShowPointGuide] = useState(false);
    const [guideLangTab, setGuideLangTab] = useState("ID");

    const [scrambleWord, setScrambleWord] = useState("");
    const [scrambledDisplay, setScrambledDisplay] = useState("");
    const [scrambleWinner, setScrambleWinner] = useState(null);

    const [miniGamePos, setMiniGamePos] = useState({ x: null, y: null });
    const [miniGameScale, setMiniGameScale] = useState(1);


    // === REFS ===
    const lastLikeTimeRef = useRef(0);
    const quitHistoryRef = useRef({});
    const bombNextRef = useRef(false);
    const rhymeTargetsRef = useRef([]);
    const tableStatusTimeout = useRef(null);
    const lastSuccessfulPlayerIdRef = useRef(null);
    const timerRef = useRef(null);
    const wsRef = useRef(null);
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);
    const fallbackToLocalhostRef = useRef(false);
    const wsHostRef = useRef(wsHost);
    const feedbackTimeoutRef = useRef(null);
    const chatHandlerRef = useRef(null);
    const phraseDictionary = useRef(new Set(FALLBACK_PHRASES_EN));

    const dictionaryCache = useRef({
        EN: { dict: FALLBACK_DICTIONARY_EN, syl: {}, info: "Default (EN)", phrases: new Set(FALLBACK_PHRASES_EN) },
        ID: null, CITIES: null, MIX: null
    });

    const playersRef = useRef(players);
    const turnIndexRef = useRef(currentTurnIndex);
    const turnDurationRef = useRef(turnDuration);
    const usedWordsRef = useRef(usedWords);
    const syllableMapRef = useRef(syllableMap);
    const isMutedRef = useRef(isMuted);
    const cityMetadataRef = useRef(cityMetadata);
    const challengeQueueRef = useRef(challengeQueue);
    const languageRef = useRef(language);
    const gameModeRef = useRef(gameMode);
    const currentWordRef = useRef(currentWord);
    const targetRhymeRef = useRef(targetRhyme);
    const gameStateRef = useRef(gameState);
    const winConditionRef = useRef(winCondition);
    const targetRoundsRef = useRef(targetRounds);
    const targetScoreRef = useRef(targetScore);
    const actionCardsEnabledRef = useRef(actionCardsEnabled);
    const pointModeRef = useRef(pointMode);
    const isReversedRef = useRef(isReversed);
    const overlapLengthRef = useRef(overlapLength);
    const overlapModeRef = useRef(overlapMode);
    const maxWordLengthRef = useRef(maxWordLength);
    const activeChallengeRef = useRef(activeChallenge);
    const autoRestartEnabledRef = useRef(autoRestartEnabled);
    const playerQueueRef = useRef(playerQueue);
    const playedWordsHistoryRef = useRef([]);

    const scrambleWordRef = useRef(scrambleWord);
    const scrambleWinnerRef = useRef(scrambleWinner);
    const miniGameDragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
    const miniGameOverlayRef = useRef(null);
    const miniGameWordsRef = useRef(["KUCING", "ANJING", "SEPATU", "BENDERA", "PELANGI", "GARUDA", "KAMERA", "PENSIL", "LEMARI", "KERTAS", "BONEKA", "PANGGUNG", "KACAMATA", "BINGKAI", "LUKISAN", "DOMPET", "BANTAL", "GULING", "SELIMUT", "KASUR"]);
    const unplayedMiniGameWordsRef = useRef([]);

    // === EFFECTS ===

    useEffect(() => {
        playersRef.current = players; turnIndexRef.current = currentTurnIndex;
        turnDurationRef.current = turnDuration; usedWordsRef.current = usedWords;
        syllableMapRef.current = syllableMap; isMutedRef.current = isMuted;
        cityMetadataRef.current = cityMetadata; challengeQueueRef.current = challengeQueue;
        languageRef.current = language; gameModeRef.current = gameMode;
        currentWordRef.current = currentWord; targetRhymeRef.current = targetRhyme;
        gameStateRef.current = gameState; winConditionRef.current = winCondition;
        targetRoundsRef.current = targetRounds; targetScoreRef.current = targetScore;
        actionCardsEnabledRef.current = actionCardsEnabled;
        pointModeRef.current = pointMode;
        isReversedRef.current = isReversed;
        overlapLengthRef.current = overlapLength;
        overlapModeRef.current = overlapMode;
        maxWordLengthRef.current = maxWordLength;
        activeChallengeRef.current = activeChallenge;
        autoRestartEnabledRef.current = autoRestartEnabled;
        playerQueueRef.current = playerQueue;
        scrambleWordRef.current = scrambleWord;
        scrambleWinnerRef.current = scrambleWinner;
        wsHostRef.current = wsHost;
    }, [
        players, currentTurnIndex, turnDuration, usedWords, syllableMap, isMuted,
        cityMetadata, challengeQueue, language, gameMode, currentWord, targetRhyme,
        gameState, winCondition, targetRounds, targetScore, actionCardsEnabled, pointMode, isReversed, overlapLength, overlapMode, maxWordLength, activeChallenge, autoRestartEnabled, playerQueue, scrambleWord, scrambleWinner, wsHost
    ]);


    const handleWsHostChange = (e) => {
        const val = e.target.value.trim();
        setWsHost(val);
        wsHostRef.current = val;
        localStorage.setItem("word_chain_ws_host", val);
    };

    const handleReconnectWebSocket = () => {
        if (wsRef.current) {
            wsRef.current.onclose = null;
            wsRef.current.close();
        }
        setConnectionStatus("disconnected");
        fallbackToLocalhostRef.current = false;
        setTimeout(connectWebSocket, 500);
    };

    const handleMiniGameDragStart = (e) => {
        miniGameDragRef.current.isDragging = true;
        miniGameDragRef.current.startX = e.clientX || (e.touches && e.touches[0].clientX);
        miniGameDragRef.current.startY = e.clientY || (e.touches && e.touches[0].clientY);

        const rect = e.currentTarget.parentElement.getBoundingClientRect();
        miniGameDragRef.current.initialX = rect.left;
        miniGameDragRef.current.initialY = rect.top;

        if (miniGamePos.x === null) {
            setMiniGamePos({ x: rect.left, y: rect.top });
        }

        // Apply fixed positioning directly to DOM for instant response
        if (miniGameOverlayRef.current) {
            miniGameOverlayRef.current.style.position = 'fixed';
            miniGameOverlayRef.current.style.bottom = 'auto';
            miniGameOverlayRef.current.style.right = 'auto';
            const initialLeft = miniGamePos.x !== null ? miniGamePos.x : rect.left;
            const initialTop = miniGamePos.y !== null ? miniGamePos.y : rect.top;
            miniGameOverlayRef.current.style.left = initialLeft + 'px';
            miniGameOverlayRef.current.style.top = initialTop + 'px';
            miniGameDragRef.current.lastX = initialLeft;
            miniGameDragRef.current.lastY = initialTop;
        }
        e.stopPropagation();
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!miniGameDragRef.current.isDragging) return;
            if (e.cancelable && e.type === 'touchmove') e.preventDefault();

            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            if (clientX === undefined) return;

            const dx = clientX - miniGameDragRef.current.startX;
            const dy = clientY - miniGameDragRef.current.startY;

            let newX = miniGameDragRef.current.initialX + dx;
            let newY = miniGameDragRef.current.initialY + dy;

            newX = Math.max(0, Math.min(window.innerWidth - 100, newX));
            newY = Math.max(0, Math.min(window.innerHeight - 50, newY));

            // Direct DOM update - avoids React re-render on every mousemove
            if (miniGameOverlayRef.current) {
                miniGameOverlayRef.current.style.left = newX + 'px';
                miniGameOverlayRef.current.style.top = newY + 'px';
            }
            miniGameDragRef.current.lastX = newX;
            miniGameDragRef.current.lastY = newY;
        };

        const handleMouseUp = () => {
            if (miniGameDragRef.current.isDragging) {
                miniGameDragRef.current.isDragging = false;
                if (miniGameDragRef.current.lastX !== undefined) {
                    setMiniGamePos({ x: miniGameDragRef.current.lastX, y: miniGameDragRef.current.lastY });
                }
            }
        };

        document.addEventListener('mousemove', handleMouseMove, { passive: false });
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleMouseMove, { passive: false });
        document.addEventListener('touchend', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleMouseMove);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, []);

    const handleRevealAnagram = (e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (!scrambleWordRef.current || scrambleWinnerRef.current) return;

        setScrambledDisplay(scrambleWordRef.current);
        playSound("wrong");

        setTimeout(() => {
            startNewScramble();
        }, 4000);
    };

    const startNewScramble = () => {
        if (unplayedMiniGameWordsRef.current.length === 0) {
            unplayedMiniGameWordsRef.current = [...miniGameWordsRef.current];
        }

        const randomIndex = Math.floor(Math.random() * unplayedMiniGameWordsRef.current.length);
        const word = unplayedMiniGameWordsRef.current[randomIndex];

        unplayedMiniGameWordsRef.current.splice(randomIndex, 1);

        let scrambled = word;
        let attempts = 0;
        while (scrambled === word && attempts < 10) {
            scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
            attempts++;
        }
        if (scrambled === word) {
            const reversed = word.split('').reverse().join('');
            scrambled = reversed !== word ? reversed : word.slice(1) + word[0];
        }

        setScrambleWord(word);
        setScrambledDisplay(scrambled);
        setScrambleWinner(null);
    };

    useEffect(() => {
        fetch("/minigame.txt")
            .then(res => {
                if (!res.ok) throw new Error("File minigame.txt tidak ditemukan");
                return res.text();
            })
            .then(text => {
                const words = text.split(/\r?\n/)
                    .map(w => w.trim().toUpperCase())
                    .filter(w => w.length >= 5 && w.length <= 8 && !w.includes(" "));

                if (words.length > 0) {
                    miniGameWordsRef.current = words;
                    unplayedMiniGameWordsRef.current = [...words];
                    addLog("System", `Berhasil memuat ${words.length} kata minigame!`);
                } else {
                    unplayedMiniGameWordsRef.current = [...miniGameWordsRef.current];
                }
                startNewScramble();
            })
            .catch(() => {
                unplayedMiniGameWordsRef.current = [...miniGameWordsRef.current];
                startNewScramble();
            });
    }, []);


    useEffect(() => {
        let interval;
        if (gameState === "ENDED" && autoRestartEnabled) {
            setRestartCountdown(10);
            interval = setInterval(() => {
                setRestartCountdown(prev => {
                    if (prev !== null && prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev !== null ? prev - 1 : null;
                });
            }, 1000);
        } else {
            setRestartCountdown(null);
        }
        return () => clearInterval(interval);
    }, [gameState, autoRestartEnabled]);

    useEffect(() => {
        if (restartCountdown === 0 && gameState === "ENDED") {
            setRestartCountdown(null);
            clearLobby();
            pickShowcaseWords();
            setWaitingCountdown(60);
            addLog("System", "Lobby dibuka 60 detik untuk pemain baru!");
        }
    }, [restartCountdown, gameState]);

    useEffect(() => {
        let interval;
        if (gameState === "WAITING" && waitingCountdown !== null) {
            if (waitingCountdown > 0) {
                interval = setInterval(() => {
                    setWaitingCountdown(prev => prev - 1);
                }, 1000);
            } else {
                setWaitingCountdown(null);
                if (playersRef.current.length >= 2) {
                    startGame();
                } else {
                    addLog("System", t("log_need_players"));
                }
            }
        }
        return () => clearInterval(interval);
    }, [gameState, waitingCountdown]);

    useEffect(() => {
        const counts = {};
        dictionary.forEach(w => {
            if (w.length >= 4) {
                const s3 = w.slice(-3); const s4 = w.slice(-4);
                counts[s3] = (counts[s3] || 0) + 1; counts[s4] = (counts[s4] || 0) + 1;
            } else if (w.length === 3) {
                const s2 = w.slice(-2); counts[s2] = (counts[s2] || 0) + 1;
            }
        });
        const targets = [];
        Object.keys(counts).forEach(k => { if (counts[k] > 10) targets.push(k); });
        rhymeTargetsRef.current = targets.sort((a, b) => counts[b] - counts[a]);
    }, [dictionary]);

    useEffect(() => {
        if (showStats) {
            const rawStats = StatsManager.loadAll();
            const statsArray = Object.keys(rawStats).map((key) => ({ id: key, ...rawStats[key] }));
            statsArray.sort((a, b) => b.wins !== a.wins ? b.wins - a.wins : b.games - a.games);
            setAllStats(statsArray);
        }
    }, [showStats]);

    const isScoreMode = () => pointModeRef.current !== "OFF";

    const pickShowcaseWords = () => {
        let candidates = [...playedWordsHistoryRef.current];

        candidates.sort((a, b) => b.word.length - a.word.length);

        let selected = [];
        let usedNicknames = new Set();

        for (let i = 0; i < candidates.length; i++) {
            if (selected.length >= 3) break;
            if (!usedNicknames.has(candidates[i].nickname)) {
                selected.push(candidates[i]);
                usedNicknames.add(candidates[i].nickname);
            }
        }

        if (selected.length < 3) {
            for (let i = 0; i < candidates.length; i++) {
                if (selected.length >= 3) break;
                if (!selected.find(s => s.word === candidates[i].word)) {
                    selected.push(candidates[i]);
                }
            }
        }

        playedWordsHistoryRef.current = playedWordsHistoryRef.current.filter(
            h => !selected.find(s => s.word === h.word)
        );

        if (selected.length < 3) {
            const fallbackKeys = Object.keys(syllableMapRef.current).filter(k => syllableMapRef.current[k]?.def);
            const shuffledFallback = fallbackKeys.sort(() => Math.random() - 0.5);
            for (const key of shuffledFallback) {
                if (selected.length >= 3) break;
                if (!selected.find(s => s.word === key)) {
                    const fakeNames = ["AI Kamus", "Bot Pintar", "Suhu Bahasa", "Penonton Setia"];
                    const selectedName = fakeNames[Math.floor(Math.random() * fakeNames.length)];
                    selected.push({
                        word: key,
                        nickname: selectedName,
                        avatarUrl: getAvatarUrl(key),
                        def: syllableMapRef.current[key].def
                    });
                }
            }
        }

        if (selected.length === 0) {
            selected.push({ word: "EDUKASI", nickname: "Sistem Pusat", avatarUrl: getAvatarUrl("edu"), def: "Proses pengubahan sikap dan tata laku seseorang atau kelompok dalam usaha mendewasakan manusia melalui pengajaran dan pelatihan." });
            selected.push({ word: "ESTETIK", nickname: "Sistem Pusat", avatarUrl: getAvatarUrl("est"), def: "Mengenai keindahan; menyangkut apresiasi keindahan (alam, seni, dan sastra)." });
            selected.push({ word: "KREATIF", nickname: "Sistem Pusat", avatarUrl: getAvatarUrl("kreatif"), def: "Memiliki daya cipta; memiliki kemampuan untuk menciptakan." });
        } else if (selected.length === 1) {
            selected.push({ word: "BAHASA", nickname: "Sistem Pusat", avatarUrl: getAvatarUrl("bahasa"), def: "Sistem lambang bunyi yang arbitrer, yang digunakan oleh anggota suatu masyarakat untuk bekerja sama dan berinteraksi." });
            selected.push({ word: "KREATIF", nickname: "Sistem Pusat", avatarUrl: getAvatarUrl("kreatif"), def: "Memiliki daya cipta; memiliki kemampuan untuk menciptakan." });
        } else if (selected.length === 2) {
            selected.push({ word: "KREATIF", nickname: "Sistem Pusat", avatarUrl: getAvatarUrl("kreatif"), def: "Memiliki daya cipta; memiliki kemampuan untuk menciptakan." });
        }

        setShowcaseWords(selected);
    };


    // Timers are now handled in PlayerTimer and GlobalTimer components to prevent re-render hell

    useEffect(() => {
        if (gameState !== "PLAYING") return;
        const currentPlayer = players[currentTurnIndex];
        if (currentPlayer && currentPlayer.isBot && !currentPlayer.isEliminated) {
            const diff = currentPlayer.botDifficulty || 3;
            let minTime = 2000, maxTime = 4000;
            if (diff <= 2) { minTime = 3500; maxTime = 6500; }
            if (diff >= 5) { minTime = 500; maxTime = 1500; }
            const thinkingTime = Math.floor(Math.random() * (maxTime - minTime)) + minTime;
            const botTimer = setTimeout(() => {
                if (currentWordRef.current !== currentWord && gameModeRef.current !== "RHYME") return;
                const dictArray = Array.from(dictionary);
                let candidates = [];
                const startIndex = Math.floor(Math.random() * dictArray.length);
                for (let i = 0; i < dictArray.length; i++) {
                    const word = dictArray[(startIndex + i) % dictArray.length];
                    if (usedWordsRef.current.has(word) || word === currentWordRef.current) continue;
                    if (maxWordLengthRef.current > 0 && word.length > maxWordLengthRef.current) continue;
                    if (validateConnection(currentWordRef.current, word, getLogicOptions())) {
                        candidates.push(word);
                        if (candidates.length >= 60) break; // Optimization: early exit
                    }
                }

                if (candidates.length > 0) {
                    if (diff <= 2 && Math.random() < 0.20) {
                        addLog("Bot", `${currentPlayer.nickname} ${t("log_stumped")}`);
                        return;
                    }
                    let selectedWord;
                    if (diff >= 5) {
                        let preferredCandidates = candidates;
                        if (actionCardsEnabledRef.current) {
                            const actionCandidates = candidates.filter(w => {
                                const low = w.toLowerCase();
                                return low.endsWith('sk') || low.endsWith('bo') || low.endsWith('po') || low.endsWith('rv');
                            });
                            if (actionCandidates.length > 0 && Math.random() < 0.85) preferredCandidates = actionCandidates;
                        }

                        preferredCandidates.sort((a, b) => b.length - a.length);

                        const topCandidates = preferredCandidates.slice(0, 20);
                        const aliveCount = players.filter(p => !p.isEliminated).length;

                        let killMove = null;
                        let safeMoves = [];

                        for (const w of topCandidates) {
                            let steps = 1;
                            const low = w.toLowerCase();
                            if (actionCardsEnabledRef.current && low.endsWith('sk')) steps = 2;

                            const landsOnSelf = (steps % aliveCount === 0);

                            let isDeadlock = false;
                            if (overlapModeRef.current === "RANDOM" && gameModeRef.current !== "FILL_BLANK") {
                                isDeadlock = true;
                                for (let i = 1; i <= Math.min(4, w.length); i++) {
                                    if (hasPossibleAnswer(w, i)) { isDeadlock = false; break; }
                                }
                            } else {
                                isDeadlock = !hasPossibleAnswer(w);
                            }

                            if (isDeadlock) {
                                if (!landsOnSelf) {
                                    killMove = w;
                                    break;
                                }
                            } else {
                                safeMoves.push(w);
                            }
                        }

                        if (killMove) {
                            selectedWord = killMove;
                        } else if (safeMoves.length > 0) {
                            selectedWord = safeMoves[Math.floor(Math.random() * Math.min(3, safeMoves.length))];
                        } else {
                            selectedWord = candidates[Math.floor(Math.random() * candidates.length)];
                        }
                    } else if (diff <= 2) {
                        candidates.sort((a, b) => a.length - b.length);
                        selectedWord = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))];
                    } else {
                        if (actionCardsEnabledRef.current) {
                            const actionCandidates = candidates.filter(w => {
                                const low = w.toLowerCase();
                                return low.endsWith('sk') || low.endsWith('bo') || low.endsWith('po') || low.endsWith('rv');
                            });
                            if (actionCandidates.length > 0 && Math.random() < 0.4) candidates = actionCandidates;
                        }
                        selectedWord = candidates[Math.floor(Math.random() * candidates.length)];
                    }
                    submitAnswer(selectedWord);
                } else {
                    addLog("Bot", `${currentPlayer.nickname} ${t("log_stumped")}`);
                }
            }, thinkingTime);
            return () => clearTimeout(botTimer);
        }
    }, [currentTurnIndex, gameState, currentWord, players, dictionary]);


    useEffect(() => {
        fetch("/dictionary.json")
            .then((res) => { if (!res.ok) throw new Error("Not found"); return res.json(); })
            .then((data) => {
                const rawWords = Object.keys(data);
                const cleanedWords = rawWords.filter((w) => !w.includes(" ")).map((w) => normalizeWord(w)).filter((w) => w.length > 0);
                const newDict = new Set(cleanedWords);
                setDictionary(newDict);
                setDictLoadedInfo(`Loaded (${cleanedWords.length})`);
                dictionaryCache.current.EN = { dict: newDict, syl: {}, info: `Loaded (${cleanedWords.length})`, phrases: new Set(FALLBACK_PHRASES_EN) };
            }).catch(() => { });
        connectWebSocket();
        return () => {
            if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
            clearInterval(timerRef.current);
        };
    }, []);

    const triggerVisualEffect = (type, uniqueId, data) => {
        if (type === "like") {
            const now = Date.now();
            if (now - lastLikeTimeRef.current < 200) return; // Limit to max 5 like animations per second
            lastLikeTimeRef.current = now;
        }

        const id = `${type}-${Date.now()}-${Math.random()}`;
        setActiveEffects(prev => {
            // Keep maximum of 15 effects on screen to prevent massive DOM lag
            const newEffects = [...prev, { id, type, uniqueId, ...data }];
            if (newEffects.length > 15) newEffects.shift();
            return newEffects;
        });

        setTimeout(() => {
            setActiveEffects(prev => prev.filter(e => e.id !== id));
        }, type === 'gift' ? 3000 : 2000);
    };

    const connectWebSocket = () => {
        let hostname;
        if (wsHostRef.current && wsHostRef.current.trim()) {
            hostname = wsHostRef.current.trim();
        } else {
            hostname = fallbackToLocalhostRef.current ? "localhost" : window.location.hostname || "localhost";
        }
        const url = `ws://${hostname}:62024`;
        try {
            wsRef.current = new WebSocket(url);
            wsRef.current.onopen = () => {
                setConnectionStatus("ws_only");
                addLog("System", `Connected to Backend (${hostname})`);
                fallbackToLocalhostRef.current = false;
            };
            wsRef.current.onmessage = (event) => {
                try {
                    const { event: eventName, data } = JSON.parse(event.data);
                    if (eventName === "chat" && chatHandlerRef.current) chatHandlerRef.current(data);

                    if (eventName === "gift") triggerVisualEffect("gift", data.uniqueId, {
                        nickname: data.nickname,
                        profilePictureUrl: data.profilePictureUrl,
                        giftName: data.giftName,
                        giftPictureUrl: data.giftPictureUrl
                    });
                    if (eventName === "like") triggerVisualEffect("like", data.uniqueId, {
                        nickname: data.nickname,
                        profilePictureUrl: data.profilePictureUrl,
                        count: Math.min(data.likeCount || 1, 5)
                    });

                    if (eventName === "tiktok_connected") {
                        setConnectionStatus("tiktok_ready");
                        addLog("System", `Terkoneksi ke TikTok Live! 🟢`);
                        playSound("notification");
                    }
                    if (eventName === "music_state") {
                        setMusicState(data);
                    }
                    if (eventName === "tiktok_disconnected") {
                        setConnectionStatus("ws_only");
                        addLog("System", `Terputus dari TikTok Live 🔴`);
                    }
                } catch (err) { console.error("WS Error", err); }
            };
            wsRef.current.onclose = () => {
                setConnectionStatus("disconnected");
                if (!fallbackToLocalhostRef.current && window.location.hostname !== "localhost") {
                    fallbackToLocalhostRef.current = true;
                }
                setTimeout(connectWebSocket, 15000);
            };
        } catch (err) { }
    };

    useEffect(() => { chatHandlerRef.current = handleChatEvent; });

    const isHostJoined = players.some((p) => p.uniqueId === "host_player");
    const playSound = (effect) => { if (!isMutedRef.current) SoundManager.play(effect); };
    const t = (key) => TRANSLATIONS[language === "MIX" ? "ID" : language]?.[key] || TRANSLATIONS["EN"][key] || key;

    const addLog = (user, message, uniqueId = null) => {
        const logId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setLogs((prev) => [{ user, message, id: logId, uniqueId }, ...prev].slice(0, 50));
    };

    const triggerTableEffect = (status) => {
        if (tableStatusTimeout.current) clearTimeout(tableStatusTimeout.current);
        setTableStatus(status);
        tableStatusTimeout.current = setTimeout(() => setTableStatus("idle"), 500);
    };

    const showFeedback = (text, type) => {
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        setFeedbackMessage({ text, type });
        feedbackTimeoutRef.current = setTimeout(() => setFeedbackMessage(null), 2000);
    };


    const generateChallengeQueue = () => {
        const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
        return [
            ...shuffle(DYNAMIC_CHALLENGES.filter((c) => c.tier === 1)),
            ...shuffle(DYNAMIC_CHALLENGES.filter((c) => c.tier === 2)),
            ...shuffle(DYNAMIC_CHALLENGES.filter((c) => c.tier === 3)),
            ...shuffle(DYNAMIC_CHALLENGES.filter((c) => c.tier === 4))
        ];
    };

    const getNextChallenge = (queue, currentSuffix) => {
        let tempQueue = [...queue];
        if (tempQueue.length === 0) tempQueue = generateChallengeQueue();
        for (let i = 0; i < tempQueue.length; i++) {
            const challenge = tempQueue[i];
            let isSafe = true;

            if (challenge.id === "NO_VOWELS" && /[aeiou]/i.test(currentSuffix)) isSafe = false;
            else if (challenge.id === "MAX_1_VOWEL" && (currentSuffix.match(/[aeiou]/gi) || []).length > 1) isSafe = false;
            else if (challenge.id === "EXACT_2_VOWELS" && (currentSuffix.match(/[aeiou]/gi) || []).length > 2) isSafe = false;
            else if (challenge.id === "UNIQUE" && new Set(currentSuffix).size !== currentSuffix.length) isSafe = false;
            else if (challenge.id === "START_END_CONS" && /[aeiou]/i.test(currentSuffix[0])) isSafe = false;
            else if (challenge.id === "SECOND_VOWEL" && currentSuffix.length >= 2 && !/[aeiou]/i.test(currentSuffix[1])) isSafe = false;
            else if (challenge.id === "EXACT_4" && currentSuffix.length >= 4) isSafe = false;
            else if (challenge.id === "MAX_5" && currentSuffix.length >= 5) isSafe = false;
            else if (challenge.id === "EXACT_6" && currentSuffix.length >= 6) isSafe = false;
            else if (challenge.id.startsWith("NO_")) {
                const forbiddenChars = challenge.id.replace("NO_", "").toLowerCase().split("_");
                if (forbiddenChars.some((char) => currentSuffix.includes(char))) isSafe = false;
            }

            if (isSafe) return { selected: tempQueue.splice(i, 1)[0], newQueue: tempQueue };
        }
        return { selected: tempQueue.shift(), newQueue: tempQueue };
    };

    function getLogicOptions() {
        return {
            gameMode: gameModeRef.current || gameMode,
            overlapLength: overlapLengthRef.current || overlapLength,
            targetRhyme: targetRhymeRef.current || targetRhyme,
            language: language,
            syllableMap: syllableMapRef.current || syllableMap,
            phraseDictionary: phraseDictionary.current || phraseDictionary,
            activeChallenge: activeChallengeRef.current || activeChallenge,
            getEnglishSyllableSuffix: getEnglishSyllableSuffix
        };
    }
    function handleWin(winners) {
        const winnersArray = Array.isArray(winners) ? winners : [winners];
        const updatedStatsMap = {};
        winnersArray.forEach(w => { updatedStatsMap[w.uniqueId] = StatsManager.update(w.uniqueId, true, false, w.nickname); });
        setPlayers((prev) => prev.map(p => updatedStatsMap[p.uniqueId] ? { ...p, stats: updatedStatsMap[p.uniqueId] } : p));
        setGameState("ENDED");
        playSound("win");
    }

    function advanceTurn(currentPlayersList, startIndex, steps = 1, currentWordOverride = null) {
        const len = currentPlayersList.length;
        if (len === 0) return;

        const activeCount = currentPlayersList.filter(p => !p.isEliminated).length;
        turnCountRef.current += 1;
        
        if (turnCountRef.current >= Math.max(1, activeCount)) {
            turnCountRef.current = 0;
            const wordToUse = currentWordOverride !== null ? currentWordOverride : (currentWordRef.current || "");
            
            if (gameModeRef.current === "DYNAMIC" && gameStateRef.current !== "ENDED") {
                const suffix = wordToUse.slice(-overlapLengthRef.current).toLowerCase();
                const { selected, newQueue } = getNextChallenge(challengeQueueRef.current, suffix);
                setActiveChallenge(selected);
                activeChallengeRef.current = selected;
                setChallengeQueue(newQueue);
                challengeQueueRef.current = newQueue;
                const label = (languageRef.current === "ID" || languageRef.current === "MIX") && selected.labelID ? selected.labelID : selected.label;
                addLog("System", `🚨 ${t("log_rule_change")}: ${label} 🚨`);
                playSound("tick");
            }

            if (overlapModeRef.current === "SEQUENTIAL" && gameModeRef.current !== "FILL_BLANK") {
                let nextSeq = overlapLengthRef.current + 1;
                if (nextSeq > 4) nextSeq = 2; // Siklus 2 -> 3 -> 4 -> 2
                setOverlapLength(nextSeq);
                overlapLengthRef.current = nextSeq;
                addLog("System", `🔄 Ronde Baru! Syarat Overlap: ${nextSeq} Huruf`);
                playSound("notification");
            }

            if (gameModeRef.current === "RHYME") {
                setTimeout(changeRhymeTarget, 800);
            }
        }

        let nextIndex = startIndex; let stepsTaken = 0; let attempts = 0;
        const direction = isReversedRef.current ? -1 : 1;
        while (stepsTaken < steps && attempts < len * 2) {
            nextIndex = (nextIndex + direction + len) % len;
            if (!currentPlayersList[nextIndex].isEliminated) stepsTaken++;
            attempts++;
        }
        setCurrentTurnIndex(nextIndex);
        setTurnKey(k => k + 1);
    }

    function handleTimeout() {
        clearInterval(timerRef.current);
        playSound("eliminate");
        const currentPlayers = playersRef.current;
        const currentIndex = turnIndexRef.current;
        const playerToEliminate = currentPlayers[currentIndex];
        if (!playerToEliminate || playerToEliminate.isEliminated) return;
        let killerId = null;
        if (lastSuccessfulPlayerIdRef.current && lastSuccessfulPlayerIdRef.current !== playerToEliminate.uniqueId) {
            killerId = lastSuccessfulPlayerIdRef.current;
            StatsManager.addKill(killerId);
        }
        const newPlayers = currentPlayers.map((p, idx) => {
            let pData = { ...p };
            if (idx === currentIndex) pData.isEliminated = true;
            if (killerId && p.uniqueId === killerId) pData.sessionKills = (pData.sessionKills || 0) + 1;
            return pData;
        });
        setPlayers(newPlayers);
        addLog("System", `${playerToEliminate.nickname} ${t("log_eliminated")}`);

        const activePlayers = newPlayers.filter((p) => !p.isEliminated);

        let gameEndedByRounds = false;
        if (isScoreMode() && winConditionRef.current === "ROUNDS") {
            if (activePlayers.length > 0 && activePlayers.every((p) => (p.turnCount || 0) >= targetRoundsRef.current)) {
                gameEndedByRounds = true;
            }
        }

        if (gameEndedByRounds) {
            const sorted = [...activePlayers].sort((a, b) => (b.score || 0) - (a.score || 0));
            const winners = sorted.filter(p => (p.score || 0) === (sorted[0].score || 0));
            if (winners.length > 0) handleWin(winners); else { setGameState("ENDED"); playSound("win"); }
        } else if (activePlayers.length <= 1) {
            if (activePlayers.length === 1) handleWin([activePlayers[0]]);
            else { setGameState("ENDED"); playSound("win"); }
        } else {
            if (gameModeRef.current === "RHYME") {
                setTimeout(changeRhymeTarget, 500);
            }
            setTurnCount(0);
            advanceTurn(newPlayers, currentIndex, 1);
        }
    }


    const hasPossibleAnswer = (startWord, specificOverlap = null) => {
        const oldOverlap = overlapLengthRef.current;
        if (specificOverlap !== null) overlapLengthRef.current = specificOverlap;

        let patternToTest = startWord;
        if (gameModeRef.current === "FILL_BLANK" && !startWord.includes("...")) {
            patternToTest = generatePattern(startWord, dictionary, usedWordsRef.current).display;
        }

        let found = false;
        for (const candidate of dictionary) {
            if (usedWordsRef.current.has(candidate) || candidate === startWord) continue;
            if (maxWordLengthRef.current > 0 && candidate.length > maxWordLengthRef.current) continue;
            if (validateConnection(patternToTest, candidate, getLogicOptions())) { found = true; break; }
        }

        if (specificOverlap !== null) overlapLengthRef.current = oldOverlap;
        return found;
    };

    const countPossibleAnswers = (startWord, specificOverlap = null) => {
        const oldOverlap = overlapLengthRef.current;
        if (specificOverlap !== null) overlapLengthRef.current = specificOverlap;

        let patternToTest = startWord;
        if (gameModeRef.current === "FILL_BLANK" && !startWord.includes("...")) {
            patternToTest = generatePattern(startWord, dictionary, usedWordsRef.current).display;
        }

        let count = 0;
        for (const candidate of dictionary) {
            if (usedWordsRef.current.has(candidate) || candidate === startWord) continue;
            if (maxWordLengthRef.current > 0 && candidate.length > maxWordLengthRef.current) continue;
            if (validateConnection(patternToTest, candidate, getLogicOptions())) {
                count++;
                if (count > 1) break;
            }
        }

        if (specificOverlap !== null) overlapLengthRef.current = oldOverlap;
        return count;
    };

    const getNewRandomWord = (challenge = null) => {
        if (gameModeRef.current === "PHRASE_CHAIN") {
            const phrases = Array.from(phraseDictionary.current);
            if (phrases.length === 0) return dictionary.size > 0 ? Array.from(dictionary)[0] : "word";
            return phrases[Math.floor(Math.random() * phrases.length)].split(" ")[0];
        }
        const dictArray = Array.from(dictionary);
        if (dictArray.length === 0) return "start";

        let candidates = dictArray.filter((w) => w.length >= 3 && w.length <= 6);

        if (maxWordLengthRef.current > 0) {
            candidates = candidates.filter(w => w.length <= maxWordLengthRef.current);
        }

        if (challenge) {
            candidates = candidates.filter(w => challenge.check(w));
        }

        if (candidates.length === 0) {
            candidates = dictArray.filter(w => {
                if (challenge && !challenge.check(w)) return false;
                if (maxWordLengthRef.current > 0 && w.length > maxWordLengthRef.current) return false;
                return true;
            });
        }

        if (candidates.length === 0) candidates = dictArray;

        for (let i = 0; i < 50; i++) {
            const choice = candidates[Math.floor(Math.random() * candidates.length)];
            if (hasPossibleAnswer(choice)) return choice;
        }
        return candidates[Math.floor(Math.random() * candidates.length)];
    };

    function handleSurrender(playerToSurrender) {
        if (gameStateRef.current !== "PLAYING") return;
        const currentPlayers = playersRef.current;
        const pIndex = currentPlayers.findIndex(p => p.uniqueId === playerToSurrender.uniqueId);
        if (pIndex === -1 || currentPlayers[pIndex].isEliminated) return;
        playSound("eliminate");
        const isActivePlayer = pIndex === turnIndexRef.current;
        let killerId = null;
        if (isActivePlayer && lastSuccessfulPlayerIdRef.current && lastSuccessfulPlayerIdRef.current !== playerToSurrender.uniqueId) {
            killerId = lastSuccessfulPlayerIdRef.current; StatsManager.addKill(killerId);
        }
        const newPlayers = currentPlayers.map((p, idx) => {
            let pData = { ...p };
            if (idx === pIndex) pData.isEliminated = true;
            if (killerId && p.uniqueId === killerId) pData.sessionKills = (pData.sessionKills || 0) + 1;
            return pData;
        });
        playersRef.current = newPlayers;
        setPlayers(newPlayers);
        addLog("Game", `${playerToSurrender.nickname} ${t("log_surrender")}`);

        const activePlayers = newPlayers.filter((p) => !p.isEliminated);

        let gameEndedByRounds = false;
        if (isScoreMode() && winConditionRef.current === "ROUNDS") {
            if (activePlayers.length > 0 && activePlayers.every((p) => (p.turnCount || 0) >= targetRoundsRef.current)) {
                gameEndedByRounds = true;
            }
        }

        if (gameEndedByRounds) {
            const sorted = [...activePlayers].sort((a, b) => (b.score || 0) - (a.score || 0));
            const winners = sorted.filter(p => (p.score || 0) === (sorted[0].score || 0));
            if (winners.length > 0) handleWin(winners); else { setGameState("ENDED"); playSound("win"); }
        } else if (activePlayers.length <= 1) {
            if (activePlayers.length === 1) handleWin([activePlayers[0]]);
            else { setGameState("ENDED"); playSound("win"); }
        } else if (isActivePlayer) {
            if (gameModeRef.current === "RHYME") {
                setTimeout(changeRhymeTarget, 500);
            }
            setTurnCount(0);
            advanceTurn(newPlayers, pIndex, 1);
        }
    }

    const wordStartsPhrase = (word) => {
        const prefix = word.toLowerCase() + " ";
        for (const phrase of phraseDictionary.current) if (phrase.startsWith(prefix)) return true;
        return false;
    };

    const findRecoveryWord = (deadEndWord) => {
        const suffix = getRecoverySuffix(deadEndWord, getLogicOptions()).toLowerCase();
        const candidates = [];
        for (const phrase of phraseDictionary.current) {
            const parts = phrase.split(" ");
            if (parts.length > 0 && parts[0].startsWith(suffix) && parts[0] !== deadEndWord.toLowerCase()) candidates.push(parts[0]);
        }
        return candidates.length > 0 ? { word: candidates[Math.floor(Math.random() * candidates.length)], suffix } : null;
    };

    function changeRhymeTarget() {
        const targets = rhymeTargetsRef.current;
        if (targets.length > 0) {
            let newTarget = targets[Math.floor(Math.random() * targets.length)];
            if (newTarget === targetRhymeRef.current && targets.length > 1) {
                const alt = targets.filter(t => t !== newTarget);
                newTarget = alt[Math.floor(Math.random() * alt.length)];
            }
            setTargetRhyme(newTarget);
            addLog("System", `${t("rhyme_change")}: ...${newTarget.toUpperCase()}`);
            playSound("notification"); triggerTableEffect("info"); showFeedback(`${t("rhyme_change")}: ${newTarget.toUpperCase()}`, "info");
        }
    }

    function submitAnswer(word, forcedUniqueId = null) {
        let playerIndex = turnIndexRef.current;
        if (forcedUniqueId) {
            const idx = playersRef.current.findIndex(p => p.uniqueId === forcedUniqueId);
            if (idx !== -1) playerIndex = idx;
        }
        if (gameModeRef.current !== "PHRASE_CHAIN" && !dictionary.has(word)) {
            addLog("Game", `❌ "${word}" ${t("log_invalid")}.`);
            playSound("wrong"); triggerTableEffect("error"); showFeedback(`${word} ${t("log_invalid")}`, "error");
            return;
        }
        if (usedWordsRef.current.has(word)) {
            addLog("Game", `❌ "${word}" ${t("log_used")}.`);
            playSound("wrong"); triggerTableEffect("warning"); showFeedback(`${word} ${t("log_used")}`, "warning");
            return;
        }
        if (maxWordLengthRef.current > 0 && word.length > maxWordLengthRef.current) {
            addLog("Game", `❌ "${word}" kepanjangan (Maks ${maxWordLengthRef.current}).`);
            playSound("wrong"); triggerTableEffect("error"); showFeedback(`Maksimal ${maxWordLengthRef.current} huruf`, "error");
            return;
        }
        const isValid = validateConnection(currentWordRef.current, word, getLogicOptions());
        if (isValid) {
            playSound("correct"); triggerTableEffect("success");
            usedWordsRef.current.add(word); setUsedWords(new Set(usedWordsRef.current));
            const prevWord = currentWordRef.current;
            let nextWord = word; let stepsToAdvance = 1; let applyBomb = false;

            let pointsAwarded = 0;
            if (pointModeRef.current !== "OFF") {
                if (gameModeRef.current === "STEP_UP") {
                    pointsAwarded = 10;
                } else if (pointModeRef.current === "LENGTH") {
                    pointsAwarded = word.length;
                } else if (pointModeRef.current === "SCRABBLE") {
                    let useIndoScoring = languageRef.current === "ID";

                    if (languageRef.current === "MIX") {
                        const isEnglishWord = dictionaryCache.current.EN?.dict?.has(word) || FALLBACK_DICTIONARY_EN.has(word);
                        const isIndoWord = !!syllableMapRef.current[word] || !!FALLBACK_DICTIONARY_ID_DATA[word] || dictionaryCache.current.ID?.dict?.has(word);

                        if (isEnglishWord && !isIndoWord) {
                            useIndoScoring = false;
                        } else {
                            useIndoScoring = true;
                        }
                    }

                    let scores;
                    if (useIndoScoring) {
                        scores = {
                            a: 1, e: 1, i: 1, n: 1, o: 1, r: 1, s: 1, t: 1, u: 1,
                            d: 2, k: 2, l: 2, m: 2,
                            b: 3, g: 3, p: 3,
                            c: 4, h: 4,
                            f: 5, j: 5, w: 5, y: 5,
                            v: 8,
                            q: 10, x: 10, z: 10
                        };
                    } else {
                        scores = {
                            a: 1, e: 1, i: 1, o: 1, u: 1, l: 1, n: 1, s: 1, t: 1, r: 1,
                            d: 2, g: 2,
                            b: 3, c: 3, m: 3, p: 3,
                            f: 4, h: 4, v: 4, w: 4, y: 4,
                            k: 5,
                            j: 8, x: 8,
                            q: 10, z: 10
                        };
                    }
                    for (let char of word.toLowerCase()) {
                        pointsAwarded += scores[char] || 1;
                    }
                } else if (pointModeRef.current === "VOWELS") {
                    for (let char of word.toLowerCase()) {
                        pointsAwarded += /[aeiou]/.test(char) ? 3 : 1;
                    }
                }
            }

            const p = playersRef.current[playerIndex];

            setLastPlay({
                id: Date.now(),
                word: word.toUpperCase(),
                points: pointsAwarded,
                nickname: p.nickname,
                avatarUrl: p.avatarUrl
            });

            const defData = syllableMapRef.current[word]?.def;
            if (defData && !playedWordsHistoryRef.current.find(h => h.word === word)) {
                playedWordsHistoryRef.current.push({
                    word: word,
                    nickname: p.nickname,
                    avatarUrl: p.avatarUrl,
                    def: defData
                });
                if (playedWordsHistoryRef.current.length > 50) playedWordsHistoryRef.current.shift();
            }

            const newPlayersList = playersRef.current.map((pl, index) => {
                if (index === playerIndex) return { ...pl, score: (pl.score || 0) + pointsAwarded, turnCount: (pl.turnCount || 0) + 1 };
                return pl;
            });
            let modifiedPlayers = [...newPlayersList];
            if (actionCardsEnabledRef.current) {
                const lowWord = word.toLowerCase();
                if (lowWord.endsWith('sk')) { stepsToAdvance = 2; addLog("Action", `⏸️ SKIP!`); triggerTableEffect("warning"); playSound("notification"); }
                else if (lowWord.endsWith('bo')) { applyBomb = true; addLog("Action", `💣?? BOM WAKTU! (10 Detik)`); triggerTableEffect("error"); playSound("eliminate"); }
                else if (lowWord.endsWith('rv')) {
                    setIsReversed((prev) => !prev);
                    isReversedRef.current = !isReversedRef.current;
                    addLog("Action", `🔄 PUTAR BALIK!`);
                    triggerTableEffect("info");
                    playSound("notification");
                }
                else if (lowWord.endsWith('po')) {
                    const len = modifiedPlayers.length;
                    const direction = isReversedRef.current ? -1 : 1;
                    let nextIdx = (playerIndex + direction + len) % len;
                    let attempts = 0;
                    while (modifiedPlayers[nextIdx].isEliminated && attempts < len) {
                        nextIdx = (nextIdx + direction + len) % len;
                        attempts++;
                    }
                    if (isScoreMode()) {
                        modifiedPlayers[nextIdx] = {
                            ...modifiedPlayers[nextIdx],
                            score: Math.max(0, (modifiedPlayers[nextIdx].score || 0) - 5)
                        };
                        addLog("Action", `💀 ${modifiedPlayers[nextIdx].nickname} -5 POIN!`);
                    } else {
                        // In non-score mode, PO acts as a half-time bomb
                        applyBomb = true;
                        addLog("Action", `💀 RACUN! ${modifiedPlayers[nextIdx].nickname} waktu dipotong!`);
                    }
                    triggerTableEffect("error");
                    playSound("wrong");
                }
            }
            setPlayers(modifiedPlayers);
            bombNextRef.current = applyBomb;

            let pts = isScoreMode() ? ` (+${pointsAwarded})` : "";

            if (gameModeRef.current === "FILL_BLANK") {
                nextWord = generatePattern(word, dictionary, usedWordsRef.current).display;
            }

            if (gameModeRef.current === "CITIES") {
                addLog("Game", `✅ ${word.toUpperCase()} ${cityMetadataRef.current[word] ? `(${cityMetadataRef.current[word]}) ` : ""}${pts}`);
            } else if (gameModeRef.current === "PHRASE_CHAIN") {
                addLog("Game", `✅ ${prevWord.toUpperCase()} -> ${word.toUpperCase()}${pts}`);
                if (!wordStartsPhrase(word)) {
                    const recovery = findRecoveryWord(word);
                    if (recovery) {
                        setTimeout(() => {
                            addLog("System", `${t("chain_broken")} 💥`);
                            addLog("System", `${t("reconnecting")}: ...${recovery.suffix} -> ${recovery.word.toUpperCase()}`);
                            triggerTableEffect("info"); playSound("notification"); showFeedback(t("chain_broken"), "info");
                        }, 600);
                        nextWord = recovery.word;
                    }
                }
            } else if (gameModeRef.current === "RHYME") {
                addLog("Game", `✅ ${word.toUpperCase()} (...${targetRhymeRef.current.toUpperCase()})${pts}`);
            } else if (gameModeRef.current === "WRAP_AROUND") {
                addLog("Game", `✅ ${word.toUpperCase()} (${word.slice(0, overlapLengthRef.current).toUpperCase()}...${word.slice(-overlapLengthRef.current).toUpperCase()})${pts}`);
            } else if (gameModeRef.current === "MIRROR") {
                addLog("Game", `✅ ${word.toUpperCase()} (End: ${word.slice(-overlapLengthRef.current).toUpperCase()})${pts}`);
            } else if (gameModeRef.current === "STEP_UP") {
                addLog("Game", `✅ ${word.toUpperCase()} (Len: ${word.length}) ⟡️ Next: ${word.length >= 10 ? "Reset" : word.length + 1}${pts}`);
            } else if (gameModeRef.current === "FILL_BLANK") {
                addLog("Game", `✅ ${word.toUpperCase()} (+${pointsAwarded})`);
            } else {
                if (isScoreMode()) {
                    addLog("Game", `✅ ${word.toUpperCase()} +${pointsAwarded} ${t("log_pts")}!`);
                } else {
                    addLog("Game", `✅ ${t("log_correct")} "${word.toUpperCase()}"`);
                }
            }

            if (overlapModeRef.current === "RANDOM" && gameModeRef.current !== "FILL_BLANK") {
                const maxOverlap = Math.min(4, nextWord.length);
                let validOverlaps = [];

                for (let i = 1; i <= maxOverlap; i++) {
                    if (countPossibleAnswers(nextWord, i) > 1) validOverlaps.push(i);
                }

                if (validOverlaps.length === 0) {
                    for (let i = 1; i <= maxOverlap; i++) {
                        if (hasPossibleAnswer(nextWord, i)) validOverlaps.push(i);
                    }
                }

                let nextOverlap = 1;
                if (validOverlaps.length > 0) nextOverlap = validOverlaps[Math.floor(Math.random() * validOverlaps.length)];

                setOverlapLength(nextOverlap);
                overlapLengthRef.current = nextOverlap;
            }

            let gameEnded = false;
            let winnersToDeclare = [];

            if (isScoreMode()) {
                if (winConditionRef.current === "SCORE" && modifiedPlayers[playerIndex].score >= targetScoreRef.current) gameEnded = true;
                if (winConditionRef.current === "ROUNDS") {
                    const activePlayers = modifiedPlayers.filter((pl) => !pl.isEliminated);
                    if (activePlayers.length > 0 && activePlayers.every((pl) => (pl.turnCount || 0) >= targetRoundsRef.current)) gameEnded = true;
                }
                if (gameEnded) {
                    const activePlayers = modifiedPlayers.filter((pl) => !pl.isEliminated);
                    const sorted = [...activePlayers].sort((a, b) => (b.score || 0) - (a.score || 0));
                    winnersToDeclare = sorted.filter(pl => (pl.score || 0) === (sorted[0].score || 0));
                }
            }

            lastSuccessfulPlayerIdRef.current = modifiedPlayers[playerIndex].uniqueId;

            if (!gameEnded) {
                setCurrentWord(nextWord);
                currentWordRef.current = nextWord;
                advanceTurn(modifiedPlayers, playerIndex, stepsToAdvance, nextWord);
            } else {
                setCurrentWord(nextWord);
                handleWin(winnersToDeclare);
            }
        } else {
            let msg = t("log_bad_link");
            if (gameModeRef.current === "PHRASE_CHAIN") msg = "Invalid Phrase Pair";
            else if (gameModeRef.current === "RHYME") msg = "Salah Rima";
            else if (gameModeRef.current === "FILL_BLANK") msg = "Pola Huruf Tidak Cocok";
            else if (gameModeRef.current === "DYNAMIC") {
                const suffix = currentWordRef.current.slice(-overlapLengthRef.current).toLowerCase();
                if (word.toLowerCase().startsWith(suffix)) {
                    if (activeChallengeRef.current?.check && !activeChallengeRef.current.check(word)) {
                        const label = (languageRef.current === "ID" || languageRef.current === "MIX") && activeChallengeRef.current.labelID ? activeChallengeRef.current.labelID : activeChallengeRef.current.label;
                        msg = `Gagal Aturan: ${label}`;
                    }
                }
            }
            addLog("Game", `❌ "${word}" ${msg}.`);
            playSound("wrong"); triggerTableEffect("error"); showFeedback(`${word} ${msg}`, "error");
        }
    }


    function processQueue() {
        if (playerQueueRef.current.length === 0) return;
        let currentPlayers = [...playersRef.current];
        let currentQueue = [...playerQueueRef.current];

        while (currentPlayers.length < maxPlayers && currentQueue.length > 0) {
            const nextPlayer = currentQueue.shift();
            currentPlayers.push(nextPlayer);
            addLog("System", `${nextPlayer.nickname} bergabung dari antrean!`);
        }

        playersRef.current = currentPlayers;
        setPlayers(currentPlayers);
        playerQueueRef.current = currentQueue;
        setPlayerQueue(currentQueue);
    }

    function unjoinGame(uniqueId, nickname) {
        if (playerQueueRef.current.some(p => p.uniqueId === uniqueId)) {
            playerQueueRef.current = playerQueueRef.current.filter(p => p.uniqueId !== uniqueId);
            setPlayerQueue([...playerQueueRef.current]);
            addLog("System", `${nickname} keluar dari antrean.`);
            return;
        }
        if (gameStateRef.current !== "WAITING") return addLog("System", `${nickname}: ${t("log_cant_unjoin")}`);
        if (!playersRef.current.some(p => p.uniqueId === uniqueId)) return;
        quitHistoryRef.current[uniqueId] = (quitHistoryRef.current[uniqueId] || 0) + 1;
        addLog("System", `${nickname} ${t("log_unjoin")}`); playSound("eliminate");
        playersRef.current = playersRef.current.filter(p => p.uniqueId !== uniqueId);
        setPlayers([...playersRef.current]);
    }

    function joinGame(uniqueId, nickname, profilePictureUrl, botDifficulty = 0) {
        if ((quitHistoryRef.current[uniqueId] || 0) >= 2) return;
        if (playersRef.current.some((p) => p.uniqueId === uniqueId)) return;
        if (playerQueueRef.current.some((p) => p.uniqueId === uniqueId)) return;

        const isBot = botDifficulty > 0;
        const stats = isBot ? { wins: 0, games: 0, kills: 0 } : StatsManager.load(uniqueId);
        const newPlayer = {
            id: uniqueId, uniqueId, nickname, avatarUrl: profilePictureUrl || getAvatarUrl(uniqueId),
            isEliminated: false, color: getRandomColor(), isBot, botDifficulty, stats, score: 0, turnCount: 0, sessionKills: 0
        };

        if (gameStateRef.current !== "WAITING") {
            playerQueueRef.current = [...playerQueueRef.current, newPlayer];
            setPlayerQueue([...playerQueueRef.current]);
            playSound("notification");
            addLog("System", `${nickname} masuk antrean next game!`, uniqueId);
            return;
        }

        if (playersRef.current.length >= maxPlayers) {
            playerQueueRef.current = [...playerQueueRef.current, newPlayer];
            setPlayerQueue([...playerQueueRef.current]);
            addLog("System", `Lobby penuh, ${nickname} antre!`, uniqueId);
            return;
        }

        playSound("join"); addLog("System", `${nickname} ${t("log_joined")}`, uniqueId);
        playersRef.current = [...playersRef.current, newPlayer]; setPlayers([...playersRef.current]);
    }

    function addBot() {
        const existingNames = new Set(playersRef.current.map((p) => p.nickname));
        const availableBots = BOT_PROFILES.filter((b) => !existingNames.has(b.name));
        if (availableBots.length === 0) {
            joinGame(`bot_${Date.now()}_${Math.random()}`, `Bot Kloning ${Math.floor(Math.random() * 100)}`, null, 3);
            return;
        }
        const selected = availableBots[Math.floor(Math.random() * availableBots.length)];
        joinGame(`bot_${Date.now()}_${Math.random()}`, selected.name, null, selected.diff);
    }

    function addHost() { joinGame("host_player", "HOST", `https://api.dicebear.com/9.x/fun-emoji/svg?seed=HOST`, 0); }

    const loadCitiesData = (citiesArray) => {
        const dictSet = new Set(); const meta = {};
        citiesArray.forEach((city) => {
            const cleanName = normalizeWord(city.name);
            if (cleanName) { dictSet.add(cleanName); if (city.region) meta[cleanName] = city.region; }
        });
        setDictionary(dictSet); setCityMetadata(meta); setDictLoadedInfo(`Cities (${dictSet.size})`);
        dictionaryCache.current.CITIES = { dict: dictSet, syl: {}, info: `Cities (${dictSet.size})`, meta: meta };
        addLog("System", "Loaded World Cities!");
    };

    function startGame() {
        if (playersRef.current.length < 2) return addLog("System", t("log_need_players"));
        playSound("start");
        setWaitingCountdown(null);
        bombNextRef.current = false; lastSuccessfulPlayerIdRef.current = null;
        setIsReversed(false);

        let randomStart = "";
        let selectedChallenge = null;

        if (gameModeRef.current === "DYNAMIC") {
            const queue = generateChallengeQueue();
            const { selected, newQueue } = getNextChallenge(queue, "");
            selectedChallenge = selected;
            setActiveChallenge(selected);
            activeChallengeRef.current = selected;
            setChallengeQueue(newQueue); setTurnCount(0);
            const label = (languageRef.current === "ID" || languageRef.current === "MIX") && selected.labelID ? selected.labelID : selected.label;
            addLog("System", `Mode: DYNAMIC CHAOS! \nRule: ${label}`);
        }

        if (gameModeRef.current === "RHYME") {
            setTargetRhyme(rhymeTargetsRef.current.length > 0 ? rhymeTargetsRef.current[Math.floor(Math.random() * rhymeTargetsRef.current.length)] : "ing");
        } else if (gameModeRef.current === "FILL_BLANK") {
            const baseW = getNewRandomWord(selectedChallenge);
            const pat = generatePattern(baseW, dictionary, new Set());
            randomStart = pat.display;
        } else {
            randomStart = getNewRandomWord(selectedChallenge);
        }

        const initialUsed = new Set(gameModeRef.current === "FILL_BLANK" ? [] : (randomStart ? [randomStart] : []));
        setUsedWords(initialUsed); usedWordsRef.current = initialUsed;
        const updatedStatsMap = {};
        playersRef.current.forEach((p) => { if (!p.isBot) updatedStatsMap[p.uniqueId] = StatsManager.update(p.uniqueId, false, true, p.nickname); });
        setPlayers((prev) => prev.map((p) => ({ ...p, stats: updatedStatsMap[p.uniqueId] || p.stats, score: 0, turnCount: 0, sessionKills: 0, isEliminated: false })));
        if (isScoreMode() && winConditionRef.current === "TIME") setGlobalTimer(gameDuration);

        if (gameModeRef.current === "RHYME") { setTurnCount(0); addLog("System", `Mode: RHYME RUSH! Target: ...${targetRhymeRef.current || ""}`); }

        if (overlapModeRef.current === "SEQUENTIAL") {
            setOverlapLength(2);
            overlapLengthRef.current = 2;
        } else if (overlapModeRef.current === "RANDOM" && randomStart && gameModeRef.current !== "FILL_BLANK") {
            const maxOverlap = Math.min(4, randomStart.length);
            let validOverlaps = [];

            for (let i = 1; i <= maxOverlap; i++) {
                if (countPossibleAnswers(randomStart, i) > 1) {
                    validOverlaps.push(i);
                }
            }

            if (validOverlaps.length === 0) {
                for (let i = 1; i <= maxOverlap; i++) {
                    if (hasPossibleAnswer(randomStart, i)) {
                        validOverlaps.push(i);
                    }
                }
            }

            let nextOverlap = 1;
            if (validOverlaps.length > 0) {
                nextOverlap = validOverlaps[Math.floor(Math.random() * validOverlaps.length)];
            }

            setOverlapLength(nextOverlap);
            overlapLengthRef.current = nextOverlap;
        }

        setCurrentWord(randomStart);
        const randomFirstPlayerIndex = Math.floor(Math.random() * playersRef.current.length);
        setCurrentTurnIndex(randomFirstPlayerIndex); setRoundStarterId(playersRef.current[randomFirstPlayerIndex].uniqueId);
        setTimer(turnDuration); setGameState("PLAYING"); setShowSettings(false);
        addLog("System", `Start: ${playersRef.current[randomFirstPlayerIndex].nickname} ${t("log_goes_first")}`);
        if (randomStart) addLog("System", `Word: ${randomStart.toUpperCase()} ${cityMetadataRef.current[randomStart] ? `(${cityMetadataRef.current[randomStart]})` : ""}`);
    }

    function resetGame() {
        setGameState("WAITING");
        setWaitingCountdown(null);
        processQueue();
        setPlayers((prev) => prev.map((p) => ({ ...p, isEliminated: false, score: 0, turnCount: 0, sessionKills: 0 })));
        setUsedWords(new Set()); setCurrentWord(""); setTargetRhyme(""); setGlobalTimer(null);
        setRoundStarterId(null); lastSuccessfulPlayerIdRef.current = null; setTimer(turnDuration);
        bombNextRef.current = false; setIsReversed(false); turnCountRef.current = 0; addLog("System", t("log_reset"));
    }

    function togglePause() {
        if (gameState === "PLAYING") {
            setGameState("PAUSED");
            addLog("System", "Game Paused ⏸️");
            triggerTableEffect("warning");
            playSound("notification");
        } else if (gameState === "PAUSED") {
            setGameState("PLAYING");
            addLog("System", "Game Resumed ▶️");
            triggerTableEffect("success");
            playSound("start");
        }
    }

    function handleOpenPointGuide() {
        if (gameState === "PLAYING") {
            setGameState("PAUSED");
            addLog("System", "Game Paused ⏸️ (Melihat Panduan)");
            triggerTableEffect("warning");
            playSound("notification");
        }
        setShowPointGuide(true);
    }

    function handleClosePointGuide() {
        setShowPointGuide(false);
        if (gameState === "PAUSED") {
            setGameState("PLAYING");
            addLog("System", "Game Resumed ▶️");
            triggerTableEffect("success");
            playSound("start");
        }
    }

    function clearLobby() {
        setGameState("WAITING"); setPlayers([]); playersRef.current = []; setUsedWords(new Set());
        setPlayerQueue([]); playerQueueRef.current = [];
        usedWordsRef.current = new Set(); setCurrentWord(""); setTargetRhyme(""); setGlobalTimer(null);
        setRoundStarterId(null); lastSuccessfulPlayerIdRef.current = null; setTimer(turnDuration);
        setTurnCount(0); turnCountRef.current = 0; setActiveChallenge(null); setChallengeQueue([]); quitHistoryRef.current = {};
        bombNextRef.current = false; setIsReversed(false); addLog("System", t("log_lobby_cleared")); playSound("eliminate");
        setWaitingCountdown(null);
    }


    useEffect(() => {
        if (gameState === "WAITING" && players.length >= maxPlayers) {
            addLog("System", t("log_lobby_full")); startGame();
        }
    }, [players, gameState, maxPlayers]);

    function cycleGameMode() {
        if (gameState === "PLAYING") { resetGame(); addLog("System", "Game Reset due to Mode Change"); }
        const modes = [
            "LAST_LETTER", "WRAP_AROUND", "STEP_UP",
            "RHYME", "MIRROR", "PHRASE_CHAIN", "DYNAMIC", "SECOND_LETTER",
            "SYLLABLE", "LONGER_WORD", "CITIES", "FILL_BLANK"
        ];
        setGameMode(modes[(modes.indexOf(gameMode) + 1) % modes.length]);
    }

    const cyclePointMode = () => {
        const modes = ["OFF", "LENGTH", "SCRABBLE", "VOWELS"];
        setPointMode(modes[(modes.indexOf(pointMode) + 1) % modes.length]);
    };

    useEffect(() => {
        if (gameMode === "CITIES") {
            if (dictionaryCache.current.CITIES) {
                setDictionary(dictionaryCache.current.CITIES.dict); setCityMetadata(dictionaryCache.current.CITIES.meta);
                setDictLoadedInfo(dictionaryCache.current.CITIES.info); addLog("System", "Loaded Cities (Cached)");
            } else {
                loadCitiesData(FALLBACK_CITIES);
            }
        } else {
            toggleLanguage(true);
        }
    }, [gameMode]);

    function toggleLanguage(forceReload = false) {
        let targetLang = language;
        if (!forceReload) {
            targetLang = language === "EN" ? "ID" : language === "ID" ? "MIX" : "EN";
            setLanguage(targetLang);
        }

        if (targetLang === "ID") {
            if (!forceReload) addLog("System", "Switching to Indonesian...");

            Promise.all([
                fetch("/kamus.json").then((res) => res.ok ? res.json() : {}).catch(() => ({})),
                fetch("/kamus_tambahan.txt").then((res) => res.ok ? res.text() : "").catch(() => "")
            ]).then(([jsonData, txtData]) => {
                const dictSet = new Set(); const sMap = {}; const phraseSet = new Set(FALLBACK_PHRASES_ID);

                if (Object.keys(jsonData).length > 0) {
                    Object.keys(jsonData).forEach((k) => {
                        if (k.includes(" ")) phraseSet.add(k.toLowerCase());
                        else {
                            const clean = normalizeWord(k);
                            if (clean) {
                                dictSet.add(clean);
                                let defText = null;
                                if (jsonData[k].submakna) {
                                    let sm = jsonData[k].submakna;
                                    if (Array.isArray(sm)) sm = sm[0];
                                    if (typeof sm === 'string' && sm.trim().length > 0) defText = sm.replace(/^[0-9]+\.?\s*/, '').trim();
                                }
                                if (jsonData[k].nama || defText) {
                                    sMap[clean] = { nama: jsonData[k].nama?.toLowerCase(), def: defText };
                                }
                            }
                        }
                    });
                }

                if (txtData) {
                    const lines = txtData.split(/\r?\n/);
                    lines.forEach((line) => {
                        if (line.includes(" ")) phraseSet.add(line.trim().toLowerCase());
                        else { const clean = normalizeWord(line); if (clean) dictSet.add(clean); }
                    });
                }

                if (dictSet.size === 0) throw new Error("Empty Dictionary");

                setDictionary(dictSet); setSyllableMap(sMap); phraseDictionary.current = phraseSet; setDictLoadedInfo(`Kamus.json+TXT (${dictSet.size})`);
                dictionaryCache.current.ID = { dict: dictSet, syl: sMap, phrases: phraseSet, info: `Kamus.json+TXT (${dictSet.size})` };
            }).catch(() => {
                const words = Object.keys(FALLBACK_DICTIONARY_ID_DATA); const pSet = new Set(FALLBACK_PHRASES_ID);
                setDictionary(new Set(words)); setSyllableMap(FALLBACK_DICTIONARY_ID_DATA); phraseDictionary.current = pSet;
                setDictLoadedInfo("Default (ID)"); dictionaryCache.current.ID = { dict: new Set(words), syl: FALLBACK_DICTIONARY_ID_DATA, phrases: pSet, info: "Default (ID)" };
            });
        } else if (targetLang === "MIX") {
            if (!forceReload) addLog("System", "Switching to Mix Bahasa...");
            const loadMix = async () => {
                let rawEn = FALLBACK_DICTIONARY_EN; let rawId = new Set(Object.keys(FALLBACK_DICTIONARY_ID_DATA));
                let pSet = new Set([...FALLBACK_PHRASES_EN, ...FALLBACK_PHRASES_ID]);
                let mixSMap = {};
                try { const resEn = await fetch("/dictionary.json"); if (resEn.ok) rawEn = new Set((Array.isArray(await resEn.clone().json()) ? await resEn.json() : Object.keys(await resEn.json())).map(normalizeWord).filter(w => w.length > 0)); } catch (e) { }
                try {
                    const resId = await fetch("/kamus.json");
                    if (resId.ok) {
                        const idData = await resId.json();
                        Object.keys(idData).forEach(k => {
                            const clean = normalizeWord(k);
                            if (clean) {
                                rawId.add(clean);
                                let defText = null;
                                if (idData[k].submakna) {
                                    let sm = idData[k].submakna;
                                    if (Array.isArray(sm)) sm = sm[0];
                                    if (typeof sm === 'string') defText = sm.replace(/^[0-9]+\.?\s*/, '').trim();
                                }
                                if (idData[k].nama || defText) mixSMap[clean] = { nama: idData[k].nama?.toLowerCase(), def: defText };
                            }
                        });
                    }
                } catch (e) { }
                try {
                    const resTxt = await fetch("/kamus_tambahan.txt");
                    if (resTxt.ok) {
                        const txtData = await resTxt.text();
                        const lines = txtData.split(/\r?\n/);
                        lines.forEach((line) => {
                            if (line.includes(" ")) pSet.add(line.trim().toLowerCase());
                            else { const clean = normalizeWord(line); if (clean) rawId.add(clean); }
                        });
                    }
                } catch (e) { }

                const mixDict = new Set([...rawEn, ...rawId]);
                setDictionary(mixDict); setSyllableMap(mixSMap); phraseDictionary.current = pSet; setDictLoadedInfo(`Mix (${mixDict.size})`);
                dictionaryCache.current.MIX = { dict: mixDict, syl: mixSMap, phrases: pSet, info: `Mix (${mixDict.size})` };
            };
            loadMix();
        } else {
            if (!forceReload) addLog("System", "Switching to English...");
            fetch("/dictionary.json").then((res) => res.json()).then((data) => {
                let rawWords = Array.isArray(data) ? data : Object.keys(data); let phraseSet = new Set(FALLBACK_PHRASES_EN);
                const cleanedWords = rawWords.filter((w) => { if (w.includes(" ")) { phraseSet.add(w.toLowerCase()); return false; } return true; }).map(normalizeWord).filter(w => w.length > 0);
                const newDict = new Set(cleanedWords);
                setDictionary(newDict); setSyllableMap({}); phraseDictionary.current = phraseSet; setDictLoadedInfo(`Dictionary.json (${cleanedWords.length})`);
                dictionaryCache.current.EN = { dict: newDict, syl: {}, phrases: phraseSet, info: `Dictionary.json (${cleanedWords.length})` };
            }).catch(() => {
                setDictionary(FALLBACK_DICTIONARY_EN); setSyllableMap({}); phraseDictionary.current = new Set(FALLBACK_PHRASES_EN);
                setDictLoadedInfo("Default (EN)"); dictionaryCache.current.EN = { dict: FALLBACK_DICTIONARY_EN, syl: {}, phrases: new Set(FALLBACK_PHRASES_EN), info: "Default (EN)" };
            });
        }

        if (!forceReload) {
            setGameState("WAITING"); setPlayers((prev) => prev.map((p) => ({ ...p, isEliminated: false, score: 0, turnCount: 0, sessionKills: 0 })));
            setUsedWords(new Set()); setCurrentWord(""); setTargetRhyme(""); setGlobalTimer(null);
            setRoundStarterId(null); lastSuccessfulPlayerIdRef.current = null; setTurnCount(0);
            setActiveChallenge(null); setChallengeQueue([]); setTimer(turnDuration); addLog("System", "Language changed! Lobby kept.");
        }
    }

    function getModeLabel() {
        const ovStr = overlapMode === "RANDOM" ? "RND" : overlapMode === "SEQUENTIAL" ? "SEQ" : overlapLength;
        const labels = {
            LAST_LETTER: `LAST LETTER (${ovStr})`, WRAP_AROUND: `WRAP AROUND (${ovStr})`,
            SECOND_LETTER: "2ND LETTER", RHYME: "RHYME RUSH", MIRROR: `MIRROR (${ovStr})`,
            STEP_UP: `STEP UP (${ovStr})`,
            SYLLABLE: "SYLLABLE", LONGER_WORD: `LONGER (${ovStr})`,
            CITIES: `CITIES (${ovStr})`, DYNAMIC: `DYNAMIC (${ovStr})`, PHRASE_CHAIN: "PHRASE",
            FILL_BLANK: "LENGKAPI"
        };
        return labels[gameMode] || `LAST LETTER (${ovStr})`;
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (containerRef.current) containerRef.current.requestFullscreen().catch(() => { });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            setIsFullscreen(false);
        }
    }

    const handleChatEvent = (data) => {
        const { uniqueId, nickname, comment, profilePictureUrl } = data;
        const lowerComment = (comment || "").trim().toLowerCase();

        // 1. Cek command dasar SEBELUM memproses regex atau state (Fast path)
        if (lowerComment === "!join" || lowerComment === "join") return joinGame(uniqueId, nickname, profilePictureUrl);
        if (lowerComment === "!unjoin" || lowerComment === "unjoin") return unjoinGame(uniqueId, nickname);
        if (["!surrender", "!surrend", "surrend", "surrender", "ff", "menyerah", "!ff"].includes(lowerComment)) {
            const p = playersRef.current.find(p => p.uniqueId === uniqueId);
            if (p && !p.isEliminated) handleSurrender(p);
            return;
        }

        const isScrambleActive = !!scrambleWordRef.current && !scrambleWinnerRef.current;
        const currentPlayer = playersRef.current[turnIndexRef.current];
        const isCurrentPlayerTurn = gameStateRef.current === "PLAYING" && currentPlayer?.uniqueId === uniqueId && !currentPlayer.isEliminated;

        // 2. Optimization: Jika tidak ada scramble, dan bukan giliran orang ini, drop pesan chat!
        if (!isScrambleActive && !isCurrentPlayerTurn) {
            return;
        }

        // 3. Hanya gunakan regex setelah yakin chat perlu diproses
        const cleanWordCheck = normalizeWord(lowerComment);

        if (isScrambleActive && cleanWordCheck === scrambleWordRef.current.toLowerCase()) {
            setScrambledDisplay(scrambleWordRef.current);
            setScrambleWinner({ nickname, profilePictureUrl: profilePictureUrl || getAvatarUrl(uniqueId) });
            playSound("notification");
            triggerTableEffect("info");
            addLog("MiniGame", `🎉 ${nickname} menebak anagram: ${scrambleWordRef.current}!`);
            setTimeout(() => {
                startNewScramble();
            }, 5000);
            return;
        }

        if (isCurrentPlayerTurn) {
            let cleanWord = cleanWordCheck;
            if (gameModeRef.current !== "PHRASE_CHAIN" && gameModeRef.current !== "CITIES") {
                cleanWord = cleanWord.split(" ")[0];
            }
            if (cleanWord.length > 0) submitAnswer(cleanWord);
        }
    };

    const handleManualSubmit = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!manualInput.trim()) return;

        const lower = manualInput.trim().toLowerCase();
        const cleanWordCheck = normalizeWord(lower);

        if (scrambleWordRef.current && cleanWordCheck === scrambleWordRef.current.toLowerCase() && !scrambleWinnerRef.current) {
            setScrambledDisplay(scrambleWordRef.current);
            setScrambleWinner({ nickname: "HOST (You)", profilePictureUrl: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=HOST` });
            playSound("notification");
            triggerTableEffect("info");
            addLog("MiniGame", `🎉 HOST menebak anagram: ${scrambleWordRef.current}!`);
            setTimeout(() => {
                startNewScramble();
            }, 5000);
            setManualInput("");
            return;
        }

        const currentPlayer = playersRef.current[turnIndexRef.current];
        const isHostTurn = currentPlayer?.uniqueId === "host_player";

        if (gameStateRef.current === "PLAYING") {
            if (!isHostTurn) {
                showFeedback("Bukan Giliran Host!", "warning");
                setManualInput("");
                return;
            }

            if (["!surrender", "!surrend", "surrend", "surrender", "ff", "menyerah", "!ff"].includes(lower)) {
                handleSurrender(currentPlayer);
            } else {
                let cleanWord = normalizeWord(manualInput);
                if (gameModeRef.current !== "PHRASE_CHAIN" && gameModeRef.current !== "CITIES") {
                    cleanWord = cleanWord.split(" ")[0];
                }
                if (cleanWord.length > 0) submitAnswer(cleanWord);
            }
        }
        setManualInput("");
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (file.name.endsWith('.txt')) {
                const lines = e.target.result.split(/\r?\n/);
                let dictSet = new Set(); let phraseSet = new Set();
                lines.forEach(line => {
                    if (line.includes(" ")) phraseSet.add(line.trim().toLowerCase());
                    else { const clean = normalizeWord(line); if (clean) dictSet.add(clean); }
                });
                setDictionary(dictSet); setSyllableMap({}); phraseDictionary.current = phraseSet; setDictLoadedInfo(`Custom TXT (${dictSet.size})`);
                addLog("System", `Loaded TXT Dictionary (${dictSet.size} words)`);
                if (phraseSet.size > 0) addLog("System", `Detected ${phraseSet.size} phrases.`);
                return;
            }
            try {
                const json = JSON.parse(e.target.result);
                let dictSet = new Set(); let sMap = {}; let meta = {}; let phraseSet = new Set();
                if (Array.isArray(json)) {
                    if (json.length > 0 && typeof json[0] === "object" && json[0].name) {
                        json.forEach((item) => {
                            const clean = normalizeWord(item.name);
                            if (clean) { dictSet.add(clean); if (item.region) meta[clean] = item.region; }
                        });
                        setCityMetadata(meta); setGameMode("CITIES"); addLog("System", `Loaded Cities JSON (${dictSet.size})`);
                    } else {
                        const cleanedWords = json.filter((w) => { if (typeof w === "string" && w.includes(" ")) { phraseSet.add(w.toLowerCase()); return false; } return typeof w === "string"; }).map(normalizeWord).filter(w => w.length > 0);
                        dictSet = new Set(cleanedWords); addLog("System", `Loaded Simple Array (${dictSet.size} words)`);
                    }
                } else {
                    Object.keys(json).forEach((k) => {
                        if (k.includes(" ")) phraseSet.add(k.toLowerCase());
                        else { const cleanKey = normalizeWord(k); if (cleanKey) { dictSet.add(cleanKey); if (json[k].nama) sMap[cleanKey] = { nama: json[k].nama.toLowerCase() }; } }
                    });
                    addLog("System", `Loaded Rich Dictionary (${dictSet.size} words)`);
                }
                setDictionary(dictSet); setSyllableMap(sMap); phraseDictionary.current = phraseSet; setDictLoadedInfo(`Custom (${dictSet.size})`);
                if (phraseSet.size > 0) addLog("System", `Detected ${phraseSet.size} phrases for Phrase Chain mode.`);
            } catch (err) { addLog("System", "Error parsing JSON"); console.error(err); }
        };
        reader.readAsText(file);
    };

    const simulateJoin = () => {
        const names = ["Andi", "Budi", "Citra", "Dewi", "Eko", "Fajar"];
        handleChatEvent({ uniqueId: `user_${Math.floor(Math.random() * 1000)}`, nickname: names[Math.floor(Math.random() * names.length)], comment: "!join" });
    };

    const simulateCorrectAnswer = () => {
        const validWord = Array.from(dictionary).find((w) => validateConnection(currentWord, w, getLogicOptions()) && !usedWords.has(w));
        if (validWord && players[currentTurnIndex] && !players[currentTurnIndex].isEliminated) {
            handleChatEvent({ uniqueId: players[currentTurnIndex].uniqueId, nickname: players[currentTurnIndex].nickname, comment: validWord });
        } else addLog("Debug", "No valid word found.");
    };

    const simulateEffect = (type) => {
        const isPlayer = players.length > 0 && Math.random() > 0.3;
        const targetUniqueId = isPlayer
            ? players[Math.floor(Math.random() * players.length)].uniqueId
            : `viewer_${Math.floor(Math.random() * 1000)}`;

        const targetNickname = isPlayer ? "" : "Penonton Setia";
        const targetAvatar = isPlayer ? "" : getAvatarUrl(targetUniqueId);

        if (type === 'like') {
            triggerVisualEffect("like", targetUniqueId, { count: 5, nickname: targetNickname, profilePictureUrl: targetAvatar });
        } else {
            const gifts = [
                { name: "Mawar", pictureUrl: "https://cdn-icons-png.flaticon.com/512/126/126079.png" },
                { name: "Kopi", pictureUrl: "https://cdn-icons-png.flaticon.com/512/3502/3502601.png" },
                { name: "TikTok Universe", pictureUrl: "https://cdn-icons-png.flaticon.com/512/3176/3176335.png" }
            ];
            const g = gifts[Math.floor(Math.random() * gifts.length)];
            triggerVisualEffect("gift", targetUniqueId, { giftName: g.name, giftPictureUrl: g.pictureUrl, nickname: targetNickname, profilePictureUrl: targetAvatar });
        }
    };

    const getWinners = () => {
        if (gameState !== "ENDED") return [];
        const activePlayers = players.filter((p) => !p.isEliminated);
        if (activePlayers.length === 0) return [];
        if (isScoreMode()) {
            const sorted = [...activePlayers].sort((a, b) => (b.score || 0) - (a.score || 0));
            return sorted.filter(p => (p.score || 0) === (sorted[0].score || 0));
        }
        return [activePlayers[0]];
    };

    const cycleWinCondition = () => {
        setWinCondition(winCondition === "TIME" ? "SCORE" : winCondition === "SCORE" ? "ROUNDS" : "TIME");
    };

    const getTableStatusClass = () => {
        switch (tableStatus) {
            case "error": return "border-red-500/30 bg-red-950/50 animate-shake";
            case "warning": return "border-amber-500/30 bg-amber-950/50";
            case "success": return "border-emerald-500/30 bg-emerald-950/50";
            case "info": return "border-sky-500/30 bg-sky-950/50 animate-pulse";
            default: return "border-slate-800 bg-slate-900 shadow-2xl shadow-black/20";
        }
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    // --- LOGIKA DINAMIS RADIUS & SKALA AVATAR ---
    const baseRadius = (gameState === "WAITING" && waitingCountdown === null) ? (isMobile ? 135 : 170) : (isMobile ? 185 : 260);
    // 1. Tambahkan jarak radius secara bertahap jika pemain banyak, namun batasi agar tidak keluar layar monitor/HP
    const extraRadius = Math.max(0, players.length - 8) * (isMobile ? 4 : 8);
    const dynamicRadius = baseRadius + Math.min(extraRadius, isMobile ? 35 : 60);

    // 2. Perkecil ukuran profil (scale down) secara otomatis jika pemain lebih dari 6
    const dynamicScale = players.length > 6 ? Math.max(0.45, 1 - (players.length - 6) * 0.045) : 1;


    // ==========================================
    // 4. RENDER UI
    // ==========================================
    return (
        <div ref={containerRef} className="min-h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4 relative">
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 pointer-events-none">
                <h1 className="text-xl sm:text-3xl font-black text-sky-400 drop-shadow-sm">SAMBUNG KATA</h1>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 mt-1">
                    <span
                        className={`w-2.5 h-2.5 rounded-full ${connectionStatus === "tiktok_ready" ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : connectionStatus === "ws_only" ? "bg-amber-400 animate-pulse" : "bg-red-500"}`}
                        title={connectionStatus === "tiktok_ready" ? "Terhubung ke TikTok" : connectionStatus === "ws_only" ? "Backend OK, TikTok Belum Connect" : "Backend Offline"}
                    ></span>
                    <div className="flex gap-2">
                        <span className="text-sky-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shadow-sm">{language}</span>
                        <span className="text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shadow-sm">{getModeLabel()}</span>
                    </div>
                </div>
                {playerQueue.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 shadow-sm animate-in fade-in max-w-fit">
                        <Users className="w-4 h-4 text-sky-400" />
                        <span className="text-xs font-bold text-slate-400">Antrean: <span className="text-sky-400">{playerQueue.length}</span></span>
                    </div>
                )}
            </div>


            {/* --- MENU SETTINGS & CONTROLS --- */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[300] flex flex-col items-end">
                <div className="flex gap-2">
                    {(gameState === "PLAYING" || gameState === "PAUSED") && (
                        <button onClick={togglePause} className={`w-10 h-10 flex items-center justify-center rounded-full shadow-md transition-all duration-300 border ${gameState === "PAUSED" ? "bg-amber-900/50 border-amber-700/50 animate-pulse" : "bg-slate-900 border-slate-800 hover:bg-slate-800 hover:scale-105"}`} title={gameState === "PAUSED" ? "Resume Game" : "Pause Game"}>
                            {gameState === "PAUSED" ? <Play className="w-5 h-5 text-amber-400" /> : <Pause className="w-5 h-5 text-slate-300" />}
                        </button>
                    )}
                    <button onClick={() => setShowStats(true)} className="w-10 h-10 flex items-center justify-center rounded-full shadow-md transition-all duration-300 border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:scale-105" title="Hall of Fame">
                        <BarChart2 className="w-5 h-5 text-sky-400" />
                    </button>
                    <button onClick={toggleFullscreen} className="w-10 h-10 flex items-center justify-center rounded-full shadow-md transition-all duration-300 border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:scale-105" title="Toggle Fullscreen">
                        {isFullscreen ? <Minimize className="w-5 h-5 text-slate-300" /> : <Maximize className="w-5 h-5 text-slate-300" />}
                    </button>
                    <button onClick={() => setShowSettings(!showSettings)} className={`w-10 h-10 flex items-center justify-center rounded-full shadow-md transition-all duration-300 border ${showSettings ? "bg-sky-900/50 border-sky-800 rotate-90" : "border-slate-800 bg-slate-900 hover:bg-slate-800 hover:scale-105"}`}>
                        {showSettings ? <X className="w-5 h-5 text-sky-400" /> : <Settings className="w-5 h-5 text-slate-300" />}
                    </button>
                </div>

                <div className={`mt-3 flex flex-col gap-2 transition-all duration-300 origin-top-right ${showSettings ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-4 pointer-events-none absolute top-10 right-0 w-0 h-0 overflow-hidden"}`}>
                    <div className="bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-700 shadow-2xl shadow-black/50 flex flex-col gap-2 w-64">
                        <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                            <button onClick={() => setSettingsTab('rules')} title="Aturan Game" className={`flex-1 flex justify-center py-1.5 rounded-md transition-all duration-200 ${settingsTab === 'rules' ? 'bg-sky-600 text-white shadow-sm scale-95' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><Gamepad2 className="w-4 h-4" /></button>
                            <button onClick={() => setSettingsTab('lobby')} title="Lobi & Pemain" className={`flex-1 flex justify-center py-1.5 rounded-md transition-all duration-200 ${settingsTab === 'lobby' ? 'bg-emerald-600 text-white shadow-sm scale-95' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><Users className="w-4 h-4" /></button>
                            <button onClick={() => setSettingsTab('general')} title="Sistem & Kamus" className={`flex-1 flex justify-center py-1.5 rounded-md transition-all duration-200 ${settingsTab === 'general' ? 'bg-indigo-600 text-white shadow-sm scale-95' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><Settings className="w-4 h-4" /></button>
                            <button onClick={() => setSettingsTab('dev')} title="Simulasi/Dev" className={`flex-1 flex justify-center py-1.5 rounded-md transition-all duration-200 ${settingsTab === 'dev' ? 'bg-amber-600 text-white shadow-sm scale-95' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><Bot className="w-4 h-4" /></button>
                        </div>

                        <div className="flex flex-col gap-2 min-h-[190px]">
                            {settingsTab === 'rules' && (
                                <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-2">
                                    <button onClick={cycleGameMode} className="w-full bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded text-xs font-bold border border-slate-700 transition-colors flex items-center justify-between group">
                                        <span className="text-slate-300">{t("mode")}:</span><span className="text-sky-400 group-hover:text-sky-300">{getModeLabel()}</span>
                                    </button>
                                    <div className="flex flex-col gap-1.5">
                                        <button onClick={() => setActionCardsEnabled(!actionCardsEnabled)} className={`w-full ${actionCardsEnabled ? 'bg-amber-900/30 hover:bg-amber-900/50 border-amber-700/50' : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700'} px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-between group`}>
                                            <div className="flex items-center gap-2"><Sparkles className={`w-3 h-3 ${actionCardsEnabled ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} /><span className={actionCardsEnabled ? "text-amber-300" : "text-slate-400"}>Kartu Aksi</span></div>
                                            <span className={actionCardsEnabled ? "text-amber-400" : "text-slate-500"}>{actionCardsEnabled ? "ON" : "OFF"}</span>
                                        </button>
                                        {/* BUTTON POINT MODE */}
                                        <button onClick={cyclePointMode} className={`w-full ${pointMode !== 'OFF' ? 'bg-emerald-900/30 hover:bg-emerald-900/50 border-emerald-700/50' : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700'} px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-between group`}>
                                            <div className="flex items-center gap-2"><Target className={`w-3 h-3 ${pointMode !== 'OFF' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} /><span className={pointMode !== 'OFF' ? "text-emerald-300" : "text-slate-400"}>Point Mode</span></div>
                                            <span className={pointMode !== 'OFF' ? "text-emerald-400" : "text-slate-500"}>
                                                {pointMode === 'OFF' ? 'OFF' : pointMode === 'LENGTH' ? 'LEN (1pt)' : pointMode === 'SCRABBLE' ? 'SCRABBLE' : 'VOWELS (+3)'}
                                            </span>
                                        </button>
                                        <button onClick={() => setAutoRestartEnabled(!autoRestartEnabled)} className={`w-full ${autoRestartEnabled ? 'bg-indigo-900/30 hover:bg-indigo-900/50 border-indigo-700/50' : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700'} px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-between group`}>
                                            <div className="flex items-center gap-2"><FastForward className={`w-3 h-3 ${autoRestartEnabled ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} /><span className={autoRestartEnabled ? "text-indigo-300" : "text-slate-400"}>{t("auto_restart")}</span></div>
                                            <span className={autoRestartEnabled ? "text-indigo-400" : "text-slate-500"}>{autoRestartEnabled ? "ON" : "OFF"}</span>
                                        </button>
                                    </div>
                                    <div className="w-full bg-slate-800/50 p-2 rounded border border-slate-700 flex flex-col gap-1.5 mt-0.5">
                                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mb-0.5">
                                            <span>{t("end_condition")}:</span>
                                            <button onClick={cycleWinCondition} className="text-sky-400 hover:text-sky-300 transition-colors uppercase">{winCondition}</button>
                                        </div>
                                        {winCondition === "TIME" ? (
                                            <div className="flex items-center gap-1 bg-slate-900 rounded p-1 border border-slate-800">
                                                <Clock className="w-3 h-3 text-sky-400" />
                                                <input type="range" min="30" max="300" step="10" value={gameDuration} onChange={(e) => setGameDuration(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                                                <span className="text-[10px] font-mono w-8 text-right text-slate-300">{gameDuration}s</span>
                                            </div>
                                        ) : winCondition === "SCORE" ? (
                                            <div className="flex items-center gap-1 bg-slate-900 rounded p-1 border border-slate-800">
                                                <Target className="w-3 h-3 text-emerald-400" />
                                                <input type="range" min="20" max="200" step="10" value={targetScore} onChange={(e) => setTargetScore(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                                <span className="text-[10px] font-mono w-8 text-right text-slate-300">{targetScore}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 bg-slate-900 rounded p-1 border border-slate-800">
                                                <RefreshCw className="w-3 h-3 text-indigo-400" />
                                                <input type="range" min="1" max="10" step="1" value={targetRounds} onChange={(e) => setTargetRounds(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                                <span className="text-[10px] font-mono w-8 text-right text-slate-300">{targetRounds}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-1.5 text-slate-300"><Clock className="w-3 h-3 text-emerald-400" /><span className="font-bold">{t("turn_time")}</span></div>
                                        <div className="flex items-center gap-1 bg-slate-800/50 rounded p-0.5 border border-slate-700">
                                            <button onClick={() => setTurnDuration((d) => Math.max(5, d - 5))} className="w-5 h-5 flex items-center justify-center hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"><Minus className="w-3 h-3" /></button>
                                            <span className="w-7 text-center font-mono font-bold text-slate-200 text-xs">{turnDuration}s</span>
                                            <button onClick={() => setTurnDuration((d) => Math.min(60, d + 5))} className="w-5 h-5 flex items-center justify-center hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"><Plus className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-1.5 text-slate-300"><Link className="w-3 h-3 text-indigo-400" /><span className="font-bold">Overlap Mode</span></div>
                                        <div className="flex items-center gap-1 bg-slate-800/50 rounded p-0.5 border border-slate-700">
                                            <button onClick={() => {
                                                const opts = [1, 2, 3, 4, "RANDOM", "SEQUENTIAL"];
                                                const cIdx = overlapMode === "FIXED" ? overlapLength - 1 : (overlapMode === "RANDOM" ? 4 : 5);
                                                const pIdx = (cIdx - 1 + opts.length) % opts.length;
                                                const val = opts[pIdx];
                                                if (typeof val === "number") { setOverlapMode("FIXED"); setOverlapLength(val); }
                                                else { setOverlapMode(val); }
                                            }} className="w-5 h-5 flex items-center justify-center hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"><Minus className="w-3 h-3" /></button>

                                            <span className="w-7 text-center font-mono font-bold text-slate-200 text-xs">
                                                {overlapMode === "RANDOM" ? "RND" : overlapMode === "SEQUENTIAL" ? "SEQ" : overlapLength}
                                            </span>

                                            <button onClick={() => {
                                                const opts = [1, 2, 3, 4, "RANDOM", "SEQUENTIAL"];
                                                const cIdx = overlapMode === "FIXED" ? overlapLength - 1 : (overlapMode === "RANDOM" ? 4 : 5);
                                                const nIdx = (cIdx + 1) % opts.length;
                                                const val = opts[nIdx];
                                                if (typeof val === "number") { setOverlapMode("FIXED"); setOverlapLength(val); }
                                                else { setOverlapMode(val); }
                                            }} className="w-5 h-5 flex items-center justify-center hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"><Plus className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-1.5 text-slate-300"><Hash className="w-3 h-3 text-rose-400" /><span className="font-bold">Max Huruf</span></div>
                                        <div className="flex items-center gap-1 bg-slate-800/50 rounded p-0.5 border border-slate-700">
                                            <button onClick={() => setMaxWordLength((d) => Math.max(0, d - 1))} className="w-5 h-5 flex items-center justify-center hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"><Minus className="w-3 h-3" /></button>
                                            <span className="w-7 text-center font-mono font-bold text-slate-200 text-xs">{maxWordLength === 0 ? "OFF" : maxWordLength}</span>
                                            <button onClick={() => setMaxWordLength((d) => Math.min(30, d + 1))} className="w-5 h-5 flex items-center justify-center hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"><Plus className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {settingsTab === 'lobby' && (
                                <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-3 text-xs bg-slate-800/50 p-2 rounded border border-slate-700">
                                        <div className="flex items-center gap-1.5 text-slate-300"><Users className="w-3.5 h-3.5 text-emerald-400" /><span className="font-bold">{t("players")} Max</span></div>
                                        <div className="flex items-center gap-1 bg-slate-900 rounded p-0.5 border border-slate-800">
                                            <button onClick={() => setMaxPlayers((n) => Math.max(2, n - 1))} className="w-6 h-6 flex items-center justify-center hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"><Minus className="w-3 h-3" /></button>
                                            <span className="w-8 text-center font-mono font-bold text-slate-200 text-sm">{maxPlayers}</span>
                                            <button onClick={() => setMaxPlayers((n) => Math.min(100, n + 1))} className="w-6 h-6 flex items-center justify-center hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"><Plus className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={addHost} className="flex-1 bg-slate-800/50 hover:bg-slate-800 py-2 rounded text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 group">
                                            <User className="w-3.5 h-3.5 text-sky-400" /><span className="text-slate-300 group-hover:text-white">{t("add_host")}</span>
                                        </button>
                                        <button onClick={addBot} className="flex-1 bg-slate-800/50 hover:bg-slate-800 py-2 rounded text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 group">
                                            <Bot className="w-3.5 h-3.5 text-indigo-400" /><span className="text-slate-300 group-hover:text-white">{t("add_bot")}</span>
                                        </button>
                                    </div>
                                    <div className="h-px bg-slate-800 my-1"></div>
                                    <button onClick={clearLobby} className="w-full bg-red-950/30 hover:bg-red-900/50 px-3 py-2 rounded text-xs font-bold border border-red-900/50 text-red-400 transition-colors flex items-center justify-center gap-2 group">
                                        <Delete className="w-3.5 h-3.5" /> {t("clear_lobby")}
                                    </button>
                                </div>
                            )}
                            {settingsTab === 'general' && (
                                <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-2">
                                    <button onClick={() => setIsMuted(!isMuted)} className="w-full bg-slate-800/50 hover:bg-slate-800 px-3 py-2 rounded text-xs font-bold border border-slate-700 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-2">{isMuted ? <VolumeX className="w-3 h-3 text-red-500" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}<span className="text-slate-300">{t("sound")}</span></div>
                                        <span className="text-slate-100">{isMuted ? "Off" : "On"}</span>
                                    </button>
                                    <button onClick={() => toggleLanguage()} className="w-full bg-slate-800/50 hover:bg-slate-800 px-3 py-2 rounded text-xs font-bold border border-slate-700 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-2"><Globe className="w-3 h-3 text-sky-400" /><span className="text-slate-300">{t("language")}</span></div>
                                        <span className="text-slate-100 group-hover:text-sky-300">{language === "EN" ? "English" : language === "ID" ? "Indonesia" : "Mix"}</span>
                                    </button>
                                    <div className="w-full bg-slate-800/50 p-2.5 rounded border border-slate-700 flex flex-col gap-2 mt-2">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">WebSocket Server</div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={wsHost}
                                                onChange={handleWsHostChange}
                                                placeholder={window.location.hostname || "localhost"}
                                                className="flex-1 bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                                            />
                                            <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">:62024</span>
                                            <button
                                                onClick={handleReconnectWebSocket}
                                                className="bg-sky-900/50 hover:bg-sky-800/50 p-1.5 rounded border border-sky-800 text-sky-400 transition-colors"
                                                title="Reconnect WebSocket"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="text-[9px] text-slate-500">Kosongkan untuk pakai hostname saat ini</div>
                                    </div>
                                    
                                    <div className="w-full bg-slate-800/50 p-2.5 rounded border border-slate-700 flex flex-col gap-2 mt-2">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            TikTok Live Connection
                                            {connectionStatus === "tiktok_ready" && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400 font-mono text-sm">@</span>
                                            <input
                                                type="text"
                                                value={tiktokUsername}
                                                onChange={(e) => setTiktokUsername(e.target.value)}
                                                placeholder="username"
                                                className="flex-1 bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                                            />
                                            <button
                                                onClick={() => {
                                                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && tiktokUsername.trim()) {
                                                        wsRef.current.send(JSON.stringify({ event: 'connect_tiktok', data: { uniqueId: tiktokUsername.trim() } }));
                                                        addLog("System", `Menyambungkan ke @${tiktokUsername.trim()}...`);
                                                    }
                                                }}
                                                className="bg-emerald-900/50 hover:bg-emerald-800/50 px-3 py-1.5 rounded border border-emerald-800 text-emerald-400 transition-colors text-xs font-bold"
                                            >
                                                Connect
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full bg-slate-800/50 p-2.5 rounded border border-slate-700 flex flex-col gap-2 mt-2">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Kamus (Dictionary)</div>
                                        <div className="flex items-center justify-between gap-2 text-xs">
                                            <span className="truncate text-slate-300 font-mono" title={dictLoadedInfo}>{dictLoadedInfo}</span>
                                            <button onClick={() => fileInputRef.current?.click()} className="bg-slate-700 hover:bg-slate-600 px-2.5 py-1.5 rounded flex items-center gap-1.5 transition-colors text-slate-200 border border-slate-600">
                                                <FileJson className="w-3.5 h-3.5" /> {t("load_json")}
                                            </button>
                                            <input type="file" accept=".json,.txt" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {settingsTab === 'dev' && (
                                <div className="animate-in fade-in zoom-in-95 duration-200 bg-slate-800/50 p-2 rounded-lg border border-slate-700 flex flex-col justify-center h-full min-h-[190px]">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-wider mb-3">{t("simulation")} Tools</div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button onClick={simulateJoin} className="bg-sky-900/40 hover:bg-sky-800/50 py-2.5 rounded text-sky-300 border border-sky-800 flex flex-col items-center justify-center gap-1 transition-colors"><Users className="w-4 h-4" /> <span className="text-[9px] font-bold">Join</span></button>
                                        <button onClick={simulateCorrectAnswer} className="bg-emerald-900/40 hover:bg-emerald-800/50 py-2.5 rounded text-emerald-300 border border-emerald-800 flex flex-col items-center justify-center gap-1 transition-colors"><Gamepad2 className="w-4 h-4" /> <span className="text-[9px] font-bold">Ans</span></button>
                                        <button onClick={handleTimeout} className="bg-red-900/40 hover:bg-red-800/50 py-2.5 rounded text-red-300 border border-red-800 flex flex-col items-center justify-center gap-1 transition-colors"><Clock className="w-4 h-4" /> <span className="text-[9px] font-bold">T.O.</span></button>
                                        <button onClick={() => { setShowSettings(false); clearLobby(); pickShowcaseWords(); setWaitingCountdown(60); }} className="bg-indigo-900/40 hover:bg-indigo-800/50 py-2.5 rounded text-indigo-300 border border-indigo-800 flex flex-col items-center justify-center gap-1 transition-colors"><Info className="w-4 h-4" /> <span className="text-[9px] font-bold">Edu</span></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <button onClick={() => simulateEffect('like')} className="bg-pink-900/40 hover:bg-pink-800/50 py-2 rounded text-pink-300 border border-pink-800 flex items-center justify-center gap-1 transition-colors"><Heart className="w-3 h-3" /> <span className="text-[10px] font-bold">Spam Like</span></button>
                                        <button onClick={() => simulateEffect('gift')} className="bg-purple-900/40 hover:bg-purple-800/50 py-2 rounded text-purple-300 border border-purple-800 flex items-center justify-center gap-1 transition-colors"><Gift className="w-3 h-3" /> <span className="text-[10px] font-bold">Send Gift</span></button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="h-px bg-slate-800 my-1"></div>
                        <button onClick={gameState === "WAITING" ? startGame : resetGame} className={`w-full px-3 py-2.5 rounded-lg text-sm font-black tracking-widest uppercase shadow-sm transition-transform active:scale-95 border border-transparent ${gameState === "WAITING" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-red-600 hover:bg-red-500 text-white"}`}>
                            {gameState === "WAITING" ? t("start_game") : t("reset_game")}
                        </button>
                    </div>
                </div>
            </div>


            {/* --- STATS MODAL --- */}
            {showStats && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Trophy className="w-6 h-6 text-amber-400" />
                                <h2 className="text-xl font-bold text-slate-100 tracking-wider">{t("hall_of_fame")}</h2>
                            </div>
                            <button onClick={() => setShowStats(false)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors text-slate-400 hover:text-white border border-slate-700 shadow-sm"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="mb-6 bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2"><Info className="w-3 h-3" /> {t("tier_legend")}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {TIER_LEVELS.map(t => (
                                        <div key={t.level} className="flex justify-center items-center">
                                            <span className={`px-2 py-1 w-full text-center rounded border text-[10px] font-bold uppercase tracking-widest ${t.class}`}>{t.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                {allStats.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 italic">{t("no_data")}</div>
                                ) : (
                                    allStats.map((stat, index) => {
                                        const winRate = stat.games > 0 ? Math.round((stat.wins / stat.games) * 100) : 0;
                                        const tier = getPlayerTier(stat);
                                        let rankStyle = "border-slate-800 bg-slate-900/50";
                                        let rankIcon = <span className="font-mono font-bold text-slate-500">#{index + 1}</span>;
                                        if (index === 0) { rankStyle = "border-amber-500/50 bg-amber-900/20 shadow-sm"; rankIcon = <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />; }
                                        else if (index === 1) { rankStyle = "border-slate-500/50 bg-slate-800/50"; rankIcon = <Medal className="w-5 h-5 text-slate-300" />; }
                                        else if (index === 2) { rankStyle = "border-orange-500/50 bg-orange-900/20"; rankIcon = <Medal className="w-5 h-5 text-orange-400" />; }
                                        return (
                                            <div key={stat.id} className={`relative flex items-center p-3 rounded-xl border ${rankStyle} transition-all hover:bg-slate-800 group`}>
                                                <div className="flex items-center gap-4 min-w-[50px] sm:min-w-[150px]">
                                                    <div className="w-8 flex justify-center">{rankIcon}</div>
                                                    <div className="relative flex flex-col items-center">
                                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800"><img src={getAvatarUrl(stat.id)} alt="Avatar" className="w-full h-full object-cover" /></div>
                                                        {index === 0 && <div className="absolute -top-3 -right-2 text-lg"><Crown className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow-md" /></div>}
                                                    </div>
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 ml-2">
                                                    <div className="flex flex-col justify-center">
                                                        <span className="font-bold text-slate-100 text-lg truncate">{stat.nickname || "Unknown"}</span>
                                                        <div className="flex mt-1">
                                                            <span className={`px-2 py-0.5 rounded shadow-sm border text-[9px] font-bold uppercase tracking-wider ${tier.class}`}>
                                                                {tier.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col justify-center gap-1.5 text-xs">
                                                        <div className="flex justify-between text-slate-400 mb-1">
                                                            <span title={t("stats_wins")} className="flex items-center gap-1"><Trophy className="w-4 h-4 text-amber-400 inline" /> <span className="text-amber-400 font-bold">{stat.wins || 0}</span></span>
                                                            <span title={t("stats_games")} className="flex items-center gap-1"><Gamepad2 className="w-4 h-4 text-sky-400 inline" /> <span className="text-sky-400 font-bold">{stat.games || 0}</span></span>
                                                            <span title={t("stats_kills")} className="flex items-center gap-1"><Target className="w-4 h-4 text-emerald-400 inline" /> <span className="text-emerald-400 font-bold">{stat.kills || 0}</span></span>
                                                        </div>
                                                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative group/bar">
                                                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${winRate}%` }}></div>
                                                        </div>
                                                        <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500">{t("stats_rate")}</span><span className="font-mono font-bold text-emerald-400">{winRate}%</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        <div className="p-3 bg-slate-800/50 border-t border-slate-800 text-center">
                            <button onClick={() => setShowStats(false)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-full text-sm font-bold transition-colors border border-slate-600 shadow-sm">{t("close")}</button>
                        </div>
                    </div>
                </div>
            )}


            <div className="transform scale-[0.85] -translate-y-12 sm:translate-y-0 sm:scale-100 transition-transform duration-300">
                <div className="relative w-[360px] h-[360px] sm:w-[500px] sm:h-[500px] flex items-center justify-center">
                    <div className={`absolute inset-0 rounded-full border-[8px] bg-slate-900 transition-all duration-300 flex items-center justify-center overflow-hidden shadow-xl ${getTableStatusClass()} ${tableStatus === 'success' ? 'scale-105' : 'scale-100'}`}>
                        {gameState === "PAUSED" && (
                            <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                                <Pause className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400 mb-2 animate-pulse" />
                                <p className="text-2xl sm:text-4xl font-black text-amber-400 tracking-widest drop-shadow-sm">PAUSED</p>
                                <p className="text-xs sm:text-sm text-amber-500 mt-2 font-mono">Menunggu Jaringan Stabil...</p>
                            </div>
                        )}

                        <div className="relative z-10 text-center flex flex-col items-center justify-center w-full h-full">
                            {gameState === "WAITING" ? (
                                <div className="flex flex-col items-center justify-center w-full h-full">
                                    {waitingCountdown !== null ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center w-full h-full px-4">
                                            {showcaseWords.length > 0 ? (
                                                (() => {
                                                    let currentShowcase;
                                                    if (waitingCountdown > 40) {
                                                        currentShowcase = showcaseWords[0];
                                                    } else if (waitingCountdown > 20) {
                                                        currentShowcase = showcaseWords[1] || showcaseWords[0];
                                                    } else {
                                                        currentShowcase = showcaseWords[2] || showcaseWords[1] || showcaseWords[0];
                                                    }

                                                    if (!currentShowcase) return null;
                                                    return (
                                                        <div key={currentShowcase.word} className="flex flex-col items-center text-center max-w-[85%] bg-slate-800/50 p-4 sm:p-6 rounded-3xl border border-slate-700/50 shadow-md animate-in fade-in zoom-in duration-700 w-full">
                                                            <div className="flex items-center gap-2 mb-3 bg-slate-900 pr-4 pl-1.5 py-1.5 rounded-full border border-slate-800 shadow-sm">
                                                                <img src={currentShowcase.avatarUrl} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-800 border-2 border-slate-700 object-cover" alt="avatar" />
                                                                <span className="text-[10px] sm:text-xs text-slate-300 font-bold tracking-wide">Kosakata dari <span className="text-sky-400">{currentShowcase.nickname}</span></span>
                                                            </div>
                                                            <h3 className="font-black text-sky-400 tracking-widest uppercase mb-2 sm:mb-4 whitespace-nowrap w-full px-2" style={{ fontSize: `clamp(12px, 60vw / ${Math.max(6, currentShowcase.word.length)}, 32px)` }}>{currentShowcase.word}</h3>
                                                            <div className="relative w-full px-4 py-2 sm:px-6 sm:py-3 bg-slate-900 rounded-xl border border-slate-800 shadow-sm">
                                                                <span className="absolute -top-3 -left-2 text-3xl text-sky-500/50 font-black">"</span>
                                                                <p className="text-[10px] sm:text-sm text-slate-300 italic line-clamp-3 sm:line-clamp-4 leading-relaxed relative z-10">
                                                                    {currentShowcase.def}
                                                                </p>
                                                                <span className="absolute -bottom-5 -right-2 text-3xl text-sky-500/50 font-black">"</span>
                                                            </div>
                                                            <div className="mt-4 flex flex-col items-center justify-center animate-pulse bg-indigo-950/50 border border-indigo-800 rounded-full px-5 py-1.5 shadow-sm">
                                                                <span className="text-[9px] text-indigo-400 uppercase tracking-widest leading-none mb-0.5">{t("starting_in")}</span>
                                                                <span className="text-xl sm:text-2xl font-black text-indigo-300 font-mono leading-none">{waitingCountdown}s</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()
                                            ) : (
                                                <div className="mb-2 animate-pulse bg-indigo-950/50 border border-indigo-800 rounded-full px-6 py-2 shadow-sm">
                                                    <p className="text-[10px] text-indigo-400 uppercase tracking-widest text-center">{t("starting_in")}</p>
                                                    <p className="text-3xl font-black text-indigo-300 font-mono text-center">{waitingCountdown}s</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <Users className="w-12 h-12 text-sky-500/50 mx-auto mb-2 animate-pulse" />
                                            <p className="text-slate-300 font-bold">{t("waiting")}</p>
                                            <p className="text-xs text-slate-500">{t("type_join")}</p>
                                            <p className="text-xl font-mono mt-2 text-sky-400">{players.length} / {maxPlayers}</p>
                                        </>
                                    )}
                                </div>
                            ) : gameState === "ENDED" ? (
                                <div className="animate-bounce">
                                    <p className="text-xl font-bold text-amber-400">{t("game_over")}</p>
                                    <button onClick={() => { setRestartCountdown(null); processQueue(); startGame(); }} className="mt-2 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm hover:bg-emerald-500 transition-colors">{t("new_game")}</button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    {pointMode !== "OFF" && (
                                        <div className="mb-3 flex justify-center animate-in slide-in-from-top fade-in duration-500">
                                            {winCondition === "TIME" ? (
                                                <GlobalTimer gameDuration={gameDuration} isActive={gameState === "PLAYING" && globalTimer !== null} onTimeout={() => { setGameState("ENDED"); playSound("win"); addLog("System", "WAKTU HABIS! Permainan Selesai."); }} resetKey={globalTimer} />
                                            ) : winCondition === "SCORE" ? (
                                                <div className="px-4 py-1 rounded-full font-bold border text-emerald-400 border-emerald-800 bg-emerald-950/50 shadow-sm flex items-center gap-2">
                                                    <Target className="w-4 h-4" /><span className="text-xs uppercase tracking-wide opacity-80">{t("target")}:</span><span className="text-lg">{targetScore}</span>
                                                </div>
                                            ) : (
                                                <div className="px-4 py-1 rounded-full font-bold border text-indigo-400 border-indigo-800 bg-indigo-950/50 shadow-sm flex items-center gap-2">
                                                    <RefreshCw className="w-4 h-4" /><span className="text-xs uppercase tracking-wide opacity-80">{t("round")}:</span><span className="text-lg">{Math.min(...players.filter((p) => !p.isEliminated).map((p) => p.turnCount || 0)) + 1}/{targetRounds}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1.5 mb-2 h-7">
                                        {actionCardsEnabled && (
                                            <div title="Action Cards Enabled" className="w-6 h-6 rounded-full bg-amber-950/50 text-amber-400 flex items-center justify-center border border-amber-800">
                                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                            </div>
                                        )}
                                        {pointMode !== "OFF" && (
                                            <button
                                                onClick={handleOpenPointGuide}
                                                title={`Point Mode: ${pointMode}. Klik untuk melihat tabel poin!`}
                                                className="px-2 h-6 rounded-full bg-emerald-950/50 text-emerald-400 flex items-center justify-center border border-emerald-800 hover:bg-emerald-900/50 transition-colors cursor-pointer shadow-sm active:scale-95"
                                            >
                                                <Target className="w-3.5 h-3.5 animate-pulse mr-1" />
                                                <span className="text-[9px] font-bold uppercase tracking-tighter">{pointMode}</span>
                                            </button>
                                        )}
                                        {maxWordLength > 0 && (
                                            <div title={`Batas Maksimal: ${maxWordLength} Huruf`} className="px-2 h-6 rounded-full bg-rose-950/50 border border-rose-800 flex items-center gap-1 shadow-sm">
                                                <Hash className="w-3.5 h-3.5 text-rose-400" />
                                                <span className="text-[9px] font-bold text-rose-300 uppercase tracking-tighter">MAX {maxWordLength}</span>
                                            </div>
                                        )}
                                        <div title={`Game Mode: ${getModeLabel()}`} className="px-2 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center gap-1">
                                            {gameMode === "CITIES" && <MapPin className="w-3.5 h-3.5 text-sky-400" />}
                                            {gameMode === "WRAP_AROUND" && <Repeat2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
                                            {gameMode === "RHYME" && <Hash className="w-3.5 h-3.5 text-purple-400" />}
                                            {gameMode === "MIRROR" && <FlipHorizontal className="w-3.5 h-3.5 text-pink-400 animate-pulse" />}
                                            {gameMode === "STEP_UP" && <MoveUpRight className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />}
                                            {gameMode === "PHRASE_CHAIN" && (tableStatus === "info" ? <Unlink className="w-3.5 h-3.5 text-indigo-400 animate-bounce" /> : <Link className="w-3.5 h-3.5 text-indigo-400" />)}
                                            {gameMode === "DYNAMIC" && <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />}
                                            {gameMode === "FILL_BLANK" && <Keyboard className="w-3.5 h-3.5 text-emerald-400" />}
                                            {!["CITIES", "WRAP_AROUND", "RHYME", "MIRROR", "STEP_UP", "PHRASE_CHAIN", "DYNAMIC", "FILL_BLANK"].includes(gameMode) && <TrendingUpIcon className="w-3.5 h-3.5 text-slate-400" />}
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{getModeLabel().split(' ')[0]}</span>
                                        </div>
                                    </div>

                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
                                        {gameMode === "RHYME" ? t("rhyme_target") : "SAMBUNG KATA BERIKUT"}
                                    </p>

                                    <h2 className="font-black flex justify-center transition-all duration-300 px-2 my-1 w-full overflow-hidden" style={{ fontSize: `clamp(10px, 55vw / ${Math.max(6, currentWord?.length || 6)}, 28px)` }}>
                                        {(() => {
                                            if (gameMode === "RHYME") {
                                                return (
                                                    <div className="flex flex-col items-center w-full">
                                                        <span className="text-[1em] text-sky-400 bg-sky-950/80 border-2 border-sky-500/50 rounded-[0.3em] px-[0.6em] py-[0.2em] shadow-[0_0_20px_rgba(56,189,248,0.4)] whitespace-nowrap">...{targetRhyme.toUpperCase()}</span>
                                                        {currentWord && <span className="text-[0.5em] text-slate-500 mt-[0.5em] font-normal opacity-80 whitespace-nowrap">Kata Sebelumnya: {currentWord.toUpperCase()}</span>}
                                                    </div>
                                                );
                                            }
                                            if (gameMode === "FILL_BLANK") {
                                                const parts = currentWord.toUpperCase().split(/(\.\.\.)/g);
                                                return (
                                                    <div className="bg-slate-900/80 px-[0.6em] py-[0.3em] rounded-[0.5em] border border-slate-700 shadow-inner flex items-center justify-center whitespace-nowrap">
                                                        {parts.map((part, i) =>
                                                            part === "..."
                                                                ? <span key={i} className="text-emerald-400 mx-[0.3em] tracking-widest animate-pulse">. . .</span>
                                                                : <span key={i} className="text-slate-100 tracking-widest">{part}</span>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            const { pre, high, post } = getDisplayParts(currentWord, getLogicOptions());
                                            return (
                                                <div className="flex items-center justify-center bg-slate-900/60 pl-[0.6em] pr-[0.2em] py-[0.2em] rounded-[0.5em] border border-slate-800 shadow-inner whitespace-nowrap">
                                                    {pre && <span className="text-slate-400 opacity-60 tracking-widest">{pre.toUpperCase()}</span>}
                                                    <span className="text-sky-400 bg-sky-950 border-2 border-sky-500/60 rounded-[0.3em] px-[0.3em] mx-[0.1em] shadow-[0_0_15px_rgba(56,189,248,0.4)] tracking-widest animate-pulse scale-105">
                                                        {high.toUpperCase()}
                                                    </span>
                                                    {post && <span className="text-slate-400 opacity-60 tracking-widest">{post.toUpperCase()}</span>}
                                                </div>
                                            );
                                        })()}
                                    </h2>

                                    <div className="flex flex-col items-center w-full">
                                        <div className="mt-1 flex flex-col items-center gap-2 w-full max-w-[280px] sm:max-w-[400px]">
                                            <div className="w-full text-sky-300 bg-sky-950/30 px-3 py-3 rounded-2xl border border-sky-800/40 flex justify-center items-center text-center shadow-lg relative overflow-hidden">
                                                {/* Shimmer effect background */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/10 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]"></div>

                                                {(() => {
                                                    const rule = getRuleDisplay(currentWord, getLogicOptions());
                                                    const totalLen = (rule.desc?.length || 0) + (rule.action?.length || 0) + (rule.target?.length || 0);
                                                    const dynamicTextSize = totalLen > 30 ? "text-[11px] sm:text-sm" : "text-sm sm:text-base";
                                                    return (
                                                        <div className={`${dynamicTextSize} flex flex-col justify-center items-center gap-y-3 leading-snug w-full relative z-10`}>
                                                            <span className="font-bold text-slate-200 px-2 text-center font-sans">{rule.desc}</span>
                                                            {gameMode !== "RHYME" && gameMode !== "FILL_BLANK" && (
                                                                <div className="flex items-center justify-center bg-slate-950 px-4 py-2 rounded-xl border border-sky-500/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                                                                    {rule.action && <span className="mr-2 font-bold text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest">{rule.action}</span>}

                                                                    {/* Titik indikator di KIRI khusus mode MIRROR */}
                                                                    {gameMode === "MIRROR" && (
                                                                        <div className="mr-3 flex items-center opacity-80">
                                                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-sky-400 rounded-full animate-bounce shadow-[0_0_5px_rgba(56,189,248,0.8)]"></div>
                                                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-sky-400 rounded-full animate-bounce mx-1 shadow-[0_0_5px_rgba(56,189,248,0.8)]" style={{ animationDelay: "150ms" }}></div>
                                                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-sky-400 rounded-full animate-bounce shadow-[0_0_5px_rgba(56,189,248,0.8)]" style={{ animationDelay: "300ms" }}></div>
                                                                        </div>
                                                                    )}

                                                                    <span className="font-black text-sky-400 bg-sky-900/50 px-3 py-0.5 rounded-lg tracking-widest text-lg sm:text-2xl border border-sky-700/50 drop-shadow-md">
                                                                        {rule.target}
                                                                    </span>

                                                                    {/* Titik indikator di KANAN untuk mode selain MIRROR */}
                                                                    {gameMode !== "MIRROR" && (
                                                                        <div className="ml-3 flex items-center opacity-80">
                                                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-sky-400 rounded-full animate-bounce shadow-[0_0_5px_rgba(56,189,248,0.8)]"></div>
                                                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-sky-400 rounded-full animate-bounce mx-1 shadow-[0_0_5px_rgba(56,189,248,0.8)]" style={{ animationDelay: "150ms" }}></div>
                                                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-sky-400 rounded-full animate-bounce shadow-[0_0_5px_rgba(56,189,248,0.8)]" style={{ animationDelay: "300ms" }}></div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        {feedbackMessage && (
                                            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold animate-bounce shadow-sm ${feedbackMessage.type === 'error' ? 'bg-red-950/50 text-red-400 border border-red-800' : feedbackMessage.type === 'warning' ? 'bg-amber-950/50 text-amber-400 border border-amber-800' : feedbackMessage.type === 'info' ? 'bg-sky-950/50 text-sky-400 border border-sky-800' : 'bg-green-950/50 text-emerald-400 border border-emerald-800'}`}>
                                                {feedbackMessage.text}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    {players.map((player, index) => {
                        const angleDeg = index * (360 / Math.max(players.length, 1)) + 90;
                        const isTurn = gameState === "PLAYING" && currentTurnIndex === index && !player.isEliminated;
                        const maxWins = Math.max(...players.map((p) => p.stats?.wins || 0));
                        const isKing = maxWins > 0 && (player.stats?.wins || 0) === maxWins && !player.isEliminated;
                        const isStarter = player.uniqueId === roundStarterId;
                        const tier = player.isBot
                            ? TIER_LEVELS[Math.min(5, Math.max(0, (player.botDifficulty || 3) - 1))]
                            : getPlayerTier(player.stats);

                        return (
                            <div key={player.uniqueId} className="absolute transition-all duration-500 ease-out flex flex-col items-center justify-center w-24 h-28" style={{ transform: `rotate(${angleDeg}deg) translate(${dynamicRadius}px) rotate(-${angleDeg}deg) scale(${dynamicScale})`, zIndex: isTurn ? 100 : 20 }}>

                                {/* --- RENDER EFEK VISUAL DI SINI --- */}
                                <div className="absolute inset-0 pointer-events-none z-[150]">
                                    {activeEffects.filter(e => e.uniqueId === player.uniqueId).map(effect => {
                                        if (effect.type === 'like') {
                                            return Array.from({ length: effect.count }).map((_, i) => {
                                                const tx = (Math.random() - 0.5) * 60;
                                                const ty = (Math.random() - 0.5) * 80 - 20;
                                                const delay = Math.random() * 0.4;
                                                return (
                                                    <Heart
                                                        key={`${effect.id}-${i}`}
                                                        className="absolute top-1/2 left-1/2 text-rose-500 fill-rose-500 drop-shadow-sm w-4 h-4 animate-flurry-heart"
                                                        style={{ '--tx': `${tx}px`, '--ty': `${ty}px`, animationDelay: `${delay}s`, opacity: 0, marginTop: '-10px', transform: 'translate(-50%, -50%)' }}
                                                    />
                                                );
                                            });
                                        }
                                        if (effect.type === 'gift') {
                                            return (
                                                <div key={effect.id} className="absolute top-0 left-1/2 -translate-x-1/2 animate-flurry-gift flex flex-col items-center justify-center pointer-events-none w-[150px]">
                                                    {effect.giftPictureUrl ? (
                                                        <img src={effect.giftPictureUrl} alt={effect.giftName} className="w-12 h-12 object-contain drop-shadow-sm animate-bounce" />
                                                    ) : (
                                                        <span className="text-4xl drop-shadow-sm animate-bounce"><Gift className="w-10 h-10 text-pink-400 fill-pink-500/20" /></span>
                                                    )}
                                                    <span className="text-[10px] font-black text-white bg-pink-600 px-2 py-0.5 rounded-full border border-pink-400 shadow-sm whitespace-nowrap mt-1 leading-tight text-center">
                                                        {effect.giftName}
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>

                                <div className={`relative group ${player.isEliminated ? "opacity-50 grayscale" : "opacity-100"}`}>
                                    {isTurn && <div className="absolute -inset-2 bg-amber-500/30 rounded-full animate-ping opacity-75"></div>}
                                    {isKing && <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce drop-shadow-sm"><Crown className="w-5 h-5 text-amber-400 fill-amber-400" /></div>}
                                    <div className={`w-14 h-14 rounded-full border-4 overflow-hidden bg-slate-800 z-10 relative shadow-sm ${isTurn ? (bombNextRef.current ? "border-orange-500 scale-110 animate-shake" : "border-amber-400 scale-110 shadow-lg") : isKing ? "border-amber-500/70 scale-105" : "border-slate-700"} transition-all duration-300`}>
                                        <img src={player.avatarUrl} alt={player.nickname} className={`w-full h-full object-cover transition-all ${isKing ? "brightness-105" : ""}`} />
                                    </div>
                                    {/* Badge Tier menggantikan posisi bot difficulty lama */}
                                    <div className={`absolute -top-2 -right-3 sm:-right-5 text-[6px] sm:text-[7px] px-1.5 py-0.5 rounded-full font-bold border border-slate-900 z-30 flex items-center shadow-sm uppercase tracking-widest transition-colors whitespace-nowrap ${tier.class}`}>
                                        {tier.name}
                                    </div>
                                    {isStarter && !player.isEliminated && (
                                        <div className="absolute -top-1 -left-2 bg-sky-600 border border-slate-900 text-white p-1.5 rounded-full shadow-sm z-40 animate-pulse" title="First Player (Round Starter)"><Flag className="w-3 h-3 fill-white" /></div>
                                    )}
                                    <PlayerTimer isTurn={isTurn && gameState === "PLAYING"} turnDuration={turnDuration} onTimeout={handleTimeout} playSound={playSound} bombNext={bombNextRef.current} onBombApplied={() => { bombNextRef.current = false; }} resetKey={turnKey} />
                                    {player.isEliminated && <div className="absolute inset-0 flex items-center justify-center z-20"><X className="w-8 h-8 text-slate-500 drop-shadow-md" /></div>}
                                </div>
                                <div className="mt-[-2px] flex flex-col items-center z-40 relative w-full">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-md transition-all duration-300 ${isTurn ? "bg-slate-800 border-amber-500/50 text-amber-400 scale-110" : "bg-slate-900/95 border-slate-700 text-slate-300"}`}>
                                        {player.stats?.wins > 0 && (
                                            <div className={`flex items-center gap-0.5 border-r pr-1.5 mr-0.5 ${isTurn ? "border-amber-700/50" : "border-slate-700"}`}>
                                                <Trophy className={`w-3 h-3 ${isTurn ? "text-amber-500" : "text-slate-500"}`} /><span className={`text-[10px] font-bold font-mono ${isTurn ? "text-amber-400" : "text-slate-400"}`}>{player.stats.wins}</span>
                                            </div>
                                        )}
                                        {pointMode !== "OFF" && (
                                            <div className={`flex items-center gap-0.5 border-r pr-1.5 mr-0.5 ${isTurn ? "border-amber-700/50" : "border-slate-700"}`}>
                                                <Star className={`w-3 h-3 ${isTurn ? "text-amber-500" : "text-emerald-500"}`} fill={isTurn ? "currentColor" : "none"} /><span className={`text-[10px] font-bold font-mono ${isTurn ? "text-amber-400" : "text-emerald-400"}`}>{player.score || 0}</span>
                                            </div>
                                        )}
                                        {player.sessionKills > 0 && (
                                            <div className={`flex items-center gap-0.5 border-r pr-1.5 mr-0.5 ${isTurn ? "border-amber-700/50" : "border-slate-700"}`} title="Combos this match">
                                                <Sparkles className={`w-3 h-3 ${isTurn ? "text-orange-400" : "text-sky-400"}`} /><span className={`text-[10px] font-bold font-mono ${isTurn ? "text-orange-300" : "text-sky-300"}`}>{player.sessionKills}</span>
                                            </div>
                                        )}
                                        <span className="text-[10px] font-bold tracking-wide truncate max-w-[70px]">{player.nickname}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* EFEK KATA MELAYANG (JUICY UI) */}
                    {lastPlay && (
                        <div key={lastPlay.id} className="absolute top-[10%] sm:top-[15%] left-1/2 -translate-x-1/2 pointer-events-none z-[250] flex flex-col items-center animate-float-up w-full">
                            <div className="flex items-center gap-1.5 mb-1 bg-slate-900 px-3 py-1 rounded-full border border-emerald-500/30 shadow-sm">
                                <img src={lastPlay.avatarUrl} className="w-5 h-5 rounded-full border border-emerald-900" alt="avatar" />
                                <span className="text-[10px] sm:text-xs text-emerald-400 font-bold truncate max-w-[100px]">{lastPlay.nickname}</span>
                            </div>
                            <div className={`font-black text-emerald-400 drop-shadow-sm uppercase tracking-widest leading-none px-4 text-center whitespace-nowrap`} style={{ fontSize: `clamp(12px, 60vw / ${Math.max(6, lastPlay.word.length)}, 32px)` }}>
                                {lastPlay.word}
                            </div>
                            {pointMode !== "OFF" && (
                                <div className="text-lg sm:text-xl font-black text-amber-400 drop-shadow-sm mt-1">
                                    +{lastPlay.points} Pts
                                </div>
                            )}
                        </div>
                    )}

                    {/* COMMAND FOOTER - Posisi di bawah meja/avatar */}
                    <div className="absolute -bottom-24 sm:-bottom-32 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-[60]">
                        <div className="bg-slate-900/60 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg border border-slate-700/50 tracking-wide text-center text-slate-300 text-[10px] sm:text-xs">
                            {t("footer")}
                        </div>
                    </div>
                </div>
            </div>


            {gameState === "PLAYING" && isHostJoined && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-2 flex flex-col gap-2 items-center">
                    <div className="flex items-center gap-2 bg-slate-900/95 border border-slate-700 rounded-full px-4 py-2 w-full sm:max-w-md shadow-lg backdrop-blur-md">
                        <input
                            type="text"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(e); }}
                            placeholder="Ketik jawaban..."
                            className="flex-1 bg-transparent text-center font-mono font-bold text-lg sm:text-xl text-slate-100 tracking-widest uppercase outline-none placeholder:text-slate-500 placeholder:text-sm placeholder:font-sans placeholder:lowercase placeholder:tracking-normal w-full min-w-0"
                        />
                        {manualInput && <button onClick={() => setManualInput("")} className="text-slate-500 hover:text-slate-300 shrink-0"><X className="w-5 h-5" /></button>}
                        <button onClick={handleManualSubmit} className="bg-sky-600 text-white p-2 rounded-full hover:bg-sky-500 shadow-sm active:scale-90 transition-transform shrink-0"><Send className="w-4 h-4" /></button>
                    </div>
                    <button onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)} className="text-[10px] text-slate-400 bg-slate-900 px-3 py-1 rounded-full hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-sm border border-slate-700">
                        <Keyboard className="w-3 h-3" /> {showVirtualKeyboard ? "Tutup Keyboard" : "Buka Keyboard"}
                    </button>
                    {showVirtualKeyboard && (
                        <div className="bg-slate-800/90 p-2.5 sm:p-3 rounded-2xl border border-slate-700 shadow-xl w-full sm:w-[90%] animate-in slide-in-from-bottom-10 fade-in duration-300">
                            {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((row, i) => (
                                <div key={i} className="flex justify-center gap-1.5 sm:gap-2 mb-2 last:mb-0">
                                    {row.split("").map((char) => (
                                        <button key={char} onClick={() => setManualInput(prev => prev + char)} className="w-8 h-10 sm:w-11 sm:h-12 bg-slate-700 text-slate-200 rounded-lg font-bold text-sm sm:text-base shadow-sm active:scale-95 transition-all hover:bg-slate-600 active:bg-slate-500 border border-slate-600">{char}</button>
                                    ))}
                                </div>
                            ))}
                            <div className="flex justify-center gap-2 mt-2 px-0.5 sm:px-2">
                                <button onClick={handleManualSubmit} className="flex-[1.5] bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs sm:text-sm h-11 sm:h-12 flex items-center justify-center shadow-sm active:scale-95 transition-colors uppercase">ENTER</button>
                                <button onClick={() => setManualInput(prev => prev + " ")} className="flex-[4] bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-bold text-xs sm:text-sm h-11 sm:h-12 flex items-center justify-center shadow-sm active:scale-95 transition-colors uppercase tracking-widest border border-slate-600">SPACE</button>
                                <button onClick={() => setManualInput(prev => prev.slice(0, -1))} className="flex-[1.5] bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-bold text-xs sm:text-sm h-11 sm:h-12 flex items-center justify-center shadow-sm active:scale-95 gap-1 transition-colors uppercase border border-slate-600"><Delete className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {gameState === "ENDED" && getWinners().length > 0 && (
                <div className="absolute inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-500 p-4">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="absolute animate-ping" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDuration: `${1 + Math.random()}s`, animationDelay: `${Math.random()}s`, backgroundColor: ["#FCD34D", "#6EE7B7", "#7DD3FC", "#F9A8D4"][Math.floor(Math.random() * 4)], width: "8px", height: "8px", borderRadius: "50%" }}></div>
                        ))}
                    </div>
                    <div className="relative bg-slate-900 border border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 max-w-3xl w-full flex flex-col items-center transform transition-all animate-in zoom-in-90 duration-300">
                        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
                            <Trophy className="w-10 h-10 sm:w-14 sm:h-14 text-amber-400 drop-shadow-sm animate-bounce" />
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-100">{getWinners().length > 1 ? t("draw") : t("winner")}</h2>
                            <Trophy className="w-10 h-10 sm:w-14 sm:h-14 text-amber-400 drop-shadow-sm animate-bounce" />
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6 w-full max-h-[35vh] overflow-y-auto custom-scrollbar">
                            {getWinners().map((winner, idx) => (
                                <div key={idx} className="flex flex-col items-center bg-slate-800/50 p-3 rounded-2xl border border-slate-700 min-w-[110px] sm:min-w-[130px] animate-in zoom-in duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="relative mb-2 group">
                                        <img src={winner.avatarUrl} alt="Winner" className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-amber-400 shadow-md object-cover bg-slate-800" />
                                        {getWinners().length > 1 && <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[10px] shadow-sm">#{idx + 1}</div>}
                                    </div>
                                    <p className="text-sm sm:text-base font-bold text-slate-200 truncate max-w-[100px]">{winner.nickname}</p>
                                    {pointMode !== "OFF" && <p className="text-xs sm:text-sm font-mono text-emerald-400 font-bold mt-0.5">{winner.score} {t("log_pts")}</p>}
                                </div>
                            ))}
                        </div>
                        {(() => {
                            const killers = players.filter(p => (p.sessionKills || 0) > 0).sort((a, b) => b.sessionKills - a.sessionKills);
                            const maxKills = killers.length > 0 ? killers[0].sessionKills : 0;
                            const mostKillers = killers.filter(p => p.sessionKills === maxKills);
                            if (mostKillers.length > 0) {
                                return (
                                    <div className="w-full bg-sky-950/30 border border-sky-900/50 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6">
                                        <div className="flex items-center gap-1.5 text-sky-400 text-xs sm:text-sm font-black tracking-widest"><Sparkles className="w-4 h-4 animate-pulse" /> {t("most_killer")}</div>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {mostKillers.map((killer, idx) => (
                                                <div key={idx} className="bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2 shadow-sm hover:scale-105 transition-transform">
                                                    <div className="relative">
                                                        <img src={killer.avatarUrl} alt="killer" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-sky-800 object-cover bg-slate-700" />
                                                        <div className="absolute -bottom-1 -right-1 text-[8px] bg-sky-500 text-white rounded-full px-1 shadow-sm">⭐</div>
                                                    </div>
                                                    <div className="text-left leading-tight">
                                                        <p className="text-[10px] sm:text-xs font-bold text-slate-200 truncate max-w-[80px]">{killer.nickname}</p>
                                                        <p className="text-[9px] sm:text-[10px] font-mono text-sky-400 font-bold">{killer.sessionKills} {t("stats_kills")}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => {
                                setRestartCountdown(null);
                                if (autoRestartEnabled) {
                                    clearLobby();
                                    pickShowcaseWords();
                                    setTimeout(() => setWaitingCountdown(60), 0);
                                } else {
                                    processQueue();
                                    startGame();
                                }
                            }} className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-full shadow-sm hover:bg-emerald-500 active:scale-95 transition-all text-sm sm:text-base border border-emerald-500">
                                {restartCountdown !== null ? `Timer Join (${restartCountdown}s)` : t("play_again")}
                            </button>
                            <button onClick={() => { setRestartCountdown(null); clearLobby(); }} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-full shadow-sm active:scale-95 transition-all text-xs sm:text-sm border border-slate-700">
                                {t("clear_lobby")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute bottom-12 left-2 sm:bottom-4 sm:left-4 z-40 flex flex-col gap-1 items-start">
                <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm border border-slate-800"
                    title={showLogs ? "Sembunyikan Log" : "Tampilkan Log"}
                >
                    {showLogs ? <MessageSquareOff className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                    <span className="hidden sm:inline">{showLogs ? "Tutup Logs" : "Buka Logs"}</span>
                </button>

                {showLogs && (
                    <div className="w-48 sm:w-64 h-32 sm:h-48 overflow-y-auto custom-scrollbar rounded-lg">
                        <div className="flex flex-col-reverse justify-end min-h-full gap-1">
                            {logs.map((log) => (
                                <div key={log.id} className={`flex items-center px-3 py-1 rounded text-[10px] sm:text-xs animate-in slide-in-from-left fade-in transition-colors w-full bg-slate-900/90 border border-slate-800 shadow-sm cursor-default`}>
                                    <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                        {log.user === "Action" ? <span className="font-bold text-amber-400 drop-shadow-sm">{log.message}</span> : <><span className="font-bold text-sky-400">{log.user}:</span> <span className="text-slate-300">{log.message}</span></>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- GLOBAL TOAST UNTUK PENONTON (NON-PLAYERS) --- */}
            <div className="absolute top-24 right-4 z-[60] flex flex-col gap-2 pointer-events-none items-end">
                {activeEffects
                    .filter(e => !players.some(p => p.uniqueId === e.uniqueId))
                    .slice(-1) // Membatasi agar hanya menampilkan 1 notifikasi terbaru (satu baris)
                    .map(effect => {
                        if (effect.type === 'like') {
                            return (
                                <div key="toast-like-viewer" className="bg-slate-900 text-slate-300 px-3 py-1.5 rounded-full border border-rose-900/50 flex items-center gap-2 shadow-sm animate-in slide-in-from-right fade-in fade-out duration-300">
                                    <img src={effect.profilePictureUrl || getAvatarUrl(effect.uniqueId)} alt="avatar" className="w-5 h-5 rounded-full border border-slate-700 object-cover bg-slate-800" />
                                    <div className="flex flex-col leading-tight">
                                        <span className="text-[10px] font-bold truncate max-w-[80px] text-slate-200">{effect.nickname || "Penonton"}</span>
                                        <span className="text-[8px] text-slate-400">Kirim likes <Heart className="w-2.5 h-2.5 inline text-rose-500 animate-pulse" fill="currentColor" /></span>
                                    </div>
                                </div>
                            )
                        }
                        if (effect.type === 'gift') {
                            return (
                                <div key="toast-gift-viewer" className="bg-slate-900 text-slate-300 p-2 rounded-lg border border-pink-900/50 flex items-center gap-3 shadow-md animate-in slide-in-from-right fade-in fade-out duration-300">
                                    <img src={effect.profilePictureUrl || getAvatarUrl(effect.uniqueId)} alt="avatar" className="w-8 h-8 rounded-full border-2 border-slate-700 object-cover bg-slate-800" />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold truncate max-w-[100px] text-slate-200">{effect.nickname || "Penonton"}</span>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            Kirim: {effect.giftName}
                                            {effect.giftPictureUrl ? <img src={effect.giftPictureUrl} className="w-4 h-4 object-contain inline" alt="gift" /> : <Gift className="w-4 h-4 inline text-pink-400" />}
                                        </span>
                                    </div>
                                </div>
                            )
                        }
                        return null;
                    })}
            </div>

            {/* Old footer position removed */}


            {/* --- SCRAMBLE MINIGAME OVERLAY --- */}
            {scrambleWord && (
                <div
                    ref={miniGameOverlayRef}
                    className={`z-[90] flex pointer-events-none animate-in slide-in-from-right fade-in duration-500 ${miniGamePos.x !== null ? 'fixed' : 'absolute bottom-24 sm:bottom-32 right-2 sm:right-4'}`}
                    style={miniGamePos.x !== null ? { left: miniGamePos.x, top: miniGamePos.y, bottom: 'auto', right: 'auto' } : {}}
                >
                    <div
                        className="bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700/50 shadow-lg pointer-events-auto flex items-center p-1.5 gap-2 w-max"
                        style={{
                            transform: `scale(${miniGameScale})`,
                            transformOrigin: miniGamePos.x !== null ? 'top left' : 'bottom right',
                            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                    >
                        {/* Drag Handle (Grip) */}
                        <div
                            className="cursor-move touch-none p-1 sm:p-1.5 text-slate-500 hover:text-slate-300 transition-colors bg-slate-800/50 rounded-full"
                            onMouseDown={handleMiniGameDragStart}
                            onTouchStart={handleMiniGameDragStart}
                            title="Tahan dan geser"
                        >
                            <GripHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>

                        {/* Content Mini Game */}
                        <div className="flex items-center gap-1.5 sm:gap-2 pr-1">
                            {scrambleWinner ? (
                                <div className="flex items-center gap-1.5 animate-in slide-in-from-left duration-300">
                                    <img src={scrambleWinner.profilePictureUrl} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-emerald-500 object-cover bg-slate-800 shadow-sm" alt="winner" />
                                    <span className="text-[10px] sm:text-xs font-bold max-w-[80px] sm:max-w-[120px] truncate text-emerald-100">
                                        {scrambleWinner.nickname}
                                    </span>
                                    <span className="text-[8px] font-black px-1 py-0.5 rounded border text-emerald-400 bg-emerald-950/50 border-emerald-800/50 hidden sm:inline-block">
                                        BENAR
                                    </span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleRevealAnagram}
                                    onTouchEnd={handleRevealAnagram}
                                    className="hover:scale-110 active:scale-90 transition-transform cursor-pointer outline-none bg-transparent border-none p-0 flex items-center justify-center ml-0.5 mr-0.5"
                                    title="Nyerah / Spill Jawaban"
                                    disabled={scrambledDisplay === scrambleWord}
                                >
                                    <Sparkles className={`w-4 h-4 ${scrambledDisplay === scrambleWord ? 'text-slate-500' : 'text-amber-400 animate-pulse hover:text-amber-300'} drop-shadow-md`} />
                                </button>
                            )}

                            <div className="flex gap-0.5 sm:gap-1 flex-nowrap">
                                {scrambledDisplay.split('').map((char, i) => (
                                    <div key={i} className={`w-5 h-6 sm:w-6 sm:h-7 shrink-0 bg-slate-800 border rounded flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm transition-colors duration-300 ${scrambleWinner ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30' : (scrambledDisplay === scrambleWord ? 'border-amber-500/50 text-amber-400 bg-amber-950/30' : 'border-slate-700 text-sky-400')}`}>
                                        {char}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Scale Controls */}
                        <div className="flex items-center gap-0.5 border-l border-slate-700/50 pl-1.5 ml-1" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMiniGameScale(p => Math.max(0.5, p - 0.25)); }}
                                className="text-slate-500 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-30"
                                disabled={miniGameScale <= 0.5}
                                title="Perkecil"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMiniGameScale(p => Math.min(1.5, p + 0.25)); }}
                                className="text-slate-500 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-30"
                                disabled={miniGameScale >= 1.5}
                                title="Perbesar"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* --- MODAL PANDUAN POIN (SCORING GUIDE) --- */}
            {showPointGuide && pointMode !== "OFF" && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4" onClick={handleClosePointGuide}>
                    <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-black text-emerald-400 flex items-center gap-2">
                                <Target className="w-6 h-6" /> INFO POIN: {pointMode}
                            </h3>
                            <button onClick={handleClosePointGuide} className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-sm text-slate-300 space-y-4">
                            {pointMode === "LENGTH" && (
                                <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 text-center shadow-inner">
                                    <p className="text-3xl font-black text-white mb-2 tracking-widest">1 HURUF <br /><span className="text-emerald-400">= 1 POIN</span></p>
                                    <p className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg mt-3">Makin panjang kata, makin besar poinnya! <br />Contoh: "KUCING" (6 huruf) = 6 Poin</p>
                                </div>
                            )}

                            {pointMode === "VOWELS" && (
                                <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 text-center shadow-inner">
                                    <div className="mb-4">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Huruf Vokal (A, I, U, E, O)</p>
                                        <p className="text-2xl font-black text-sky-400">= 3 POIN</p>
                                    </div>
                                    <div className="mb-2">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Huruf Konsonan</p>
                                        <p className="text-xl font-black text-emerald-400">= 1 POIN</p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded-lg mt-4 border border-slate-800">Tips: Gunakan banyak huruf hidup untuk poin maksimal!</p>
                                </div>
                            )}

                            {pointMode === "SCRABBLE" && (
                                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 shadow-inner">
                                    <p className="text-xs text-center text-slate-400 mb-3 border-b border-slate-700 pb-2">
                                        Gunakan huruf langka untuk poin ekstra!<br />
                                        Versi: <span className="font-bold text-sky-400">{language === "EN" ? "Inggris Klasik" : language === "MIX" ? "Campuran (Auto-Detect)" : "Bahasa Indonesia"}</span>
                                    </p>

                                    {language === "MIX" && (
                                        <div className="flex bg-slate-900 rounded-lg p-1 mb-3 shadow-inner">
                                            <button onClick={() => setGuideLangTab("ID")} className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${guideLangTab === "ID" ? "bg-sky-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>Poin Indo</button>
                                            <button onClick={() => setGuideLangTab("EN")} className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${guideLangTab === "EN" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>Poin Inggris</button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-1.5 text-sm">
                                        {(language === "EN" || (language === "MIX" && guideLangTab === "EN")) ? (
                                            <>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-emerald-400 font-black w-14">1 Poin</span> <span className="font-mono text-slate-200 tracking-widest">A E I O U L N S T R</span></div>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-emerald-400 font-black w-14">2 Poin</span> <span className="font-mono text-slate-200 tracking-widest">D G</span></div>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-amber-400 font-black w-14">3 Poin</span> <span className="font-mono text-slate-200 tracking-widest">B C M P</span></div>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-amber-400 font-black w-14">4 Poin</span> <span className="font-mono text-slate-200 tracking-widest">F H V W Y</span></div>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-rose-400 font-black w-14">5 Poin</span> <span className="font-mono text-slate-200 tracking-widest">K</span></div>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-purple-400 font-black w-14">8 Poin</span> <span className="font-mono text-slate-200 tracking-widest">J X</span></div>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-purple-400 font-black w-14">10 Pts</span> <span className="font-mono text-slate-200 tracking-widest">Q Z</span></div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-emerald-400 font-black w-14">1 Poin</span> <span className="font-mono text-slate-200 tracking-[0.3em]">A E I N O R S T U</span></div>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-emerald-400 font-black w-14">2 Poin</span> <span className="font-mono text-slate-200 tracking-[0.3em]">D K L M</span></div>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-amber-400 font-black w-14">3 Poin</span> <span className="font-mono text-slate-200 tracking-[0.3em]">B G P</span></div>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-amber-400 font-black w-14">4 Poin</span> <span className="font-mono text-slate-200 tracking-[0.3em]">C H</span></div>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-rose-400 font-black w-14">5 Poin</span> <span className="font-mono text-slate-200 tracking-[0.3em]">F J W Y</span></div>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-purple-400 font-black w-14">8 Poin</span> <span className="font-mono text-slate-200 tracking-[0.3em]">V</span></div>
                                                <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30"><span className="text-purple-400 font-black w-14">10 Pts</span> <span className="font-mono text-slate-200 tracking-[0.3em]">Q X Z</span></div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={handleClosePointGuide} className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 uppercase tracking-widest text-sm">
                            Tutup Panduan
                        </button>
                    </div>
                </div>
            )}

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        
        /* Animasi Flurry Heart / Likes */
        @keyframes flurry-heart {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
            20% { opacity: 1; transform: translate(calc(-50% + (var(--tx) * 0.5)), calc(-50% + (var(--ty) * 0.5))) scale(1); }
            80% { opacity: 1; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.8); }
            100% { opacity: 0; transform: translate(calc(-50% + (var(--tx) * 1.5)), calc(-50% + (var(--ty) * 1.5) - 10px)) scale(0); }
        }
        .animate-flurry-heart {
            animation: flurry-heart 1.5s ease-out forwards;
        }

        /* Animasi Flurry Gift */
        @keyframes flurry-gift {
            0% { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.5); }
            15% { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1.1); }
            85% { opacity: 1; transform: translateX(-50%) translateY(-40px) scale(1); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-60px) scale(0.8); }
        }
        .animate-flurry-gift {
            animation: flurry-gift 3s ease-out forwards;
        }

        /* Animasi Teks Meledak & Melayang */
        @keyframes float-up {
            0% { opacity: 0; transform: translate(-50%, 40px) scale(0.5); }
            15% { opacity: 1; transform: translate(-50%, -10px) scale(1.1); }
            30% { transform: translate(-50%, 0px) scale(1); }
            70% { opacity: 1; transform: translate(-50%, -15px) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -40px) scale(0.8); }
        }
        .animate-float-up {
            animation: float-up 2s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
            position: absolute; left: 50%;
        }

        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }
      `}</style>
            
            {/* --- MUSIC PLAYER OVERLAY --- */}
            <MusicPlayer musicState={musicState} wsRef={wsRef} />

        </div>
    );
}
