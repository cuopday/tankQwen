import { GameState } from '../game/types';
import { MAP_WIDTH, MAP_HEIGHT } from '../game/engine';

interface HUDProps {
  state: GameState;
}

export default function HUD({ state }: HUDProps) {
  const healthPercent = (state.player.health / state.player.maxHealth) * 100;
  const healthColor = healthPercent > 50 ? 'from-green-400 to-emerald-500' : 
                      healthPercent > 25 ? 'from-yellow-400 to-amber-500' : 
                      'from-red-400 to-rose-600';

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top-left: Score, Wave, Chaos Level */}
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        <div className="bg-black/70 backdrop-blur-xl rounded-xl px-4 py-2 border border-blue-500/20 shadow-lg">
          <div className="text-[10px] text-blue-300/70 uppercase tracking-[0.2em] font-semibold">Score</div>
          <div className="text-2xl font-black text-white tabular-nums">{state.score.toLocaleString()}</div>
        </div>
        <div className="bg-black/70 backdrop-blur-xl rounded-xl px-4 py-2 border border-purple-500/20 shadow-lg">
          <div className="text-[10px] text-purple-300/70 uppercase tracking-[0.2em] font-semibold">Wave</div>
          <div className="text-xl font-bold text-white">{state.wave}</div>
        </div>
        <div className="bg-black/70 backdrop-blur-xl rounded-xl px-4 py-2 border border-orange-500/20 shadow-lg">
          <div className="text-[10px] text-orange-300/70 uppercase tracking-[0.2em] font-semibold">Chaos</div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < state.chaosLevel
                    ? 'bg-gradient-to-br from-orange-400 to-red-600 shadow-lg shadow-orange-500/50'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="bg-black/70 backdrop-blur-xl rounded-xl px-4 py-2 border border-red-500/20 shadow-lg">
          <div className="text-[10px] text-red-300/70 uppercase tracking-[0.2em] font-semibold">Kills</div>
          <div className="text-xl font-black text-white tabular-nums">{state.player.kills}</div>
        </div>
      </div>
      
      {/* Power-up indicators */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2">
        {state.player.rapidFire && state.player.rapidFire > 0 && (
          <div className="bg-orange-500/80 backdrop-blur-xl rounded-lg px-3 py-1 border border-orange-300/50 shadow-lg">
            <span className="text-xs font-bold text-white">🔥 RAPID FIRE</span>
          </div>
        )}
        {state.player.tripleShot && state.player.tripleShot > 0 && (
          <div className="bg-purple-500/80 backdrop-blur-xl rounded-lg px-3 py-1 border border-purple-300/50 shadow-lg">
            <span className="text-xs font-bold text-white">3x TRIPLE</span>
          </div>
        )}
        {state.player.speedBoost && state.player.speedBoost > 0 && (
          <div className="bg-blue-500/80 backdrop-blur-xl rounded-lg px-3 py-1 border border-blue-300/50 shadow-lg">
            <span className="text-xs font-bold text-white">⚡ SPEED</span>
          </div>
        )}
        {state.player.shield > 0 && (
          <div className="bg-cyan-500/80 backdrop-blur-xl rounded-lg px-3 py-1 border border-cyan-300/50 shadow-lg">
            <span className="text-xs font-bold text-white">🛡 SHIELD</span>
          </div>
        )}
      </div>

      {/* Top-right: BIG MINIMAP */}
      <div className="absolute top-3 right-3">
        <div className="bg-black/80 backdrop-blur-xl rounded-xl p-2 border border-white/10 shadow-xl">
          <div className="text-[9px] text-gray-400 uppercase tracking-widest text-center mb-1 font-semibold">Tactical Map</div>
          <div className="relative w-52 h-40 bg-gray-900/90 rounded-lg overflow-hidden border border-white/5">
            {/* Map grid */}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'linear-gradient(rgba(100,150,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100,150,255,0.3) 1px, transparent 1px)',
                backgroundSize: '10% 10%',
              }}
            />
            
            {/* Obstacles */}
            {state.obstacles.map((obs, i) => {
              const colors: Record<string, string> = {
                // Vietnam village
                stilt_house: 'bg-amber-800/60',
                mud_hut: 'bg-amber-700/50',
                bamboo: 'bg-green-600/50',
                rice_paddy: 'bg-green-500/30',
                buddha: 'bg-gray-400/60',
                well: 'bg-gray-500/50',
                rice_stack: 'bg-yellow-600/50',
                fence: 'bg-amber-900/50',
                palm_tree: 'bg-green-700/50',
                banana_tree: 'bg-green-600/50',
                sampan: 'bg-amber-900/50',
                market_stall: 'bg-red-800/50',
                stone_lantern: 'bg-gray-400/50',
                village_gate: 'bg-red-700/60',
                barrel: 'bg-amber-800/50',
                cart: 'bg-amber-700/50',
                // Explosives
                explosive_barrel: 'bg-red-600/80',
                tnt_crate: 'bg-red-800/80',
                // Power-ups
                health_pack: 'bg-green-400/80',
                speed_boost: 'bg-blue-400/80',
                rapid_fire: 'bg-orange-400/80',
                triple_shot: 'bg-purple-400/80',
                shield: 'bg-cyan-400/80',
                armor_boost: 'bg-gray-400/80',
                // Hazards
                lava_pool: 'bg-orange-600/70',
                acid_lake: 'bg-green-400/70',
                quicksand: 'bg-yellow-800/70',
                ice_patch: 'bg-blue-200/70',
                oil_spill: 'bg-gray-800/70',
                tornado: 'bg-gray-500/70',
                // Traps
                auto_turret: 'bg-red-900/80',
                // Interactive
                teleport_portal: 'bg-purple-500/80',
                // Moving
                rolling_boulder: 'bg-gray-600/80',
                // AI
                attack_drone: 'bg-red-500/80',
                // Chaos
                black_hole: 'bg-purple-900/90',
              };
              return (
                <div
                  key={i}
                  className={`absolute ${colors[obs.type] || 'bg-gray-500/40'} rounded-sm`}
                  style={{
                    left: `${(obs.position.x / MAP_WIDTH) * 100}%`,
                    top: `${(obs.position.y / MAP_HEIGHT) * 100}%`,
                    width: `${Math.max(2, (obs.width / MAP_WIDTH) * 100)}%`,
                    height: `${Math.max(2, (obs.height / MAP_HEIGHT) * 100)}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              );
            })}
            
            {/* Enemies */}
            {state.enemies.map((enemy, i) => (
              <div
                key={`e${i}`}
                className="absolute"
                style={{
                  left: `${(enemy.position.x / MAP_WIDTH) * 100}%`,
                  top: `${(enemy.position.y / MAP_HEIGHT) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="w-2 h-2 bg-red-500 rounded-full shadow-sm shadow-red-500/80" />
              </div>
            ))}
            
            {/* Player viewport rectangle */}
            <div 
              className="absolute border border-blue-400/30 bg-blue-400/5 rounded-sm"
              style={{
                left: `${((state.player.position.x - 600) / MAP_WIDTH) * 100}%`,
                top: `${((state.player.position.y - 400) / MAP_HEIGHT) * 100}%`,
                width: `${(1200 / MAP_WIDTH) * 100}%`,
                height: `${(800 / MAP_HEIGHT) * 100}%`,
              }}
            />
            
            {/* Player */}
            <div
              className="absolute z-10"
              style={{
                left: `${(state.player.position.x / MAP_WIDTH) * 100}%`,
                top: `${(state.player.position.y / MAP_HEIGHT) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="w-3 h-3 bg-blue-400 rounded-full shadow-md shadow-blue-400/80 border border-white/30" />
              <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-40" />
            </div>
            
            {/* Map border */}
            <div className="absolute inset-0 border border-red-500/20 rounded-lg pointer-events-none" />
            
            {/* Coordinates */}
            <div className="absolute bottom-1 left-1 text-[8px] text-gray-500 font-mono">
              {Math.floor(state.player.position.x)}, {Math.floor(state.player.position.y)}
            </div>
          </div>
        </div>
      </div>

      {/* Wave Announcement */}
      {state.waveAnnouncement > 0 && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
          style={{ opacity: Math.min(1, state.waveAnnouncement / 500) }}>
          <div className="relative">
            <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500 tracking-tight"
              style={{ filter: 'drop-shadow(0 0 30px rgba(255,100,0,0.4))' }}>
              WAVE {state.wave}
            </div>
            <div className="text-lg text-orange-300/70 font-medium mt-2">
              {state.wave === 1 ? 'Battle begins!' : `${Math.min(12, 3 + state.wave * 2)} enemies incoming!`}
            </div>
          </div>
        </div>
      )}

      {/* Enemies remaining */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2" style={{ opacity: state.waveAnnouncement > 0 ? 0 : 1, transition: 'opacity 0.5s' }}>
        <div className="bg-black/70 backdrop-blur-xl rounded-full px-5 py-2 border border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-gray-300 font-medium">
            Enemies: <span className="text-white font-bold">{state.enemies.length}</span>
          </span>
        </div>
      </div>

      {/* Bottom: Health bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-full max-w-lg px-3">
        <div className="bg-black/70 backdrop-blur-xl rounded-xl p-3 border border-white/10 shadow-xl">
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 ${healthPercent <= 25 ? 'animate-pulse' : ''}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className={
                healthPercent > 50 ? 'text-green-400' : healthPercent > 25 ? 'text-yellow-400' : 'text-red-400'
              }>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="h-5 bg-gray-800/80 rounded-full overflow-hidden relative border border-white/5">
                <div 
                  className={`h-full bg-gradient-to-r ${healthColor} rounded-full transition-all duration-300 relative`}
                  style={{ width: `${healthPercent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-white drop-shadow-lg">
                    {Math.ceil(state.player.health)} / {state.player.maxHealth}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="mt-1.5 text-center text-[10px] text-gray-500 flex items-center justify-center gap-2">
          <span><kbd className="bg-white/10 px-1 py-0.5 rounded text-gray-300 font-mono border border-white/5">WASD</kbd> Move</span>
          <span><kbd className="bg-white/10 px-1 py-0.5 rounded text-gray-300 font-mono border border-white/5">Mouse</kbd> Aim</span>
          <span><kbd className="bg-white/10 px-1 py-0.5 rounded text-gray-300 font-mono border border-white/5">Click</kbd> Fire</span>
        </div>
      </div>

      {/* Pause */}
      {state.paused && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-5xl font-black text-white mb-4">PAUSED</h2>
            <p className="text-gray-400">Press <kbd className="bg-white/10 px-2 py-1 rounded text-white font-mono">ESC</kbd> to resume</p>
          </div>
        </div>
      )}

      {/* Game Over */}
      {state.gameOver && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center pointer-events-auto">
          <div className="text-center bg-gradient-to-b from-gray-900/95 to-black/95 rounded-3xl p-10 border border-red-500/20 shadow-2xl max-w-md">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-6">
              DESTROYED
            </h2>
            <div className="space-y-3 mb-8">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Final Score</p>
                <p className="text-3xl font-black text-white">{state.score.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-gray-400 uppercase">Wave</p>
                  <p className="text-2xl font-bold text-white">{state.wave}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-gray-400 uppercase">Kills</p>
                  <p className="text-2xl font-bold text-white">{state.player.kills}</p>
                </div>
              </div>
            </div>
            <button 
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl 
                         hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg active:scale-95"
              onClick={() => window.location.reload()}
            >
              ⚔️ PLAY AGAIN
            </button>
            <p className="mt-2 text-xs text-gray-500">or press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">R</kbd></p>
          </div>
        </div>
      )}
    </div>
  );
}
