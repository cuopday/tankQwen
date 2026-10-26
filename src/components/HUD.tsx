import { GameState } from '../game/types';

interface HUDProps {
  state: GameState;
}

export default function HUD({ state }: HUDProps) {
  const healthPercent = (state.player.health / state.player.maxHealth) * 100;
  const healthColor = healthPercent > 50 ? 'from-green-400 to-emerald-500' : 
                      healthPercent > 25 ? 'from-yellow-400 to-amber-500' : 
                      'from-red-400 to-rose-600';

  const MAP_W = 2400;
  const MAP_H = 1600;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start">
        {/* Score & Wave */}
        <div className="flex flex-col gap-2">
          <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-blue-500/20 shadow-lg shadow-blue-500/5">
            <div className="text-[10px] text-blue-300 uppercase tracking-widest font-semibold">Score</div>
            <div className="text-2xl font-black text-white tabular-nums tracking-tight">{state.score.toLocaleString()}</div>
          </div>
          <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-purple-500/20 shadow-lg shadow-purple-500/5">
            <div className="text-[10px] text-purple-300 uppercase tracking-widest font-semibold">Wave</div>
            <div className="text-xl font-bold text-white">{state.wave}</div>
          </div>
        </div>

        {/* Minimap */}
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-2 border border-white/10 shadow-lg">
          <div className="relative w-36 h-24 bg-gray-900/80 rounded-lg overflow-hidden border border-white/5">
            {/* Map grid */}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'linear-gradient(rgba(100,150,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100,150,255,0.3) 1px, transparent 1px)',
                backgroundSize: '15% 15%',
              }}
            />
            {/* Obstacles */}
            {state.obstacles.map((obs, i) => (
              <div
                key={i}
                className="absolute bg-gray-500/50"
                style={{
                  left: `${(obs.position.x / MAP_W) * 100}%`,
                  top: `${(obs.position.y / MAP_H) * 100}%`,
                  width: `${Math.max(2, (obs.width / MAP_W) * 100)}%`,
                  height: `${Math.max(2, (obs.height / MAP_H) * 100)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
            {/* Enemies */}
            {state.enemies.map((enemy, i) => (
              <div
                key={`e${i}`}
                className="absolute w-1.5 h-1.5 bg-red-500 rounded-full shadow-sm shadow-red-500"
                style={{
                  left: `${(enemy.position.x / MAP_W) * 100}%`,
                  top: `${(enemy.position.y / MAP_H) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
            {/* Player */}
            <div
              className="absolute w-2 h-2 bg-blue-400 rounded-full shadow-sm shadow-blue-400 z-10"
              style={{
                left: `${(state.player.position.x / MAP_W) * 100}%`,
                top: `${(state.player.position.y / MAP_H) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-50" />
            </div>
          </div>
        </div>

        {/* Kill count */}
        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-red-500/20 shadow-lg shadow-red-500/5">
          <div className="text-[10px] text-red-300 uppercase tracking-widest font-semibold">Kills</div>
          <div className="text-2xl font-black text-white tabular-nums">{state.player.kills}</div>
        </div>
      </div>

      {/* Wave Announcement */}
      {state.waveAnnouncement > 0 && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
          style={{ opacity: Math.min(1, state.waveAnnouncement / 500) }}>
          <div className="relative">
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 tracking-tight animate-bounce"
              style={{ textShadow: '0 0 40px rgba(255,150,0,0.5)' }}>
              WAVE {state.wave}
            </div>
            <div className="text-lg text-orange-300/80 font-medium mt-1">
              {state.wave === 1 ? 'Battle begins!' : `${3 + state.wave * 2} enemies incoming!`}
            </div>
            {/* Decorative lines */}
            <div className="absolute top-1/2 -left-20 w-16 h-0.5 bg-gradient-to-r from-transparent to-orange-400/50 -translate-y-1/2" />
            <div className="absolute top-1/2 -right-20 w-16 h-0.5 bg-gradient-to-l from-transparent to-orange-400/50 -translate-y-1/2" />
          </div>
        </div>
      )}

      {/* Enemies remaining indicator */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2" style={{ opacity: state.waveAnnouncement > 0 ? 0 : 1, transition: 'opacity 0.5s' }}>
        <div className="bg-black/60 backdrop-blur-md rounded-full px-5 py-1.5 border border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-gray-300 font-medium">
            Enemies: <span className="text-white font-bold">{state.enemies.length}</span>
          </span>
        </div>
      </div>

      {/* Bottom bar - Health */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="max-w-lg mx-auto">
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="text-red-400 flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="h-5 bg-gray-800/80 rounded-full overflow-hidden relative border border-white/5">
                  <div 
                    className={`h-full bg-gradient-to-r ${healthColor} rounded-full transition-all duration-300 relative`}
                    style={{ width: `${healthPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent rounded-full" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" 
                         style={{ animation: 'shimmer 2s infinite' }} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white drop-shadow-lg">
                      {Math.ceil(state.player.health)} / {state.player.maxHealth}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Controls hint */}
          <div className="mt-2 text-center text-[11px] text-gray-500 flex items-center justify-center gap-3">
            <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">WASD</kbd> Move</span>
            <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">Mouse</kbd> Aim</span>
            <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">Click</kbd> Fire</span>
            <span><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">ESC</kbd> Pause</span>
          </div>
        </div>
      </div>

      {/* Pause overlay */}
      {state.paused && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-5xl font-black text-white mb-4 tracking-tight">PAUSED</h2>
            <p className="text-gray-400 text-lg">Press <kbd className="bg-white/10 px-2 py-1 rounded text-white font-mono">ESC</kbd> to resume</p>
          </div>
        </div>
      )}

      {/* Game Over */}
      {state.gameOver && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="text-center bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl p-10 border border-red-500/20 shadow-2xl shadow-red-500/10 max-w-md">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-5xl font-black text-transparent bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text mb-6 tracking-tight">
              DESTROYED
            </h2>
            <div className="space-y-3 mb-8">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-sm text-gray-400">Final Score</p>
                <p className="text-2xl font-black text-white">{state.score.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-xs text-gray-400">Wave</p>
                  <p className="text-xl font-bold text-white">{state.wave}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-xs text-gray-400">Kills</p>
                  <p className="text-xl font-bold text-white">{state.player.kills}</p>
                </div>
              </div>
            </div>
            <button 
              className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl 
                         hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/25
                         border border-white/10 active:scale-95"
              onClick={() => window.location.reload()}
            >
              ⚔️ PLAY AGAIN
            </button>
            <p className="mt-3 text-xs text-gray-500">or press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">R</kbd></p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
