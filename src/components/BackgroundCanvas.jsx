import React, { useEffect, useRef } from "react";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SCRABBLE_SCORES = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
    N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

const RADAR_BLIPS = [
    { angle: 0.65, dist: 190, label: "AKSARA" },
    { angle: 2.15, dist: 225, label: "LEKSIKON" },
    { angle: 3.75, dist: 180, label: "SINONIM" },
    { angle: 5.15, dist: 215, label: "METAFORA" }
];

const DEFAULT_CHAIN_WORDS = [
    "MALAM", "LAMPU", "PULAU", "LAUTAN", "TANAH", "AHLI", "LINTAS", "SIKAP"
];

const CHAIN_ANCHORS = [
    { ax: 0.16, ay: 0.22 },
    { ax: 0.34, ay: 0.14 },
    { ax: 0.66, ay: 0.14 },
    { ax: 0.84, ay: 0.22 },
    { ax: 0.85, ay: 0.72 },
    { ax: 0.66, ay: 0.82 },
    { ax: 0.34, ay: 0.82 },
    { ax: 0.15, ay: 0.72 }
];

const SYLLABLES = [
    "BA", "CA", "DA", "KA", "LA", "MA", "NA", "PA",
    "RA", "SA", "TA", "WA", "AN", "IN", "UN", "NG"
];

const CONSTELLATION_NODES = Array.from({ length: 16 }).map((_, i) => ({
    baseAngle: (i / 16) * Math.PI * 2,
    rFactor: i % 2 === 0 ? 0.36 : 0.44,
    label: SYLLABLES[i],
    phase: i * 1.1
}));

