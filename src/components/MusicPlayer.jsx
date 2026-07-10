import React, { useEffect, useState, useRef } from 'react';
import { Music, SkipForward, Volume2, VolumeX, ListMusic, X } from 'lucide-react';
import { SoundManager } from '../utils/constants';

const MusicPlayer = ({ musicState, wsRef, isKeyboardOpen, overlayStyle = 'thumbnail' }) => {
    const { current, queue } = musicState || { current: null, queue: [] };
    const [isMuted, setIsMuted] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [toast, setToast] = useState(null);
    const playerRef = useRef(null);
    const containerRef = useRef(null);
    const prevQueueRef = useRef(queue);
    const currentVideoIdRef = useRef(null);
    const [pos, setPos] = useState({ x: null, y: null });
    const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
    const overlayRef = useRef(null);

    useEffect(() => {
        // Load YouTube IFrame API
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = initPlayer;
        } else if (!playerRef.current) {
            initPlayer();
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, []);

    const initPlayer = () => {
        playerRef.current = new window.YT.Player('yt-player-container', {
            height: '100%',
            width: '100%',
            playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                rel: 0,
                modestbranding: 1,
                iv_load_policy: 3
            },
            events: {
                onReady: (event) => {
                    setPlayerReady(true);
                    if (isMuted) event.target.mute();
                    else event.target.unMute();
                    event.target.setVolume(100);
                },
                onStateChange: (event) => {
                    // YT.PlayerState.ENDED == 0
                    if (event.data === 0) {
                        handleSkipWithRetry();
                    }
                },
                onError: (e) => {
                    console.error("YT Player Error:", e);
                    handleSkipWithRetry();
                }
            }
        });
    };

    useEffect(() => {
        if (playerReady && playerRef.current && playerRef.current.loadVideoById) {
            if (current && current.videoId) {
                // Only load if it's a DIFFERENT video ID to prevent restarting
                if (currentVideoIdRef.current !== current.videoId) {
                    playerRef.current.loadVideoById(current.videoId);
                    currentVideoIdRef.current = current.videoId;
                }
            } else {
                playerRef.current.stopVideo();
                currentVideoIdRef.current = null;
            }
        }
    }, [current?.videoId, playerReady]);

    useEffect(() => {
        if (playerReady && playerRef.current && playerRef.current.mute) {
            if (isMuted) {
                playerRef.current.mute();
            } else {
                playerRef.current.unMute();
                playerRef.current.setVolume(100);
            }
        }
    }, [isMuted, playerReady]);

    const handleSkip = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ event: 'music_skip' }));
            return true;
        }
        return false;
    };

    // Retry skip up to 3x with 500ms delay if WS is temporarily disconnected
    const handleSkipWithRetry = (attempt = 0) => {
        if (handleSkip()) return;
        if (attempt < 3) {
            setTimeout(() => handleSkipWithRetry(attempt + 1), 500);
        } else {
            console.warn('[MusicPlayer] WS unavailable after retries, song ended without skip signal');
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    // Track queue changes to show toast and play SFX
    // Note: SFX uses Web Audio API which can cause browser audio ducking on YouTube.
    // Volume is intentionally kept very low (0.04) to minimise the ducking effect.
    useEffect(() => {
        if (queue.length > prevQueueRef.current.length) {
            const addedItems = queue.slice(prevQueueRef.current.length);
            const latestSong = addedItems[addedItems.length - 1];
            
            if (latestSong) {
                if (!isMuted) SoundManager.play("join");
                setToast({ ...latestSong, toastId: Date.now() });
            }
        }
        prevQueueRef.current = queue;
    }, [queue, isMuted]);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Drag functionality
    const handleDragStart = (e) => {
        if (e.target.closest('button')) return;
        dragRef.current.isDragging = true;
        dragRef.current.startX = e.clientX || (e.touches && e.touches[0].clientX);
        dragRef.current.startY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (pos.x === null && overlayRef.current) {
            const rect = overlayRef.current.getBoundingClientRect();
            dragRef.current.initialX = rect.left;
            dragRef.current.initialY = rect.top;
            setPos({ x: rect.left, y: rect.top });
        } else {
            dragRef.current.initialX = pos.x;
            dragRef.current.initialY = pos.y;
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!dragRef.current.isDragging) return;
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            const dx = clientX - dragRef.current.startX;
            const dy = clientY - dragRef.current.startY;
            setPos({
                x: dragRef.current.initialX + dx,
                y: dragRef.current.initialY + dy
            });
        };

        const handleMouseUp = () => {
            dragRef.current.isDragging = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleMouseMove, { passive: false });
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchend', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, []);

    return (
        <>
            {/* UI Overlay - Always rendered so YT API can bind, but hidden when no current song */}
            <div 
                ref={overlayRef}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                className={`fixed z-40 [perspective:1000px] transition-all cursor-move ${dragRef.current?.isDragging ? 'duration-0' : 'duration-500'} ${isFlipped ? 'w-72 h-52' : 'w-72 h-20'} ${current ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${pos.x === null ? 'bottom-4 right-4' : ''}`}
                style={pos.x !== null ? { left: `${pos.x}px`, top: `${pos.y}px` } : {}}
            >
                {/* TOAST NOTIFICATION FOR NEW REQUESTS */}
                <div className={`absolute bottom-full right-0 mb-3 z-[110] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${toast ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95 pointer-events-none'}`}>
                    {toast && (
                        <div className="bg-gradient-to-r from-sky-900/95 to-slate-900/95 border border-sky-500/40 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(14,165,233,0.2)] backdrop-blur-md flex items-center gap-3 w-72 pointer-events-none">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-inner">
                                <img src={toast.thumbnail} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-sky-500/20 mix-blend-overlay"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                                    </span>
                                    <p className="text-sky-300 text-[10px] font-bold uppercase tracking-wider">New Request</p>
                                </div>
                                <p className="text-white text-[11px] font-medium truncate drop-shadow-sm">{toast.title}</p>
                                <p className="text-slate-400 text-[9px] truncate">dari {toast.requesterName}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`w-full h-full relative transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(-180deg)]' : ''} ${!current ? 'translate-y-10' : 'translate-y-0'}`}>
                    
                    {/* FRONT FACE - CURRENT SONG */}
                    <div className="absolute inset-0 [backface-visibility:hidden] bg-slate-900/90 border border-slate-700/50 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3">
                        {/* Video / Thumbnail */}
                        <div className={`relative ${overlayStyle === 'video' ? 'w-16' : 'w-12'} h-12 rounded-lg overflow-hidden shrink-0 shadow-inner bg-slate-950 border border-slate-800 transition-all duration-300`}>
                            {/* Scaled iframe to crop out YouTube UI */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250%] h-[250%] pointer-events-none transition-opacity duration-300 ${overlayStyle === 'video' ? 'opacity-100' : 'opacity-0'}`}>
                                <div id="yt-player-container" className="w-full h-full"></div>
                            </div>
                            
                            {/* Thumbnail Image */}
                            <img 
                                src={current?.thumbnail} 
                                alt="thumbnail" 
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${overlayStyle === 'thumbnail' || !playerReady ? 'opacity-80' : 'opacity-0'}`} 
                            />

                            {/* Overlay to block clicks and add tint */}
                            <div className={`absolute inset-0 z-10 transition-colors duration-300 ${overlayStyle === 'thumbnail' || !playerReady ? 'bg-black/20' : 'bg-transparent'}`}></div>
                            
                            {(overlayStyle === 'thumbnail' || !playerReady) && (
                                <div className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none ${!playerReady ? 'bg-slate-800/80' : ''}`}>
                                    <Music className="w-5 h-5 text-white drop-shadow-md animate-pulse" />
                                </div>
                            )}
                        </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-white font-semibold text-xs truncate drop-shadow-sm">{current?.title || "Mencari musik..."}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <img src={current?.requesterImg || "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Req"} alt="" className="w-3.5 h-3.5 rounded-full bg-slate-800" />
                                    <p className="text-sky-300 text-[10px] truncate">Req: {current?.requesterName || "-"}</p>
                                </div>
                            </div>


                            {/* Controls */}
                            <div className="flex flex-col gap-1.5 shrink-0 border-l border-slate-700/50 pl-2">
                                <button 
                                    onClick={handleSkip}
                                    className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
                                    title="Skip Song"
                                >
                                    <SkipForward className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={toggleMute}
                                    className={`p-1.5 rounded-md transition-colors ${isMuted ? 'bg-red-900/50 text-red-400 hover:bg-red-800/50 hover:text-red-300' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                                    title={isMuted ? "Unmute" : "Mute"}
                                >
                                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                            
                            {/* Queue Badge */}
                            {queue.length > 0 && (
                                <button 
                                    onClick={() => setIsFlipped(true)}
                                    className="absolute -top-2 -left-2 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md border border-sky-400/30 transition-colors cursor-pointer flex items-center gap-1 z-10"
                                >
                                    <ListMusic className="w-3 h-3" />
                                    {queue.length}
                                </button>
                            )}
                        </div>

                        {/* BACK FACE - QUEUE */}
                        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-900/90 border border-slate-700/50 p-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col">
                            <div className="flex justify-between items-center mb-1.5 border-b border-slate-700/50 pb-1.5">
                                <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                                    <ListMusic className="w-3.5 h-3.5 text-sky-400" />
                                    Antrian Musik
                                </div>
                                <button onClick={() => setIsFlipped(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 rounded-md p-0.5">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
                                {queue.length === 0 ? (
                                    <p className="text-slate-400 text-[10px] text-center mt-3">Antrian kosong</p>
                                ) : (
                                    queue.map((song, i) => (
                                        <div key={song.id || i} className="flex items-center gap-1.5 bg-slate-800/40 p-1 rounded-md border border-slate-700/30">
                                            <div className="relative w-8 h-8 rounded shrink-0 overflow-hidden">
                                                <img src={song.thumbnail} alt="" className="w-full h-full object-cover opacity-80" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-[10px] font-medium truncate leading-tight">{song.title}</p>
                                                <p className="text-sky-300 text-[8px] truncate mt-0.5">Req: {song.requesterName}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
        </>
    );
};

export default MusicPlayer;
