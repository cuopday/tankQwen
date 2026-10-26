import { useState, useEffect, useRef } from 'react';

interface MenuProps {
  onStart: () => void;
}

export default function Menu({ onStart }: MenuProps) {
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 200);
    setTimeout(() => setShowButton(true), 700);
  }, []);

  // Animated background canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 800;

    interface MenuParticle {
      x: number; y: number; vx: number; vy: number;
      size: number; life: number; maxLife: number;
      color: string; type: 'spark' | 'ember' | 'dust';
    }

    const particles: MenuParticle[] = [];
    let time = 0;

    function spawnParticle() {
      const type = Math.random() > 0.7 ? 'ember' : Math.random() > 0.5 ? 'spark' : 'dust';
      const colors = {
        spark: ['#ff9500', '#ffcc00', '#ffffff', '#ffee00'],
        ember: ['#ff4400', '#ff6600', '#ff8800', '#ff2200'],
        dust: ['#4a5568', '#718096', '#a0aec0'],
      };
      const colorSet = colors[type];
      
      particles.push({
        x: Math.random() * 1200,
        y: 800 + Math.random() * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 3,
        size: type === 'dust' ? 2 + Math.random() * 4 : 1 + Math.random() * 2,
        life: 0,
        maxLife: type === 'dust' ? 200 + Math.random() * 200 : 100 + Math.random() * 150,
        color: colorSet[Math.floor(Math.random() * colorSet.length)],
        type,
      });
    }

    function animate() {
      time++;
      ctx.clearRect(0, 0, 1200, 800);

      // Background gradient
      const bg = ctx.createRadialGradient(600, 400, 0, 600, 400, 700);
      bg.addColorStop(0, '#1a1a2e');
      bg.addColorStop(0.5, '#0f172a');
      bg.addColorStop(1, '#030712');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1200, 800);

      // Animated grid
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.04)';
      ctx.lineWidth = 0.5;
      const gridOffset = (time * 0.3) % 60;
      for (let x = -60 + gridOffset; x < 1260; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 800);
        ctx.stroke();
      }
      for (let y = -60 + gridOffset; y < 860; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1200, y);
        ctx.stroke();
      }

      // Spawn particles
      if (Math.random() > 0.7) spawnParticle();

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        
        if (p.type === 'ember') {
          p.vx += (Math.random() - 0.5) * 0.2;
          p.vy -= 0.01;
        }
        
        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0 || p.y < -50) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (p.type === 'spark' || p.type === 'ember') {
          // Glow
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
          glow.addColorStop(0, p.color + '80');
          glow.addColorStop(1, p.color + '00');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Core
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }

      // Central glow pulse
      const pulseSize = 200 + Math.sin(time * 0.02) * 30;
      const centralGlow = ctx.createRadialGradient(600, 350, 0, 600, 350, pulseSize);
      centralGlow.addColorStop(0, 'rgba(59, 130, 246, 0.05)');
      centralGlow.addColorStop(0.5, 'rgba(99, 102, 241, 0.02)');
      centralGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = centralGlow;
      ctx.beginPath();
      ctx.arc(600, 350, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // Bottom fire glow
      const fireGlow = ctx.createRadialGradient(600, 850, 0, 600, 850, 400);
      fireGlow.addColorStop(0, `rgba(255, 100, 0, ${0.03 + Math.sin(time * 0.03) * 0.01})`);
      fireGlow.addColorStop(1, 'rgba(255, 50, 0, 0)');
      ctx.fillStyle = fireGlow;
      ctx.fillRect(0, 400, 1200, 400);

      animRef.current = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden select-none">
      {/* Animated canvas background */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-orange-950/10 via-transparent to-blue-950/20" />

      {/* Content */}
      <div className={`relative z-10 text-center transition-all duration-1000 ease-out ${showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
        {/* Title */}
        <div className="mb-8">
          {/* Subtitle above */}
          <div className="text-xs uppercase tracking-[0.4em] text-blue-400/50 mb-4 font-medium">
            ⚡ Tactical Warfare ⚡
          </div>
          
          {/* Main title */}
          <h1 className="text-8xl font-black tracking-tighter mb-1 leading-none">
            <span className="bg-gradient-to-b from-blue-200 via-blue-400 to-blue-600 bg-clip-text text-transparent"
              style={{ filter: 'drop-shadow(0 0 40px rgba(96, 165, 250, 0.4))' }}>
              STEEL
            </span>
          </h1>
          <h1 className="text-8xl font-black tracking-tighter leading-none -mt-3">
            <span className="bg-gradient-to-b from-orange-200 via-orange-400 to-red-600 bg-clip-text text-transparent"
              style={{ filter: 'drop-shadow(0 0 40px rgba(251, 146, 60, 0.4))' }}>
              THUNDER
            </span>
          </h1>
          
          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-blue-400/40" />
            <div className="w-2 h-2 rotate-45 bg-blue-400/40 shadow-lg shadow-blue-400/20" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-blue-400/40" />
          </div>
          
          <p className="mt-5 text-base text-gray-400/70 font-light tracking-[0.2em]">
            DOMINATE THE BATTLEFIELD
          </p>
        </div>

        {/* Tank illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <svg width="180" height="110" viewBox="0 0 180 110" className="drop-shadow-2xl">
              <defs>
                <linearGradient id="tankBody2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="20%" stopColor="#60a5fa" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="80%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="tankBarrel2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e5e7eb" />
                  <stop offset="30%" stopColor="#f9fafb" />
                  <stop offset="50%" stopColor="#f3f4f6" />
                  <stop offset="70%" stopColor="#d1d5db" />
                  <stop offset="100%" stopColor="#9ca3af" />
                </linearGradient>
                <linearGradient id="tankTrack2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4b5563" />
                  <stop offset="50%" stopColor="#374151" />
                  <stop offset="100%" stopColor="#1f2937" />
                </linearGradient>
                <radialGradient id="turretGlow">
                  <stop offset="0%" stopColor="rgba(96,165,250,0.3)" />
                  <stop offset="100%" stopColor="rgba(96,165,250,0)" />
                </radialGradient>
                <filter id="glow2">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Shadow */}
              <ellipse cx="90" cy="95" rx="60" ry="8" fill="rgba(0,0,0,0.4)" />
              
              {/* Tracks */}
              <rect x="22" y="60" width="136" height="28" rx="12" fill="url(#tankTrack2)" />
              <rect x="26" y="63" width="128" height="22" rx="10" fill="#1f2937" />
              {/* Track segments */}
              {Array.from({length: 14}).map((_, i) => (
                <rect key={i} x={30 + i * 9} y="65" width="5" height="18" rx="1" fill="#374151" opacity="0.5" />
              ))}
              {/* Wheels */}
              {[35, 70, 105, 140].map((wx, i) => (
                <circle key={i} cx={wx} cy="74" r="6" fill="#4b5563" stroke="#374151" strokeWidth="1" />
              ))}
              
              {/* Hull */}
              <path d="M32 60 L45 30 L135 30 L148 60 Z" fill="url(#tankBody2)" />
              <path d="M38 60 L48 34 L132 34 L142 60 Z" fill="rgba(255,255,255,0.06)" />
              {/* Hull details */}
              <line x1="48" y1="38" x2="132" y2="38" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <line x1="45" y1="48" x2="135" y2="48" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
              {/* Armor panels */}
              <rect x="50" y="42" width="20" height="12" rx="1" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
              <rect x="110" y="42" width="20" height="12" rx="1" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
              
              {/* Turret base */}
              <circle cx="90" cy="42" r="20" fill="url(#tankBody2)" />
              <circle cx="90" cy="42" r="20" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
              <circle cx="90" cy="42" r="16" fill="rgba(255,255,255,0.04)" />
              
              {/* Barrel */}
              <rect x="90" y="37" width="65" height="10" rx="4" fill="url(#tankBarrel2)" />
              {/* Barrel rings */}
              <rect x="110" y="36" width="3" height="12" rx="1" fill="rgba(0,0,0,0.15)" />
              <rect x="130" y="36" width="3" height="12" rx="1" fill="rgba(0,0,0,0.15)" />
              {/* Muzzle brake */}
              <rect x="150" y="34" width="10" height="16" rx="3" fill="#6b7280" />
              <rect x="150" y="35" width="10" height="6" rx="2" fill="rgba(255,255,255,0.15)" />
              <circle cx="158" cy="42" r="3" fill="#1f2937" />
              
              {/* Shine effects */}
              <ellipse cx="75" cy="38" rx="14" ry="6" fill="rgba(255,255,255,0.12)" />
              <ellipse cx="90" cy="37" rx="7" ry="3" fill="rgba(255,255,255,0.08)" />
              
              {/* Turret hatch */}
              <circle cx="85" cy="45" r="5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
              
              {/* Antenna */}
              <line x1="75" y1="35" x2="72" y2="15" stroke="rgba(200,200,200,0.5)" strokeWidth="1" />
              <circle cx="72" cy="14" r="2" fill="#60a5fa" filter="url(#glow2)" />
              
              {/* Engine glow */}
              <circle cx="90" cy="75" r="10" fill="url(#turretGlow)" />
              
              {/* Star emblem */}
              <polygon points="90,35 92,40 97,40 93,43 95,48 90,45 85,48 87,43 83,40 88,40" 
                       fill="rgba(255,255,255,0.25)" />
            </svg>
            {/* Glow effect behind tank */}
            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl scale-150 -z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-400/5 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Start button */}
        <div className={`transition-all duration-700 delay-300 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={onStart}
            className="group relative px-14 py-5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-xl rounded-2xl 
                       hover:from-blue-500 hover:via-cyan-400 hover:to-blue-400 transition-all duration-300 
                       shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/60 hover:scale-105 active:scale-95
                       border border-blue-300/20 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>START BATTLE</span>
            </span>
            {/* Button shine animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {/* Button glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity -z-10" />
          </button>
        </div>

        {/* Controls info */}
        <div className={`mt-10 grid grid-cols-4 gap-3 max-w-lg mx-auto transition-all duration-700 delay-500 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            { label: 'Move', key: 'WASD', icon: '↕↔' },
            { label: 'Aim', key: 'Mouse', icon: '⊕' },
            { label: 'Fire', key: 'Click', icon: '💥' },
            { label: 'Pause', key: 'ESC', icon: '⏸' },
          ].map((control, i) => (
            <div key={i} className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-3 border border-white/[0.06] hover:border-blue-500/20 transition-all hover:bg-white/[0.05] group">
              <div className="text-blue-300/60 text-[10px] font-semibold mb-1.5 uppercase tracking-widest">{control.label}</div>
              <div className="text-gray-300 text-sm font-mono group-hover:text-white transition-colors">{control.key}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`mt-8 transition-all duration-700 delay-700 ${showButton ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[11px] text-gray-600 tracking-wide">
            Survive waves of enemies • Destroy everything in your path • Become legend
          </p>
        </div>
      </div>
    </div>
  );
}