const BackgroundCanvas = React.memo(({ theme = "CHAIN", lastPlay = null, currentWord = "", disabled = false }) => {
    const canvasRef = useRef(null);
    const pulseRef = useRef({ radius: -1, alpha: 0 });
    const prevPlayIdRef = useRef(lastPlay?.id);
    const chainHistoryRef = useRef([...DEFAULT_CHAIN_WORDS]);

    // When currentWord initializes at game start, push it if not already at end
    useEffect(() => {
        if (currentWord && typeof currentWord === "string" && !currentWord.includes("...")) {
            const clean = currentWord.trim().toUpperCase();
            if (clean.length >= 2) {
                const list = chainHistoryRef.current;
                if (list[list.length - 1] !== clean) {
                    chainHistoryRef.current = [...list.slice(-7), clean];
                }
            }
        }
    }, [currentWord]);

    // Trigger soft shockwave ring & append newly played word to Live Word Chain
    useEffect(() => {
        if (lastPlay?.id && lastPlay.id !== prevPlayIdRef.current) {
            prevPlayIdRef.current = lastPlay.id;
            pulseRef.current = { radius: 95, alpha: 0.55 };
            if (lastPlay.word) {
                const clean = lastPlay.word.trim().toUpperCase();
                const list = chainHistoryRef.current;
                if (list[list.length - 1] !== clean) {
                    chainHistoryRef.current = [...list.slice(-7), clean];
                }
            }
        }
    }, [lastPlay]);

    useEffect(() => {
        if (disabled || theme === "OFF") return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let rafId = null;
        let t = 0;

        const floatingTiles = Array.from({ length: 22 }).map((_, i) => ({
            x: ((i * 0.37) % 0.88) + 0.06,
            y: i / 22,
            size: 26 + (i % 3) * 6,
            speed: 0.00022 + (i % 3) * 0.00009,
            rot: ((i % 5) - 2) * 0.08,
            rotSpeed: (i % 2 === 0 ? 1 : -1) * 0.00045,
            char: ALPHABET[i % 26],
            depth: 0.45 + (i % 3) * 0.22
        }));

        const handleResize = () => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        const drawRoundRect = (x, y, width, height, radius) => {
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(x, y, width, height, radius);
            } else {
                ctx.rect(x, y, width, height);
            }
        };

        const draw = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = canvas.width / dpr;
            const h = canvas.height / dpr;
            const cx = w / 2;
            const cy = h / 2;
            t += 0.0045;

            ctx.clearRect(0, 0, w, h);

            if (theme === "CHAIN") {
                // 1. RANTAI KATA (Live Word Chain connected around the outer perimeter)
                const words = chainHistoryRef.current;
                const pts = CHAIN_ANCHORS.map((a, i) => {
                    const ox = Math.sin(t * 1.3 + i * 0.9) * 4;
                    const oy = Math.cos(t * 1.1 + i * 1.1) * 4;
                    return {
                        x: a.ax * w + ox,
                        y: a.ay * h + oy,
                        word: words[i % words.length] || "KATA"
                    };
                });

                for (let i = 0; i < pts.length - 1; i++) {
                    const p1 = pts[i];
                    const p2 = pts[i + 1];

                    ctx.strokeStyle = "rgba(56, 189, 248, 0.13)";
                    ctx.lineWidth = 1.2;
                    ctx.setLineDash([4, 5]);
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    const prog = ((t * 0.45) + i * 0.25) % 1;
                    const dx = p1.x + (p2.x - p1.x) * prog;
                    const dy = p1.y + (p2.y - p1.y) * prog;
                    ctx.fillStyle = "rgba(56, 189, 248, 0.42)";
                    ctx.beginPath();
                    ctx.arc(dx, dy, 2.2, 0, Math.PI * 2);
                    ctx.fill();
                }

                pts.forEach((p, idx) => {
                    const isLatest = idx === pts.length - 1;
                    const label = p.word.length > 10 ? p.word.slice(0, 9) + "…" : p.word;
                    const pillW = Math.max(58, label.length * 7 + 16);
                    const pillH = 22;

                    ctx.save();
                    ctx.translate(p.x, p.y);

                    ctx.fillStyle = isLatest ? "rgba(14, 116, 144, 0.20)" : "rgba(15, 23, 42, 0.50)";
                    ctx.strokeStyle = isLatest ? "rgba(56, 189, 248, 0.40)" : "rgba(56, 189, 248, 0.15)";
                    ctx.lineWidth = 1;
                    drawRoundRect(-pillW / 2, -pillH / 2, pillW, pillH, 11);
                    ctx.fill();
                    ctx.stroke();

                    ctx.font = "bold 9.5px monospace";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = isLatest ? "rgba(186, 230, 253, 0.62)" : "rgba(226, 232, 240, 0.34)";
                    ctx.fillText(label, 0, 0);

                    ctx.restore();
                });
            } else if (theme === "CONSTELLATION") {
                // 2. KONSTELASI SUKU KATA (Calm starry syllable constellation around the perimeter)
                const nodes = CONSTELLATION_NODES.map((n) => {
                    const angle = n.baseAngle + t * 0.035;
                    const rx = w * n.rFactor;
                    const ry = h * n.rFactor;
                    return {
                        x: cx + Math.cos(angle) * rx,
                        y: cy + Math.sin(angle) * ry,
                        label: n.label,
                        pulse: 0.5 + 0.5 * Math.sin(t * 1.5 + n.phase)
                    };
                });

                for (let i = 0; i < nodes.length; i++) {
                    const n1 = nodes[i];
                    const n2 = nodes[(i + 1) % nodes.length];
                    const n3 = nodes[(i + 2) % nodes.length];

                    ctx.strokeStyle = "rgba(56, 189, 248, 0.075)";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.moveTo(n1.x, n1.y);
                    ctx.lineTo(n3.x, n3.y);
                    ctx.stroke();
                }

                nodes.forEach((n) => {
                    const alpha = 0.12 + n.pulse * 0.22;
                    ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, 2.4, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.font = "bold 9.5px monospace";
                    ctx.fillStyle = `rgba(186, 230, 253, ${alpha * 1.15})`;
                    ctx.textAlign = "center";
                    ctx.fillText(n.label, n.x, n.y - 7);
                });
            } else if (theme === "ORBIT") {
                // 3. LEXICON ORBIT DIAL
                const baseR = Math.min(w, h) < 500 ? 145 : 195;
                const rings = [
                    { r: baseR, speed: 0.16, dash: [5, 10], color: "rgba(56, 189, 248, 0.14)" },
                    { r: baseR + 36, speed: -0.11, isLetters: true, color: "rgba(148, 163, 184, 0.16)" },
                    { r: baseR + 72, speed: 0.08, dash: [22, 12, 5, 12], color: "rgba(56, 189, 248, 0.11)" },
                    { r: baseR + 106, speed: -0.05, isTicks: true, color: "rgba(251, 191, 36, 0.11)" }
                ];

                rings.forEach((ring) => {
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(t * ring.speed);

                    if (ring.isLetters) {
                        ctx.font = "bold 11px monospace";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        for (let i = 0; i < 26; i++) {
                            const a = (i / 26) * Math.PI * 2;
                            ctx.save();
                            ctx.rotate(a);
                            ctx.translate(0, -ring.r);
                            const highlight = Math.sin(t * 1.4 + i) > 0.86;
                            ctx.fillStyle = highlight ? "rgba(56, 189, 248, 0.38)" : ring.color;
                            ctx.fillText(ALPHABET[i], 0, 0);
                            ctx.restore();
                        }
                    } else if (ring.isTicks) {
                        ctx.strokeStyle = ring.color;
                        ctx.lineWidth = 1.25;
                        for (let i = 0; i < 72; i++) {
                            const a = (i / 72) * Math.PI * 2;
                            const len = i % 6 === 0 ? 9 : 4;
                            ctx.beginPath();
                            ctx.moveTo(Math.cos(a) * ring.r, Math.sin(a) * ring.r);
                            ctx.lineTo(Math.cos(a) * (ring.r + len), Math.sin(a) * (ring.r + len));
                            ctx.stroke();
                        }
                    } else {
                        ctx.strokeStyle = ring.color;
                        ctx.lineWidth = 1.25;
                        ctx.setLineDash(ring.dash || []);
                        ctx.beginPath();
                        ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                });
            } else if (theme === "SCRABBLE") {
                // 4. FALLING SCRABBLE TILES
                floatingTiles.forEach((tile) => {
                    tile.y -= tile.speed;
                    tile.rot += tile.rotSpeed;
                    if (tile.y < -0.12) {
                        tile.y = 1.12;
                    }
                    const px = tile.x * w;
                    const py = tile.y * h;
                    const distCenter = Math.hypot(px - cx, py - cy);
                    const centerFade = distCenter < 180 ? 0.035 : 0.11;
                    const alpha = centerFade * tile.depth;

                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(tile.rot);
                    const s = tile.size;

                    ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 1.5})`;
                    ctx.fillStyle = `rgba(15, 23, 42, ${alpha * 2.0})`;
                    ctx.lineWidth = 1.1;
                    drawRoundRect(-s / 2, -s / 2, s, s, 6);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = `rgba(226, 232, 240, ${alpha * 1.9})`;
                    ctx.font = `900 ${Math.round(s * 0.5)}px sans-serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(tile.char, -1, 0);

                    ctx.fillStyle = `rgba(251, 191, 36, ${alpha * 2.0})`;
                    ctx.font = `bold ${Math.round(s * 0.24)}px monospace`;
                    ctx.fillText(SCRABBLE_SCORES[tile.char] || 1, s * 0.27, s * 0.27);

                    ctx.restore();
                });
            } else if (theme === "RADAR") {
                // 5. TACTICAL ARENA RADAR
                ctx.save();
                ctx.translate(cx, cy);

                ctx.strokeStyle = "rgba(56, 189, 248, 0.065)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-w, 0);
                ctx.lineTo(w, 0);
                ctx.moveTo(0, -h);
                ctx.lineTo(0, h);
                ctx.stroke();

                const step = Math.min(w, h) < 500 ? 45 : 62;
                [step * 2.4, step * 3.1, step * 3.8, step * 4.5].forEach((r) => {
                    ctx.beginPath();
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                    ctx.stroke();
                });

                const sweepAngle = (t * 0.65) % (Math.PI * 2);
                if (ctx.createConicGradient) {
                    const grad = ctx.createConicGradient(sweepAngle, 0, 0);
                    grad.addColorStop(0, "rgba(16, 185, 129, 0.13)");
                    grad.addColorStop(0.14, "rgba(16, 185, 129, 0.02)");
                    grad.addColorStop(0.25, "rgba(16, 185, 129, 0)");
                    grad.addColorStop(1, "rgba(16, 185, 129, 0)");

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(0, 0, step * 4.6, 0, Math.PI * 2);
                    ctx.fill();
                }

                RADAR_BLIPS.forEach((b) => {
                    const scaleDist = (Math.min(w, h) < 500 ? 0.78 : 1.15) * b.dist;
                    const bx = Math.cos(b.angle) * scaleDist;
                    const by = Math.sin(b.angle) * scaleDist;
                    let diff = (sweepAngle - b.angle) % (Math.PI * 2);
                    if (diff < 0) diff += Math.PI * 2;
                    const intensity = Math.max(0.12, 1 - diff / 2.4);

                    ctx.fillStyle = `rgba(52, 211, 153, ${intensity * 0.45})`;
                    ctx.beginPath();
                    ctx.arc(bx, by, 2.8, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.font = "bold 9px monospace";
                    ctx.fillText(b.label, bx + 7, by + 3);
                });

                ctx.restore();
            } else if (theme === "GRID") {
                // 6. ISOMETRIC WORD BOARD GRID
                const spacing = 44;
                ctx.strokeStyle = "rgba(56, 189, 248, 0.065)";
                ctx.lineWidth = 1;

                for (let y = 0; y < h + spacing; y += spacing) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(w, y);
                    ctx.stroke();
                }
                for (let x = 0; x < w + spacing; x += spacing) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, h);
                    ctx.stroke();
                }

                const cols = Math.ceil(w / spacing);
                const rows = Math.ceil(h / spacing);
                ctx.font = "bold 11px monospace";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const cellX = c * spacing;
                        const cellY = r * spacing;
                        const distCenter = Math.hypot(cellX + spacing / 2 - cx, cellY + spacing / 2 - cy);
                        if (distCenter < 155) continue;

                        const wave = Math.sin(c * 0.85 + r * 0.75 + t * 1.35);
                        if (wave > 0.78) {
                            const alpha = (wave - 0.78) * 0.55;
                            ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.25})`;
                            ctx.fillRect(cellX + 2, cellY + 2, spacing - 4, spacing - 4);
                            ctx.fillStyle = `rgba(125, 211, 252, ${alpha * 0.85})`;
                            const charIdx = Math.abs((c * 7 + r * 13) % 26);
                            ctx.fillText(ALPHABET[charIdx], cellX + spacing / 2, cellY + spacing / 2);
                        }
                    }
                }
            }

            // Soft shockwave pulse when a word is answered correctly
            if (pulseRef.current.radius > 0) {
                ctx.save();
                ctx.strokeStyle = `rgba(52, 211, 153, ${pulseRef.current.alpha})`;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(cx, cy, pulseRef.current.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                pulseRef.current.radius += 3.6;
                pulseRef.current.alpha *= 0.94;
                if (pulseRef.current.alpha < 0.015) {
                    pulseRef.current.radius = -1;
                }
            }

            rafId = requestAnimationFrame(draw);
        };

        rafId = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener("resize", handleResize);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [theme, disabled]);

    if (disabled || theme === "OFF") return null;

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
        />
    );
});

export default BackgroundCanvas;
