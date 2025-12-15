import React, { useEffect, useRef, useState } from 'react';
import { Signal } from '@/types';
import { Radio, BarChart3, ArrowUpRight, Play, Pause, Activity, Zap, Server, Globe, Terminal, Cpu, Shield, Database, Lock, Crosshair, X } from 'lucide-react';
import { gsap } from 'gsap';

import { useRadioStore } from '@/store/useRadioStore';

// --- Left Panel: Signal Queue ---
interface SignalQueueProps {
    onCloseMobile?: () => void;
}

export const SignalQueue: React.FC<SignalQueueProps> = ({ onCloseMobile }) => {
    const {
        signals,
        currentSignal,
        setCurrentSignal,
        isPlaying,
        setIsPlaying
    } = useRadioStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const currentId = currentSignal?.id || null;

    useEffect(() => {
        if (!containerRef.current || containerRef.current.children.length === 0) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(containerRef.current!.children,
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" }
            );
        }, containerRef);

        return () => ctx.revert();
    }, [signals]);

    const handleItemHover = (e: React.MouseEvent, entering: boolean) => {
        if (e.currentTarget.classList.contains('active-signal')) return;

        gsap.to(e.currentTarget, {
            x: entering ? 6 : 0,
            y: entering ? -2 : 0,
            backgroundColor: entering ? 'rgba(6, 182, 212, 0.05)' : 'rgba(5, 7, 20, 0.6)',
            borderColor: entering ? 'rgba(6, 182, 212, 0.3)' : 'transparent',
            boxShadow: entering ? '0 0 12px rgba(6, 182, 212, 0.15)' : 'none',
            duration: 0.3,
            ease: "power2.out"
        });
    };

    const handleItemClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (currentId === id) {
            setIsPlaying(!isPlaying);
        } else {
            const s = signals.find(x => x.id === id);
            if (s) {
                setCurrentSignal(s);
                setIsPlaying(true);
            }
        }
    };

    return (
        <div className="h-full flex flex-col pt-4 relative">
            <div className="px-4 mb-4 flex items-center justify-between shrink-0">
                <h3 className="font-display text-xs font-bold text-ui-dim tracking-widest uppercase flex items-center gap-2">
                    <Radio size={12} className="text-accent-cyan" /> Incoming
                </h3>

                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-ui-dim bg-white/5 px-2 py-0.5 rounded border border-white/5">LIVE FEED</span>
                    {onCloseMobile && (
                        <button onClick={onCloseMobile} className="md:hidden text-ui-dim hover:text-white p-1">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div ref={containerRef} className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                {signals.map((signal) => {
                    const isActive = currentId === signal.id;
                    const isSignalPlaying = isActive && isPlaying;

                    return (
                        <div
                            key={signal.id}
                            onClick={(e) => handleItemClick(e, signal.id)}
                            onMouseEnter={(e) => !isActive && handleItemHover(e, true)}
                            onMouseLeave={(e) => !isActive && handleItemHover(e, false)}
                            className={`
                                group relative p-3 rounded border transition-all duration-300 cursor-pointer overflow-hidden
                                ${isActive
                                    ? 'active-signal bg-accent-cyan/5 border-l-4 border-l-accent-cyan border-y-accent-cyan/20 border-r-accent-cyan/20'
                                    : 'bg-space-panel/40 border-l-4 border-l-transparent border-y-transparent border-r-transparent hover:bg-space-panel/80'
                                }
                            `}
                        >
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-3 min-w-0">
                                    <button
                                        onClick={(e) => handleItemClick(e, signal.id)}
                                        className={`w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors border ${isActive ? 'bg-accent-cyan text-black border-accent-cyan' : 'bg-black text-ui-dim border-ui-border group-hover:text-white group-hover:border-white/30'}`}
                                    >
                                        {isSignalPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                                    </button>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            {isSignalPlaying && (
                                                <div className="flex gap-0.5 h-2 items-end">
                                                    <div className="w-0.5 bg-accent-cyan animate-[bounce_1s_infinite]" />
                                                    <div className="w-0.5 bg-accent-cyan animate-[bounce_1.2s_infinite]" />
                                                    <div className="w-0.5 bg-accent-cyan animate-[bounce_0.8s_infinite]" />
                                                </div>
                                            )}
                                            <span className={`font-mono text-xs font-bold truncate ${isActive ? 'text-accent-cyan' : 'text-ui-text group-hover:text-white'}`}>
                                                SIGNAL #{signal.id.substring(0, 4)}
                                            </span>
                                        </div>
                                        <div className="font-mono text-[9px] text-ui-dim uppercase flex items-center gap-2 truncate">
                                            <span>{signal.source || 'UNKNOWN'}</span>
                                            <span className="w-1 h-1 rounded-full bg-ui-dim" />
                                            <span className={`text-accent-${getMoodColor(signal.mood)}`}>{signal.mood}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right shrink-0 pl-2">
                                    <div className="font-mono text-[10px] text-ui-dim mb-1 bg-black/30 px-1.5 rounded">{signal.duration}</div>
                                    {signal.tips > 0 && <div className="text-[9px] text-accent-orange font-mono flex items-center justify-end gap-1"><Zap size={8} /> {signal.tips}</div>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Mini Network Globe for Stats Panel (Refined Aesthetic) ---
const MiniNetworkGlobe: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const resize = () => {
            if (canvas.parentElement) {
                const dpr = window.devicePixelRatio || 1;
                canvas.width = canvas.parentElement.clientWidth * dpr;
                canvas.height = canvas.parentElement.clientHeight * dpr;
                ctx.scale(dpr, dpr);
            }
        };
        resize();
        window.addEventListener('resize', resize);

        // Mouse Interaction
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: (e.clientX - rect.left) / rect.width - 0.5,
                y: (e.clientY - rect.top) / rect.height - 0.5
            };
        };
        canvas.addEventListener('mousemove', handleMouseMove);

        // Generate Nodes - Fibonacci Sphere distribution for even spread
        const nodes: { x: number, y: number, z: number, pulseOffset: number }[] = [];
        const numNodes = 60;
        const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

        for (let i = 0; i < numNodes; i++) {
            const y = 1 - (i / (numNodes - 1)) * 2; // y goes from 1 to -1
            const radius = Math.sqrt(1 - y * y); // radius at y
            const theta = phi * i; // golden angle increment

            const r = 0.8; // Globe radius
            nodes.push({
                x: Math.cos(theta) * radius * r,
                y: y * r,
                z: Math.sin(theta) * radius * r,
                pulseOffset: Math.random() * Math.PI * 2
            });
        }

        let currentRotX = 0;
        let currentRotY = 0;

        const render = (time: number) => {
            const w = canvas.width / (window.devicePixelRatio || 1);
            const h = canvas.height / (window.devicePixelRatio || 1);
            const cx = w / 2;
            const cy = h / 2;
            const scale = Math.min(w, h) * 0.45;

            // Clear with a very slight fade for trail effect (optional, strictly clear for crispness)
            ctx.clearRect(0, 0, w, h);

            // Enable additive blending for glowing "hologram" look
            ctx.globalCompositeOperation = 'lighter';

            // Draw Background "Core" (very faint)
            const coreGradient = ctx.createRadialGradient(cx, cy, scale * 0.2, cx, cy, scale * 0.9);
            coreGradient.addColorStop(0, 'rgba(0, 240, 255, 0.05)');
            coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = coreGradient;
            ctx.fillRect(0, 0, w, h);

            // Smooth Rotation Control
            const targetRotY = time * 0.0001 + mouseRef.current.x * 2.0;
            const targetRotX = mouseRef.current.y * 1.5;

            currentRotY += (targetRotY - currentRotY) * 0.05;
            currentRotX += (targetRotX - currentRotX) * 0.05;

            const sinY = Math.sin(currentRotY);
            const cosY = Math.cos(currentRotY);
            const sinX = Math.sin(currentRotX);
            const cosX = Math.cos(currentRotX);

            // Project Nodes
            const projected = nodes.map(node => {
                // Rotate Y
                const x1 = node.x * cosY - node.z * sinY;
                const z1 = node.z * cosY + node.x * sinY;
                // Rotate X
                const y2 = node.y * cosX - z1 * sinX;
                const z2 = z1 * cosX + node.y * sinX;

                const k = 2 / (2 + z2); // Perspective
                // Slow down pulse significantly
                const pulse = Math.sin(time * 0.0008 + node.pulseOffset); // slowed from 0.003
                return {
                    x: cx + x1 * k * scale,
                    y: cy + y2 * k * scale,
                    z: z2,
                    pulse: pulse,
                    origX: node.x,
                    origY: node.y,
                    origZ: node.z
                };
            });

            // Sort by depth for proper layering if we weren't using additive blending, 
            // but with 'lighter', order matters less. Still good practice.
            projected.sort((a, b) => b.z - a.z);

            // Draw Connections
            ctx.lineWidth = 0.5; // Very thin

            for (let i = 0; i < projected.length; i++) {
                const p1 = projected[i];
                if (p1.z < -0.5) continue; // Skip back-facing for cleaner look

                let connectionsCount = 0;

                for (let j = i + 1; j < projected.length; j++) {
                    const p2 = projected[j];
                    if (p2.z < -0.5) continue;

                    // Check 2D distance for visual connection
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    // Stricter threshold for cleaner look
                    if (distSq < 1600) { // 40px squared
                        const alpha = (1 - distSq / 1600) * 0.15; // Very faint lines
                        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                        connectionsCount++;
                        if (connectionsCount > 3) break; // Limit connections per node
                    }
                }
            }

            // Draw Nodes
            projected.forEach(p => {
                // Alpha based on depth
                const alpha = (p.z + 1.2) / 2.2;
                if (alpha < 0.1) return;

                // Higher threshold for active state -> fewer nodes light up
                const isActive = p.pulse > 0.9;

                // Base color
                ctx.fillStyle = isActive
                    ? `rgba(255, 255, 255, ${alpha})`
                    : `rgba(0, 240, 255, ${alpha * 0.5})`;

                // Size breathes
                const size = (p.z + 1.5) * (isActive ? 1.8 : 1.2);

                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fill();

                // Glow for active nodes
                if (isActive) {
                    // Inner bright core
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
                    ctx.fill();

                    // Outer glow (canvas shadow is expensive, simulate with gradient or larger circle)
                    const glowGrad = ctx.createRadialGradient(p.x, p.y, size, p.x, p.y, size * 3);
                    glowGrad.addColorStop(0, `rgba(0, 240, 255, ${alpha * 0.8})`);
                    glowGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
                    ctx.fillStyle = glowGrad;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Reset composite operation for next frame checks if needed
            ctx.globalCompositeOperation = 'source-over';

            animationId = requestAnimationFrame(render);
        };
        render(0);

        return () => {
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />;
};


// --- Right Panel: Stats ---
export const StatsPanel: React.FC = () => {
    const statsRef = useRef<HTMLDivElement>(null);
    const [logs, setLogs] = useState<{ time: string, action: string, id: string, type: 'info' | 'success' | 'warning' }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-generate network logs
    useEffect(() => {
        const actions = [
            { type: 'info', name: 'PACKET_IN' },
            { type: 'success', name: 'SYNC_NODE' },
            { type: 'info', name: 'HASH_VERIFY' },
            { type: 'warning', name: 'LATENCY_CHK' },
            { type: 'info', name: 'PEER_DISC' },
            { type: 'success', name: 'BLOCK_MINT' }
        ];

        const addLog = () => {
            const action = actions[Math.floor(Math.random() * actions.length)];
            const id = Math.floor(Math.random() * 9000 + 1000).toString();
            const time = new Date().toISOString().split('T')[1].slice(0, 8);
            setLogs(prev => [{ time, action: action.name, id, type: action.type as any }, ...prev].slice(0, 8));
        };

        // Slow down log updates to reduce blinking text
        const interval = setInterval(addLog, 3000);
        addLog();
        return () => clearInterval(interval);
    }, []);

    // Stats Entrance
    useEffect(() => {
        if (!statsRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(statsRef.current!.children,
                { opacity: 0, x: 20 },
                { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
            );
        }, statsRef);
        return () => ctx.revert();
    }, []);

    const handleStatHover = (e: React.MouseEvent, entering: boolean) => {
        gsap.to(e.currentTarget, {
            scale: entering ? 1.02 : 1,
            backgroundColor: entering ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            duration: 0.3
        });
    };

    return (
        <div ref={statsRef} className="h-full flex flex-col pt-4 gap-6 px-4">

            {/* Enhanced Network Activity UI */}
            <div className="bg-space-panel/50 backdrop-blur-md border border-ui-border rounded-lg overflow-hidden group hover:border-accent-cyan/30 transition-colors flex flex-col h-72 shadow-2xl relative">
                {/* Decorative Header */}
                <div className="flex justify-between items-center p-3 border-b border-ui-border/50 bg-black/40 shrink-0">
                    <span className="font-display text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                        <Globe size={12} className="text-accent-cyan" /> Network
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                            <div className="w-0.5 h-2 bg-ui-dim/30" />
                            <div className="w-0.5 h-2 bg-ui-dim/30" />
                            <div className="w-0.5 h-2 bg-ui-dim/30" />
                        </div>
                        <div className="flex items-center gap-1.5 bg-accent-phosphor/10 px-2 py-0.5 rounded border border-accent-phosphor/20">
                            <span className="w-1.5 h-1.5 bg-accent-phosphor rounded-full shadow-[0_0_5px_currentColor]" />
                            <span className="font-mono text-[9px] text-accent-phosphor">LIVE</span>
                        </div>
                    </div>
                </div>

                {/* Globe Visualization */}
                <div className="relative flex-1 bg-space-black w-full overflow-hidden">
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] opacity-50" />
                    <div className="absolute inset-0 bg-radial-gradient from-transparent to-space-black opacity-80" />

                    {/* 3D Globe */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <div className="w-[120%] h-[120%]">
                            <MiniNetworkGlobe />
                        </div>
                    </div>

                    {/* Data Overlay - Floating UI Elements */}
                    <div className="absolute top-3 left-3 z-30 font-mono text-[8px] text-accent-cyan/70 space-y-1">
                        <div className="flex items-center gap-2"><span className="w-1 h-1 bg-accent-cyan" /> NODES: 42</div>
                        <div className="flex items-center gap-2"><span className="w-1 h-1 bg-ui-dim" /> PEERS: 128</div>
                    </div>
                </div>

                {/* Scrolling Logs - Recessed Terminal Look */}
                <div className="h-28 bg-black/60 border-t border-ui-border/30 p-2 overflow-hidden relative shrink-0 font-mono text-[9px]">
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent opacity-50" />

                    <div ref={scrollRef} className="space-y-1 relative z-0">
                        {logs.map((log, i) => (
                            <div key={i} className={`flex gap-2 items-center ${i === 0 ? 'opacity-100' : 'opacity-60 grayscale'}`}>
                                <span className="text-ui-dim">[{log.time}]</span>
                                <span className={`
                            ${log.type === 'success' ? 'text-accent-phosphor' :
                                        log.type === 'warning' ? 'text-accent-orange' : 'text-accent-cyan'}
                            font-bold tracking-wide
                        `}>
                                    {log.action}
                                </span>
                                <span className="text-ui-dim flex-1 border-b border-ui-dim/10 border-dotted mx-1"></span>
                                <span className="text-white/80">{log.id}</span>
                                {i === 0 && <span className="w-1.5 h-3 bg-accent-cyan/50 inline-block ml-1" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Signals */}
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <h3 className="font-display text-xs font-bold text-ui-dim tracking-widest uppercase flex items-center gap-2">
                        <BarChart3 size={12} /> Trending
                    </h3>
                </div>

                <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            onMouseEnter={(e) => handleStatHover(e, true)}
                            onMouseLeave={(e) => handleStatHover(e, false)}
                            className="flex items-center justify-between p-2 rounded cursor-pointer group border border-transparent bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="font-mono text-xs text-ui-dim font-bold w-4">0{i}</div>
                                <div>
                                    <div className="font-mono text-xs text-ui-text group-hover:text-accent-cyan transition-colors">Signal #{4000 + i * 24}</div>
                                    <div className="font-mono text-[9px] text-ui-dim flex items-center gap-2">
                                        <span>Sector 7G</span>
                                        <span className="w-1 h-1 rounded-full bg-ui-dim" />
                                        <span>{100 - i * 15} Echoes</span>
                                    </div>
                                </div>
                            </div>
                            <ArrowUpRight size={12} className="text-ui-dim group-hover:text-accent-cyan transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-300" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Stats Grid */}
            <div className="grid grid-cols-2 gap-2 pb-4 shrink-0">
                <StatBox label="GAS (MNT)" value="0.001" icon={Zap} color="text-accent-orange" />
                <StatBox label="LATENCY" value="24ms" icon={Server} color="text-accent-phosphor" />
            </div>
        </div>
    );
};

// ... (Rest of components: TopologyGlobe, SystemLogs, StatusBadge, ResourceBar, StatBox, getMoodColor)
// TopologyGlobe needs similar refinement for consistency

// --- Refined Dynamic Point Cloud Globe Component (TopologyGlobe) ---
const TopologyGlobe: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                const dpr = window.devicePixelRatio || 1;
                canvas.width = parent.clientWidth * dpr;
                canvas.height = parent.clientHeight * dpr;
                ctx.scale(dpr, dpr);
                canvas.style.width = `${parent.clientWidth}px`;
                canvas.style.height = `${parent.clientHeight}px`;
            }
        };
        resize();
        window.addEventListener('resize', resize);

        // Mouse Handler
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: (e.clientX - rect.left) / rect.width - 0.5,
                y: (e.clientY - rect.top) / rect.height - 0.5
            };
        };
        canvas.addEventListener('mousemove', handleMouseMove);

        const numPoints = 160;
        const points: { x: number, y: number, z: number, pulseOffset: number }[] = [];
        const phi = Math.PI * (3 - Math.sqrt(5));

        for (let i = 0; i < numPoints; i++) {
            const y = 1 - (i / (numPoints - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const theta = phi * i;
            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;
            points.push({ x, y, z, pulseOffset: Math.random() * 100 });
        }

        let currentRotX = 0;
        let currentRotY = 0;

        const render = (time: number) => {
            const w = parseFloat(canvas.style.width);
            const h = parseFloat(canvas.style.height);
            const cx = w / 2;
            const cy = h / 2;
            const globeRadius = Math.min(w, h) * 0.35;

            ctx.clearRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'lighter'; // Aesthetic upgrade

            const targetRotY = time * 0.00015 + mouseRef.current.x * 2;
            const targetRotX = mouseRef.current.y * 1.5;

            currentRotY += (targetRotY - currentRotY) * 0.05;
            currentRotX += (targetRotX - currentRotX) * 0.05;

            const sinY = Math.sin(currentRotY);
            const cosY = Math.cos(currentRotY);
            const sinX = Math.sin(currentRotX);
            const cosX = Math.cos(currentRotX);

            const projectedPoints: { x: number, y: number, z: number, opacity: number, pulse: number }[] = [];

            points.forEach(p => {
                // Y Rot
                let px = p.x * cosY - p.z * sinY;
                let pz = p.z * cosY + p.x * sinY;
                // X Rot
                let py = p.y * cosX - pz * sinX;
                let zFinal = pz * cosX + p.y * sinX;

                const zFactor = 3;
                const scale = globeRadius * (zFactor / (zFactor - zFinal));

                const x2d = cx + px * scale;
                const y2d = cy + py * scale;

                const alpha = (zFinal + 1.2) / 2.2;
                // Slow down pulse significantly
                const pulse = (Math.sin(time * 0.0005 + p.pulseOffset) + 1) / 2;

                projectedPoints.push({ x: x2d, y: y2d, z: zFinal, opacity: alpha, pulse });
            });

            ctx.lineWidth = 0.3; // Thinner lines
            projectedPoints.forEach((p1, i) => {
                if (p1.z < -0.2) return;

                projectedPoints.forEach((p2, j) => {
                    if (i >= j) return;
                    if (p2.z < -0.2) return;

                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distSq = dx * dx + dy * dy;
                    const threshold = 50 * 50;

                    if (distSq < threshold) {
                        const alpha = Math.min(p1.opacity, p2.opacity) * (1 - distSq / threshold) * 0.3;
                        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                });
            });

            projectedPoints.forEach(p => {
                // Higher active threshold
                const isActive = p.pulse > 0.9;
                const size = (1.5 + (isActive ? p.pulse * 0.5 : 0)) * (p.z + 2) * 0.6; // Slightly larger for clarity
                const alpha = Math.max(0.1, p.opacity);

                ctx.fillStyle = isActive
                    ? `rgba(255, 255, 255, ${alpha})`
                    : `rgba(0, 240, 255, ${alpha * 0.4})`;

                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fill();

                if (isActive && p.z > 0) {
                    // Add simple glow
                    ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            ctx.globalCompositeOperation = 'source-over';
            animationFrameId = requestAnimationFrame(render);
        };
        render(0);

        return () => {
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-space-black opacity-80 z-10 pointer-events-none" />
            <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
        </div>
    );
};

export const SystemLogs: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const actions = ['ENCRYPTING', 'HANDSHAKE', 'VERIFYING', 'PACKET_LOSS', 'RE-ROUTING', 'OPTIMIZING', 'SYNC'];
            const targets = ['NODE_ALPHA', 'PROXY_7', 'SECURE_VAULT', 'GATEWAY_9', 'KERNEL_CORE'];
            const newLine = `[${new Date().toLocaleTimeString()}] ${actions[Math.floor(Math.random() * actions.length)]} >> ${targets[Math.floor(Math.random() * targets.length)]} :: ${Math.random().toString(16).substr(2, 6)}`;

            setLines(prev => [newLine, ...prev].slice(0, 20));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;
        const ctx = gsap.context(() => {
            gsap.from(".sys-box", {
                y: 20,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-ui-border pb-4 shrink-0 gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white mb-1 tracking-wider glitch-text text-phosphor">SYSTEM KERNEL</h2>
                    <p className="font-mono text-xs text-ui-dim tracking-widest uppercase">ROOT ACCESS GRANTED // LEVEL 5 SECURITY</p>
                </div>
                <div className="flex gap-4">
                    <StatusBadge label="SERVER" status="ONLINE" color="text-accent-phosphor" />
                    <StatusBadge label="DB SHARD" status="SYNCED" color="text-accent-cyan" />
                    <StatusBadge label="FIREWALL" status="ACTIVE" color="text-accent-orange" />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1 min-h-[500px]">
                <div className="sys-box lg:col-span-2 xl:col-span-3 bg-space-panel border border-ui-border rounded-xl relative overflow-hidden flex flex-col group min-h-[400px]">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 pointer-events-none">
                        <div className="bg-black/40 backdrop-blur px-3 py-1 rounded border border-ui-border/50 flex items-center gap-2">
                            <Globe size={14} className="text-accent-cyan" />
                            <span className="font-mono text-[10px] text-ui-dim tracking-widest">GLOBAL_TOPOLOGY</span>
                        </div>
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-accent-red rounded-full animate-pulse" />
                            <span className="font-mono text-[9px] text-accent-red">LIVE_TRACKING</span>
                        </div>
                    </div>
                    <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-accent-cyan/30 z-20 m-2 rounded-tl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-accent-cyan/30 z-20 m-2 rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-accent-cyan/30 z-20 m-2 rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-accent-cyan/30 z-20 m-2 rounded-br" />
                    <div className="absolute inset-0 bg-black/40">
                        <TopologyGlobe />
                        <div className="absolute bottom-4 left-4 font-mono text-[9px] text-ui-dim space-y-1 z-20 pointer-events-none">
                            <div>CAM_Z: 400.00</div>
                            <div>FOV: 75.00</div>
                            <div className="flex items-center gap-2">
                                <span>ROTATION:</span>
                                <div className="w-12 h-0.5 bg-ui-dim/30 overflow-hidden">
                                    <div className="h-full bg-accent-cyan/50 animate-[width_2s_ease-in-out_infinite] w-1/2" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-20">
                            <Crosshair size={300} className="text-ui-dim stroke-[0.5]" />
                        </div>
                    </div>
                </div>

                <div className="sys-box flex flex-col gap-6">
                    <div className="bg-space-panel border border-ui-border rounded-xl p-4 flex-1">
                        <div className="flex items-center gap-2 mb-4 font-mono text-xs text-ui-dim"><Cpu size={14} /> RESOURCES</div>
                        <div className="space-y-4">
                            <ResourceBar label="CPU CORE 0" value={45} color="bg-accent-cyan" />
                            <ResourceBar label="CPU CORE 1" value={72} color="bg-accent-cyan" />
                            <ResourceBar label="MEMORY" value={30} color="bg-accent-purple" />
                            <ResourceBar label="BANDWIDTH" value={85} color="bg-accent-orange" />
                            <ResourceBar label="STORAGE" value={12} color="bg-accent-phosphor" />
                        </div>
                    </div>

                    <div className="bg-space-panel border border-ui-border rounded-xl p-4 h-48 overflow-hidden relative">
                        <div className="flex items-center gap-2 mb-2 font-mono text-xs text-ui-dim"><Shield size={14} /> SECURITY EVENT</div>
                        <div className="font-mono text-[10px] space-y-1.5 text-ui-dim">
                            <div className="text-accent-red flex justify-between"><span>! INTRUSION DETECTED</span> <span>02ms</span></div>
                            <div className="flex justify-between"><span>FIREWALL.BLOCK</span> <span>10ms</span></div>
                            <div className="flex justify-between"><span>IP.LOG.ROTATE</span> <span>45ms</span></div>
                            <div className="text-accent-phosphor flex justify-between"><span>AUTH.SUCCESS</span> <span>120ms</span></div>
                        </div>
                    </div>
                </div>

                <div className="sys-box lg:col-span-3 xl:col-span-4 h-64 bg-black/80 border border-ui-border rounded-xl font-mono text-xs p-4 overflow-hidden relative font-mono shadow-inner">
                    <div className="absolute top-2 right-4 text-ui-dim text-[10px] flex items-center gap-2"><Terminal size={12} /> BASH_V4.2</div>
                    <div className="space-y-1 h-full overflow-hidden flex flex-col justify-end">
                        {lines.map((line, i) => (
                            <div key={i} className="text-ui-dim/80 hover:text-white transition-colors border-l-2 border-transparent hover:border-accent-cyan pl-2">
                                <span className="text-accent-cyan mr-2">$</span>
                                {line}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

const StatusBadge = ({ label, status, color }: any) => (
    <div className="flex flex-col items-end">
        <span className="text-[9px] font-mono text-ui-dim">{label}</span>
        <span className={`text-xs font-bold font-display ${color} tracking-wider`}>{status}</span>
    </div>
);

const ResourceBar = ({ label, value, color }: any) => (
    <div>
        <div className="flex justify-between text-[9px] font-mono text-ui-dim mb-1">
            <span>{label}</span>
            <span>{value}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${value}%` }} />
        </div>
    </div>
);

const StatBox = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-space-panel border border-ui-border p-2.5 rounded hover:border-ui-borderHover transition-colors group">
        <div className="flex justify-between items-start mb-1">
            <span className="font-mono text-[9px] text-ui-dim">{label}</span>
            <Icon size={10} className="text-ui-dim group-hover:text-white transition-colors" />
        </div>
        <div className={`font-mono text-sm ${color} tracking-wider`}>{value}</div>
    </div>
);

const getMoodColor = (mood: string) => {
    switch (mood) {
        case 'CALM': return 'cyan';
        case 'EXCITED': return 'orange';
        case 'MYSTERIOUS': return 'purple';
        case 'URGENT': return 'red';
        default: return 'phosphor';
    }
};