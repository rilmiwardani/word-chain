import React, { useState, useEffect, useRef } from "react";
import {
    AlertTriangle, BarChart2, Bot, Clock, Crown, Delete, FastForward,
    FileJson, Flag, FlipHorizontal, Gamepad2, Gift, Globe, GripHorizontal, Hash, Heart, Info,
    Keyboard, Link, MapPin, Maximize, Medal, Minimize, Minus,
    MoveUpRight, Plus, RefreshCw, Repeat2, Send, Settings,
    Star, Target, TrendingUp as TrendingUpIcon, Trophy, Unlink,
    User, Users, Volume2, VolumeX, X, Sparkles, MessageSquare, MessageSquareOff,
    Pause, Play, Music, Camera, CameraOff
} from "lucide-react";

import { TRANSLATIONS, TIER_LEVELS, getPlayerTier, FALLBACK_DICTIONARY_EN, FALLBACK_PHRASES_ID, FALLBACK_PHRASES_EN, FALLBACK_DICTIONARY_ID_DATA, FALLBACK_CITIES, DYNAMIC_CHALLENGES, BOT_PROFILES, getRandomColor, getAvatarUrl, normalizeWord, generatePattern, getEnglishSyllableSuffix, StatsManager, SoundManager } from "./utils/constants";
// ==========================================
import { PlayerTimer, GlobalTimer } from "./components/Timers";
import { getIndonesianOverlapSuffix, getSuffixOrRule, getRecoverySuffix, getRuleDisplay, getDisplayParts, validateConnection } from "./utils/gameLogic";
import MusicPlayer from "./components/MusicPlayer";
import CameraOverlay from "./components/CameraOverlay";

const TABLE_THEMES = {
    midnight: "border-slate-800 bg-slate-900 shadow-2xl shadow-black/20",
    emerald: "border-emerald-800 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-800 to-emerald-950 shadow-2xl shadow-emerald-900/20",
    crimson: "border-rose-800 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-800 to-rose-950 shadow-2xl shadow-rose-900/20",
    cyber: "border-indigo-700 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-900 via-indigo-950 to-slate-950 shadow-2xl shadow-indigo-900/40",
    ocean: "border-sky-800 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-800 via-cyan-900 to-blue-950 shadow-2xl shadow-sky-900/30",
    wood: "border-amber-900 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-800 to-stone-900 shadow-2xl shadow-amber-950/40"
};

const THEME_LABELS = {
    midnight: "Midnight (Default)",
    emerald: "Emerald Table",
    crimson: "Crimson Red",
    cyber: "Cyberpunk",
    ocean: "Ocean Blue",
    wood: "Classic Wood"
};

