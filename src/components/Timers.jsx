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
            className={`absolute -top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 font-black font-mono text-xs sm:text-sm px-2.5 py-0.5 rounded-full whitespace-nowrap transition-all duration-200 border-2 ${
                isCritical
                    ? "bg-red-600 text-white border-red-200 shadow-[0_0_16px_rgba(239,68,68,1)] animate-bounce"
                    : "bg-slate-950/95 text-amber-300 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.85)]"
            }`}
        >
            <Clock className={`w-3.5 h-3.5 ${isCritical ? "text-white animate-spin" : "text-amber-400"}`} />
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
