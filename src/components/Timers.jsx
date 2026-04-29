import React, { useState, useEffect, useRef, useCallback } from 'react';
// 2.5 TIMERS (TO PREVENT APP RE-RENDER)
// ==========================================
const PlayerTimer = ({ isTurn, turnDuration, onTimeout, playSound, bombNext, onBombApplied, resetKey }) => {
    const [time, setTime] = useState(bombNext ? 10 : turnDuration);
    const hasTimedOutRef = useRef(false);

    // Keep callbacks fresh without re-creating intervals
    const onTimeoutRef = useRef(onTimeout);
    const playSoundRef = useRef(playSound);
    const onBombAppliedRef = useRef(onBombApplied);
    useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);
    useEffect(() => { playSoundRef.current = playSound; }, [playSound]);
    useEffect(() => { onBombAppliedRef.current = onBombApplied; }, [onBombApplied]);

    const resetTimer = useCallback(() => {
        hasTimedOutRef.current = false;
        setTime(bombNext ? 10 : turnDuration);
        if (bombNext) onBombAppliedRef.current();
    }, [bombNext, turnDuration]);

    useEffect(() => {
        if (!isTurn) return;
        resetTimer();
    }, [isTurn, resetKey, resetTimer]);

    useEffect(() => {
        if (!isTurn) return;
        const int = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
        return () => clearInterval(int);
    }, [isTurn, resetKey]);

    useEffect(() => {
        if (!isTurn) return;
        if (time <= 5 && time > 0) playSoundRef.current("tick");
        if (time === 0 && !hasTimedOutRef.current) {
            hasTimedOutRef.current = true;
            onTimeoutRef.current();
        }
    }, [time, isTurn]);

    if (!isTurn) return null;
    return <div className={`absolute -top-6 left-1/2 -translate-x-1/2 font-bold text-xs px-2 py-0.5 rounded-full shadow-sm z-50 whitespace-nowrap border ${time <= 5 ? "bg-red-900/80 text-red-200 animate-pulse border-red-700" : "bg-amber-900/80 text-amber-200 border-amber-700"}`}>{`${time}s`}</div>;
};

const GlobalTimer = ({ gameDuration, isActive, onTimeout, resetKey }) => {
    const [time, setTime] = useState(gameDuration);
    const hasTimedOutRef = useRef(false);
    const onTimeoutRef = useRef(onTimeout);
    useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);

    useEffect(() => {
        if (isActive) {
            hasTimedOutRef.current = false;
            setTime(gameDuration);
        }
    }, [isActive, resetKey, gameDuration]);

    useEffect(() => {
        if (!isActive) return;
        const int = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
        return () => clearInterval(int);
    }, [isActive, resetKey]);

    useEffect(() => {
        if (isActive && time === 0 && !hasTimedOutRef.current) {
            hasTimedOutRef.current = true;
            onTimeoutRef.current();
        }
    }, [time, isActive]);

    if (!isActive) return <div className="px-4 py-1 rounded-full font-mono text-xl font-bold border shadow-sm text-sky-300 border-sky-800 bg-sky-950/50">0:00</div>;

    return (
        <div className={`px-4 py-1 rounded-full font-mono text-xl font-bold border shadow-sm ${time <= 10 ? "text-red-400 border-red-800 bg-red-950/50 animate-pulse" : "text-sky-300 border-sky-800 bg-sky-950/50"}`}>
            {`${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, "0")}`}
        </div>
    );
};

export { PlayerTimer, GlobalTimer };
