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
        spark: ['#ff9500', '#ffcc00', '#ffffff'],
        ember: ['#ff4400', '#ff6600', '#ff8800'],
        dust: ['#4a5568', '#718096'],
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

    function drawIsoBox(x: number, y: number, w: number, h: number, d: number, topColor: string, sideColor: string) {
      // South face
      ctx.fillStyle = sideColor;
      ctx.fillRect(x - w/2, y, w, d);
      // Top face
      ctx.fillStyle = topColor;
      ctx.fillRect(x - w/2, y - h, w, h);
      // Border
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - w/2, y - h, w, h);
    }

    function animate() {
      time++;
      ctx.clearRect(0, 0, 1200, 800);

      // Background - jungle night
      const bg = ctx.createRadialGradient(600, 400, 0, 600, 400, 700);
      bg.addColorStop(0, '#1a2817');
      bg.addColorStop(0.5, '#0f1f0a');
      bg.addColorStop(1, '#030a02');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1200, 800);

      // Isometric ground grid - jungle earth tones
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.05)';
      ctx.lineWidth = 0.5;
      const gridSize = 60;
      const gridOffset = (time * 0.2) % gridSize;
      for (let x = -gridSize + gridOffset; x < 1260; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 800);
        ctx.stroke();
      }
      for (let y = -gridSize + gridOffset; y < 860; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1200, y);
        ctx.stroke();
      }

      // 2.5D decorative boxes in background
      const boxes = [
        { x: 200, y: 500, w: 60, h: 40, d: 25, top: '#4b5563', side: '#2d3748' },
        { x: 900, y: 450, w: 80, h: 50, d: 30, top: '#6b7280', side: '#374151' },
        { x: 150, y: 350, w: 40, h: 30, d: 20, top: '#8B4513', side: '#5c3310' },
        { x: 1000, y: 550, w: 50, h: 35, d: 22, top: '#4b5563', side: '#1f2937' },
      ];
      boxes.forEach(b => {
        ctx.globalAlpha = 0.3;
        drawIsoBox(b.x, b.y, b.w, b.h, b.d, b.top, b.side);
        ctx.globalAlpha = 1;
      });

      // Spawn particles
      if (Math.random() > 0.7) spawnParticle();

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        
        if (p.type === 'ember') p.vx += (Math.random() - 0.5) * 0.2;
        
        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0 || p.y < -50) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (p.type === 'spark' || p.type === 'ember') {
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
          glow.addColorStop(0, p.color + '80');
          glow.addColorStop(1, p.color + '00');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          ctx.fill();
          
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

      // Central glow
      const pulseSize = 200 + Math.sin(time * 0.02) * 30;
      const centralGlow = ctx.createRadialGradient(600, 350, 0, 600, 350, pulseSize);
      centralGlow.addColorStop(0, 'rgba(59, 130, 246, 0.04)');
      centralGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = centralGlow;
      ctx.beginPath();
      ctx.arc(600, 350, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
      
      <div className="absolute inset-0 bg-gradient-to-t from-orange-950/10 via-transparent to-blue-950/20" />

      <div className={`relative z-10 text-center transition-all duration-1000 ease-out ${showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.4em] text-orange-400/50 mb-3 font-medium">
            💥 CHAOS MODE • 200+ OBJECTS 💥
          </div>
          
          <h1 className="text-7xl font-black tracking-tighter mb-1 leading-none">
            <span className="bg-gradient-to-b from-blue-200 via-blue-400 to-blue-600 bg-clip-text text-transparent"
              style={{ filter: 'drop-shadow(0 0 30px rgba(96, 165, 250, 0.4))' }}>
              STEEL
            </span>
          </h1>
          <h1 className="text-7xl font-black tracking-tighter leading-none -mt-2">
            <span className="bg-gradient-to-b from-orange-200 via-orange-400 to-red-600 bg-clip-text text-transparent"
              style={{ filter: 'drop-shadow(0 0 30px rgba(251, 146, 60, 0.4))' }}>
              THUNDER
            </span>
          </h1>
          
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-orange-400/40" />
            <div className="w-2 h-2 rotate-45 bg-orange-400/40" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-orange-400/40" />
          </div>
          
          <p className="mt-3 text-sm text-gray-400/70 font-light tracking-[0.15em]">
            EXPLOSIVE CHAOS • POWER-UPS • MAYHEM
          </p>
        </div>

        {/* Tank illustration */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <svg width="160" height="100" viewBox="0 0 160 100" className="drop-shadow-2xl">
              <defs>
                <linearGradient id="body2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="barrel2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e5e7eb" />
                  <stop offset="50%" stopColor="#f9fafb" />
                  <stop offset="100%" stopColor="#9ca3af" />
                </linearGradient>
              </defs>
              
              {/* 2.5D shadow */}
              <ellipse cx="82" cy="88" rx="55" ry="8" fill="rgba(0,0,0,0.4)" />
              
              {/* South side face */}
              <rect x="28" y="62" width="104" height="12" rx="2" fill="#1d4ed8" />
              <rect x="28" y="62" width="104" height="3" fill="#1e40af" />
              
              {/* Tracks */}
              <rect x="22" y="50" width="116" height="24" rx="8" fill="#374151" />
              <rect x="26" y="53" width="108" height="18" rx="6" fill="#1f2937" />
              
              {/* Hull top */}
              <path d="M32 50 L42 25 L118 25 L128 50 Z" fill="url(#body2)" />
              <path d="M38 50 L46 30 L114 30 L122 50 Z" fill="rgba(255,255,255,0.06)" />
              
              {/* Turret */}
              <circle cx="80" cy="38" r="18" fill="url(#body2)" />
              <circle cx="80" cy="38" r="18" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
              
              {/* Barrel */}
              <rect x="80" y="33" width="58" height="10" rx="3" fill="url(#barrel2)" />
              <rect x="133" y="31" width="8" height="14" rx="2" fill="#6b7280" />
              
              {/* Shine */}
              <ellipse cx="70" cy="33" rx="10" ry="5" fill="rgba(255,255,255,0.15)" />
              
              {/* Antenna */}
              <line x1="68" y1="30" x2="65" y2="12" stroke="rgba(200,200,200,0.5)" strokeWidth="1" />
              <circle cx="65" cy="11" r="2" fill="#60a5fa" />
            </svg>
            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl scale-150 -z-10" />
          </div>
        </div>

        <div className={`transition-all duration-700 delay-300 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={onStart}
            className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-xl rounded-2xl 
                       hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 
                       shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/60 hover:scale-105 active:scale-95
                       border border-blue-300/20 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span>⚔️</span>
              <span>START BATTLE</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity -z-10" />
          </button>
        </div>

        <div className={`mt-8 grid grid-cols-4 gap-3 max-w-lg mx-auto transition-all duration-700 delay-500 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            { label: 'Move', key: 'WASD' },
            { label: 'Aim', key: 'Mouse' },
            { label: 'Fire', key: 'Click' },
            { label: 'Pause', key: 'ESC' },
          ].map((c, i) => (
            <div key={i} className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-3 border border-white/[0.06] hover:border-blue-500/20 transition-all">
              <div className="text-blue-300/60 text-[10px] font-semibold mb-1 uppercase tracking-widest">{c.label}</div>
              <div className="text-gray-300 text-sm font-mono">{c.key}</div>
            </div>
          ))}
        </div>

        <div className={`mt-6 transition-all duration-700 delay-700 ${showButton ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[11px] text-gray-600 tracking-wide">
            Chain explosions • Power-ups • Tornadoes • Black holes • Turrets • Portals • Total chaos!
          </p>
        </div>
      </div>
    </div>
  );
}
