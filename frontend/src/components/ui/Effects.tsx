import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

// --- Particles Background Component ---
export const ParticleField: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const particles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }[] = [];
        const particleCount = 60;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 1.5,
                speedX: (Math.random() - 0.5) * 0.2,
                speedY: (Math.random() - 0.5) * 0.2,
                opacity: Math.random() * 0.5
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.fillStyle = `rgba(200, 220, 255, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen" />;
};

// --- Transition Overlay Component ---
export const ChannelSwitchOverlay: React.FC<{ trigger: number }> = ({ trigger }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // Use a ref to store the animation frame ID so we can cancel it
    const frameIdRef = useRef<number | null>(null);

    // Setup Canvas & Resize only (No loop here)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    // Trigger Transition & Manage Loop
    useEffect(() => {
        if (trigger === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // 1. Define the intense noise loop
        const drawNoise = () => {
            const w = canvas.width;
            const h = canvas.height;
            if (w <= 0 || h <= 0) return;

            const idata = ctx.createImageData(w, h);
            const buffer32 = new Uint32Array(idata.data.buffer);
            const len = buffer32.length;

            for (let i = 0; i < len; i++) {
                // Optimization: Skip random check occasionally or use simpler noise?
                // For now, standard noise is fine if it only runs for 0.5s
                if (Math.random() < 0.5) buffer32[i] = 0xffffffff;
                else buffer32[i] = 0xff000000;
            }
            ctx.putImageData(idata, 0, 0);
            
            frameIdRef.current = requestAnimationFrame(drawNoise);
        };

        // 2. Start the loop
        drawNoise();

        // 3. Animate Visibility with GSAP
        const tl = gsap.timeline({
            onComplete: () => {
                // STOP the loop when animation is done
                if (frameIdRef.current) {
                    cancelAnimationFrame(frameIdRef.current);
                    frameIdRef.current = null;
                }
                gsap.set(containerRef.current, { display: 'none' });
            }
        });

        tl.set(containerRef.current, { opacity: 0, display: 'block' })
            .to(containerRef.current, { opacity: 0.8, duration: 0.1, ease: "power1.in" })
            .to(containerRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });

        // Cleanup if component unmounts or trigger changes abruptly
        return () => {
            if (frameIdRef.current) {
                cancelAnimationFrame(frameIdRef.current);
            }
            tl.kill();
        };

    }, [trigger]);

    return (
        <div ref={containerRef} className="absolute inset-0 z-[60] pointer-events-none hidden mix-blend-hard-light">
            <canvas ref={canvasRef} className="w-full h-full opacity-50" />
            <div className="absolute inset-0 bg-black/20" />
        </div>
    );
};
