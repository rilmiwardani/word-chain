import React, { useEffect, useState, useRef } from 'react';
import { Camera, CameraOff, Settings, Minimize2, Move, RotateCcw, ShieldAlert, Sliders, ToggleLeft, ToggleRight, AlertCircle, RefreshCw, Video, Palette, Sparkles, X } from 'lucide-react';

const CameraOverlay = ({ isEnabled, setIsEnabled }) => {
    const [stream, setStream] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [hasError, setHasError] = useState(false);
    const [errorType, setErrorType] = useState(''); // 'busy', 'denied', 'none'
    const [useSimulation, setUseSimulation] = useState(() => localStorage.getItem('cam_use_sim') === 'true');
    
    // Customization states
    const [shape, setShape] = useState(() => localStorage.getItem('cam_shape') || 'rounded');
    const [size, setSize] = useState(() => Number(localStorage.getItem('cam_size')) || 200);
    const [aspectRatio, setAspectRatio] = useState(() => localStorage.getItem('cam_aspect') || '1:1');
    const [mirror, setMirror] = useState(() => localStorage.getItem('cam_mirror') === 'true');
    const [glowColor, setGlowColor] = useState(() => localStorage.getItem('cam_glow_color') || '#06b6d4');
    const [glowIntensity, setGlowIntensity] = useState(() => Number(localStorage.getItem('cam_glow_int')) || 15);
    const [borderWidth, setBorderWidth] = useState(() => Number(localStorage.getItem('cam_border_w')) || 3);
    const [opacity, setOpacity] = useState(() => Number(localStorage.getItem('cam_opacity')) || 100);
    const [filterMode, setFilterMode] = useState(() => localStorage.getItem('cam_filter') || 'none');
    const [showConfig, setShowConfig] = useState(false);
    const [activeTab, setActiveTab] = useState('camera'); // 'camera', 'layout', 'style'
    
    // Positioning
    const [pos, setPos] = useState(() => {
        try {
            const saved = localStorage.getItem('cam_pos');
            return saved ? JSON.parse(saved) : { x: 30, y: 150 };
        } catch {
            return { x: 30, y: 150 };
        }
    });

    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });

    // Load available video devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
                const list = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = list.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);
                if (videoDevices.length > 0 && !selectedDevice) {
                    const saved = localStorage.getItem('cam_device');
                    const defaultDev = videoDevices.find(d => d.deviceId === saved) || videoDevices[0];
                    setSelectedDevice(defaultDev.deviceId);
                }
                if (tempStream) {
                    tempStream.getTracks().forEach(track => track.stop());
                }
            } catch (err) {
                console.error("Error enumerating devices:", err);
            }
        };
        getDevices();
    }, []);

    // Start / Stop Stream
    const startStream = async () => {
        if (!isEnabled) return;
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }

        if (useSimulation) {
            setHasError(false);
            return;
        }

        try {
            setHasError(false);
            setErrorType('');
            
            const constraints = selectedDevice 
                ? { video: { deviceId: { exact: selectedDevice } } }
                : { video: true };
                
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.warn("Camera access failed:", err);
            setHasError(true);
            if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setErrorType('busy'); // Captured by OBS/Discord/etc
            } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setErrorType('denied'); // Permission blocked
            } else {
                setErrorType('none'); // No device
            }
        }
    };

    useEffect(() => {
        if (isEnabled) {
            startStream();
        } else {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isEnabled, selectedDevice, useSimulation]);

    // Update srcObject when videoRef mounts or stream changes
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Save configurations
    useEffect(() => {
        localStorage.setItem('cam_shape', shape);
        localStorage.setItem('cam_size', size.toString());
        localStorage.setItem('cam_aspect', aspectRatio);
        localStorage.setItem('cam_mirror', mirror.toString());
        localStorage.setItem('cam_glow_color', glowColor);
        localStorage.setItem('cam_glow_int', glowIntensity.toString());
        localStorage.setItem('cam_border_w', borderWidth.toString());
        localStorage.setItem('cam_opacity', opacity.toString());
        localStorage.setItem('cam_filter', filterMode);
        localStorage.setItem('cam_use_sim', useSimulation.toString());
    }, [shape, size, aspectRatio, mirror, glowColor, glowIntensity, borderWidth, opacity, filterMode, useSimulation]);

    // Drag handlers
    const handleDragStart = (e) => {
        if (e.target.closest('.no-drag')) return;
        dragRef.current.isDragging = true;
        dragRef.current.startX = e.clientX || (e.touches && e.touches[0].clientX);
        dragRef.current.startY = e.clientY || (e.touches && e.touches[0].clientY);
        dragRef.current.initialX = pos.x;
        dragRef.current.initialY = pos.y;
    };

    useEffect(() => {
        let rafId = null;
        const handleMouseMove = (e) => {
            if (!dragRef.current.isDragging) return;
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            const dx = clientX - dragRef.current.startX;
            const dy = clientY - dragRef.current.startY;
            
            const newX = dragRef.current.initialX + dx;
            const newY = dragRef.current.initialY + dy;
            dragRef.current.lastX = newX;
            dragRef.current.lastY = newY;

            if (containerRef.current) {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                    if (containerRef.current) {
                        containerRef.current.style.left = `${newX}px`;
                        containerRef.current.style.top = `${newY}px`;
                    }
                });
            }
        };

        const handleMouseUp = () => {
            if (dragRef.current.isDragging) {
                dragRef.current.isDragging = false;
                if (dragRef.current.lastX !== undefined) {
                    const newPos = { x: dragRef.current.lastX, y: dragRef.current.lastY };
                    setPos(newPos);
                    localStorage.setItem('cam_pos', JSON.stringify(newPos));
                }
            }
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
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    if (!isEnabled) return null;

    const getRatioHeight = () => {
        if (shape === 'circle' || shape === 'hexagon') return size;
        if (aspectRatio === '1:1') return size;
        if (aspectRatio === '4:3') return Math.round(size * 0.75);
        if (aspectRatio === '16:9') return Math.round(size * 0.5625);
        return size;
    };

    const filterCSS = () => {
        switch (filterMode) {
            case 'grayscale': return 'grayscale(100%)';
            case 'sepia': return 'sepia(80%)';
            case 'invert': return 'invert(90%)';
            case 'contrast': return 'contrast(130%) brightness(110%)';
            case 'dream': return 'hue-rotate(45deg) saturate(130%)';
            default: return 'none';
        }
    };

    const shapeStyles = () => {
        const borderStyle = `${borderWidth}px solid ${glowColor}`;
        const glowFilter = glowIntensity > 0 ? `0 0 ${glowIntensity}px ${glowColor}` : 'none';

        switch (shape) {
            case 'circle':
                return {
                    borderRadius: '50%',
                    border: borderStyle,
                    boxShadow: glowFilter
                };
            case 'hexagon':
                return {
                    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                    background: glowColor,
                    padding: `${borderWidth}px`
                };
            case 'square':
                return {
                    borderRadius: '0px',
                    border: borderStyle,
                    boxShadow: glowFilter
                };
            case 'pill':
                return {
                    borderRadius: '9999px',
                    border: borderStyle,
                    boxShadow: glowFilter
                };
            case 'rounded':
            default:
                return {
                    borderRadius: '24px',
                    border: borderStyle,
                    boxShadow: glowFilter
                };
        }
    };

    return (
        <div
            ref={containerRef}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                position: 'fixed',
                zIndex: 350,
                opacity: opacity / 100
            }}
            className="cursor-move select-none group/cam duration-0"
        >
            {/* Camera Outer Wrap */}
            <div 
                style={{ 
                    width: `${size}px`, 
                    height: `${getRatioHeight()}px`,
                    ...shapeStyles()
                }}
                className="relative overflow-hidden bg-slate-950 flex items-center justify-center transition-all duration-300"
            >
                {/* 1. Live camera feed */}
                {!useSimulation && stream && !hasError && (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: mirror ? 'scaleX(-1)' : 'none',
                            filter: filterCSS(),
                            clipPath: shape === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' : 'none'
                        }}
                    />
                )}

                {/* 2. Simulation Grid fallback OR user manually selected simulation */}
                {(useSimulation || hasError) && (
                    <div 
                        style={{
                            clipPath: shape === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' : 'none'
                        }}
                        className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 relative overflow-hidden"
                    >
                        {/* Futuristic animated bg lines */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60"></div>
                        <div className="absolute w-full h-0.5 bg-sky-500/25 top-0 left-0 animate-[bounce_3s_infinite]" style={{ backgroundColor: glowColor + '30' }}></div>
                        
                        <div className="relative flex flex-col items-center gap-1.5 z-10">
                            <div className="p-2.5 rounded-full bg-slate-900 border border-slate-800 animate-pulse">
                                <Camera className="w-6 h-6 text-sky-400" style={{ color: glowColor }} />
                            </div>
                            
                            {useSimulation ? (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-black text-sky-400 tracking-wider uppercase" style={{ color: glowColor }}>SIMULASI CAM</span>
                                    <span className="text-[8px] text-slate-400 max-w-[80%] mx-auto leading-tight">Seret & atur posisi overlay ini untuk streaming</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-0.5 px-2">
                                    <span className="text-[10px] font-black text-amber-500 tracking-wider uppercase flex items-center justify-center gap-1">
                                        <AlertCircle className="w-3 h-3 text-amber-500" /> CAMERA BUSY
                                    </span>
                                    <span className="text-[8px] text-slate-400 leading-tight">
                                        {errorType === 'busy' 
                                            ? 'Kamera dikunci OBS/Aplikasi lain'
                                            : errorType === 'denied'
                                            ? 'Izin akses diblokir'
                                            : 'Kamera tidak terdeteksi'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Floating controls on hover */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/cam:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2.5 pointer-events-none z-20">
                    <div className="flex justify-between items-center w-full pointer-events-auto no-drag">
                        <div className="flex items-center gap-1 bg-black/70 px-2.5 py-0.5 rounded-full text-[9px] text-sky-400 font-bold border border-sky-500/30" style={{ color: glowColor, borderColor: glowColor + '30' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" style={{ backgroundColor: glowColor }}></span>
                            {useSimulation ? 'TEST MODE' : 'CAM LIVE'}
                        </div>
                        <button
                            onClick={() => setShowConfig(!showConfig)}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-200 p-1.5 rounded-full border border-slate-700 shadow-lg transition-all active:scale-90"
                        >
                            <Settings className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex justify-center items-center w-full text-[10px] text-slate-300 font-semibold bg-black/60 py-1 rounded-full border border-slate-800/40">
                        <Move className="w-3.5 h-3.5 mr-1 text-sky-400 animate-bounce" /> Geser Posisi
                    </div>
                </div>
            </div>

            {/* Drag config panel */}
            {showConfig && (
                <div className="absolute top-0 left-full ml-3 bg-slate-950/90 backdrop-blur-xl border border-slate-800/60 p-3.5 rounded-2xl shadow-2xl text-slate-200 w-64 z-[360] no-drag font-sans select-none animate-in slide-in-from-left-4 duration-200 flex flex-col gap-3">
                    {/* Header */}
                    <div className="flex justify-between items-center pb-1">
                        <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Camera Overlay Settings</span>
                        <button 
                            onClick={() => setShowConfig(false)}
                            className="text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 p-1 rounded-lg transition-all"
                        >
                            <Minimize2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex bg-slate-900/85 p-0.5 rounded-lg border border-slate-800/80">
                        <button
                            onClick={() => setActiveTab('camera')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${activeTab === 'camera' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Video className="w-3.5 h-3.5" />
                            Kamera
                        </button>
                        <button
                            onClick={() => setActiveTab('layout')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${activeTab === 'layout' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Sliders className="w-3.5 h-3.5" />
                            Bingkai
                        </button>
                        <button
                            onClick={() => setActiveTab('style')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${activeTab === 'style' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Palette className="w-3.5 h-3.5" />
                            Efek
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-3">
                        {activeTab === 'camera' && (
                            <div className="space-y-3 animate-in fade-in duration-200">
                                {/* Simulation / Mock Toggle */}
                                <div className="bg-slate-900/40 border border-slate-800/60 p-2 rounded-xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-250 uppercase">Mode Simulasi</span>
                                        <span className="text-[8px] text-slate-400">Gunakan feed buatan</span>
                                    </div>
                                    <button
                                        onClick={() => setUseSimulation(!useSimulation)}
                                        className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${useSimulation ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {useSimulation ? 'ON' : 'OFF'}
                                    </button>
                                </div>

                                {/* Device Selector */}
                                {!useSimulation && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase">Pilih Perangkat</label>
                                        {devices.length === 0 ? (
                                            <div className="text-[9px] text-amber-500 flex items-center gap-1.5 p-2 bg-amber-950/20 rounded-lg border border-amber-900/40">
                                                <ShieldAlert className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                                                <span>Kamera tidak terdeteksi</span>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1.5">
                                                <select 
                                                    value={selectedDevice} 
                                                    onChange={(e) => {
                                                        setSelectedDevice(e.target.value);
                                                        localStorage.setItem('cam_device', e.target.value);
                                                    }}
                                                    className="bg-slate-900/80 border border-slate-800 rounded-md px-2 py-1 text-[11px] outline-none focus:border-sky-500 w-full font-medium"
                                                >
                                                    {devices.map(dev => (
                                                        <option key={dev.deviceId} value={dev.deviceId}>
                                                            {dev.label || `Camera ${dev.deviceId.slice(0,5)}...`}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button 
                                                    onClick={startStream}
                                                    className="bg-slate-900/80 hover:bg-slate-800 p-1.5 rounded-md border border-slate-800 text-slate-300 hover:text-white transition-colors"
                                                    title="Refresh Kamera"
                                                >
                                                    <RefreshCw className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Mirror Mode */}
                                <div className="bg-slate-900/40 border border-slate-800/60 p-2 rounded-xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-250 uppercase">Mirror Video</span>
                                        <span className="text-[8px] text-slate-400">Balik arah horizontal</span>
                                    </div>
                                    <button
                                        onClick={() => setMirror(!mirror)}
                                        className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${mirror ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {mirror ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'layout' && (
                            <div className="space-y-3 animate-in fade-in duration-200">
                                {/* Shape select */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Bentuk Bingkai</label>
                                    <div className="grid grid-cols-3 gap-1">
                                        {['rounded', 'circle', 'square', 'hexagon', 'pill'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setShape(s)}
                                                className={`py-1 rounded text-[9px] font-bold uppercase transition-all ${shape === s ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-900/60 text-slate-450 hover:bg-slate-800'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Size slider */}
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                                        <span>Lebar Bingkai</span>
                                        <span className="font-mono text-sky-400">{size}px</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="120" 
                                        max="450" 
                                        value={size} 
                                        onChange={(e) => setSize(Number(e.target.value))}
                                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500" 
                                    />
                                </div>

                                {/* Aspect ratio */}
                                {shape !== 'circle' && shape !== 'hexagon' && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase">Rasio Aspek</label>
                                        <div className="flex gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800">
                                            {['1:1', '4:3', '16:9'].map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => setAspectRatio(r)}
                                                    className={`flex-1 py-1 rounded text-[9px] font-bold transition-all ${aspectRatio === r ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'style' && (
                            <div className="space-y-3 animate-in fade-in duration-200">
                                {/* Border settings & Color */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase">Warna Neon</label>
                                        <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800/80 p-0.5 rounded-md">
                                            <input 
                                                type="color" 
                                                value={glowColor}
                                                onChange={(e) => setGlowColor(e.target.value)}
                                                className="w-6 h-6 border-0 bg-transparent cursor-pointer rounded overflow-hidden shrink-0" 
                                            />
                                            <span className="text-[8px] font-mono uppercase font-bold text-slate-350">{glowColor}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase">Tebal Garis</label>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            max="8" 
                                            value={borderWidth} 
                                            onChange={(e) => setBorderWidth(Number(e.target.value))}
                                            className="bg-slate-900/80 border border-slate-800 rounded-md px-1 py-0.5 text-[11px] text-center font-mono outline-none focus:border-sky-500 font-bold" 
                                        />
                                    </div>
                                </div>

                                {/* Glow intensity slider */}
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                                        <span>Intensitas Neon</span>
                                        <span className="font-mono text-sky-400">{glowIntensity}px</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="30" 
                                        value={glowIntensity} 
                                        onChange={(e) => setGlowIntensity(Number(e.target.value))}
                                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500" 
                                    />
                                </div>

                                {/* Transparency Opacity */}
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                                        <span>Opasitas</span>
                                        <span className="font-mono text-sky-400">{opacity}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="20" 
                                        max="100" 
                                        step="5"
                                        value={opacity} 
                                        onChange={(e) => setOpacity(Number(e.target.value))}
                                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500" 
                                    />
                                </div>

                                {/* Color Filters */}
                                {!useSimulation && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase">Efek / Filter</label>
                                        <div className="grid grid-cols-3 gap-1">
                                            {['none', 'grayscale', 'sepia', 'invert', 'contrast', 'dream'].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => setFilterMode(f)}
                                                    className={`py-1 rounded text-[8px] font-bold uppercase transition-all ${filterMode === f ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-850'}`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                        <button
                            onClick={() => {
                                setPos({ x: 30, y: 150 });
                                setShape('rounded');
                                setSize(200);
                                setAspectRatio('1:1');
                                setMirror(false);
                                setGlowColor('#06b6d4');
                                setGlowIntensity(15);
                                setBorderWidth(3);
                                setOpacity(100);
                                setFilterMode('none');
                                setUseSimulation(false);
                                localStorage.removeItem('cam_pos');
                            }}
                            className="flex-1 bg-slate-900/80 hover:bg-slate-800 py-1.5 rounded-lg text-[9px] font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1 border border-slate-800/60 uppercase"
                        >
                            <RotateCcw className="w-2.5 h-2.5" /> Reset
                        </button>
                        <button
                            onClick={() => {
                                setIsEnabled(false);
                                setShowConfig(false);
                            }}
                            className="flex-1 bg-red-950/20 hover:bg-red-950/40 py-1.5 rounded-lg text-[9px] font-bold text-red-400 hover:text-red-350 transition-all flex items-center justify-center gap-1 border border-red-950/40 uppercase"
                        >
                            <CameraOff className="w-2.5 h-2.5" /> Matikan
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CameraOverlay;
