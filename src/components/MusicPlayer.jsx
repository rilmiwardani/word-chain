import React, { useEffect, useState, useRef } from 'react';
import { Music, SkipForward, Volume2, VolumeX, ListMusic, X } from 'lucide-react';
import { SoundManager } from '../utils/constants';

const MusicPlayer = ({ musicState, wsRef }) => {
    const { current, queue } = musicState || { current: null, queue: [] };
    const [isMuted, setIsMuted] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [toast, setToast] = useState(null);
    const playerRef = useRef(null);
    const containerRef = useRef(null);
    const prevQueueRef = useRef(queue);
    const currentVideoIdRef = useRef(null);

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
            height: '0',
            width: '0',
            playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                rel: 0,
                modestbranding: 1
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

    return (
        <>
            {/* Hidden YouTube Player Container - Always rendered to prevent React DOM errors when YT API replaces it */}
            <div style={{ display: 'none' }}>
                <div id="yt-player-container"></div>
            </div>

            {/* TOAST NOTIFICATION FOR NEW REQUESTS */}
            <div className={`fixed bottom-[6.5rem] right-4 z-[110] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${toast ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
                {toast && (
                    <div className="bg-gradient-to-r from-sky-900/95 to-slate-900/95 border border-sky-500/40 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(14,165,233,0.2)] backdrop-blur-md flex items-center gap-3 w-72">
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

            {/* UI Overlay - Conditionally rendered when there is a current song */}
            {current && (
                <div className={`fixed bottom-4 right-4 z-[100] [perspective:1000px] transition-all duration-500 ${isFlipped ? 'w-72 h-52' : 'w-72 h-20'}`}>
                    <div className={`w-full h-full relative transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(-180deg)]' : ''}`}>
                        
                        {/* FRONT FACE - CURRENT SONG */}
                        <div className="absolute inset-0 [backface-visibility:hidden] bg-slate-900/90 border border-slate-700/50 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3">
                            {/* Thumbnail */}
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-inner bg-slate-800">
                                <img src={current.thumbnail} alt="thumbnail" className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Music className="w-5 h-5 text-white drop-shadow-md animate-pulse" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-white font-semibold text-xs truncate drop-shadow-sm">{current.title}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <img src={current.requesterImg || "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Req"} alt="" className="w-3.5 h-3.5 rounded-full bg-slate-800" />
                                    <p className="text-sky-300 text-[10px] truncate">Req: {current.requesterName}</p>
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
            )}
        </>
    );
};

export default MusicPlayer;
