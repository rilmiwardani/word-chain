import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock } from 'lucide-react';
// 2.5 TIMERS (TO PREVENT APP RE-RENDER)
// ==========================================
const PlayerTimer = ({ isTurn, turnDuration, onTimeout, playSound, bombNext, onBombApplied, resetKey }) => {
    const [time, setTime] = useState(turnDuration);
    const hasTimedOutRef = useRef(false);
    const lastResetKeyRef = useRef(null);

    // Keep callbacks fresh without re-creating intervals
    const onTimeoutRef = useRef(onTimeout);
    const playSoundRef = useRef(playSound);
    const onBombAppliedRef = useRef(onBombApplied);
    useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);
    useEffect(() => { playSoundRef.current = playSound; }, [playSound]);
    useEffect(() => { onBombAppliedRef.current = onBombApplied; }, [onBombApplied]);

    // Reset timer on turn start — uses a key check to run exactly once per turn
    useEffect(() => {
        if (!isTurn) return;
        // Only reset if resetKey actually changed (prevents re-fires from other dep changes)
        if (lastResetKeyRef.current === resetKey) return;
        lastResetKeyRef.current = resetKey;

        hasTimedOutRef.current = false;
        if (bombNext) {
            setTime(10);
            // Defer the callback so it doesn't cause a re-render during this effect
            Promise.resolve().then(() => {
                onBombAppliedRef.current();
            });
        } else {
            setTime(turnDuration);
        }
    });

    // Clear lastResetKey when no longer our turn
    useEffect(() => {
        if (!isTurn) {
            lastResetKeyRef.current = null;
        }
    }, [isTurn]);

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
    const isCritical = time <= 5;
    return (
        <div
            className={`absolute -top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap backdrop-blur-md transition-all duration-300 border ${
                isCritical
                    ? "bg-rose-950/90 text-rose-300 border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse"
                    : "bg-slate-900/90 text-amber-300 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/20"
            }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? "bg-rose-500 animate-ping" : "bg-amber-400 animate-pulse"}`}></span>
            <span>{time}s</span>
        </div>
    );
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

    if (!isActive) return <div className="font-mono text-xl font-bold drop-shadow-md text-sky-300 flex items-center justify-center">0:00</div>;

    return (
        <div className={`font-mono text-xl font-bold drop-shadow-md flex items-center justify-center ${time <= 10 ? "text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" : "text-sky-300 drop-shadow-[0_0_8px_rgba(125,211,252,0.6)]"}`}>
            {`${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, "0")}`}
        </div>
    );
};

export { PlayerTimer, GlobalTimer };