// 3. MAIN COMPONENT
// ==========================================
export default function App() {
    // === STATE ===
    const [players, setPlayers] = useState([]);
    const [gameState, setGameState] = useState("WAITING");
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [currentWord, setCurrentWord] = useState("");
    const [lastInputWord, setLastInputWord] = useState("");
    const [usedWords, setUsedWords] = useState(new Set());
    const [gameMode, setGameMode] = useState("LAST_LETTER");
    const [language, setLanguage] = useState("EN");
    const [targetRhyme, setTargetRhyme] = useState("");
    const [tableStatus, setTableStatus] = useState("idle");
    const [feedbackMessage, setFeedbackMessage] = useState(null);

    const [actionCardsEnabled, setActionCardsEnabled] = useState(false);
    const [pointMode, setPointMode] = useState("OFF"); // OFF, LENGTH, SCRABBLE, VOWELS
    const [musicState, setMusicState] = useState(null);
    const [musicOverlayStyle, setMusicOverlayStyle] = useState("thumbnail");
    const [isCamEnabled, setIsCamEnabled] = useState(() => localStorage.getItem("is_cam_enabled") === "true");

    const [isReversed, setIsReversed] = useState(false);
    const [overlapLength, setOverlapLength] = useState(1);
    const [overlapMode, setOverlapMode] = useState("FIXED"); // FIXED, RANDOM, SEQUENTIAL
    const [maxWordLength, setMaxWordLength] = useState(0);
    const [autoRestartEnabled, setAutoRestartEnabled] = useState(false);
    const [restartLikes, setRestartLikes] = useState(0);
    const TARGET_RESTART_LIKES = 200;
    const restartLikesRef = useRef(0);
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
    const [tiktokSessionId, setTiktokSessionId] = useState(() => localStorage.getItem("tiktok_session_id") || "");
    const [cityMetadata, setCityMetadata] = useState({});
    const [logs, setLogs] = useState([]);
    const [activeEffects, setActiveEffects] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState("disconnected");
    const [connectionSource, setConnectionSource] = useState(() => localStorage.getItem("sk_conn_source") || "LOCAL"); // LOCAL | TIKFINITY

    const [maxPlayers, setMaxPlayers] = useState(8);
    const [turnDuration, setTurnDuration] = useState(15);
    const [timer, setTimer] = useState(turnDuration);
    const [manualInput, setManualInput] = useState("");
    const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState("rules");
    const [wsHost, setWsHost] = useState(() => localStorage.getItem("word_chain_ws_host") || "");
    const [dictLoadedInfo, setDictLoadedInfo] = useState("Default (EN)");
    const [tableTheme, setTableTheme] = useState(() => localStorage.getItem("sk_tableTheme") || "midnight");
    const [layoutStyle, setLayoutStyle] = useState(() => localStorage.getItem("sk_layoutStyle") || "round");
    const [bgColorMode, setBgColorMode] = useState(() => {
        const saved = localStorage.getItem("sk_bgColorMode");
        if (saved) return saved;
        return localStorage.getItem("sk_greenscreen") === "true" ? "greenscreen" : "default";
    });

    useEffect(() => {
        localStorage.setItem("sk_tableTheme", tableTheme);
    }, [tableTheme]);

    useEffect(() => {
        localStorage.setItem("sk_layoutStyle", layoutStyle);
    }, [layoutStyle]);

    useEffect(() => {
        localStorage.setItem("sk_bgColorMode", bgColorMode);
    }, [bgColorMode]);

    useEffect(() => {
        localStorage.setItem("is_cam_enabled", isCamEnabled);
    }, [isCamEnabled]);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const [isMuted, setIsMuted] = useState(false);
    const [showLogs, setShowLogs] = useState(true);
    const [showPointGuide, setShowPointGuide] = useState(false);
    const [guideLangTab, setGuideLangTab] = useState("ID");

    const [scrambleWord, setScrambleWord] = useState("");
    const [scrambledDisplay, setScrambledDisplay] = useState("");
    const [scrambleWinner, setScrambleWinner] = useState(null);

    const [activeMinigame, setActiveMinigame] = useState("ANAGRAM"); // "OFF", "ANAGRAM", "WORD500", "AUTO_WORDLE"
    const [word500Target, setWord500Target] = useState("");
    const [word500Guesses, setWord500Guesses] = useState([]);
    const [word500Winner, setWord500Winner] = useState(null);
    const [word500FlipPhase, setWord500FlipPhase] = useState(null); // null | "flipping" | "winner"
    const [anagramFlipPhase, setAnagramFlipPhase] = useState(null); // null | "flipping" | "winner"
    const [autoWordleGuess, setAutoWordleGuess] = useState(null);
    const [autoWordleLeaderboard, setAutoWordleLeaderboard] = useState({});

    const [miniGamePos, setMiniGamePos] = useState({ x: null, y: null });
    const [miniGameScale, setMiniGameScale] = useState(1);
    const [tableScale, setTableScale] = useState(1);
    const [mainTableOffset, setMainTableOffset] = useState({ x: 0, y: 0 });


    // === REFS ===
    const lastLikeTimeRef = useRef(0);
    const quitHistoryRef = useRef({});
    const bombNextRef = useRef(false);
    const rhymeTargetsRef = useRef([]);
    const tableStatusTimeout = useRef(null);
    const lastSuccessfulPlayerIdRef = useRef(null);
    const timerRef = useRef(null);
    const wsRef = useRef(null);
    const backendWsRef = useRef(null);
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);
    const fallbackToLocalhostRef = useRef(false);
    const reconnectAttemptsRef = useRef(0);
    const pausedByDisconnectRef = useRef(false);
    const wsHostRef = useRef(wsHost);
    const connectionSourceRef = useRef(localStorage.getItem("sk_conn_source") || "LOCAL");
    const feedbackTimeoutRef = useRef(null);
    const chatHandlerRef = useRef(null);
    const likeHandlerRef = useRef(null);
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
    const lastWordleGuessRef = useRef({ uniqueId: null, word: null, time: 0 });
    const currentWordRef = useRef(currentWord);
    const lastInputWordRef = useRef(lastInputWord);
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
    const lastPatternTypeRef = useRef(null);
    const playedWordsHistoryRef = useRef([]);

    const scrambleWordRef = useRef(scrambleWord);
    const scrambleWinnerRef = useRef(scrambleWinner);
    const activeMinigameRef = useRef(activeMinigame);
    const word500TargetRef = useRef(word500Target);
    const word500WinnerRef = useRef(word500Winner);
    const word500GuessesRef = useRef(word500Guesses);
    const word500EndRef = useRef(null);
    const kamusTambahanRef = useRef(new Set());
    // Session-level tracker: rule tidak diulang sampai semua 22 jenis habis
    const sessionUsedChallengeIdsRef = useRef(new Set());

    const mainTableDragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
    const mainTableRef = useRef(null);

    const miniGameDragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
    const miniGameOverlayRef = useRef(null);
    const miniGameWordsRef = useRef(["KUCING", "ANJING", "SEPATU", "BENDERA", "PELANGI", "GARUDA", "KAMERA", "PENSIL", "LEMARI", "KERTAS", "BONEKA", "PANGGUNG", "KACAMATA", "BINGKAI", "LUKISAN", "DOMPET", "BANTAL", "GULING", "SELIMUT", "KASUR"]);
    const unplayedMiniGameWordsRef = useRef([]);
    const unplayedWord500WordsRef = useRef([]);

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
        restartLikesRef.current = restartLikes;
        playerQueueRef.current = playerQueue;
        scrambleWordRef.current = scrambleWord;
        scrambleWinnerRef.current = scrambleWinner;
        activeMinigameRef.current = activeMinigame;
        word500TargetRef.current = word500Target;
        word500WinnerRef.current = word500Winner;
        word500GuessesRef.current = word500Guesses;
        wsHostRef.current = wsHost;
    }, [
        players, currentTurnIndex, turnDuration, usedWords, syllableMap, isMuted,
        cityMetadata, challengeQueue, language, gameMode, currentWord, targetRhyme,
        gameState, winCondition, targetRounds, targetScore, actionCardsEnabled, pointMode, isReversed, overlapLength, overlapMode, maxWordLength, activeChallenge, autoRestartEnabled, playerQueue, scrambleWord, scrambleWinner, activeMinigame, word500Target, word500Winner, word500Guesses, wsHost
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
        reconnectAttemptsRef.current = 0;
        setTimeout(connectWebSocket, 500);
    };

    const handleMainTableDragStart = (e) => {
        if (e.target.closest('button') || e.target.closest('input')) return;
        mainTableDragRef.current.isDragging = true;
        mainTableDragRef.current.startX = e.clientX || (e.touches && e.touches[0].clientX);
        mainTableDragRef.current.startY = e.clientY || (e.touches && e.touches[0].clientY);
        mainTableDragRef.current.initialX = mainTableOffset.x;
        mainTableDragRef.current.initialY = mainTableOffset.y;
        if (mainTableRef.current) {
            mainTableRef.current.style.transition = 'none';
        }
    };

    const handleMiniGameDragStart = (e) => {
        miniGameDragRef.current.isDragging = true;
        miniGameDragRef.current.startX = e.clientX || (e.touches && e.touches[0].clientX);
        miniGameDragRef.current.startY = e.clientY || (e.touches && e.touches[0].clientY);

        const targetEl = miniGameOverlayRef.current || e.currentTarget.parentElement;
        const rect = targetEl.getBoundingClientRect();
        miniGameDragRef.current.initialX = rect.left;
        miniGameDragRef.current.initialY = rect.top;

        if (miniGamePos.x === null) {
            setMiniGamePos({ x: rect.left, y: rect.top });
        }

        // Apply fixed positioning directly to DOM for instant response & disable transition lag
        if (miniGameOverlayRef.current) {
            miniGameOverlayRef.current.style.transition = 'none';
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
        let miniGameRafId = null;
        let mainTableRafId = null;

        const handleMouseMove = (e) => {
            if (miniGameDragRef.current.isDragging) {
                if (e.cancelable && e.type === 'touchmove') e.preventDefault();
                const clientX = e.clientX || (e.touches && e.touches[0].clientX);
                const clientY = e.clientY || (e.touches && e.touches[0].clientY);
                if (clientX !== undefined) {
                    const dx = clientX - miniGameDragRef.current.startX;
                    const dy = clientY - miniGameDragRef.current.startY;
                    let newX = miniGameDragRef.current.initialX + dx;
                    let newY = miniGameDragRef.current.initialY + dy;
                    newX = Math.max(0, Math.min(window.innerWidth - 100, newX));
                    newY = Math.max(0, Math.min(window.innerHeight - 50, newY));
                    miniGameDragRef.current.lastX = newX;
                    miniGameDragRef.current.lastY = newY;

                    if (miniGameOverlayRef.current) {
                        if (miniGameRafId) cancelAnimationFrame(miniGameRafId);
                        miniGameRafId = requestAnimationFrame(() => {
                            if (miniGameOverlayRef.current) {
                                miniGameOverlayRef.current.style.left = newX + 'px';
                                miniGameOverlayRef.current.style.top = newY + 'px';
                            }
                        });
                    }
                }
            }

            if (mainTableDragRef.current.isDragging) {
                if (e.cancelable && e.type === 'touchmove') e.preventDefault();
                const clientX = e.clientX || (e.touches && e.touches[0].clientX);
                const clientY = e.clientY || (e.touches && e.touches[0].clientY);
                if (clientX !== undefined) {
                    const dx = clientX - mainTableDragRef.current.startX;
                    const dy = clientY - mainTableDragRef.current.startY;
                    const newX = mainTableDragRef.current.initialX + dx;
                    const newY = mainTableDragRef.current.initialY + dy;
                    mainTableDragRef.current.lastX = newX;
                    mainTableDragRef.current.lastY = newY;

                    if (mainTableRef.current) {
                        if (mainTableRafId) cancelAnimationFrame(mainTableRafId);
                        mainTableRafId = requestAnimationFrame(() => {
                            if (mainTableRef.current) {
                                mainTableRef.current.style.left = `${newX}px`;
                                mainTableRef.current.style.top = `${newY}px`;
                            }
                        });
                    }
                }
            }
        };

        const handleMouseUp = () => {
            if (miniGameDragRef.current.isDragging) {
                miniGameDragRef.current.isDragging = false;
                if (miniGameOverlayRef.current) {
                    miniGameOverlayRef.current.style.transition = '';
                }
                if (miniGameDragRef.current.lastX !== undefined) {
                    setMiniGamePos({ x: miniGameDragRef.current.lastX, y: miniGameDragRef.current.lastY });
                }
            }
            if (mainTableDragRef.current.isDragging) {
                mainTableDragRef.current.isDragging = false;
                if (mainTableRef.current) {
                    mainTableRef.current.style.transition = '';
                }
                if (mainTableDragRef.current.lastX !== undefined) {
                    setMainTableOffset({ x: mainTableDragRef.current.lastX, y: mainTableDragRef.current.lastY });
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
            if (miniGameRafId) cancelAnimationFrame(miniGameRafId);
            if (mainTableRafId) cancelAnimationFrame(mainTableRafId);
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
        setScrambleWinner({ nickname: "Sistem (Spill)", profilePictureUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=System" });
        
        setTimeout(() => { setAnagramFlipPhase("flipping"); }, 1000);
        setTimeout(() => { setAnagramFlipPhase("winner"); }, 1600);
        setTimeout(() => { setAnagramFlipPhase(null); startNewScramble(); }, 5000);
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
        
        const isDerangement = (orig, shuff) => {
            for (let i = 0; i < orig.length; i++) {
                if (orig[i] === shuff[i]) return false;
            }
            return true;
        };

        while (attempts < 50) {
            let arr = word.split('');
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            scrambled = arr.join('');
            
            if (isDerangement(word, scrambled)) break;
            attempts++;
        }

        // Fallback jika derangement gagal (misal terlalu banyak huruf kembar)
        if (attempts >= 50) {
            let fallbackAttempts = 0;
            while (scrambled === word && fallbackAttempts < 10) {
                let arr = word.split('');
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
                scrambled = arr.join('');
                fallbackAttempts++;
            }
            if (scrambled === word) {
                const reversed = word.split('').reverse().join('');
                scrambled = reversed !== word ? reversed : word.slice(1) + word[0];
            }
        }

        setScrambleWord(word);
        setScrambledDisplay(scrambled);
        setScrambleWinner(null);
        setAnagramFlipPhase(null);
    };

    const computeWordleColors = (guessStr, targetStr) => {
        if (!guessStr || !targetStr) return [];
        const guess = guessStr.toUpperCase().split("");
        const target = targetStr.toUpperCase().split("");
        const len = target.length;
        const colors = Array(len).fill("gray");
        const targetMatched = Array(len).fill(false);
        const guessMatched = Array(len).fill(false);

        // 1. Green pass (exact position match)
        for (let i = 0; i < len; i++) {
            if (guess[i] === target[i]) {
                colors[i] = "green";
                targetMatched[i] = true;
                guessMatched[i] = true;
            }
        }

        // 2. Yellow pass (letter exists in target elsewhere)
        for (let i = 0; i < len; i++) {
            if (guessMatched[i]) continue;
            for (let j = 0; j < len; j++) {
                if (!targetMatched[j] && guess[i] === target[j]) {
                    colors[i] = "yellow";
                    targetMatched[j] = true;
                    break;
                }
            }
        }

        return colors;
    };

    const checkWordleHardMode = (newGuessStr, targetStr, previousGuesses) => {
        const newGuess = newGuessStr.toUpperCase();
        const len = targetStr.length;

        const greenReqs = Array(len).fill(null);
        const yellowLetters = new Set();
        const grayLetters = new Set();
        const validLettersInTarget = new Set();

        for (const prev of previousGuesses) {
            const prevWord = prev.word.toUpperCase();
            const prevColors = prev.colors || computeWordleColors(prevWord, targetStr);

            for (let i = 0; i < len; i++) {
                if (prevColors[i] === "green") {
                    greenReqs[i] = prevWord[i];
                    validLettersInTarget.add(prevWord[i]);
                } else if (prevColors[i] === "yellow") {
                    yellowLetters.add(prevWord[i]);
                    validLettersInTarget.add(prevWord[i]);
                }
            }
        }

        for (const prev of previousGuesses) {
            const prevWord = prev.word.toUpperCase();
            const prevColors = prev.colors || computeWordleColors(prevWord, targetStr);

            for (let i = 0; i < len; i++) {
                if (prevColors[i] === "gray") {
                    const char = prevWord[i];
                    if (!validLettersInTarget.has(char)) {
                        grayLetters.add(char);
                    }
                }
            }
        }

        // 1. Green rule: Must reuse green letters in exact same position
        for (let i = 0; i < len; i++) {
            if (greenReqs[i] !== null && newGuess[i] !== greenReqs[i]) {
                return {
                    valid: false,
                    reason: `Hard Mode: Huruf ke-${i + 1} harus '${greenReqs[i]}'!`
                };
            }
        }

        // 2. Yellow rule: Must include yellow letters in the new guess
        for (const yellowChar of yellowLetters) {
            if (!newGuess.includes(yellowChar)) {
                return {
                    valid: false,
                    reason: `Hard Mode: Harus mengandung huruf '${yellowChar}'!`
                };
            }
        }

        // 3. Gray rule: Cannot use eliminated gray letters
        for (let i = 0; i < len; i++) {
            const char = newGuess[i];
            if (grayLetters.has(char)) {
                return {
                    valid: false,
                    reason: `Hard Mode: Huruf '${char}' sudah di-eliminasi (Abu)!`
                };
            }
        }

        return { valid: true };
    };

    const isWordInDictionary = (wordStr) => {
        if (!wordStr) return false;
        const word = wordStr.toLowerCase();
        const activeDictHost = dictionaryCache.current[languageRef.current]?.dict || dictionaryCache.current.EN?.dict;
        const isInEN = activeDictHost?.has(word) || false;
        const isInID = dictionaryCache.current.ID?.dict?.has(word) || false;
        const isInKamus = kamusTambahanRef.current?.has(word) || false;
        const isInMinigame = miniGameWordsRef.current?.some(w => w.toLowerCase() === word) || false;
        return isInEN || isInID || isInKamus || isInMinigame;
    };

    const startNewWord500 = () => {
        if (miniGameWordsRef.current.length === 0) return;

        if (!unplayedWord500WordsRef.current || unplayedWord500WordsRef.current.length === 0) {
            const validWords = activeMinigameRef.current === "WORDLE"
                ? miniGameWordsRef.current.filter(w => w.length === 6)
                : miniGameWordsRef.current.filter(w => w.length >= 5 && w.length <= 6);
            unplayedWord500WordsRef.current = validWords.length > 0 ? [...validWords] : [...miniGameWordsRef.current];
        }

        const randomIndex = Math.floor(Math.random() * unplayedWord500WordsRef.current.length);
        const word = unplayedWord500WordsRef.current[randomIndex];
        
        unplayedWord500WordsRef.current.splice(randomIndex, 1);
        
        setWord500Target(word);
        setWord500Guesses([]);
        setWord500Winner(null);
    };

    const checkWord500Guess = (guess, target) => {
        let green = 0; let yellow = 0; let red = 0;
        let targetArr = target.toUpperCase().split("");
        let guessArr = guess.toUpperCase().split("");
        for (let i = 0; i < targetArr.length; i++) {
            if (guessArr[i] === targetArr[i]) {
                green++; targetArr[i] = null; guessArr[i] = null;
            }
        }
        for (let i = 0; i < guessArr.length; i++) {
            if (guessArr[i] !== null) {
                const idx = targetArr.indexOf(guessArr[i]);
                if (idx !== -1) { yellow++; targetArr[idx] = null; } else { red++; }
            }
        }
        return { green, yellow, red };
    };

    const handleRevealWord500 = (e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        if (!word500TargetRef.current || word500WinnerRef.current) return;
        const ans = word500TargetRef.current.toUpperCase();
        if (activeMinigameRef.current === "WORD500" || activeMinigameRef.current === "WORDLE") {
            const guess = {
                word: ans, green: ans.length, yellow: 0, red: 0,
                nickname: "Sistem", profilePictureUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=System"
            };
            if (activeMinigameRef.current === "WORDLE") guess.colors = Array(ans.length).fill("green");
            
            setWord500Guesses(prev => {
                const next = [...prev, guess];
                if (activeMinigameRef.current === "WORDLE" && next.length > 6) return next.slice(next.length - 6);
                return next;
            });
            playSound("wrong");
            
            if (activeMinigameRef.current === "WORDLE") {
                setWord500Winner({ nickname: "Sistem (Spill)", isFail: true, profilePictureUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=System" });
                setTimeout(() => { setWord500FlipPhase("flipping"); }, 800);
                setTimeout(() => { setWord500FlipPhase("winner"); }, 1400);
                setTimeout(() => { setWord500FlipPhase(null); startNewWord500(); }, 6000);
            } else {
                setTimeout(() => startNewWord500(), 4000);
            }
        } else if (activeMinigameRef.current === "AUTO_WORDLE") {
            setAutoWordleGuess({
                word: ans,
                colors: Array(ans.length).fill("green")
            });
            setWord500Winner({ nickname: "Sistem (Spill)", profilePictureUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=System" });
            playSound("wrong");
            setTimeout(() => { setWord500FlipPhase("flipping"); }, 1500);
            setTimeout(() => { setWord500FlipPhase("winner"); }, 2100);
            setTimeout(() => { setWord500FlipPhase(null); startNewWord500(); }, 6000);
        }
    };

    useEffect(() => {
        let interval;
        if (activeMinigame === "AUTO_WORDLE" && word500Target) {
            if (!word500Winner) {
                const generateGuess = () => {
                    const targetLen = word500Target.length;
                    const sameLengthWords = miniGameWordsRef.current.filter(w => w.length === targetLen && w !== word500Target);
                    if (sameLengthWords.length > 0) {
                        const guessWord = sameLengthWords[Math.floor(Math.random() * sameLengthWords.length)];
                        const guessArr = guessWord.toUpperCase().split("");
                        const targetArr = word500Target.toUpperCase().split("");
                        const colors = Array(targetLen).fill("gray");
                        
                        for (let i = 0; i < targetLen; i++) {
                            if (guessArr[i] === targetArr[i]) {
                                colors[i] = "green";
                                targetArr[i] = null;
                                guessArr[i] = null;
                            }
                        }
                        for (let i = 0; i < targetLen; i++) {
                            if (guessArr[i] !== null) {
                                const idx = targetArr.indexOf(guessArr[i]);
                                if (idx !== -1) {
                                    colors[i] = "yellow";
                                    targetArr[idx] = null;
                                }
                            }
                        }
                        setAutoWordleGuess({ word: guessWord, colors });
                    }
                };
                generateGuess();
                interval = setInterval(generateGuess, 4000); // 4 seconds
            }
        } else {
            setAutoWordleGuess(null);
        }
        return () => clearInterval(interval);
    }, [activeMinigame, word500Target, word500Winner]);

    useEffect(() => {
        if (activeMinigame === "WORD500" && word500EndRef.current) {
            word500EndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [word500Guesses, activeMinigame]);

    useEffect(() => {
        // Load kamus_tambahan.txt (ID) dan dictionary.txt (EN) ke ref terpisah untuk validasi Word500
        Promise.allSettled([
            fetch("/kamus_tambahan.txt").then(r => r.ok ? r.text() : Promise.reject("kamus_tambahan error")),
            fetch("/dictionary.txt").then(r => r.ok ? r.text() : Promise.reject("dictionary error"))
        ]).then(results => {
            let combinedWords = new Set();
            results.forEach((result, idx) => {
                if (result.status === 'fulfilled') {
                    const words = result.value.split(/\r?\n/)
                        .map(w => w.trim().toLowerCase())
                        .filter(w => w.length >= 3 && !w.includes(" "));
                    words.forEach(w => combinedWords.add(w));
                    addLog("System", `Kamus ${idx === 0 ? 'tambahan ID' : 'EN'} dimuat: ${words.length} kata`);
                } else {
                    addLog("System", `Gagal memuat kamus ${idx === 0 ? 'tambahan ID' : 'EN'}`);
                }
            });
            kamusTambahanRef.current = combinedWords;
        });

        fetch("/minigame.txt")
            .then(res => {
                if (!res.ok) throw new Error("File minigame.txt tidak ditemukan");
                return res.text();
            })
            .then(text => {
                const rawWords = text.split(/\r?\n/)
                    .map(w => w.trim().toUpperCase())
                    .filter(w => w.length > 0 && !w.includes(" "));

                const uniqueWords = Array.from(new Set(rawWords));

                if (uniqueWords.length > 0) {
                    miniGameWordsRef.current = uniqueWords;
                    unplayedMiniGameWordsRef.current = [...uniqueWords];
                    addLog("System", `Berhasil memuat ${uniqueWords.length} kata minigame unik!`);
                } else {
                    unplayedMiniGameWordsRef.current = [...miniGameWordsRef.current];
                }
                startNewScramble();
                startNewWord500();
            })
            .catch(() => {
                unplayedMiniGameWordsRef.current = [...miniGameWordsRef.current];
                startNewScramble();
                startNewWord500();
            });
    }, []);


    useEffect(() => {
        let interval;
        if (gameState === "ENDED" && autoRestartEnabled) {
            setRestartCountdown(35);
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
            setWaitingCountdown(30);
            addLog("System", "Lobby dibuka 30 detik untuk pemain baru!");
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
                    addLog("System", "Waktu habis. Menambahkan bot otomatis...");
                    const botCountNeeded = 2 - playersRef.current.length;
                    for (let i = 0; i < botCountNeeded; i++) {
                        const existingNames = new Set(playersRef.current.map((p) => p.nickname));
                        const midTierBots = BOT_PROFILES.filter(b => b.diff >= 3 && b.diff <= 4);
                        const availableBots = midTierBots.filter((b) => !existingNames.has(b.name));
                        if (availableBots.length === 0) {
                            joinGame(`bot_auto_${Date.now()}_${i}`, `Bot Pengganti ${i + 1}`, null, 3);
                        } else {
                            const selected = availableBots[Math.floor(Math.random() * availableBots.length)];
                            joinGame(`bot_auto_${Date.now()}_${i}`, selected.name, null, selected.diff);
                        }
                    }
                    setTimeout(() => startGame(), 500);
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
        fetch("/dictionary.txt")
            .then((res) => { if (!res.ok) throw new Error("Not found"); return res.text(); })
            .then((text) => {
                const rawWords = text.split(/\r?\n/).map(w => w.trim().replace(/^"|"$/g, "")).filter(w => w.length > 0);
                const cleanedWords = rawWords.filter((w) => !w.includes(" ")).map((w) => normalizeWord(w)).filter((w) => w.length > 0);
                const newDict = new Set(cleanedWords);
                setDictionary(newDict);
                setDictLoadedInfo(`Loaded (${cleanedWords.length})`);
                dictionaryCache.current.EN = { dict: newDict, syl: {}, info: `Loaded (${cleanedWords.length})`, phrases: new Set(FALLBACK_PHRASES_EN) };
            }).catch(() => { });
        connectWebSocket();
        return () => {
            if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
        };
    }, []);

    const triggerVisualEffect = (type, uniqueId, data) => {
        if (type === "like") {
            const now = Date.now();
            if (now - lastLikeTimeRef.current < 200) return;
            lastLikeTimeRef.current = now;
        }

        const id = `${type}-${Date.now()}-${Math.random()}`;

        // Pre-generate semua nilai random di sini agar stabil saat render
        let extraData = {};
        if (type === 'like') {
            const count = data.count || 1;
            extraData.hearts = Array.from({ length: count }).map((_, i) => ({
                tx: (Math.random() - 0.5) * 70,
                ty: -(Math.random() * 60 + 40),
                tx2: (Math.random() - 0.5) * 90,
                ty2: -(Math.random() * 100 + 70),
                rotate: (Math.random() - 0.5) * 40,
                delay: i * 0.08 + Math.random() * 0.15,
                size: Math.random() < 0.5 ? 'w-4 h-4' : Math.random() < 0.7 ? 'w-3 h-3' : 'w-5 h-5',
                color: ['text-rose-400 fill-rose-400', 'text-pink-400 fill-pink-400', 'text-red-400 fill-red-400', 'text-rose-300 fill-rose-300'][Math.floor(Math.random() * 4)],
                duration: 1.4 + Math.random() * 0.5,
            }));
        }

        setActiveEffects(prev => {
            const newEffects = [...prev, { id, type, uniqueId, ...data, ...extraData }];
            if (newEffects.length > 15) newEffects.shift();
            return newEffects;
        });

        setTimeout(() => {
            setActiveEffects(prev => prev.filter(e => e.id !== id));
        }, type === 'gift' ? 3000 : 2000);
    };

    // Dedicated connection to backend for music features and host controls
    useEffect(() => {
        let reconnectTimeout;
        const connectBackendWs = () => {
            const host = wsHostRef.current?.trim() || window.location.hostname || "localhost";
            backendWsRef.current = new WebSocket(`ws://${host}:62024`);
            backendWsRef.current.onmessage = (event) => {
                try {
                    const { event: eventName, data } = JSON.parse(event.data);
                    if (eventName === "music_state") {
                        setMusicState(data);
                    }
                } catch(err) {}
            };
            backendWsRef.current.onclose = () => {
                reconnectTimeout = setTimeout(connectBackendWs, 3000);
            };
        };
        connectBackendWs();
        return () => {
            clearTimeout(reconnectTimeout);
            if (backendWsRef.current) {
                backendWsRef.current.onclose = null;
                backendWsRef.current.close();
            }
        };
    }, []);

    const connectWebSocket = () => {
        const source = connectionSourceRef.current;
        let hostname;
        let port = 62024;

        if (source === "TIKFINITY") {
            // TikFinity: always localhost:21213 (TikFinity desktop app WebSocket API)
            hostname = wsHostRef.current?.trim() || "localhost";
            port = 21213;
        } else {
            // LOCAL: own server.js backend
            if (wsHostRef.current && wsHostRef.current.trim()) {
                hostname = wsHostRef.current.trim();
            } else {
                hostname = fallbackToLocalhostRef.current ? "localhost" : window.location.hostname || "localhost";
            }
        }

        const url = `ws://${hostname}:${port}`;
        try {
            wsRef.current = new WebSocket(url);
            wsRef.current.onopen = () => {
                if (source === "TIKFINITY") {
                    // TikFinity handles TikTok connection itself — mark as tiktok_ready directly
                    setConnectionStatus("tiktok_ready");
                    addLog("System", `Terhubung ke TikFinity (${hostname}) 🟢`);
                } else {
                    setConnectionStatus("ws_only");
                    addLog("System", `Connected to Backend (${hostname})`);
                }
                // Only clear fallback after connection is stable (don't reset immediately
                // to avoid hostname/localhost ping-pong on flaky networks)
                if (wsHostRef.current && wsHostRef.current.trim()) {
                    fallbackToLocalhostRef.current = false;
                }
                reconnectAttemptsRef.current = 0;
                if (source === "TIKFINITY") playSound("notification");

                // Auto-resume jika sebelumnya di-pause oleh disconnect
                if (pausedByDisconnectRef.current && gameStateRef.current === "PAUSED") {
                    pausedByDisconnectRef.current = false;
                    setGameState("PLAYING");
                    addLog("System", "▶️ Koneksi pulih! Game dilanjutkan otomatis.");
                    playSound("start");
                }
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
                    if (eventName === "like") {
                        const count = data.likeCount || 1;
                        triggerVisualEffect("like", data.uniqueId, {
                            nickname: data.nickname,
                            profilePictureUrl: data.profilePictureUrl,
                            count: Math.min(count, 5)
                        });
                        if (likeHandlerRef.current) likeHandlerRef.current(count);
                    }

                    if (eventName === "tiktok_connected") {
                        setConnectionStatus("tiktok_ready");
                        addLog("System", `Terkoneksi ke TikTok Live! 🟢`);
                        playSound("notification");
                    }
                    if (eventName === "music_state") {
                        setMusicState(data);
                    }
                    if (eventName === "tiktok_disconnected") {
                        setConnectionStatus(source === "TIKFINITY" ? "tiktok_ready" : "ws_only");
                        addLog("System", `Terputus dari TikTok Live 🔴`);
                    }
                } catch (err) { console.error("WS Error", err); }
            };
            wsRef.current.onerror = (err) => {
                console.error("[WS] Connection error:", err);
                // onerror is always followed by onclose, so reconnect logic is handled there
            };
            wsRef.current.onclose = () => {
                setConnectionStatus("disconnected");

                // Auto-pause jika sedang bermain saat koneksi putus
                if (gameStateRef.current === "PLAYING") {
                    pausedByDisconnectRef.current = true;
                    setGameState("PAUSED");
                    addLog("System", "⏸️ Koneksi terputus! Game di-pause otomatis.");
                    playSound("notification");
                }

                if (source !== "TIKFINITY" && !fallbackToLocalhostRef.current && window.location.hostname !== "localhost") {
                    fallbackToLocalhostRef.current = true;
                }
                reconnectAttemptsRef.current += 1;
                // Exponential backoff: 2s, 4s, 8s, capped at 15s
                const delay = Math.min(2000 * Math.pow(2, reconnectAttemptsRef.current - 1), 15000);
                addLog("System", `🔄 Mencoba reconnect dalam ${delay/1000}s... (percobaan ke-${reconnectAttemptsRef.current})`);
                setTimeout(connectWebSocket, delay);
            };
        } catch (err) {
            console.error("[WS] Failed to create WebSocket:", err);
            reconnectAttemptsRef.current += 1;
            const delay = Math.min(2000 * Math.pow(2, reconnectAttemptsRef.current - 1), 15000);
            setTimeout(connectWebSocket, delay);
        }
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
        const usedIds = sessionUsedChallengeIdsRef.current;
        const total = DYNAMIC_CHALLENGES.length;

        // Jika semua rule sudah pernah tampil, reset sesi dan log notifikasi
        if (usedIds.size >= total) {
            usedIds.clear();
            addLog("System", `🔁 Semua ${total} aturan sudah tampil! Siklus dimulai ulang.`);
        }

        // Saring hanya rule yang BELUM dipakai di sesi ini
        const unused = DYNAMIC_CHALLENGES.filter(c => !usedIds.has(c.id));

        // Urutkan per tier lalu shuffle dalam tier, sama seperti sebelumnya
        const byTier = (tier) => shuffle(unused.filter(c => c.tier === tier));
        return [...byTier(1), ...byTier(2), ...byTier(3), ...byTier(4)];
    };

    const getNextChallenge = (queue, currentSuffix, nextOverlapLength) => {
        // nextOverlapLength = the overlap that will be active when the next word is played
        const effectiveOverlap = nextOverlapLength ?? currentSuffix.length;
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
            else if (challenge.id === "SECOND_VOWEL") {
                // If overlap >= 2, the 2nd letter of every next word is already fixed (= suffix[1]).
                // If that fixed letter is a consonant, SECOND_VOWEL is impossible.
                if (effectiveOverlap >= 2) {
                    const fixedSecondChar = currentSuffix.length >= 2 ? currentSuffix[1] : null;
                    if (fixedSecondChar && !/[aeiou]/i.test(fixedSecondChar)) isSafe = false;
                }
                // If overlap == 1, suffix[0] is the first letter — 2nd letter is free, so always safe.
            }
            else if (challenge.id === "EXACT_4" && currentSuffix.length >= 4) isSafe = false;
            else if (challenge.id === "MAX_5" && currentSuffix.length >= 5) isSafe = false;
            else if (challenge.id === "EXACT_6" && currentSuffix.length >= 6) isSafe = false;
            else if (challenge.id.startsWith("NO_")) {
                const forbiddenChars = challenge.id.replace("NO_", "").toLowerCase().split("_");
                if (forbiddenChars.some((char) => currentSuffix.includes(char))) isSafe = false;
            }

            if (isSafe) {
                const selected = tempQueue.splice(i, 1)[0];
                // Catat ke session tracker agar tidak muncul lagi sampai semua habis
                sessionUsedChallengeIdsRef.current.add(selected.id);
                return { selected, newQueue: tempQueue };
            }
        }
        // Tidak ada challenge yang aman dari queue saat ini — generate ulang dari awal
        const freshQueue = generateChallengeQueue();
        const fallback = freshQueue.shift();
        if (fallback) sessionUsedChallengeIdsRef.current.add(fallback.id);
        return { selected: fallback, newQueue: freshQueue };
    };

    function getLogicOptions() {
        return {
            gameMode: gameModeRef.current ?? gameMode,
            overlapLength: overlapLengthRef.current ?? overlapLength,
            targetRhyme: targetRhymeRef.current ?? targetRhyme,
            language: languageRef.current ?? language,
            syllableMap: syllableMapRef.current ?? syllableMap,
            phraseDictionary: phraseDictionary.current ?? phraseDictionary,
            activeChallenge: activeChallengeRef.current ?? activeChallenge,
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

            // ── IMPORTANT: update overlap FIRST so challenge selection uses the correct new overlap ──
            let nextOverlapForChallenge = overlapLengthRef.current;
            if (overlapModeRef.current === "SEQUENTIAL" && gameModeRef.current !== "FILL_BLANK") {
                let nextSeq = overlapLengthRef.current + 1;
                if (nextSeq > 4) nextSeq = 2; // Siklus 2 -> 3 -> 4 -> 2
                setOverlapLength(nextSeq);
                overlapLengthRef.current = nextSeq;
                nextOverlapForChallenge = nextSeq;
                addLog("System", `🔄 Ronde Baru! Syarat Overlap: ${nextSeq} Huruf`);
                playSound("notification");
            }

            if (gameModeRef.current === "DYNAMIC" && gameStateRef.current !== "ENDED") {
                // Use the NEXT overlap (already updated above) so safety check is accurate
                const suffix = wordToUse.slice(-nextOverlapForChallenge).toLowerCase();
                const { selected, newQueue } = getNextChallenge(challengeQueueRef.current, suffix, nextOverlapForChallenge);
                setActiveChallenge(selected);
                activeChallengeRef.current = selected;
                setChallengeQueue(newQueue);
                challengeQueueRef.current = newQueue;
                const label = (languageRef.current === "ID" || languageRef.current === "MIX") && selected.labelID ? selected.labelID : selected.label;
                addLog("System", `🚨 ${t("log_rule_change")}: ${label} 🚨`);
                playSound("tick");
            }

            if (gameModeRef.current === "RHYME") {
                setTimeout(changeRhymeTarget, 800);
            }
            if (gameModeRef.current === "FILL_BLANK") {
                // Cari pemain berikutnya untuk sesuaikan kesulitan pola berdasarkan tier
                let nextTargetIdx = startIndex;
                let stFound = 0;
                let att = 0;
                const dirRound = isReversedRef.current ? -1 : 1;
                while (stFound < steps && att < len * 2) {
                    nextTargetIdx = (nextTargetIdx + dirRound + len) % len;
                    if (!currentPlayersList[nextTargetIdx].isEliminated) stFound++;
                    att++;
                }
                const nextPlayerObj = currentPlayersList[nextTargetIdx];
                const nextPlayerTierObj = nextPlayerObj.isBot ? TIER_LEVELS[Math.min(5, Math.max(0, (nextPlayerObj.botDifficulty || 3) - 1))] : getPlayerTier(nextPlayerObj.stats);

                const baseW = getNewRandomWord();
                const pat = generatePattern(baseW, dictionary, usedWordsRef.current, lastPatternTypeRef.current, nextPlayerTierObj.level);
                setCurrentWord(pat.display);
                currentWordRef.current = pat.display;
                lastPatternTypeRef.current = pat.type;
                addLog("System", `🔄 Pola Baru: ${pat.display.toUpperCase()}`);
                playSound("tick");
            }
            if (gameModeRef.current === "INFIKS") {
                const newFragment = generateInfixFragment();
                setCurrentWord(newFragment);
                currentWordRef.current = newFragment;
                addLog("System", `💣 Fragment Baru: ${newFragment.toUpperCase()}`);
                playSound("tick");
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
        
        setRoundStarterId((prevStarterId) => {
            if (prevStarterId === playerToEliminate.uniqueId) {
                const len = newPlayers.length;
                let nextIdx = (currentIndex + 1) % len;
                let attempts = 0;
                while (newPlayers[nextIdx].isEliminated && attempts < len) {
                    nextIdx = (nextIdx + 1) % len;
                    attempts++;
                }
                return newPlayers[nextIdx]?.uniqueId || null;
            }
            return prevStarterId;
        });

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
            if (activePlayers.length === 1) {
                // Cek: jika tidak ada yang pernah menjawab benar, pemain terakhir menang tanpa usaha → SERI
                if (lastSuccessfulPlayerIdRef.current === null) {
                    addLog("System", `⚠️ Tidak ada yang berhasil menjawab! Permainan berakhir SERI.`);
                    showFeedback("Tidak ada pemenang! SERI!", "warning");
                    setGameState("ENDED");
                    playSound("win");
                } else {
                    handleWin([activePlayers[0]]);
                }
            }
            else { setGameState("ENDED"); playSound("win"); }
        } else {
            if (gameModeRef.current === "RHYME") {
                setTimeout(changeRhymeTarget, 500);
            }
            // Clamp turnCountRef to the new active count - 1 instead of resetting to 0.
            // Hard-resetting would wipe round progress and cause rule changes at wrong times
            // in DYNAMIC mode (turnCount would immediately hit the smaller activeCount threshold).
            const newActiveCount = activePlayers.length;
            turnCountRef.current = Math.min(turnCountRef.current, Math.max(0, newActiveCount - 1));
            advanceTurn(newPlayers, currentIndex, 1);
        }
    }


    const hasPossibleAnswer = (startWord, specificOverlap = null) => {
        let patternToTest = startWord;
        if (gameModeRef.current === "FILL_BLANK" && !startWord.includes("...")) {
            patternToTest = generatePattern(startWord, dictionary, usedWordsRef.current, lastPatternTypeRef.current).display;
        }

        const localOptions = { ...getLogicOptions(), overlapLength: specificOverlap ?? overlapLengthRef.current };

        let found = false;
        for (const candidate of dictionary) {
            if (usedWordsRef.current.has(candidate) || candidate === startWord) continue;
            if (maxWordLengthRef.current > 0 && candidate.length > maxWordLengthRef.current) continue;
            if (validateConnection(patternToTest, candidate, localOptions)) { found = true; break; }
        }

        return found;
    };

    const countPossibleAnswers = (startWord, specificOverlap = null) => {
        let patternToTest = startWord;
        if (gameModeRef.current === "FILL_BLANK" && !startWord.includes("...")) {
            patternToTest = generatePattern(startWord, dictionary, usedWordsRef.current, lastPatternTypeRef.current).display;
        }

        const localOptions = { ...getLogicOptions(), overlapLength: specificOverlap ?? overlapLengthRef.current };

        let count = 0;
        for (const candidate of dictionary) {
            if (usedWordsRef.current.has(candidate) || candidate === startWord) continue;
            if (maxWordLengthRef.current > 0 && candidate.length > maxWordLengthRef.current) continue;
            if (validateConnection(patternToTest, candidate, localOptions)) {
                count++;
                if (count > 1) break;
            }
        }

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
        
        setRoundStarterId((prevStarterId) => {
            if (prevStarterId === playerToSurrender.uniqueId) {
                const len = newPlayers.length;
                let nextIdx = (pIndex + 1) % len;
                let attempts = 0;
                while (newPlayers[nextIdx].isEliminated && attempts < len) {
                    nextIdx = (nextIdx + 1) % len;
                    attempts++;
                }
                return newPlayers[nextIdx]?.uniqueId || null;
            }
            return prevStarterId;
        });

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
            if (activePlayers.length === 1) {
                // Cek: jika tidak ada yang pernah menjawab benar, pemain terakhir menang tanpa usaha → SERI
                if (lastSuccessfulPlayerIdRef.current === null) {
                    addLog("System", `⚠️ Tidak ada yang berhasil menjawab! Permainan berakhir SERI.`);
                    showFeedback("Tidak ada pemenang! SERI!", "warning");
                    setGameState("ENDED");
                    playSound("win");
                } else {
                    handleWin([activePlayers[0]]);
                }
            }
            else { setGameState("ENDED"); playSound("win"); }
        } else if (isActivePlayer) {
            if (gameModeRef.current === "RHYME") {
                setTimeout(changeRhymeTarget, 500);
            }
            // Clamp, don't reset — preserve round progress
            const newActiveCount = activePlayers.length;
            turnCountRef.current = Math.min(turnCountRef.current, Math.max(0, newActiveCount - 1));
            advanceTurn(newPlayers, pIndex, 1);
        } else {
            // Pemain mati bukan saat gilirannya: clamp turnCountRef agar tidak overshoot
            // karena activeCount sekarang berkurang 1
            const newActiveCount = newPlayers.filter(p => !p.isEliminated).length;
            if (turnCountRef.current >= newActiveCount) {
                turnCountRef.current = Math.max(0, newActiveCount - 1);
            }
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
                const alt = targets.filter(item => item !== newTarget);
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
                } else if (gameModeRef.current === "INFIKS") {
                    const fragment = currentWordRef.current.toLowerCase();
                    const lowWord = word.toLowerCase();
                    const matches = lowWord.split(fragment).length - 1;
                    
                    const letterCounts = {};
                    for (let c of lowWord) {
                        letterCounts[c] = (letterCounts[c] || 0) + 1;
                    }
                    
                    let uniqueScore = 0;
                    for (let c in letterCounts) {
                        if (letterCounts[c] === 1) uniqueScore += 2;
                        else if (letterCounts[c] > 2) uniqueScore -= (letterCounts[c] - 2);
                    }
                    
                    const fragmentBonus = (matches > 1) ? (matches * 5) : 0;
                    pointsAwarded = uniqueScore + fragmentBonus;
                    if (pointsAwarded < -5) pointsAwarded = -5;
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
                let nextTargetIdx = playerIndex;
                let stepsTaken = 0;
                let attempts = 0;
                const len = modifiedPlayers.length;
                const direction = isReversedRef.current ? -1 : 1;
                while (stepsTaken < stepsToAdvance && attempts < len * 2) {
                    nextTargetIdx = (nextTargetIdx + direction + len) % len;
                    if (!modifiedPlayers[nextTargetIdx].isEliminated) stepsTaken++;
                    attempts++;
                }
                const nextPlayerObj = modifiedPlayers[nextTargetIdx];
                const nextPlayerTierObj = nextPlayerObj.isBot ? TIER_LEVELS[Math.min(5, Math.max(0, (nextPlayerObj.botDifficulty || 3) - 1))] : getPlayerTier(nextPlayerObj.stats);
                const pat = generatePattern(word, dictionary, usedWordsRef.current, lastPatternTypeRef.current, nextPlayerTierObj.level);
                nextWord = pat.display;
                lastPatternTypeRef.current = pat.type;
            } else if (gameModeRef.current === "INFIKS") {
                nextWord = currentWordRef.current;
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
                addLog("Game", `✅ ${word.toUpperCase()}${pts}`);
            } else if (gameModeRef.current === "INFIKS") {
                addLog("Game", `✅ ${word.toUpperCase()} ${pts}`);
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
                setLastInputWord(word);
                lastInputWordRef.current = word;
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

        if (playersRef.current.length >= maxPlayers) {
            playerQueueRef.current = [...playerQueueRef.current, newPlayer];
            setPlayerQueue([...playerQueueRef.current]);
            addLog("System", `Lobby penuh, ${nickname} antre!`, uniqueId);
            return;
        }

        playSound("join"); 
        if (gameStateRef.current === "PLAYING") {
            addLog("System", `${nickname} langsung ikut bermain!`, uniqueId);
        } else {
            addLog("System", `${nickname} ${t("log_joined")}`, uniqueId);
        }
        
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

    const generateInfixFragment = () => {
        const arr = Array.from(dictionary);
        if (arr.length === 0) return "an";
        for (let attempt = 0; attempt < 100; attempt++) {
            const word = arr[Math.floor(Math.random() * arr.length)];
            if (word.length >= 4) {
                const len = Math.random() < 0.6 ? 2 : 3;
                const start = Math.floor(Math.random() * (word.length - len + 1));
                const fragment = word.slice(start, start + len).toLowerCase();
                
                let count = 0;
                for (let w of arr) {
                    if (!usedWordsRef.current.has(w) && w.includes(fragment)) {
                        count++;
                        if (count >= 15) break;
                    }
                }
                if (count >= 15) return fragment;
            }
        }
        return "an";
    };

    function startGame() {
        if (playersRef.current.length < 2) return addLog("System", t("log_need_players"));
        playSound("start");
        setWaitingCountdown(null);
        bombNextRef.current = false; lastSuccessfulPlayerIdRef.current = null;
        setIsReversed(false);

        if (gameMode === "RANDOM") {
            const randomPool = [
                "LAST_LETTER", "WRAP_AROUND", "STEP_UP",
                "RHYME", "MIRROR", "PHRASE_CHAIN", "DYNAMIC", "SECOND_LETTER",
                "SYLLABLE", "LONGER_WORD", "FILL_BLANK", "INFIKS"
            ];
            const chosen = randomPool[Math.floor(Math.random() * randomPool.length)];
            gameModeRef.current = chosen;
            addLog("System", `🎲 RANDOM MODE Terpilih: ${chosen}`);
        } else {
            gameModeRef.current = gameMode;
        }

        let randomStart = "";
        let selectedChallenge = null;

        if (gameModeRef.current === "DYNAMIC") {
            const queue = generateChallengeQueue();
            const { selected, newQueue } = getNextChallenge(queue, "");
            selectedChallenge = selected;
            setActiveChallenge(selected);
            activeChallengeRef.current = selected;
            setChallengeQueue(newQueue);
            setTurnCount(0);
            turnCountRef.current = 0; // Fix: reset ref juga, bukan hanya state
            const label = (languageRef.current === "ID" || languageRef.current === "MIX") && selected?.labelID ? selected.labelID : selected?.label;
            addLog("System", `Mode: DYNAMIC CHAOS! \nRule: ${label}`);
        }

        if (gameModeRef.current === "RHYME") {
            setTargetRhyme(rhymeTargetsRef.current.length > 0 ? rhymeTargetsRef.current[Math.floor(Math.random() * rhymeTargetsRef.current.length)] : "ing");
        } else if (gameModeRef.current === "FILL_BLANK") {
            lastPatternTypeRef.current = null;
            const baseW = getNewRandomWord(selectedChallenge);
            const pat = generatePattern(baseW, dictionary, new Set(), lastPatternTypeRef.current);
            randomStart = pat.display;
            lastPatternTypeRef.current = pat.type;
        } else if (gameModeRef.current === "INFIKS") {
            randomStart = generateInfixFragment();
            setTurnCount(0);
        } else {
            randomStart = getNewRandomWord(selectedChallenge);
        }

        const initialUsed = new Set(gameModeRef.current === "FILL_BLANK" ? [] : (randomStart ? [randomStart] : []));
        setUsedWords(initialUsed); usedWordsRef.current = initialUsed;
        const updatedStatsMap = {};
        
        // Shuffle players array
        let newPlayersList = [...playersRef.current].sort(() => Math.random() - 0.5);
        newPlayersList.forEach((p) => { if (!p.isBot) updatedStatsMap[p.uniqueId] = StatsManager.update(p.uniqueId, false, true, p.nickname); });
        
        newPlayersList = newPlayersList.map((p) => ({ ...p, stats: updatedStatsMap[p.uniqueId] || p.stats, score: 0, turnCount: 0, sessionKills: 0, isEliminated: false }));
        
        playersRef.current = newPlayersList;
        setPlayers(newPlayersList);
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
        setRestartLikes(0); restartLikesRef.current = 0;
        addLog("System", `Start: ${playersRef.current[randomFirstPlayerIndex].nickname} ${t("log_goes_first")}`);
        if (randomStart) addLog("System", `Word: ${randomStart.toUpperCase()} ${cityMetadataRef.current[randomStart] ? `(${cityMetadataRef.current[randomStart]})` : ""}`);
    }

    function resetGame() {
        setGameState("WAITING");
        setWaitingCountdown(null);
        setRestartLikes(0); restartLikesRef.current = 0;
        processQueue();
        setPlayers((prev) => prev.map((p) => ({ ...p, isEliminated: false, score: 0, turnCount: 0, sessionKills: 0 })));
        setUsedWords(new Set()); setCurrentWord(""); setTargetRhyme(""); setGlobalTimer(null);
        setRoundStarterId(null); lastSuccessfulPlayerIdRef.current = null; setTimer(turnDuration);
        bombNextRef.current = false; setIsReversed(false); turnCountRef.current = 0; addLog("System", t("log_reset"));
        lastPatternTypeRef.current = null;
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
        lastPatternTypeRef.current = null;
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
            "SYLLABLE", "LONGER_WORD", "CITIES", "FILL_BLANK", "INFIKS", "RANDOM"
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
                fetch("/cities.json")
                    .then((res) => { if (!res.ok) throw new Error("cities.json not found"); return res.json(); })
                    .then((data) => {
                        if (Array.isArray(data)) loadCitiesData(data);
                        else throw new Error("Invalid format");
                    })
                    .catch(() => {
                        addLog("System", "cities.json gagal dimuat, pakai fallback.");
                        loadCitiesData(FALLBACK_CITIES);
                    });
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

        if (gameMode === "CITIES") {
            if (!forceReload) {
                setGameState("WAITING"); setPlayers((prev) => prev.map((p) => ({ ...p, isEliminated: false, score: 0, turnCount: 0, sessionKills: 0 })));
                setUsedWords(new Set()); setCurrentWord(""); setTargetRhyme(""); setGlobalTimer(null);
                setRoundStarterId(null); lastSuccessfulPlayerIdRef.current = null; setTurnCount(0);
                setActiveChallenge(null); setChallengeQueue([]); setTimer(turnDuration); addLog("System", "Language changed! (City mode kept)");
            }
            // Fix: selalu restore dictionary ke cities agar tidak tertimpa oleh kamus bahasa
            if (dictionaryCache.current.CITIES) {
                setDictionary(dictionaryCache.current.CITIES.dict);
                setCityMetadata(dictionaryCache.current.CITIES.meta);
                setDictLoadedInfo(dictionaryCache.current.CITIES.info);
            } else {
                fetch("/cities.json")
                    .then((res) => { if (!res.ok) throw new Error("cities.json not found"); return res.json(); })
                    .then((data) => { if (Array.isArray(data)) loadCitiesData(data); else throw new Error("Invalid format"); })
                    .catch(() => { loadCitiesData(FALLBACK_CITIES); });
            }
            return;
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
                try { const resEn = await fetch("/dictionary.txt"); if (resEn.ok) { const txt = await resEn.text(); rawEn = new Set(txt.split(/\r?\n/).map(w => w.trim().replace(/^"|"$/g, "")).filter(w => w.length > 0 && !w.includes(" ")).map(normalizeWord).filter(w => w.length > 0)); } } catch (e) { }
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
            fetch("/dictionary.txt").then((res) => { if (!res.ok) throw new Error(); return res.text(); }).then((text) => {
                const rawWords = text.split(/\r?\n/).map(w => w.trim().replace(/^"|"$/g, "")).filter(w => w.length > 0);
                let phraseSet = new Set(FALLBACK_PHRASES_EN);
                const cleanedWords = rawWords.filter((w) => { if (w.includes(" ")) { phraseSet.add(w.toLowerCase()); return false; } return true; }).map(normalizeWord).filter(w => w.length > 0);
                const newDict = new Set(cleanedWords);
                setDictionary(newDict); setSyllableMap({}); phraseDictionary.current = phraseSet; setDictLoadedInfo(`Dictionary.txt (${cleanedWords.length})`);
                dictionaryCache.current.EN = { dict: newDict, syl: {}, phrases: phraseSet, info: `Dictionary.txt (${cleanedWords.length})` };
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
        if (gameMode === "RANDOM") return "RANDOM MODE 🎲";
        const ovStr = overlapMode === "RANDOM" ? "RND" : overlapMode === "SEQUENTIAL" ? "SEQ" : overlapLength;
        const labels = {
            LAST_LETTER: `LAST LETTER (${ovStr})`, WRAP_AROUND: `WRAP AROUND (${ovStr})`,
            SECOND_LETTER: "2ND LETTER", RHYME: "RHYME RUSH", MIRROR: `MIRROR (${ovStr})`,
            STEP_UP: `STEP UP (${ovStr})`,
            SYLLABLE: "SYLLABLE", LONGER_WORD: `LONGER (${ovStr})`,
            CITIES: `CITIES (${ovStr})`, DYNAMIC: `DYNAMIC (${ovStr})`, PHRASE_CHAIN: "PHRASE",
            FILL_BLANK: "LENGKAPI", INFIKS: "INFIKS"
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

        // --- Viewer Music Commands (forward to backend ONLY if using TIKFINITY, as LOCAL mode backend already catches it) ---
        if (connectionSourceRef.current === "TIKFINITY") {
            if (lowerComment.startsWith("!play ")) {
                const query = comment.substring(6).trim();
                if (query && backendWsRef.current && backendWsRef.current.readyState === WebSocket.OPEN) {
                    backendWsRef.current.send(JSON.stringify({ 
                        event: 'viewer_music_request', 
                        data: { query, nickname, profilePictureUrl } 
                    }));
                }
                return;
            }
            if (lowerComment === "!skip") {
                if (backendWsRef.current && backendWsRef.current.readyState === WebSocket.OPEN) {
                    backendWsRef.current.send(JSON.stringify({ event: 'music_skip' }));
                }
                return;
            }
        }

        const isScrambleActive = activeMinigameRef.current === "ANAGRAM" && !!scrambleWordRef.current && !scrambleWinnerRef.current;
        const isWord500Active = (activeMinigameRef.current === "WORD500" || activeMinigameRef.current === "AUTO_WORDLE" || activeMinigameRef.current === "WORDLE") && !!word500TargetRef.current && !word500WinnerRef.current;
        const currentPlayer = playersRef.current[turnIndexRef.current];
        const isCurrentPlayerTurn = gameStateRef.current === "PLAYING" && currentPlayer?.uniqueId === uniqueId && !currentPlayer.isEliminated;

        // 2. Optimization: Jika tidak ada minigame aktif, dan bukan giliran orang ini, drop pesan chat!
        if (!isScrambleActive && !isWord500Active && !isCurrentPlayerTurn) {
            return;
        }

        // 3. Hanya gunakan regex setelah yakin chat perlu diproses
        // Bypass filter tiktok: hapus spasi berlebih (M A K A N -> makan) dan kata sapaan (makan bang -> makan)
        let cleanWordCheck = normalizeWord(lowerComment);
        if (cleanWordCheck.includes(" ")) {
            cleanWordCheck = cleanWordCheck.replace(/\b(bang|bg|cuy|dong|min|admin)\b/g, "").replace(/\s+/g, "");
        }
        if (isScrambleActive && cleanWordCheck === scrambleWordRef.current.toLowerCase()) {
            setScrambledDisplay(scrambleWordRef.current);
            setScrambleWinner({ nickname, profilePictureUrl: profilePictureUrl || getAvatarUrl(uniqueId) });
            playSound("notification");
            triggerTableEffect("info");
            addLog("MiniGame", `🎉 ${nickname} menebak anagram: ${scrambleWordRef.current}!`);
            
            setTimeout(() => { setAnagramFlipPhase("flipping"); }, 1000);
            setTimeout(() => { setAnagramFlipPhase("winner"); }, 1600);
            setTimeout(() => {
                setAnagramFlipPhase(null);
                startNewScramble();
            }, 5000);
            return;
        }

        if (isWord500Active && cleanWordCheck.length === word500TargetRef.current.length) {
            // Validasi kamus: cek di dictionary.txt (EN via dictionaryCache) ATAU kamus_tambahan.txt (ID)
            const activeDict = dictionaryCache.current[languageRef.current]?.dict || dictionaryCache.current.EN?.dict;
            const isInDict = activeDict?.has(cleanWordCheck.toLowerCase()) || false;
            const isInKamus = kamusTambahanRef.current.has(cleanWordCheck.toLowerCase());
            const isKnownWord = isInDict || isInKamus;

            if (!isKnownWord) {
                // Kata tidak dikenal — abaikan tanpa feedback agar tidak spam
                return;
            }

            // Prevent double inputs from the same user (Throttling based on time and uniqueId)
            const now = Date.now();
            const isDuplicate = (
                lastWordleGuessRef.current.uniqueId === uniqueId && 
                lastWordleGuessRef.current.word === cleanWordCheck && 
                now - lastWordleGuessRef.current.time < 1500
            ) || (
                word500GuessesRef.current.length > 0 && 
                word500GuessesRef.current[word500GuessesRef.current.length - 1].word === cleanWordCheck.toUpperCase() &&
                word500GuessesRef.current[word500GuessesRef.current.length - 1].nickname === nickname
            );
            
            if (!isDuplicate) {
                lastWordleGuessRef.current = { uniqueId, word: cleanWordCheck, time: now };
                const { green, yellow, red } = checkWord500Guess(cleanWordCheck, word500TargetRef.current);
                
                if (activeMinigameRef.current === "WORDLE") {
                    if (cleanWordCheck.length === 6) {
                        if (word500GuessesRef.current.length >= 6) return;

                        if (!isWordInDictionary(cleanWordCheck)) {
                            showFeedback(`"${cleanWordCheck.toUpperCase()}" tidak ada di kamus!`, "warning");
                            return;
                        }

                        const hardCheck = checkWordleHardMode(cleanWordCheck, word500TargetRef.current, word500GuessesRef.current);
                        if (!hardCheck.valid) {
                            showFeedback(hardCheck.reason, "warning");
                            addLog("MiniGame", `⚠️ ${nickname}: ${hardCheck.reason}`);
                            return;
                        }

                        const colors = computeWordleColors(cleanWordCheck, word500TargetRef.current);
                        const greenCount = colors.filter(c => c === "green").length;
                        const yellowCount = colors.filter(c => c === "yellow").length;
                        const redCount = colors.filter(c => c === "gray").length;

                        const newGuess = {
                            word: cleanWordCheck.toUpperCase(),
                            green: greenCount,
                            yellow: yellowCount,
                            red: redCount,
                            colors,
                            nickname,
                            profilePictureUrl: profilePictureUrl || getAvatarUrl(uniqueId)
                        };

                        const nextGuesses = [...word500GuessesRef.current, newGuess];
                        setWord500Guesses(nextGuesses);

                        if (greenCount === 6) {
                            setWord500Winner({ nickname, profilePictureUrl: profilePictureUrl || getAvatarUrl(uniqueId) });
                            addLog("MiniGame", `🎉 ${nickname} memenangkan Wordle: ${word500TargetRef.current}!`);
                            setAutoWordleLeaderboard(prev => {
                                const currentScore = prev[uniqueId]?.score || 0;
                                return { ...prev, [uniqueId]: { score: currentScore + 1, nickname, avatar: profilePictureUrl || getAvatarUrl(uniqueId) } };
                            });
                            setTimeout(() => { setWord500FlipPhase("flipping"); }, 800);
                            setTimeout(() => { setWord500FlipPhase("winner"); playSound("win"); triggerTableEffect("success"); }, 1400);
                            setTimeout(() => { setWord500FlipPhase(null); startNewWord500(); }, 6000);
                        } else if (nextGuesses.length >= 6) {
                            setWord500Winner({ nickname: "Gagal (6/6)", isFail: true, profilePictureUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=Failed" });
                            showFeedback(`❌ Gagal (6/6)! Jawaban: ${word500TargetRef.current}`, "warning");
                            addLog("MiniGame", `❌ 6 Kesempatan Habis! Jawaban Wordle: ${word500TargetRef.current}`);
                            playSound("wrong");
                            setTimeout(() => { setWord500FlipPhase("flipping"); }, 800);
                            setTimeout(() => { setWord500FlipPhase("winner"); }, 1400);
                            setTimeout(() => { setWord500FlipPhase(null); startNewWord500(); }, 6000);
                        } else {
                            playSound("tick");
                        }
                    }
                } else if (activeMinigameRef.current === "WORD500") {
                    const newGuess = {
                        word: cleanWordCheck.toUpperCase(),
                        green, yellow, red,
                        colors: Array(word500TargetRef.current.length).fill("gray"),
                        nickname,
                        profilePictureUrl: profilePictureUrl || getAvatarUrl(uniqueId)
                    };
                    setWord500Guesses(prev => [...prev, newGuess]);
                }

                if (activeMinigameRef.current === "WORD500") {
                    if (green === word500TargetRef.current.length) {
                        setWord500Winner({ nickname, profilePictureUrl: profilePictureUrl || getAvatarUrl(uniqueId) });
                        addLog("MiniGame", `🎉 ${nickname} memenangkan Word500: ${word500TargetRef.current}!`);
                        setTimeout(() => { setWord500FlipPhase("flipping"); }, 800);
                        setTimeout(() => { setWord500FlipPhase("winner"); playSound("win"); triggerTableEffect("success"); }, 1400);
                        setTimeout(() => { setWord500FlipPhase(null); startNewWord500(); }, 6000);
                    } else {
                        playSound("tick");
                    }
                }
            }
            // Removed return; so the input can also be processed for Sambung Kata
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

        const rawInput = manualInput.trim();
        const lowerRaw = rawInput.toLowerCase();

        // --- Host Music Commands ---
        if (lowerRaw.startsWith("!play ")) {
            const query = rawInput.substring(6).trim();
            if (query && backendWsRef.current && backendWsRef.current.readyState === WebSocket.OPEN) {
                backendWsRef.current.send(JSON.stringify({ event: 'host_music_request', data: { query } }));
                showFeedback(`Mencari musik: ${query}`, "info");
            }
            setManualInput("");
            return;
        }
        if (lowerRaw === "!skip") {
            if (backendWsRef.current && backendWsRef.current.readyState === WebSocket.OPEN) {
                backendWsRef.current.send(JSON.stringify({ event: 'music_skip' }));
                showFeedback("Melewati musik", "info");
            }
            setManualInput("");
            return;
        }

        const lower = lowerRaw;
        const cleanWordCheck = normalizeWord(lower);

        if (activeMinigameRef.current === "ANAGRAM" && scrambleWordRef.current && cleanWordCheck === scrambleWordRef.current.toLowerCase() && !scrambleWinnerRef.current) {
            setScrambledDisplay(scrambleWordRef.current);
            setScrambleWinner({ nickname: "HOST (You)", profilePictureUrl: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=HOST` });
            playSound("notification");
            triggerTableEffect("info");
            addLog("MiniGame", `🎉 HOST menebak anagram: ${scrambleWordRef.current}!`);
            
            setTimeout(() => { setAnagramFlipPhase("flipping"); }, 1000);
            setTimeout(() => { setAnagramFlipPhase("winner"); }, 1600);
            setTimeout(() => {
                setAnagramFlipPhase(null);
                startNewScramble();
            }, 5000);
            setManualInput("");
            return;
        }

        if (activeMinigameRef.current === "WORDLE" && word500TargetRef.current && cleanWordCheck.length === 6 && !word500WinnerRef.current) {
            if (word500GuessesRef.current.length >= 6) {
                setManualInput("");
                return;
            }

            if (!isWordInDictionary(cleanWordCheck)) {
                showFeedback(`"${cleanWordCheck.toUpperCase()}" tidak ada di kamus!`, "warning");
                setManualInput("");
                return;
            }

            const hardCheck = checkWordleHardMode(cleanWordCheck, word500TargetRef.current, word500GuessesRef.current);
            if (!hardCheck.valid) {
                showFeedback(hardCheck.reason, "warning");
                setManualInput("");
                return;
            }

            const colors = computeWordleColors(cleanWordCheck, word500TargetRef.current);
            const greenCount = colors.filter(c => c === "green").length;
            const yellowCount = colors.filter(c => c === "yellow").length;
            const redCount = colors.filter(c => c === "gray").length;

            const newGuess = {
                word: cleanWordCheck.toUpperCase(),
                green: greenCount,
                yellow: yellowCount,
                red: redCount,
                colors,
                nickname: "HOST (You)",
                profilePictureUrl: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=HOST`
            };

            const nextGuesses = [...word500GuessesRef.current, newGuess];
            setWord500Guesses(nextGuesses);
            setManualInput("");

            if (greenCount === 6) {
                setWord500Winner({ nickname: "HOST (You)", profilePictureUrl: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=HOST` });
                addLog("MiniGame", `🎉 HOST memenangkan Wordle: ${word500TargetRef.current}!`);
                setAutoWordleLeaderboard(prev => {
                    const currentScore = prev["HOST"]?.score || 0;
                    return { ...prev, ["HOST"]: { score: currentScore + 1, nickname: "HOST (You)", avatar: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=HOST` } };
                });
                setTimeout(() => { setWord500FlipPhase("flipping"); }, 800);
                setTimeout(() => { setWord500FlipPhase("winner"); playSound("win"); triggerTableEffect("success"); }, 1400);
                setTimeout(() => { setWord500FlipPhase(null); startNewWord500(); }, 6000);
            } else if (nextGuesses.length >= 6) {
                setWord500Winner({ nickname: "Gagal (6/6)", isFail: true, profilePictureUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=Failed" });
                showFeedback(`❌ Gagal (6/6)! Jawaban: ${word500TargetRef.current}`, "warning");
                addLog("MiniGame", `❌ 6 Kesempatan Habis! Jawaban Wordle: ${word500TargetRef.current}`);
                playSound("wrong");
                setTimeout(() => { setWord500FlipPhase("flipping"); }, 800);
                setTimeout(() => { setWord500FlipPhase("winner"); }, 1400);
                setTimeout(() => { setWord500FlipPhase(null); startNewWord500(); }, 6000);
            } else {
                playSound("tick");
            }
            return;
        }

        if ((activeMinigameRef.current === "WORD500" || activeMinigameRef.current === "AUTO_WORDLE") && word500TargetRef.current && cleanWordCheck.length === word500TargetRef.current.length && !word500WinnerRef.current) {
            // Validasi kamus untuk HOST: cek di dictionary.txt (EN via dictionaryCache) ATAU kamus_tambahan.txt (ID)
            const activeDictHost = dictionaryCache.current[languageRef.current]?.dict || dictionaryCache.current.EN?.dict;
            const isInDictHost = activeDictHost?.has(cleanWordCheck.toLowerCase()) || false;
            const isInKamusHost = kamusTambahanRef.current.has(cleanWordCheck.toLowerCase());
            if (!isInDictHost && !isInKamusHost) {
                showFeedback(`"${cleanWordCheck.toUpperCase()}" tidak ada di kamus!`, "warning");
            } else {
                const { green, yellow, red } = checkWord500Guess(cleanWordCheck, word500TargetRef.current);
                
                if (activeMinigameRef.current === "WORD500") {
                    const newGuess = {
                        word: cleanWordCheck.toUpperCase(),
                        green, yellow, red,
                        nickname: "HOST (You)",
                        profilePictureUrl: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=HOST`
                    };
                    setWord500Guesses(prev => [...prev, newGuess]);
                }
                
                if (green === word500TargetRef.current.length) {
                    setWord500Winner({ nickname: "HOST (You)", profilePictureUrl: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=HOST` });
                    addLog("MiniGame", `🎉 HOST memenangkan Word500: ${word500TargetRef.current}!`);
                    
                    if (activeMinigameRef.current === "AUTO_WORDLE" || activeMinigameRef.current === "WORDLE") {
                        setAutoWordleLeaderboard(prev => {
                            const currentScore = prev["HOST"]?.score || 0;
                            return { ...prev, ["HOST"]: { score: currentScore + 1, nickname: "HOST (You)", avatar: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=HOST` } };
                        });
                    }
                    
                    if (activeMinigameRef.current === "AUTO_WORDLE") {
                        
                        setAutoWordleGuess({
                            word: word500TargetRef.current.toUpperCase(),
                            colors: Array(word500TargetRef.current.length).fill("green")
                        });
                        setTimeout(() => { setWord500FlipPhase("flipping"); }, 1500);
                        setTimeout(() => { setWord500FlipPhase("winner"); playSound("win"); triggerTableEffect("success"); }, 2100);
                        setTimeout(() => { setWord500FlipPhase(null); startNewWord500(); }, 6000);
                    } else {
                        // Show correct answer row first, then flip after 800ms
                        setTimeout(() => { setWord500FlipPhase("flipping"); }, 800);
                        setTimeout(() => { setWord500FlipPhase("winner"); playSound("win"); triggerTableEffect("success"); }, 1400);
                        setTimeout(() => { setWord500FlipPhase(null); startNewWord500(); }, 6000);
                    }
                } else {
                    playSound("tick");
                }
            }
            // Removed return; so the input can also be processed for Sambung Kata
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
            default: return TABLE_THEMES[tableTheme] || TABLE_THEMES.midnight;
        }
    };

    // isMobile is now a reactive state declared at the top of the component

    // --- LOGIKA DINAMIS RADIUS & SKALA AVATAR ---
    const activePlayers = players.filter(p => !p.isEliminated);
    const playerCount = Math.max(activePlayers.length, 1);
    
    const baseRadius = (gameState === "WAITING" && waitingCountdown === null) ? (isMobile ? 135 : 170) : (isMobile ? 185 : 260);
    // 1. Tambahkan jarak radius secara bertahap jika pemain banyak, namun batasi agar tidak keluar layar monitor/HP
    const extraRadius = Math.max(0, playerCount - 8) * (isMobile ? 4 : 8);
    const dynamicRadius = baseRadius + Math.min(extraRadius, isMobile ? 35 : 60);

    // 2. Perkecil ukuran profil (scale down) secara otomatis jika pemain lebih dari 6
    const dynamicScale = playerCount > 6 ? Math.max(0.45, 1 - (playerCount - 6) * 0.045) : 1;


    const triggerAutoRestartGame = () => {
        setRestartCountdown(null);
        setWaitingCountdown(null);
        setRestartLikes(0);
        restartLikesRef.current = 0;
        addLog("System", "⚡ 200 Tap-Tap Likes tercapai! Memulai kembali permainan...");
        playSound("notification");
        processQueue(); // Add queued players to the game

        if (playersRef.current.length < 2) {
            const botCountNeeded = 2 - playersRef.current.length;
            for (let i = 0; i < botCountNeeded; i++) {
                const existingNames = new Set(playersRef.current.map((p) => p.nickname));
                const midTierBots = BOT_PROFILES.filter(b => b.diff >= 3 && b.diff <= 4);
                const availableBots = midTierBots.filter((b) => !existingNames.has(b.name));
                if (availableBots.length === 0) {
                    joinGame(`bot_auto_${Date.now()}_${i}`, `Bot Pengganti ${i + 1}`, null, 3);
                } else {
                    const selected = availableBots[Math.floor(Math.random() * availableBots.length)];
                    joinGame(`bot_auto_${Date.now()}_${i}`, selected.name, null, selected.diff);
                }
            }
        }
        setTimeout(() => startGame(), 300);
    };

    const handleAddRestartLikes = (count = 1) => {
        if (!autoRestartEnabledRef.current) return;
        if (gameStateRef.current !== "ENDED" && gameStateRef.current !== "WAITING") return;

        setRestartLikes(prev => {
            const nextVal = prev + count;
            restartLikesRef.current = nextVal;
            if (nextVal >= TARGET_RESTART_LIKES) {
                setTimeout(() => {
                    triggerAutoRestartGame();
                }, 100);
            }
            return nextVal;
        });
    };

    useEffect(() => {
        likeHandlerRef.current = handleAddRestartLikes;
    });

    const renderLikeRestartMeter = () => {
        if (!autoRestartEnabled) return null;
        const progressPercent = Math.min(100, (restartLikes / TARGET_RESTART_LIKES) * 100);
        return (
            <div 
                onClick={() => handleAddRestartLikes(10)}
                title="Klik untuk simulasi +10 Likes"
                className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto my-1 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 shadow-[0_0_15px_rgba(251,191,36,0.15)] backdrop-blur-md transition-all duration-300 hover:border-amber-400 cursor-pointer group select-none"
            >
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
                        <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 via-yellow-300 to-emerald-300 bg-clip-text text-transparent truncate">
                            TAP-TAP 200 LIKES UNTUK START
                        </span>
                    </div>
                    <div className="flex items-center gap-0.5 font-mono text-[10px] font-bold text-amber-300 shrink-0">
                        <span>{Math.min(restartLikes, TARGET_RESTART_LIKES)}</span>
                        <span className="text-amber-500/70">/{TARGET_RESTART_LIKES}</span>
                    </div>
                </div>

                {/* Meter Track - Ultra Compact */}
                <div className="relative w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-amber-500/30">
                    <div
                        style={{ width: `${progressPercent}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] transition-all duration-300 ease-out relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    };

    // ==========================================
    // 4. RENDER UI
    // ==========================================
    return (
        <div ref={containerRef} className={`group min-h-screen ${bgColorMode === 'greenscreen' ? 'bg-[#00FF00]' : bgColorMode === 'darkblue' ? 'bg-[#1a1d27]' : 'bg-slate-950'} text-slate-200 font-sans overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4 relative`}>
            {/* Table Zoom Controls - Self-contained hover widget (hidden when settings panel is open) */}
            {!showSettings && (
                <div className="fixed left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[80] opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                    <button onClick={() => setTableScale(s => Math.min(2, s + 0.1))} className="bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full shadow-lg border border-slate-600/50 backdrop-blur-sm transition-colors active:scale-95" title="Perbesar Meja"><Plus className="w-5 h-5" /></button>
                    <button onClick={() => setTableScale(s => Math.max(0.3, s - 0.1))} className="bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full shadow-lg border border-slate-600/50 backdrop-blur-sm transition-colors active:scale-95" title="Perkecil Meja"><Minus className="w-5 h-5" /></button>
                    <button onClick={() => setTableScale(1)} className="bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full shadow-lg border border-slate-600/50 backdrop-blur-sm transition-colors active:scale-95" title="Reset Ukuran"><RefreshCw className="w-4 h-4 m-0.5" /></button>
                </div>
            )}
            {/* Background Pattern Overlay - Subtle subtle texture */}
            <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-[0.03]"></div>
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 pointer-events-none">
                <h1 className="text-xl sm:text-3xl font-black text-sky-400 drop-shadow-sm">SAMBUNG KATA</h1>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 mt-1">
                    <span
                        className={`w-2.5 h-2.5 rounded-full ${connectionStatus === "tiktok_ready" ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : connectionStatus === "ws_only" ? "bg-amber-400 animate-pulse" : "bg-red-500"}`}
                        title={connectionStatus === "tiktok_ready" ? (connectionSource === "TIKFINITY" ? "Terhubung via TikFinity" : "Terhubung ke TikTok") : connectionStatus === "ws_only" ? "Backend OK, TikTok Belum Connect" : "Backend Offline"}
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
                                    {/* Display Settings Group */}
                                    <div className="w-full bg-slate-800/30 rounded border border-slate-700/50 flex flex-col divide-y divide-slate-700/50">
                                        <button onClick={() => toggleLanguage()} className="px-3 py-2 text-xs font-bold transition-colors flex items-center justify-between group hover:bg-slate-800/50">
                                            <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-sky-400" /><span className="text-slate-300">{t("language")}</span></div>
                                            <span className="text-slate-100 group-hover:text-sky-300">{language === "EN" ? "English" : language === "ID" ? "Indonesia" : "Mix"}</span>
                                        </button>
                                        <div className="px-3 py-2 text-xs font-bold transition-colors flex items-center justify-between group hover:bg-slate-800/50">
                                            <div className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-amber-400" /><span className="text-slate-300">Tema Meja</span></div>
                                            <select value={tableTheme} onChange={(e) => setTableTheme(e.target.value)} className="bg-transparent text-slate-200 text-right outline-none cursor-pointer">
                                                {Object.keys(TABLE_THEMES).map(themeKey => ( <option key={themeKey} value={themeKey} className="bg-slate-900">{THEME_LABELS[themeKey]}</option> ))}
                                            </select>
                                        </div>
                                        <div className="px-3 py-2 text-xs font-bold transition-colors flex items-center justify-between group hover:bg-slate-800/50">
                                            <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-amber-400" /><span className="text-slate-300">Layout Pemain</span></div>
                                            <div className="flex gap-1 bg-slate-900/50 rounded border border-slate-700/50 p-0.5">
                                                <button onClick={() => setLayoutStyle("round")} className={`px-2 py-0.5 rounded text-[10px] transition-colors ${layoutStyle === "round" ? "bg-sky-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>Bundar</button>
                                                <button onClick={() => setLayoutStyle("fut")} className={`px-2 py-0.5 rounded text-[10px] transition-colors ${layoutStyle === "fut" ? "bg-amber-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>FUT Card</button>
                                            </div>
                                        </div>
                                        <div className="px-3 py-2 text-xs font-bold transition-colors flex items-center justify-between group hover:bg-slate-800/50">
                                            <div className="flex items-center gap-2"><Maximize className="w-3.5 h-3.5 text-emerald-400" /><span className="text-slate-300">Warna Latar</span></div>
                                            <div className="flex gap-1 bg-slate-900/50 rounded border border-slate-700/50 p-0.5">
                                                <button onClick={() => setBgColorMode("default")} className={`px-2 py-0.5 rounded text-[10px] transition-colors ${bgColorMode === "default" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>Default</button>
                                                <button onClick={() => setBgColorMode("darkblue")} className={`px-2 py-0.5 rounded text-[10px] transition-colors ${bgColorMode === "darkblue" ? "bg-[#1a1d27] text-white shadow-sm border border-slate-600" : "text-slate-400 hover:text-white"}`}>Dark Blue</button>
                                                <button onClick={() => setBgColorMode("greenscreen")} className={`px-2 py-0.5 rounded text-[10px] transition-colors ${bgColorMode === "greenscreen" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>Green</button>
                                            </div>
                                        </div>
                                        <div className="px-3 py-2 text-xs font-bold transition-colors flex items-center justify-between group hover:bg-slate-800/50">
                                            <div className="flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-sky-400" /><span className="text-slate-300">Ukuran Meja</span></div>
                                            <div className="flex items-center gap-1 bg-slate-900/50 rounded border border-slate-700/50 p-0.5">
                                                <button onClick={() => setTableScale(s => Math.max(0.3, s - 0.1))} className="w-5 h-5 flex items-center justify-center hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"><Minus className="w-3 h-3" /></button>
                                                <span className="w-9 text-center font-mono font-bold text-slate-200 text-[11px]">{Math.round(tableScale * 100)}%</span>
                                                <button onClick={() => setTableScale(s => Math.min(2, s + 0.1))} className="w-5 h-5 flex items-center justify-center hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"><Plus className="w-3 h-3" /></button>
                                                <button onClick={() => setTableScale(1)} title="Reset Ukuran" className="w-5 h-5 flex items-center justify-center hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors ml-0.5"><RefreshCw className="w-2.5 h-2.5" /></button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Media & Overlay Group */}
                                    <div className="w-full bg-slate-800/30 rounded border border-slate-700/50 flex flex-col divide-y divide-slate-700/50">
                                        <button onClick={() => setIsMuted(!isMuted)} className="px-3 py-2 text-xs font-bold transition-colors flex items-center justify-between group hover:bg-slate-800/50">
                                            <div className="flex items-center gap-2">{isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}<span className="text-slate-300">{t("sound")}</span></div>
                                            <span className={isMuted ? "text-red-400" : "text-emerald-400"}>{isMuted ? "Off" : "On"}</span>
                                        </button>
                                        <div className="px-3 py-2 text-xs font-bold flex items-center justify-between">
                                            <div className="flex items-center gap-2"><Music className="w-3.5 h-3.5 text-sky-400" /><span className="text-slate-300">Tampilan Musik</span></div>
                                            <div className="flex gap-1 bg-slate-900/50 rounded border border-slate-700/50 p-0.5">
                                                <button onClick={() => setMusicOverlayStyle("thumbnail")} className={`px-2 py-0.5 rounded text-[10px] transition-colors ${musicOverlayStyle === "thumbnail" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"}`}>Standar</button>
                                                <button onClick={() => setMusicOverlayStyle("video")} className={`px-2 py-0.5 rounded text-[10px] transition-colors ${musicOverlayStyle === "video" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"}`}>Video</button>
                                            </div>
                                        </div>
                                        <button onClick={() => {
                                            if (backendWsRef.current && backendWsRef.current.readyState === WebSocket.OPEN) {
                                                backendWsRef.current.send(JSON.stringify({ event: "toggle_music_requests", data: { enabled: !(musicState?.requestsEnabled ?? true) } }));
                                            }
                                        }} className="px-3 py-2 text-xs font-bold transition-colors flex items-center justify-between group hover:bg-slate-800/50">
                                            <div className="flex items-center gap-2"><Play className="w-3.5 h-3.5 text-fuchsia-400" /><span className="text-slate-300">Request Musik</span></div>
                                            <span className={(musicState?.requestsEnabled ?? true) ? "text-emerald-400" : "text-red-400"}>{(musicState?.requestsEnabled ?? true) ? "ON" : "OFF"}</span>
                                        </button>
                                        <button onClick={() => setIsCamEnabled(!isCamEnabled)} className="px-3 py-2 text-xs font-bold transition-colors flex items-center justify-between group hover:bg-slate-800/50">
                                            <div className="flex items-center gap-2">
                                                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                                                <span className="text-slate-300">Kamera Overlay</span>
                                            </div>
                                            <span className={isCamEnabled ? "text-emerald-400" : "text-red-400"}>{isCamEnabled ? "ON" : "OFF"}</span>
                                        </button>
                                        <div className="px-3 py-2 text-xs font-bold flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2"><Gamepad2 className="w-3.5 h-3.5 text-purple-400" /><span className="text-slate-300">Minigame Overlay</span></div>
                                            <div className="flex flex-wrap gap-1">
                                                <button onClick={() => setActiveMinigame("OFF")} className={`flex-1 py-1 rounded text-[10px] transition-colors ${activeMinigame === "OFF" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>OFF</button>
                                                <button onClick={() => setActiveMinigame("ANAGRAM")} className={`flex-1 py-1 rounded text-[10px] transition-colors ${activeMinigame === "ANAGRAM" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>ANAGRAM</button>
                                                <button onClick={() => setActiveMinigame("WORD500")} className={`flex-1 py-1 rounded text-[10px] transition-colors ${activeMinigame === "WORD500" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>WORD500</button>
                                                <button onClick={() => setActiveMinigame("WORDLE")} className={`flex-1 py-1 rounded text-[10px] transition-colors ${activeMinigame === "WORDLE" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>WORDLE?</button>
                                                <button onClick={() => setActiveMinigame("AUTO_WORDLE")} className={`flex-1 py-1 rounded text-[10px] transition-colors ${activeMinigame === "AUTO_WORDLE" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`} title="Auto Clue Wordle">AUTO</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connection & Advanced */}
                                    <div className="w-full bg-slate-800/30 rounded border border-slate-700/50 p-2.5 flex flex-col gap-3">
                                        {/* Connection Source Toggle */}
                                        <div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                                Sumber Koneksi
                                                <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === "tiktok_ready" ? "bg-emerald-500 animate-pulse" : connectionStatus === "ws_only" ? "bg-amber-400 animate-pulse" : "bg-red-500"}`}></span>
                                            </div>
                                            <div className="flex gap-1 bg-slate-900/50 rounded border border-slate-700/50 p-0.5 mb-2">
                                                <button onClick={() => {
                                                    setConnectionSource("LOCAL");
                                                    connectionSourceRef.current = "LOCAL";
                                                    localStorage.setItem("sk_conn_source", "LOCAL");
                                                    handleReconnectWebSocket();
                                                }} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-colors ${connectionSource === "LOCAL" ? "bg-sky-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                                                    🖥️ Server Lokal
                                                </button>
                                                <button onClick={() => {
                                                    setConnectionSource("TIKFINITY");
                                                    connectionSourceRef.current = "TIKFINITY";
                                                    localStorage.setItem("sk_conn_source", "TIKFINITY");
                                                    handleReconnectWebSocket();
                                                }} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-colors ${connectionSource === "TIKFINITY" ? "bg-violet-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                                                    🌐 TikFinity
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-slate-500 mb-1">
                                                {connectionSource === "TIKFINITY"
                                                    ? "Terhubung langsung ke TikFinity — TikTok dikelola oleh TikFinity."
                                                    : "Terhubung ke server lokal (server.js) — kelola TikTok secara mandiri."
                                                }
                                            </p>
                                        </div>

                                        {/* TikTok Connection — only show for LOCAL mode */}
                                        {connectionSource === "LOCAL" && (
                                            <div className="border-t border-slate-700/50 pt-2">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                                    TikTok Live
                                                    {connectionStatus === "tiktok_ready" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-slate-500 font-mono text-xs">@</span>
                                                    <input type="text" value={tiktokUsername} onChange={(e) => setTiktokUsername(e.target.value)} placeholder="username" className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500" />
                                                    <button onClick={() => {
                                                        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && tiktokUsername.trim()) {
                                                            wsRef.current.send(JSON.stringify({ event: 'connect_tiktok', data: { uniqueId: tiktokUsername.trim(), sessionId: tiktokSessionId.trim() || undefined } }));
                                                            addLog("System", `Menyambung @${tiktokUsername.trim()}...`);
                                                        }
                                                    }} className="bg-emerald-900/40 hover:bg-emerald-800/60 px-2.5 py-1 rounded border border-emerald-800/50 text-emerald-400 transition-colors text-xs font-bold whitespace-nowrap">Conn</button>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    <input type="password" value={tiktokSessionId} onChange={(e) => { setTiktokSessionId(e.target.value); localStorage.setItem("tiktok_session_id", e.target.value); }} placeholder="sessionid (opsional)" className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500" />
                                                    {tiktokSessionId && <button onClick={() => { setTiktokSessionId(""); localStorage.removeItem("tiktok_session_id"); }} className="text-slate-500 hover:text-red-400 p-1"><X className="w-3.5 h-3.5" /></button>}
                                                </div>
                                            </div>
                                        )}

                                        {/* WebSocket Host & Dictionary */}
                                        <div className="flex items-center justify-between gap-2 border-t border-slate-700/50 pt-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <input type="text" value={wsHost} onChange={handleWsHostChange} placeholder={connectionSource === "TIKFINITY" ? "localhost" : (window.location.hostname || "localhost")} className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono" />
                                                    <button onClick={handleReconnectWebSocket} className="bg-sky-900/40 hover:bg-sky-800/60 p-1 rounded border border-sky-800/50 text-sky-400 transition-colors"><RefreshCw className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => fileInputRef.current?.click()} className="bg-slate-700/50 hover:bg-slate-600/50 px-2 py-1 rounded flex items-center gap-1 transition-colors text-slate-300 border border-slate-600/50 text-[10px] font-bold whitespace-nowrap" title={dictLoadedInfo}>
                                                    <FileJson className="w-3 h-3" /> Dict
                                                </button>
                                                <input type="file" accept=".json,.txt" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                            </div>
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


            {/* MAIN TABLE WRAPPER WITH SCALE */}
            <div className="transition-transform duration-300 ease-out" style={{ transform: `scale(${tableScale})`, transformOrigin: "center center" }}>
                <div 
                    ref={mainTableRef}
                onMouseDown={handleMainTableDragStart}
                onTouchStart={handleMainTableDragStart}
                style={{ position: 'relative', left: `${mainTableOffset.x}px`, top: `${mainTableOffset.y}px` }}
                className="cursor-move transform scale-[0.85] -translate-y-12 sm:translate-y-0 sm:scale-100 transition-transform duration-300 z-10"
            >
                <div className={`relative transition-all duration-300 flex items-center justify-center ${activeMinigame !== "OFF" ? 'w-[320px] h-[320px] sm:w-[430px] sm:h-[430px]' : 'w-[350px] h-[350px] sm:w-[480px] sm:h-[480px]'}`}>
                    <div className={`absolute inset-0 transition-all duration-500 flex items-center justify-center overflow-hidden ${layoutStyle === "round" ? `rounded-full border-[8px] ${getTableStatusClass()}` : `bg-transparent`} ${tableStatus === 'success' ? 'scale-105' : 'scale-100'}`}>
                        {gameState === "PAUSED" && (
                            <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                                <Pause className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400 mb-2 animate-pulse" />
                                <p className="text-2xl sm:text-4xl font-black text-amber-400 tracking-widest drop-shadow-sm">PAUSED</p>
                                <p className="text-xs sm:text-sm text-amber-500 mt-2 font-mono">Menunggu Jaringan Stabil...</p>
                            </div>
                        )}

                        {/* Victory Overlay */}
                        {gameState === "ENDED" && getWinners().length > 0 && (
                            <div className={`absolute inset-0 z-[60] flex flex-col items-center justify-center ${layoutStyle === "round" ? "rounded-full overflow-hidden" : "overflow-visible"} animate-in fade-in duration-1000`}>
                                {/* Cinematic Background (Solid for round, glowing for FUT) */}
                                {layoutStyle === "round" ? (
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/60 via-slate-900/85 to-slate-950/95 backdrop-blur-md"></div>
                                ) : (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(251,191,36,0.15)_0%,_transparent_60%)] pointer-events-none mix-blend-screen"></div>
                                )}
                                
                                {/* Confetti Burst (Lightweight) */}
                                <div className={`absolute inset-0 pointer-events-none ${layoutStyle === "round" ? "overflow-hidden" : "overflow-visible"}`}>
                                    {[...Array(80)].map((_, i) => {
                                        const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#38bdf8"];
                                        const color = colors[Math.floor(Math.random() * colors.length)];
                                        const width = Math.random() * 6 + 6; // Confetti size: 6px to 12px
                                        const height = Math.random() > 0.5 ? width : width * 1.5;
                                        // Random horizontal drift direction per particle
                                        const drift = Math.random() > 0.5 ? 1 : -1;
                                        return (
                                            <div key={i} className="absolute animate-confetti rounded-sm" style={{ 
                                                left: `${Math.random() * 100}%`, 
                                                top: '-30px',
                                                backgroundColor: color, 
                                                width: `${width}px`, 
                                                height: `${height}px`, 
                                                animationDuration: `${2 + Math.random() * 2}s`, // 2s to 4s
                                                animationDelay: `${Math.random() * 1.5}s`, // Stagger burst over 1.5s
                                                transform: `scaleX(${drift})` // Flips animation direction for half of them
                                            }}></div>
                                        );
                                    })}
                                </div>

                                {/* Content */}
                                <div className="relative flex flex-col items-center justify-center z-10 px-6 w-full h-full animate-in fade-in zoom-in-[0.98] duration-1000 ease-out delay-200 fill-mode-both">
                                    <Trophy className="w-8 h-8 sm:w-11 sm:h-11 text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.5)] mb-1 fill-amber-500/10" />
                                    <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-500 uppercase tracking-widest mb-1.5">
                                        {getWinners().length > 1 ? t("draw") : t("winner")}
                                    </h2>
                                    <div className={`flex flex-wrap justify-center gap-2 sm:gap-6 mb-1.5 ${layoutStyle === "round" ? "max-h-[120px] sm:max-h-[160px] overflow-y-auto" : "overflow-visible"} custom-scrollbar`}>
                                        {getWinners().map((winner, idx) => {
                                            if (layoutStyle !== "round") {
                                                const wTier = winner.isBot ? TIER_LEVELS[Math.min(5, Math.max(0, (winner.botDifficulty || 3) - 1))] : getPlayerTier(winner.stats);
                                                return (
                                                    <div key={idx} className="relative group flex flex-col items-center justify-center animate-in zoom-in-50 slide-in-from-bottom-8 duration-1000 ease-out fill-mode-backwards mx-2 my-2" style={{ animationDelay: `${400 + idx * 250}ms` }}>
                                                        <div className="absolute -inset-10 bg-amber-400/20 rounded-full animate-ping opacity-60 blur-3xl pointer-events-none"></div>
                                                        <div className="absolute -inset-12 bg-[radial-gradient(circle,_rgba(251,191,36,0.3)_0%,_transparent_70%)] animate-pulse pointer-events-none"></div>
                                                        
                                                        <div className="w-[130px] h-[180px] sm:w-[170px] sm:h-[240px] bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 p-[3px] shadow-2xl relative overflow-hidden flex flex-col items-center shadow-amber-500/80 scale-110" style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 5%, 100% 85%, 50% 100%, 0 85%, 0 5%)' }}>
                                                            <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none"></div>
                                                            <div className="absolute inset-[3px] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-0 pointer-events-none" style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 5%, 100% 85%, 50% 100%, 0 85%, 0 5%)' }}></div>
                                                            
                                                            <div className="relative z-10 flex flex-col items-center w-full h-full pt-2 sm:pt-4">
                                                                <div className="flex w-full px-2 sm:px-3 relative h-[75px] sm:h-[105px]">
                                                                    <div className="flex flex-col items-center pt-1 text-amber-400">
                                                                        <span className="text-[18px] sm:text-[26px] font-black leading-none drop-shadow-sm">{winner.stats?.wins || 1}</span>
                                                                        <span className="text-[8px] sm:text-[11px] font-bold uppercase tracking-wider drop-shadow-sm">{wTier.name.slice(0,3)}</span>
                                                                        <Crown className="w-4 h-4 sm:w-6 sm:h-6 text-amber-300 fill-amber-300 mt-1 drop-shadow-md" />
                                                                    </div>
                                                                    <div className="absolute right-0 top-0 bottom-0 overflow-hidden w-[90px] sm:w-[125px] flex justify-end items-end pb-1 pr-1">
                                                                        <img src={winner.avatarUrl} alt={winner.nickname} className="w-[80px] sm:w-[110px] h-[80px] sm:h-[110px] object-cover drop-shadow-[2px_2px_8px_rgba(0,0,0,0.9)] filter contrast-125 saturate-150 rounded-tl-2xl rounded-tr-md rounded-bl-md [-webkit-mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)]" />
                                                                    </div>
                                                                </div>

                                                                <div className="w-[85%] h-[2px] bg-amber-400/60 my-1 sm:my-2 shadow-[0_0_5px_rgba(251,191,36,0.8)]"></div>

                                                                <div className="text-[11px] sm:text-[15px] font-black uppercase text-amber-100 tracking-wider truncate w-full text-center px-1 drop-shadow-lg">
                                                                    {winner.nickname}
                                                                </div>

                                                                <div className="w-[60%] h-px bg-amber-400/40 my-1 sm:my-1.5"></div>

                                                                <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-0.5 text-[9px] sm:text-[12px] font-mono w-full px-2 sm:px-4 text-amber-200/90 mt-1">
                                                                    <div className="flex justify-between"><span>PTS</span> <span className="font-bold text-white drop-shadow-sm">{winner.score || 0}</span></div>
                                                                    <div className="flex justify-between"><span>KIL</span> <span className="font-bold text-white drop-shadow-sm">{winner.sessionKills || 0}</span></div>
                                                                    <div className="flex justify-between"><span>TRN</span> <span className="font-bold text-white drop-shadow-sm">{winner.turnCount || 0}</span></div>
                                                                    <div className="flex justify-between"><span>PLY</span> <span className="font-bold text-white drop-shadow-sm">{winner.stats?.games || 1}</span></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {getWinners().length > 1 && <div className="absolute -bottom-4 bg-amber-600 text-white font-black px-3 py-1 rounded-full text-[10px] sm:text-xs shadow-xl border-2 border-amber-400 z-20 whitespace-nowrap">Winner #{idx + 1}</div>}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={idx} className="flex flex-col items-center p-2 sm:p-3 min-w-[80px] sm:min-w-[100px] animate-in fade-in duration-700 ease-out fill-mode-backwards" style={{ animationDelay: `${400 + idx * 150}ms` }}>
                                                    <div className="relative mb-1.5">
                                                        <div className="absolute -inset-1 bg-amber-500/20 rounded-full blur-md"></div>
                                                        <img src={winner.avatarUrl} alt="Winner" className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-amber-400/80 shadow-sm object-cover bg-slate-800" />
                                                        {getWinners().length > 1 && <div className="absolute -bottom-1 -right-1 bg-amber-600 text-white font-black px-1.5 py-0.5 rounded-full text-[9px] shadow-sm border border-amber-400">#{idx + 1}</div>}
                                                    </div>
                                                    <p className="text-xs sm:text-sm font-bold text-slate-100 truncate w-full max-w-[110px] sm:max-w-[130px] text-center drop-shadow-sm px-1">{winner.nickname}</p>
                                                    {pointMode !== "OFF" && <p className="text-[10px] sm:text-xs font-mono text-emerald-400 font-bold drop-shadow-sm">{winner.score} <span className="text-[8px] opacity-70">PTS</span></p>}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Most Killer - compact */}
                                    {(() => {
                                        const killers = players.filter(p => (p.sessionKills || 0) > 0).sort((a, b) => b.sessionKills - a.sessionKills);
                                        const maxKills = killers.length > 0 ? killers[0].sessionKills : 0;
                                        const mostKillers = killers.filter(p => p.sessionKills === maxKills);
                                        if (mostKillers.length > 0) {
                                            return (
                                                <div className="bg-sky-950/40 border border-sky-900/50 rounded-xl px-3 py-1 flex items-center gap-2 mb-1">
                                                    <Sparkles className="w-3 h-3 text-sky-400 animate-pulse shrink-0" />
                                                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                                        {mostKillers.slice(0, 3).map((killer, idx) => (
                                                            <div key={idx} className="flex items-center gap-1">
                                                                <img src={killer.avatarUrl} alt="" className="w-5 h-5 rounded-full border border-sky-800 object-cover shrink-0" />
                                                                <span className="text-[9px] text-sky-300 font-bold truncate max-w-[60px]">{killer.nickname}</span>
                                                                <span className="text-[8px] text-sky-500 font-mono shrink-0">({killer.sessionKills})</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {renderLikeRestartMeter()}

                                    <div className="flex gap-2">
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
                                        }} className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-full shadow-sm hover:bg-emerald-500 active:scale-95 transition-all text-xs border border-emerald-500">
                                            {restartCountdown !== null ? `${restartCountdown}s` : t("play_again")}
                                        </button>
                                        <button onClick={() => { setRestartCountdown(null); clearLobby(); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-full shadow-sm active:scale-95 transition-all text-[10px] border border-slate-700">
                                            {t("clear_lobby")}
                                        </button>
                                    </div>
                                </div>
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
                                            {renderLikeRestartMeter()}
                                        </>
                                    )}
                                </div>
                            ) : gameState === "ENDED" && getWinners().length === 0 ? (
                                <div className="animate-in zoom-in fade-in duration-700 flex flex-col items-center">
                                    <p className="text-2xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] uppercase tracking-widest mb-2">{t("game_over")}</p>
                                    {renderLikeRestartMeter()}
                                    <button onClick={() => { setRestartCountdown(null); processQueue(); startGame(); }} className="bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-emerald-500 transition-colors animate-pulse">{t("new_game")}</button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    {pointMode !== "OFF" && (
                                        <div className="mb-3 flex justify-center animate-in slide-in-from-top fade-in duration-500">
                                            {winCondition === "TIME" ? (
                                                <GlobalTimer gameDuration={gameDuration} isActive={gameState === "PLAYING" && globalTimer !== null} onTimeout={() => { setGameState("ENDED"); playSound("win"); addLog("System", "WAKTU HABIS! Permainan Selesai."); }} resetKey={globalTimer} />
                                            ) : winCondition === "SCORE" ? (
                                                <div className="font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] flex items-center gap-2">
                                                    <Target className="w-4 h-4" /><span className="text-xs uppercase tracking-wide opacity-80">{t("target")}:</span><span className="text-lg">{targetScore}</span>
                                                </div>
                                            ) : (
                                                <div className="font-bold text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)] flex items-center gap-2">
                                                    <RefreshCw className="w-4 h-4" /><span className="text-xs uppercase tracking-wide opacity-80">{t("round")}:</span><span className="text-lg">{Math.min(...players.filter((p) => !p.isEliminated).map((p) => p.turnCount || 0)) + 1}/{targetRounds}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 mb-2 h-7 drop-shadow-md">
                                        {actionCardsEnabled && (
                                            <div title="Action Cards Enabled" className="text-amber-400 flex items-center justify-center">
                                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                            </div>
                                        )}
                                        {pointMode !== "OFF" && (
                                            <button
                                                onClick={handleOpenPointGuide}
                                                title={`Point Mode: ${pointMode}. Klik untuk melihat tabel poin!`}
                                                className="text-emerald-400 flex items-center justify-center hover:text-emerald-300 transition-colors cursor-pointer active:scale-95"
                                            >
                                                <Target className="w-3.5 h-3.5 animate-pulse mr-1" />
                                                <span className="text-[9px] font-bold uppercase tracking-tighter">{pointMode}</span>
                                            </button>
                                        )}
                                        {maxWordLength > 0 && (
                                            <div title={`Batas Maksimal: ${maxWordLength} Huruf`} className="flex items-center gap-1 text-rose-400">
                                                <Hash className="w-3.5 h-3.5 text-rose-400" />
                                                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter">MAX {maxWordLength}</span>
                                            </div>
                                        )}
                                        <div title={`Game Mode: ${getModeLabel()}`} className="flex items-center gap-1 text-slate-300">
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
                                        {gameMode === "RHYME" ? t("rhyme_target") : gameMode === "FILL_BLANK" ? "LENGKAPI KATA BERIKUT" : gameMode === "INFIKS" ? "MENGANDUNG POLA BERIKUT" : "SAMBUNG KATA BERIKUT"}
                                    </p>

                                    <h2 className="font-black flex justify-center transition-all duration-300 px-2 my-1 w-full overflow-hidden" style={{ fontSize: `clamp(10px, 55vw / ${Math.max(6, currentWord?.length || 6)}, 28px)` }}>
                                        {(() => {
                                            if (gameMode === "RHYME") {
                                                return (
                                                    <div className="flex flex-col items-center w-full">
                                                        <span className="text-[1em] text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.6)] whitespace-nowrap">...{targetRhyme.toUpperCase()}</span>
                                                        {currentWord && <span className="text-[0.5em] text-slate-500 mt-[0.5em] font-normal opacity-80 whitespace-nowrap">Kata Sebelumnya: {currentWord.toUpperCase()}</span>}
                                                    </div>
                                                );
                                            }
                                            if (gameMode === "FILL_BLANK") {
                                                const parts = currentWord.toUpperCase().split(/(\.\.\.)/g);
                                                return (
                                                    <div className="flex flex-col items-center w-full">
                                                        <div className="flex items-center justify-center whitespace-nowrap drop-shadow-md">
                                                            {parts.map((part, i) =>
                                                                part === "..."
                                                                    ? <span key={i} className="text-emerald-400 mx-[0.3em] tracking-widest animate-pulse">. . .</span>
                                                                    : <span key={i} className="text-slate-200 tracking-widest">{part}</span>
                                                            )}
                                                        </div>
                                                        {lastInputWord && <span className="text-[0.5em] text-slate-500 mt-[0.5em] font-normal opacity-80 whitespace-nowrap">Kata Sebelumnya: {lastInputWord.toUpperCase()}</span>}
                                                    </div>
                                                );
                                            }
                                            const { pre, high, post } = getDisplayParts(currentWord, getLogicOptions());
                                            return (
                                                <div className="flex items-center justify-center whitespace-nowrap drop-shadow-md">
                                                    {pre && <span className="text-slate-200 tracking-widest">{pre.toUpperCase()}</span>}
                                                    <span className="text-sky-400 tracking-widest mx-[0.1em] drop-shadow-[0_0_10px_rgba(56,189,248,0.6)] animate-pulse">
                                                        {high.toUpperCase()}
                                                    </span>
                                                    {post && <span className="text-slate-200 tracking-widest">{post.toUpperCase()}</span>}
                                                </div>
                                            );
                                        })()}
                                    </h2>

                                    <div className="flex flex-col items-center w-full">
                                        <div className="mt-2 flex flex-col items-center justify-center w-full">
                                            {(() => {
                                                const rule = getRuleDisplay(currentWord, getLogicOptions());
                                                if (gameMode === "RHYME" || gameMode === "FILL_BLANK" || !rule.target) return null;

                                                return (
                                                    <div className="flex items-baseline text-4xl sm:text-5xl font-black text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                                                        {gameMode === "MIRROR" && (
                                                            <div className="mr-1 flex tracking-widest text-sky-400/80">
                                                                <span className="animate-pulse">.</span>
                                                                <span className="animate-pulse" style={{ animationDelay: "200ms" }}>.</span>
                                                                <span className="animate-pulse" style={{ animationDelay: "400ms" }}>.</span>
                                                            </div>
                                                        )}

                                                        <span className="tracking-widest">{rule.target}</span>

                                                        {gameMode !== "MIRROR" && (
                                                            <div className="ml-1 flex tracking-widest text-sky-400/80">
                                                                <span className="animate-pulse">.</span>
                                                                <span className="animate-pulse" style={{ animationDelay: "200ms" }}>.</span>
                                                                <span className="animate-pulse" style={{ animationDelay: "400ms" }}>.</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
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


                    {(gameState !== "ENDED" || layoutStyle === "round") && activePlayers.map((player, index, arr) => {
                        const isRound = layoutStyle === "round";
                        
                        const activeCurrentIndex = arr.findIndex(p => p.uniqueId === players[currentTurnIndex]?.uniqueId);
                        const safeCurrentIndex = activeCurrentIndex !== -1 ? activeCurrentIndex : 0;
                        
                        // Posisi Meja Bundar
                        const angleDeg = index * (360 / Math.max(arr.length, 1)) + 90;
                        const roundTransform = `rotate(${angleDeg}deg) translate(${dynamicRadius}px) rotate(-${angleDeg}deg) scale(${dynamicScale})`;
                        
                        // Posisi FUT Card (Cover Flow Perspective, Satu Baris)
                        const total = Math.max(arr.length, 1);
                        let diff = index - (gameState === "PLAYING" ? safeCurrentIndex : 0);
                        if (diff > total / 2) diff -= total;
                        else if (diff < -total / 2) diff += total;

                        const absDiff = Math.abs(diff);
                        
                        // Active card is at front and center
                        const isTurn = gameState === "PLAYING" && diff === 0 && !player.isEliminated;
                        const futZIndex = 200 - absDiff;
                        
                        // Scale down as they go further away
                        const baseScale = isMobile ? 1.0 : 1.3;
                        const futScale = Math.max(0.6, baseScale - (absDiff * 0.12)) * dynamicScale;
                        
                        // Shift them horizontally (overlap with dampening to prevent infinite stretch)
                        const gapBase = isMobile ? 75 : 110;
                        const dampening = 0.75;
                        const geometricX = gapBase * (1 - Math.pow(dampening, absDiff)) / (1 - dampening);
                        const xOffset = Math.sign(diff) * geometricX;
                        
                        // Push them slightly down for perspective curve
                        const baseFutY = isMobile ? 150 : 220; 
                        const perspectiveY = absDiff * 5; 
                        const yOffset = baseFutY + perspectiveY;
                        
                        const futTransform = `translate(${xOffset}px, ${yOffset}px) scale(${futScale})`;

                        const maxWins = Math.max(...players.map((p) => p.stats?.wins || 0));
                        const isKing = maxWins > 0 && (player.stats?.wins || 0) === maxWins && !player.isEliminated;
                        const isStarter = player.uniqueId === roundStarterId;
                        const tier = player.isBot
                            ? TIER_LEVELS[Math.min(5, Math.max(0, (player.botDifficulty || 3) - 1))]
                            : getPlayerTier(player.stats);
                            
                        const currentZIndex = isRound ? (isTurn ? 100 : 20) : futZIndex;

                        return (
                            <div key={player.uniqueId} className={`absolute transition-all duration-500 ease-out flex flex-col items-center justify-center ${isRound ? "w-24 h-28" : ""}`} style={{ transform: isRound ? roundTransform : futTransform, zIndex: currentZIndex }}>

                                {/* --- RENDER EFEK VISUAL DI SINI --- */}
                                <div className="absolute inset-0 pointer-events-none z-[150]">
                                    {activeEffects.filter(e => e.uniqueId === player.uniqueId).map(effect => {
                                        if (effect.type === 'like') {
                                            return (effect.hearts || []).map((h, i) => (
                                                <Heart
                                                    key={`${effect.id}-${i}`}
                                                    className={`absolute top-1/2 left-1/2 ${h.size} ${h.color} drop-shadow-md animate-flurry-heart`}
                                                    style={{
                                                        '--tx': `${h.tx}px`,
                                                        '--ty': `${h.ty}px`,
                                                        '--tx2': `${h.tx2}px`,
                                                        '--ty2': `${h.ty2}px`,
                                                        '--rot': `${h.rotate}deg`,
                                                        animationDelay: `${h.delay}s`,
                                                        animationDuration: `${h.duration}s`,
                                                        opacity: 0,
                                                        transform: 'translate(-50%, -50%)'
                                                    }}
                                                />
                                            ));
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

                                {isRound ? (
                                    <>
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
                                    </>
                                ) : (
                                    <div className={`relative group ${player.isEliminated ? "opacity-50 grayscale" : "opacity-100"} flex flex-col items-center justify-center transition-all duration-300 ${isTurn ? 'scale-110 brightness-110' : 'scale-100 brightness-90'}`}>
                                        <PlayerTimer isTurn={isTurn && gameState === "PLAYING"} turnDuration={turnDuration} onTimeout={handleTimeout} playSound={playSound} bombNext={bombNextRef.current} onBombApplied={() => { bombNextRef.current = false; }} resetKey={turnKey} />
                                        {isTurn && <div className="absolute -inset-3 bg-amber-500/40 rounded-xl animate-ping opacity-75 blur-md"></div>}
                                        <div className={`w-[85px] h-[120px] sm:w-[110px] sm:h-[155px] bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 p-[2px] shadow-xl relative overflow-hidden flex flex-col items-center ${isTurn ? (bombNextRef.current ? "border-orange-500 animate-shake" : "shadow-amber-500/50 shadow-2xl") : "shadow-black/50"}`} style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 5%, 100% 85%, 50% 100%, 0 85%, 0 5%)' }}>
                                            <div className="absolute inset-0 bg-black/40 mix-blend-overlay pointer-events-none"></div>
                                            <div className="absolute inset-[2px] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-0 pointer-events-none" style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 5%, 100% 85%, 50% 100%, 0 85%, 0 5%)' }}></div>
                                            
                                            {/* FUT Content */}
                                            <div className="relative z-10 flex flex-col items-center w-full h-full pt-1 sm:pt-2">
                                                {/* Top Stats & Avatar */}
                                                <div className="flex w-full px-1.5 sm:px-2 relative h-[50px] sm:h-[65px]">
                                                    <div className="flex flex-col items-center pt-1 text-amber-500">
                                                        <span className="text-[12px] sm:text-lg font-black leading-none drop-shadow-sm">{player.stats?.wins || 0}</span>
                                                        <span className="text-[7px] sm:text-[9px] font-bold uppercase tracking-wider drop-shadow-sm">{tier.name.slice(0,3)}</span>
                                                        {isKing && <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 fill-amber-400 mt-0.5 drop-shadow-md" />}
                                                    </div>
                                                    <div className="absolute right-0 top-0 bottom-0 overflow-hidden w-[60px] sm:w-[80px] flex justify-end items-end pb-1 pr-1">
                                                        <img src={player.avatarUrl} alt={player.nickname} className="w-[50px] sm:w-[70px] h-[50px] sm:h-[70px] object-cover drop-shadow-[2px_2px_4px_rgba(0,0,0,0.9)] filter contrast-125 saturate-150 rounded-tl-xl rounded-tr-sm rounded-bl-sm [-webkit-mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)]" />
                                                    </div>
                                                </div>

                                                {/* Divider */}
                                                <div className="w-[80%] h-px bg-amber-500/50 my-1 shadow-[0_0_2px_rgba(245,158,11,0.5)]"></div>

                                                {/* Name */}
                                                <div className="text-[9px] sm:text-[11px] font-black uppercase text-amber-100 tracking-wider truncate w-full text-center px-1 drop-shadow-md">
                                                    {player.nickname}
                                                </div>

                                                <div className="w-[40%] h-px bg-amber-500/30 my-0.5"></div>

                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8px] sm:text-[9px] font-mono w-full px-1.5 sm:px-3 text-amber-200/80 mt-0.5">
                                                    <div className="flex justify-between"><span>PTS</span> <span className="font-bold text-white drop-shadow-sm">{player.score || 0}</span></div>
                                                    <div className="flex justify-between"><span>KIL</span> <span className="font-bold text-white drop-shadow-sm">{player.sessionKills || 0}</span></div>
                                                    <div className="flex justify-between"><span>TRN</span> <span className="font-bold text-white drop-shadow-sm">{player.turnCount || 0}</span></div>
                                                    <div className="flex justify-between"><span>PLY</span> <span className="font-bold text-white drop-shadow-sm">{player.stats?.games || 0}</span></div>
                                                </div>
                                            </div>
                                            
                                            {isStarter && !player.isEliminated && (
                                                <div className="absolute -top-1 -left-1 bg-sky-600 border border-slate-900 text-white p-1 rounded-full shadow-sm z-30 animate-pulse"><Flag className="w-2.5 h-2.5 fill-white" /></div>
                                            )}
                                            {player.isEliminated && <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/60 backdrop-blur-[1px] rounded-b-xl rounded-t-3xl"><X className="w-8 h-8 text-red-500 drop-shadow-md" /></div>}
                                        </div>
                                    </div>
                                )}
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
                            {["QWERTYUIOP", "ASDFGHJKL", "!ZXCVBNM"].map((row, i) => (
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
            {scrambleWord && activeMinigame === "ANAGRAM" && (
                <div
                    ref={miniGameOverlayRef}
                    className={`z-[90] flex flex-col items-center gap-1 pointer-events-none animate-in slide-in-from-right fade-in duration-500 ${miniGamePos.x !== null ? 'fixed' : 'absolute bottom-24 sm:bottom-32 right-2 sm:right-4'}`}
                    style={miniGamePos.x !== null ? { left: miniGamePos.x, top: miniGamePos.y, bottom: 'auto', right: 'auto' } : {}}
                >
                    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 text-[9px] sm:text-[10px] text-slate-300 px-3 py-0.5 rounded-full font-bold tracking-widest uppercase shadow-sm pointer-events-none mr-auto ml-2">
                        SUSUN KATA
                    </div>
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
                        {/* Content Mini Game */}
                        <div 
                            className="relative flex items-center pr-1"
                            style={{
                                perspective: '1000px',
                                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                transformStyle: 'preserve-3d',
                                transform: anagramFlipPhase === 'flipping' || anagramFlipPhase === 'winner' ? 'rotateX(-180deg)' : 'rotateX(0deg)',
                                minHeight: '34px'
                            }}
                        >
                            {/* Front: Button + Letters */}
                            <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }} className="flex items-center gap-1.5 sm:gap-2">
                                <button
                                    onClick={handleRevealAnagram}
                                    onTouchEnd={handleRevealAnagram}
                                    className="hover:scale-110 active:scale-90 transition-transform cursor-pointer outline-none bg-transparent border-none p-0 flex items-center justify-center ml-0.5 mr-0.5"
                                    title="Nyerah / Spill Jawaban"
                                    disabled={scrambledDisplay === scrambleWord}
                                >
                                    <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${scrambledDisplay === scrambleWord ? 'text-slate-500' : 'text-amber-400 animate-pulse hover:text-amber-300'} drop-shadow-md`} />
                                </button>
                                <div className="flex gap-0.5 sm:gap-1 flex-nowrap">
                                    {scrambledDisplay.split('').map((char, i) => (
                                        <div key={i} className={`w-5 h-6 sm:w-6 sm:h-7 shrink-0 bg-slate-800 border rounded flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm transition-colors duration-300 ${scrambleWinner ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30' : (scrambledDisplay === scrambleWord ? 'border-amber-500/50 text-amber-400 bg-amber-950/30' : 'border-slate-700 text-sky-400')}`}>
                                            {char}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Back: Winner */}
                            <div
                                className="absolute inset-0 bg-emerald-950/90 rounded border border-emerald-600/60 shadow-xl flex items-center justify-center px-2"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateX(180deg)'
                                }}
                            >
                                {scrambleWinner && (
                                    <div className="flex items-center gap-2 sm:gap-3 w-full justify-center">
                                        <div className="relative shrink-0">
                                            <div className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping" />
                                            <img src={scrambleWinner.profilePictureUrl} className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-emerald-400 shadow-sm object-cover bg-slate-800" alt="winner" />
                                        </div>
                                        <div className="flex flex-col items-start min-w-0 pr-1">
                                            <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">BENAR!</span>
                                            <span className="text-[11px] sm:text-sm font-bold text-white truncate max-w-[80px] sm:max-w-[130px] mt-0.5">{scrambleWinner.nickname}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Scale Controls */}
                        <div className="flex items-center gap-0.5 border-l border-slate-700/50 pl-1.5 ml-1" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMiniGameScale(p => Math.max(0.2, p - 0.1)); }}
                                className="text-slate-500 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-30"
                                disabled={miniGameScale <= 0.2}
                                title="Perkecil"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMiniGameScale(p => Math.min(3.0, p + 0.1)); }}
                                className="text-slate-500 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-30"
                                disabled={miniGameScale >= 3.0}
                                title="Perbesar"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- WORD500 MINIGAME OVERLAY --- */}
            {activeMinigame === "WORD500" && word500Target && (
                <div
                    ref={miniGameOverlayRef}
                    className={`z-[90] flex pointer-events-none animate-in slide-in-from-right fade-in duration-500 ${miniGamePos.x !== null ? 'fixed' : 'absolute bottom-24 sm:bottom-32 right-2 sm:right-4'}`}
                    style={miniGamePos.x !== null ? { left: miniGamePos.x, top: miniGamePos.y, bottom: 'auto', right: 'auto' } : {}}
                >
                    <div
                        className="pointer-events-auto"
                        style={{
                            transform: `scale(${miniGameScale})`,
                            transformOrigin: miniGamePos.x !== null ? 'top left' : 'bottom right',
                            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                    >
                        {/* 3D flip container */}
                        <div
                            style={{
                                perspective: '600px',
                                width: 'max-content',
                                maxWidth: '90vw',
                            }}
                        >
                            <div
                                style={{
                                    position: 'relative',
                                    transformStyle: 'preserve-3d',
                                    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: word500FlipPhase === 'flipping' || word500FlipPhase === 'winner' ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                                    minWidth: '210px',
                                }}
                            >
                                {/* ══ FRONT FACE — Guess Rows ══ */}
                                <div
                                    className="bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/50 shadow-xl flex flex-col p-1.5 w-max max-w-[90vw]"
                                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-700/50 cursor-move touch-none" onMouseDown={handleMiniGameDragStart} onTouchStart={handleMiniGameDragStart}>
                                        <div className="flex items-center gap-1.5">
                                            <GripHorizontal className="w-3.5 h-3.5 text-slate-600" />
                                            <span className="text-[11px] font-bold text-sky-400 tracking-wide">Word500</span>
                                            <span className="text-[9px] text-slate-600 font-mono">{word500Target.length}L</span>
                                            {!word500Winner && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRevealWord500(e); }}
                                                    onTouchEnd={(e) => { e.stopPropagation(); handleRevealWord500(e); }}
                                                    title="Spill Jawaban"
                                                    className="ml-0.5 text-slate-600 hover:text-amber-400 transition-colors p-0.5 rounded hover:bg-slate-800 active:scale-90"
                                                >
                                                    <Sparkles className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-0.5 border-l border-slate-700/50 pl-1.5 ml-1.5" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                                            <button onClick={(e) => { e.stopPropagation(); setMiniGameScale(p => Math.max(0.2, p - 0.1)); }} className="text-slate-600 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors disabled:opacity-30" disabled={miniGameScale <= 0.2}><Minus className="w-2.5 h-2.5" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); setMiniGameScale(p => Math.min(3.0, p + 0.1)); }} className="text-slate-600 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors disabled:opacity-30" disabled={miniGameScale >= 3.0}><Plus className="w-2.5 h-2.5" /></button>
                                        </div>
                                    </div>

                                    {/* Guess rows */}
                                    <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto custom-scrollbar pr-0.5 w-full" style={{ scrollBehavior: 'smooth' }}>
                                        {word500Guesses.length === 0 ? (
                                            <div className="text-[9px] text-slate-600 italic text-center py-1.5 min-w-[160px]">Ketik kata {word500Target.length} huruf!</div>
                                        ) : (() => {
                                            const latestGuess = word500Guesses[word500Guesses.length - 1];
                                            const prevGuesses = word500Guesses.slice(0, -1);
                                            const bestGuesses = [...prevGuesses]
                                                .sort((a, b) => b.green - a.green || b.yellow - a.yellow)
                                                .slice(0, 2);
                                            const displayRows = [
                                                { guess: latestGuess, isLatest: true },
                                                ...bestGuesses.map(g => ({ guess: g, isLatest: false }))
                                            ];
                                            const isWinRow = latestGuess?.green === word500Target.length;
                                            const renderRow = (g, isLatest, idx) => (
                                                <div key={`${isLatest ? 'latest' : 'best'}-${idx}`} className={`flex items-center gap-1 animate-in slide-in-from-right fade-in duration-200 rounded-[3px] ${
                                                    isLatest && isWinRow
                                                        ? 'bg-emerald-950/60 ring-1 ring-emerald-600/60 px-0.5'
                                                        : isLatest ? 'bg-sky-950/40 ring-1 ring-sky-800/50 px-0.5' : ''
                                                }`}>
                                                    <div className="flex-shrink-0 w-3 flex items-center justify-center">
                                                        {isLatest && isWinRow
                                                            ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" title="BENAR!" />
                                                            : isLatest
                                                                ? <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" title="Terbaru" />
                                                                : idx === 1
                                                                    ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" title="Terbaik" />
                                                                    : <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                                        }
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        {g.profilePictureUrl ? (
                                                            <img src={g.profilePictureUrl} className="w-4 h-4 rounded-full border border-slate-600 object-cover bg-slate-800" alt={g.nickname} title={g.nickname} />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center text-[7px] font-bold text-slate-400" title={g.nickname}>{g.nickname.substring(0, 1).toUpperCase()}</div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-px">
                                                        {g.word.split('').map((char, j) => (
                                                            <div key={j} className={`w-4 h-5 shrink-0 border rounded-[2px] flex items-center justify-center font-bold text-[9px] uppercase transition-colors duration-300 ${
                                                                isLatest && isWinRow
                                                                    ? 'bg-emerald-700 border-emerald-500 text-white'
                                                                    : isLatest ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-slate-800 border-slate-700 text-slate-300'
                                                            }`}>
                                                                {char}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-px ml-0.5">
                                                        <div className="w-4 h-5 shrink-0 bg-emerald-700 border border-emerald-600 rounded-[2px] flex items-center justify-center font-bold text-[9px] text-white">{g.green}</div>
                                                        <div className="w-4 h-5 shrink-0 bg-amber-600 border border-amber-500 rounded-[2px] flex items-center justify-center font-bold text-[9px] text-white">{g.yellow}</div>
                                                        <div className="w-4 h-5 shrink-0 bg-rose-700 border border-rose-600 rounded-[2px] flex items-center justify-center font-bold text-[9px] text-white">{g.red}</div>
                                                    </div>
                                                </div>
                                            );
                                            return displayRows.map(({ guess, isLatest }, idx) => renderRow(guess, isLatest, idx));
                                        })()}
                                        <div ref={word500EndRef} />
                                    </div>
                                </div>

                                {/* ══ BACK FACE — Winner Reveal ══ */}
                                <div
                                    className="absolute inset-0 bg-slate-900/95 backdrop-blur-md rounded-lg border border-emerald-600/60 shadow-2xl flex flex-col items-center justify-center gap-2 p-3 overflow-hidden"
                                    style={{
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)',
                                        minWidth: '210px',
                                        minHeight: '80px',
                                    }}
                                >
                                    {/* Sparkle particles */}
                                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                                        {[...Array(8)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-1 h-1 rounded-full animate-ping"
                                                style={{
                                                    left: `${10 + (i * 11)}%`,
                                                    top: `${20 + (i % 3) * 30}%`,
                                                    backgroundColor: ['#34d399','#fbbf24','#60a5fa','#f472b6'][i % 4],
                                                    animationDelay: `${i * 0.15}s`,
                                                    animationDuration: '1s',
                                                    opacity: word500FlipPhase === 'winner' ? 1 : 0,
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {word500Winner && (
                                        <>
                                            <div className="relative">
                                                <div className="absolute -inset-1.5 rounded-full bg-emerald-400/20 animate-ping" />
                                                <img
                                                    src={word500Winner.profilePictureUrl}
                                                    className="relative w-9 h-9 rounded-full border-2 border-emerald-400 object-cover bg-slate-800 shadow-lg shadow-emerald-900/50"
                                                    alt={word500Winner.nickname}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5 text-center">
                                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">PEMENANG!</span>
                                                <span className="text-[11px] font-bold text-white max-w-[140px] truncate">{word500Winner.nickname}</span>
                                                <div className="flex gap-px mt-1">
                                                    {word500Target.split('').map((char, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-5 h-6 shrink-0 bg-emerald-700 border border-emerald-500 rounded-[3px] flex items-center justify-center font-black text-[10px] text-white shadow-sm"
                                                            style={{ animationDelay: `${i * 60}ms` }}
                                                        >
                                                            {char.toUpperCase()}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- WORDLE MINIGAME OVERLAY --- */}
            {activeMinigame === "WORDLE" && word500Target && (
                <div
                    ref={miniGameOverlayRef}
                    className={`z-[90] flex pointer-events-none animate-in slide-in-from-right fade-in duration-500 ${miniGamePos.x !== null ? 'fixed' : 'absolute bottom-24 sm:bottom-32 right-2 sm:right-4'}`}
                    style={miniGamePos.x !== null ? { left: miniGamePos.x, top: miniGamePos.y, bottom: 'auto', right: 'auto' } : {}}
                >
                    <div
                        className="pointer-events-auto bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-2xl flex flex-col p-2 sm:p-2.5 gap-1.5 w-max max-w-[90vw]"
                        style={{
                            transform: `scale(${miniGameScale})`,
                            transformOrigin: miniGamePos.x !== null ? 'top left' : 'bottom right',
                            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            perspective: '600px'
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-0.5 pb-1 border-b border-slate-700/50 cursor-move touch-none" onMouseDown={handleMiniGameDragStart} onTouchStart={handleMiniGameDragStart}>
                            <div className="flex items-center gap-1.5">
                                <GripHorizontal className="w-3.5 h-3.5 text-slate-600" />
                                <span className="text-[11px] font-bold text-emerald-400 tracking-wide uppercase">Wordle</span>
                                <span className="text-[9px] font-mono bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">6 HURUF • HARD MODE</span>
                                <span className="text-[9px] font-mono text-slate-400 ml-1">{word500Guesses.length}/6</span>
                                {!word500Winner && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRevealWord500(e); }}
                                        onTouchEnd={(e) => { e.stopPropagation(); handleRevealWord500(e); }}
                                        title="Spill Jawaban"
                                        className="ml-0.5 text-slate-600 hover:text-emerald-400 transition-colors p-0.5 rounded hover:bg-slate-800 active:scale-90"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-0.5 border-l border-slate-700/50 pl-1.5 ml-1.5" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                                <button onClick={(e) => { e.stopPropagation(); setMiniGameScale(p => Math.max(0.2, p - 0.1)); }} className="text-slate-600 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors disabled:opacity-30" disabled={miniGameScale <= 0.2}><Minus className="w-2.5 h-2.5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setMiniGameScale(p => Math.min(3.0, p + 0.1)); }} className="text-slate-600 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors disabled:opacity-30" disabled={miniGameScale >= 3.0}><Plus className="w-2.5 h-2.5" /></button>
                            </div>
                        </div>

                        {/* Flip Container */}
                        <div
                            style={{
                                position: 'relative',
                                transformStyle: 'preserve-3d',
                                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: word500FlipPhase === 'flipping' || word500FlipPhase === 'winner' ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                                minWidth: '190px'
                            }}
                        >
                            {/* Front: 6 Rows Wordle Grid */}
                            <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }} className="flex flex-col gap-1 mt-1 mb-1">
                                {(() => {
                                    const displayRows = [...word500Guesses];
                                    while (displayRows.length < 6) displayRows.push(null);
                                    
                                    return displayRows.slice(0, 6).map((g, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 animate-in slide-in-from-right fade-in duration-200">
                                            <div className="flex-shrink-0 w-5 flex justify-center">
                                                {g ? (
                                                    g.profilePictureUrl ? (
                                                        <img src={g.profilePictureUrl} className="w-5 h-6 rounded-[3px] border border-slate-600 object-cover bg-slate-800" alt={g.nickname} title={g.nickname} />
                                                    ) : (
                                                        <div className="w-5 h-6 rounded-[3px] border border-slate-600 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400" title={g.nickname}>{g.nickname.substring(0, 1).toUpperCase()}</div>
                                                    )
                                                ) : (
                                                    <div className="w-5 h-6 shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                {Array(6).fill(0).map((_, j) => {
                                                    if (g) {
                                                        const char = g.word[j];
                                                        const colorClass = g.colors && g.colors[j] === 'green'
                                                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                                                            : g.colors && g.colors[j] === 'yellow'
                                                                ? 'bg-amber-600 border-amber-500 text-white shadow-sm'
                                                                : 'bg-slate-700/90 border-slate-600/80 text-slate-300';
                                                        return (
                                                            <div key={j} className={`w-6 h-7 shrink-0 border rounded-[3px] flex items-center justify-center font-black text-[15px] leading-none uppercase ${colorClass}`}>
                                                                {char}
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div key={j} className="w-6 h-7 shrink-0 border border-slate-700/40 rounded-[3px] bg-slate-900/40 flex items-center justify-center"></div>
                                                        );
                                                    }
                                                })}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>

                            {/* Back: The Winner / Fail Reveal + Top 5 Leaderboard */}
                            <div
                                className={`absolute inset-0 rounded-lg border shadow-xl flex flex-col items-center justify-between p-2 sm:p-2.5 transition-colors duration-500 overflow-hidden ${
                                    word500Winner?.isFail
                                        ? 'bg-slate-900/95 border-rose-600/70 shadow-rose-950/50'
                                        : 'bg-slate-900/95 border-emerald-600/70 shadow-emerald-950/50'
                                }`}
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(-180deg)'
                                }}
                            >
                                {/* Answer & Winner Header */}
                                <div className="w-full flex flex-col items-center gap-1">
                                    {word500Winner && (
                                        <div className="flex items-center gap-2 w-full justify-center px-1">
                                            <div className="relative shrink-0">
                                                <div className={`absolute -inset-1 rounded-full animate-ping ${word500Winner.isFail ? 'bg-rose-500/40' : 'bg-emerald-500/40'}`} />
                                                <img
                                                    src={word500Winner.profilePictureUrl}
                                                    className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 shadow-lg object-cover bg-slate-800 ${
                                                        word500Winner.isFail ? 'border-rose-400' : 'border-emerald-400'
                                                    }`}
                                                    alt={word500Winner.nickname}
                                                />
                                            </div>
                                            <div className="flex flex-col items-start min-w-0">
                                                <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${
                                                    word500Winner.isFail ? 'text-rose-400' : 'text-emerald-400'
                                                }`}>
                                                    {word500Winner.isFail ? '❌ Gagal (6/6)' : '🎉 Menang!'}
                                                </span>
                                                <span className="text-xs font-bold text-white truncate max-w-[110px] mt-0.5">
                                                    {word500Winner.isFail ? 'Jawaban Benar:' : word500Winner.nickname}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 6 Target Letter Tiles */}
                                    <div className="flex gap-1 mt-1">
                                        {word500Winner && word500Target.split('').map((char, i) => (
                                            <div
                                                key={i}
                                                className={`w-5 h-6 shrink-0 rounded-[3px] flex items-center justify-center font-black text-[14px] leading-none text-white shadow-md animate-in zoom-in duration-300 ${
                                                    word500Winner?.isFail
                                                        ? 'bg-rose-600 border border-rose-500 shadow-rose-900/50'
                                                        : 'bg-emerald-600 border border-emerald-500 shadow-emerald-900/50'
                                                }`}
                                                style={{ animationDelay: `${i * 80}ms` }}
                                            >
                                                {char}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Divider with Trophy Tag */}
                                <div className="w-full border-t border-slate-700/60 my-1 relative flex items-center justify-center">
                                    <span className="bg-slate-900 px-1.5 py-0.5 text-[8px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 rounded-full border border-amber-500/30">
                                        <Trophy className="w-2.5 h-2.5 text-amber-400" /> TOP 5 LEADERBOARD
                                    </span>
                                </div>

                                {/* Top 5 List */}
                                {Object.keys(autoWordleLeaderboard).length > 0 ? (
                                    <div className="w-full flex flex-col gap-0.5">
                                        {Object.values(autoWordleLeaderboard)
                                            .sort((a, b) => b.score - a.score)
                                            .slice(0, 5)
                                            .map((user, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-slate-800/60 hover:bg-slate-800 rounded px-1.5 py-0.5 border border-slate-700/40">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className={`text-[9px] font-mono font-black w-3.5 text-center ${
                                                            idx === 0 ? 'text-amber-400 font-extrabold' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                                                        }`}>
                                                            #{idx + 1}
                                                        </span>
                                                        <img src={user.avatar} className="w-3.5 h-3.5 rounded-full border border-slate-700 object-cover bg-slate-800" alt={user.nickname} />
                                                        <span className="text-[10px] font-semibold text-slate-200 truncate max-w-[85px] sm:max-w-[105px]">{user.nickname}</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono font-bold text-emerald-400">{user.score} pt</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                ) : (
                                    <div className="text-[9px] text-slate-500 italic py-1">Belum ada pemenang ronde</div>
                                )}
                            </div>
                        </div>

                        {/* Leaderboard Marquee Removed */}
                    </div>
                </div>
            )}

            {/* --- AUTO WORDLE MINIGAME OVERLAY --- */}
            {activeMinigame === "AUTO_WORDLE" && word500Target && (
                <div
                    ref={miniGameOverlayRef}
                    className={`z-[90] flex pointer-events-none animate-in slide-in-from-right fade-in duration-500 ${miniGamePos.x !== null ? 'fixed' : 'absolute bottom-24 sm:bottom-32 right-2 sm:right-4'}`}
                    style={miniGamePos.x !== null ? { left: miniGamePos.x, top: miniGamePos.y, bottom: 'auto', right: 'auto' } : {}}
                >
                    <div
                        className="pointer-events-auto bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-2xl flex flex-col p-1.5 sm:p-2 gap-1"
                        style={{
                            transform: `scale(${miniGameScale})`,
                            transformOrigin: miniGamePos.x !== null ? 'top left' : 'bottom right',
                            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            perspective: '600px'
                        }}
                    >
                        {/* Header for Dragging */}
                        <div className="flex items-center justify-between mb-0.5 pb-1 border-b border-slate-700/50 cursor-move touch-none" onMouseDown={handleMiniGameDragStart} onTouchStart={handleMiniGameDragStart}>
                            <div className="flex items-center gap-1.5">
                                <GripHorizontal className="w-3.5 h-3.5 text-slate-600" />
                                <span className="text-[11px] font-bold text-emerald-400 tracking-wide uppercase">Wordle</span>
                                <span className="text-[9px] text-slate-600 font-mono bg-slate-800 px-1 rounded">{word500Target.length} HURUF</span>
                            </div>
                            <div className="flex items-center gap-0.5 border-l border-slate-700/50 pl-1.5 ml-1.5" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                                <button onClick={(e) => { e.stopPropagation(); setMiniGameScale(p => Math.max(0.2, p - 0.1)); }} className="text-slate-600 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors disabled:opacity-30" disabled={miniGameScale <= 0.2}><Minus className="w-2.5 h-2.5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setMiniGameScale(p => Math.min(3.0, p + 0.1)); }} className="text-slate-600 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors disabled:opacity-30" disabled={miniGameScale >= 3.0}><Plus className="w-2.5 h-2.5" /></button>
                            </div>
                        </div>

                        {/* Flip Container */}
                        <div
                            style={{
                                position: 'relative',
                                transformStyle: 'preserve-3d',
                                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: word500FlipPhase === 'flipping' || word500FlipPhase === 'winner' ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                                minWidth: '170px'
                            }}
                        >
                            {/* Front: The Hint */}
                            <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }} className="flex justify-center mt-1 mb-1">
                                {autoWordleGuess ? (
                                    <div className="flex gap-1.5 animate-in slide-in-from-top-2 fade-in duration-300">
                                        {autoWordleGuess.word.split('').map((char, i) => {
                                            const colorClass = autoWordleGuess.colors[i] === 'green' ? 'bg-emerald-600 border-emerald-700 text-slate-50 shadow-emerald-900/20' : autoWordleGuess.colors[i] === 'yellow' ? 'bg-amber-600 border-amber-700 text-slate-50 shadow-amber-900/20' : 'bg-slate-700 border-slate-800 text-slate-200 shadow-black/20';
                                            return (
                                                <div key={`${autoWordleGuess.word}-${i}`} className={`w-9 h-9 sm:w-11 sm:h-11 shrink-0 border-b-[3px] rounded-md flex items-center justify-center font-black text-2xl sm:text-3xl leading-none uppercase transition-colors shadow-lg ${colorClass} animate-in zoom-in duration-300`} style={{ animationDelay: `${i * 100}ms` }}>
                                                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pt-0.5">{char}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex gap-1.5 animate-pulse">
                                        {Array(word500Target.length).fill(0).map((_, i) => <div key={i} className="w-9 h-9 sm:w-11 sm:h-11 bg-slate-800 border-b-[3px] border-slate-700 rounded-md" />)}
                                    </div>
                                )}
                            </div>

                            {/* Back: The Winner Reveal */}
                            <div
                                className="absolute inset-0 bg-emerald-950/90 rounded-lg border border-emerald-600/60 shadow-xl flex flex-col items-center justify-center p-2"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)'
                                }}
                            >
                                {word500Winner && (
                                    <div className="flex items-center gap-2 sm:gap-3 w-full justify-center px-1">
                                        <div className="relative shrink-0">
                                            <div className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping" />
                                            <img src={word500Winner.profilePictureUrl} className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-emerald-400 shadow-lg object-cover bg-slate-800" alt={word500Winner.nickname} />
                                        </div>
                                        <div className="flex flex-col items-start min-w-0">
                                            <span className="text-[10px] sm:text-xs font-black text-emerald-400 uppercase tracking-widest leading-none">BENAR!</span>
                                            <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[100px] sm:max-w-[140px] mt-0.5">{word500Winner.nickname}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Leaderboard Marquee */}
                        {Object.keys(autoWordleLeaderboard).length > 0 && (
                            <div className="mt-1 w-full overflow-hidden rounded bg-slate-950/60 border border-slate-700/50 relative flex items-center h-5 shrink-0">
                                <div className="absolute whitespace-nowrap animate-marquee flex items-center gap-4 px-2" style={{ animationDuration: `${Math.max(10, Object.keys(autoWordleLeaderboard).length * 4)}s` }}>
                                    {Object.values(autoWordleLeaderboard)
                                        .sort((a, b) => b.score - a.score)
                                        .slice(0, 10)
                                        .map((user, idx, arr) => (
                                            <div key={idx} className="flex items-center gap-1.5">
                                                <span className={`text-[9px] font-black ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-orange-400' : 'text-slate-500'}`}>
                                                    #{idx + 1}
                                                </span>
                                                <img src={user.avatar} className="w-3 h-3 rounded-full border border-slate-600 bg-slate-800 object-cover" />
                                                <span className="text-[10px] font-bold text-slate-200">{user.nickname}</span>
                                                <span className="text-[10px] font-black text-emerald-400">{user.score}</span>
                                                
                                                {/* Bullet Separator (kecuali item terakhir) */}
                                                {idx < arr.length - 1 && (
                                                    <span className="text-[8px] text-slate-700 ml-1 mr-0.5">●</span>
                                                )}
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
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
        @keyframes word500-tile-pop {
            0%   { transform: scaleY(0); opacity: 0; }
            50%  { transform: scaleY(1.15); opacity: 1; }
            100% { transform: scaleY(1); opacity: 1; }
        }
        .animate-word500-tile { animation: word500-tile-pop 0.3s ease-out forwards; }
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
            0%   { opacity: 0;   transform: translate(-50%, -50%) scale(0.2) rotate(0deg); }
            10%  { opacity: 1;   transform: translate(calc(-50% + var(--tx) * 0.2), calc(-50% + var(--ty) * 0.2)) scale(1.3) rotate(calc(var(--rot) * 0.3)); }
            30%  { opacity: 1;   transform: translate(calc(-50% + var(--tx) * 0.5), calc(-50% + var(--ty) * 0.5)) scale(1) rotate(calc(var(--rot) * 0.6)); }
            55%  { opacity: 0.9; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.9) rotate(var(--rot)); }
            80%  { opacity: 0.5; transform: translate(calc(-50% + var(--tx2) * 0.8), calc(-50% + var(--ty2) * 0.8)) scale(0.7) rotate(calc(var(--rot) * 1.4)); }
            100% { opacity: 0;   transform: translate(calc(-50% + var(--tx2)), calc(-50% + var(--ty2))) scale(0.3) rotate(calc(var(--rot) * 1.8)); }
        }
        .animate-flurry-heart {
            animation: flurry-heart var(--dur, 1.6s) cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
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

        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
        .animate-marquee {
            animation: marquee linear infinite;
        }
      `}</style>
            
            {/* --- MUSIC PLAYER OVERLAY --- */}
            <MusicPlayer musicState={musicState} wsRef={backendWsRef} isKeyboardOpen={showVirtualKeyboard} overlayStyle={musicOverlayStyle} />

            {/* --- CAMERA OVERLAY --- */}
            <CameraOverlay isEnabled={isCamEnabled} setIsEnabled={setIsCamEnabled} />

        </div>
    );
}
