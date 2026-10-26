import { useState, useEffect } from 'react';

interface MenuProps {
  onStart: () => void;
}

export default function Menu({ onStart }: MenuProps) {
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; speed: number; opacity: number; delay: number }>>([]);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 300);
    setTimeout(() => setShowButton(true), 800);
    
    // Generate floating particles
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      speed: 0.5 + Math.random() * 2,
      opacity: 0.05 + Math.random() * 0.2,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden select-none">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(100,150,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100,150,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            animation: 'gridScroll 20s linear infinite',
          }}
        />
        
        {/* Floating particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              background: p.id % 3 === 0 ? '#60a5fa' : p.id % 3 === 1 ? '#a78bfa' : '#f97316',
              animation: `float ${10 / p.speed}s ease-in-out infinite alternate`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
        
        {/* Radial glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-3xl" />
        
        {/* Scan line effect */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />
      </div>

      {/* Content */}
      <div className={`relative z-10 text-center transition-all duration-1000 ease-out ${showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
        {/* Title */}
        <div className="mb-10">
          {/* Subtitle above */}
          <div className="text-xs uppercase tracking-[0.3em] text-blue-400/60 mb-3 font-medium">
            ⚡ Tactical Warfare ⚡
          </div>
          
          {/* Main title */}
          <h1 className="text-8xl font-black tracking-tighter mb-3 leading-none">
            <span className="bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-400 bg-clip-text text-transparent"
              style={{ filter: 'drop-shadow(0 0 30px rgba(96, 165, 250, 0.3))' }}>
              STEEL
            </span>
          </h1>
          <h1 className="text-8xl font-black tracking-tighter leading-none -mt-2">
            <span className="bg-gradient-to-r from-orange-300 via-red-300 to-orange-400 bg-clip-text text-transparent"
              style={{ filter: 'drop-shadow(0 0 30px rgba(251, 146, 60, 0.3))' }}>
              THUNDER
            </span>
          </h1>
          
          {/* Decorative line */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-400/50" />
            <div className="w-2 h-2 rotate-45 bg-blue-400/50" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-blue-400/50" />
          </div>
          
          <p className="mt-4 text-base text-gray-400/80 font-light tracking-wider">
            DOMINATE THE BATTLEFIELD
          </p>
        </div>

        {/* Tank illustration */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            <svg width="160" height="100" viewBox="0 0 160 100" className="drop-shadow-2xl">
              <defs>
                <linearGradient id="tankBody" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="30%" stopColor="#3b82f6" />
                  <stop offset="70%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="tankBarrel" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#d1d5db" />
                  <stop offset="40%" stopColor="#f3f4f6" />
                  <stop offset="60%" stopColor="#e5e7eb" />
                  <stop offset="100%" stopColor="#9ca3af" />
                </linearGradient>
                <linearGradient id="tankTrack" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4b5563" />
                  <stop offset="50%" stopColor="#374151" />
                  <stop offset="100%" stopColor="#1f2937" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Shadow */}
              <ellipse cx="80" cy="85" rx="55" ry="8" fill="rgba(0,0,0,0.3)" />
              
              {/* Tracks */}
              <rect x="20" y="55" width="120" height="25" rx="10" fill="url(#tankTrack)" />
              <rect x="24" y="58" width="112" height="19" rx="8" fill="#1f2937" />
              {/* Track details */}
              {Array.from({length: 12}).map((_, i) => (
                <rect key={i} x={28 + i * 9} y="60" width="5" height="15" rx="1" fill="#374151" opacity="0.5" />
              ))}
              
              {/* Hull */}
              <path d="M30 55 L42 28 L118 28 L130 55 Z" fill="url(#tankBody)" />
              <path d="M35 55 L45 32 L115 32 L125 55 Z" fill="rgba(255,255,255,0.08)" />
              {/* Hull detail lines */}
              <line x1="45" y1="35" x2="115" y2="35" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              <line x1="42" y1="45" x2="118" y2="45" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              
              {/* Turret base */}
              <circle cx="80" cy="40" r="18" fill="url(#tankBody)" />
              <circle cx="80" cy="40" r="15" fill="rgba(255,255,255,0.05)" />
              <circle cx="80" cy="40" r="18" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
              
              {/* Barrel */}
              <rect x="80" y="35" width="60" height="10" rx="4" fill="url(#tankBarrel)" />
              <rect x="80" y="36" width="60" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
              {/* Barrel tip */}
              <rect x="135" y="33" width="8" height="14" rx="3" fill="#6b7280" />
              <rect x="135" y="34" width="8" height="5" rx="2" fill="rgba(255,255,255,0.15)" />
              
              {/* Shine effects */}
              <ellipse cx="65" cy="35" rx="12" ry="5" fill="rgba(255,255,255,0.15)" />
              <ellipse cx="80" cy="35" rx="6" ry="3" fill="rgba(255,255,255,0.1)" />
              
              {/* Engine glow */}
              <circle cx="80" cy="68" r="8" fill="rgba(59, 130, 246, 0.3)" filter="url(#glow)" />
              
              {/* Star emblem */}
              <polygon points="80,33 82,38 87,38 83,41 85,46 80,43 75,46 77,41 73,38 78,38" 
                       fill="rgba(255,255,255,0.3)" />
            </svg>
            {/* Glow effect behind tank */}
            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl scale-150 -z-10" />
          </div>
        </div>

        {/* Start button */}
        <div className={`transition-all duration-700 delay-300 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={onStart}
            className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-xl rounded-2xl 
                       hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 
                       shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95
                       border border-blue-400/30 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span>⚔️</span>
              <span>START BATTLE</span>
            </span>
            {/* Button shine animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {/* Button glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity -z-10" />
          </button>
        </div>

        {/* Controls info */}
        <div className={`mt-10 grid grid-cols-4 gap-3 max-w-lg mx-auto transition-all duration-700 delay-500 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-3 border border-white/[0.06] hover:border-blue-500/20 transition-colors">
            <div className="text-blue-300/80 text-xs font-semibold mb-1.5 uppercase tracking-wider">Move</div>
            <div className="text-gray-400 text-sm font-mono">WASD</div>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-3 border border-white/[0.06] hover:border-blue-500/20 transition-colors">
            <div className="text-blue-300/80 text-xs font-semibold mb-1.5 uppercase tracking-wider">Aim</div>
            <div className="text-gray-400 text-sm font-mono">Mouse</div>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-3 border border-white/[0.06] hover:border-blue-500/20 transition-colors">
            <div className="text-blue-300/80 text-xs font-semibold mb-1.5 uppercase tracking-wider">Fire</div>
            <div className="text-gray-400 text-sm font-mono">Click</div>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-3 border border-white/[0.06] hover:border-blue-500/20 transition-colors">
            <div className="text-blue-300/80 text-xs font-semibold mb-1.5 uppercase tracking-wider">Pause</div>
            <div className="text-gray-400 text-sm font-mono">ESC</div>
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-8 transition-all duration-700 delay-700 ${showButton ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[11px] text-gray-600 tracking-wide">
            Survive waves of enemies • Destroy everything in your path • Become legend
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-15px) translateX(8px); }
          100% { transform: translateY(5px) translateX(-5px); }
        }
        @keyframes gridScroll {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
      `}</style>
    </div>
  );
}
