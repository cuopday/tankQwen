import { useState } from 'react';
import { TANKS, TankDefinition } from '../game/TankRegistry';
import { WEAPONS, WeaponDefinition, getWeaponsByCategory } from '../game/WeaponRegistry';

interface LoadoutScreenProps {
  onSelect: (tank: TankDefinition, weapon: WeaponDefinition) => void;
}

export default function LoadoutScreen({ onSelect }: LoadoutScreenProps) {
  const [selectedTank, setSelectedTank] = useState<TankDefinition>(TANKS[0]);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponDefinition>(WEAPONS[0]);
  const [tab, setTab] = useState<'tanks' | 'weapons'>('tanks');
  const [weaponCategory, setWeaponCategory] = useState('bullet');

  const categories = ['bullet', 'rocket', 'beam', 'plasma', 'lightning', 'fire', 'support', 'special'];

  const filteredWeapons = getWeaponsByCategory(weaponCategory);

  const rarityColors: Record<string, string> = {
    common: 'border-gray-400 bg-gray-900/50',
    uncommon: 'border-green-400 bg-green-900/30',
    rare: 'border-blue-400 bg-blue-900/30',
    epic: 'border-purple-400 bg-purple-900/30',
    legendary: 'border-yellow-400 bg-yellow-900/30',
  };

  const rarityTextColors: Record<string, string> = {
    common: 'text-gray-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-black/50 backdrop-blur">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          LOADOUT SELECT
        </h1>
        <p className="text-sm text-gray-400">Choose your tank and weapon</p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Selection */}
        <div className="w-96 border-r border-white/10 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setTab('tanks')}
              className={`flex-1 py-3 font-bold text-sm uppercase tracking-wider transition-colors ${
                tab === 'tanks' ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Tanks ({TANKS.length})
            </button>
            <button
              onClick={() => setTab('weapons')}
              className={`flex-1 py-3 font-bold text-sm uppercase tracking-wider transition-colors ${
                tab === 'weapons' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Weapons ({WEAPONS.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {tab === 'tanks' ? (
              <div className="space-y-2">
                {TANKS.map(tank => (
                  <button
                    key={tank.id}
                    onClick={() => setSelectedTank(tank)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedTank.id === tank.id
                        ? `${rarityColors[tank.rarity]} ring-2 ring-white/30`
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: tank.color + '40', border: `2px solid ${tank.color}` }}
                      >
                        🛡
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{tank.name}</span>
                          <span className={`text-[10px] uppercase font-bold ${rarityTextColors[tank.rarity]}`}>
                            {tank.rarity}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 capitalize">{tank.class} • {tank.chassisType}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                {/* Weapon category tabs */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setWeaponCategory(cat)}
                      className={`px-2 py-1 rounded text-xs font-bold uppercase transition-colors ${
                        weaponCategory === cat
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {filteredWeapons.map(weapon => (
                    <button
                      key={weapon.id}
                      onClick={() => setSelectedWeapon(weapon)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedWeapon.id === weapon.id
                          ? `${rarityColors[weapon.rarity]} ring-2 ring-white/30`
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: weapon.color + '40', border: `2px solid ${weapon.color}` }}
                        >
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: weapon.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{weapon.name}</span>
                            <span className={`text-[10px] uppercase font-bold ${rarityTextColors[weapon.rarity]}`}>
                              {weapon.rarity}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">{weapon.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Preview */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {tab === 'tanks' ? (
            <TankPreview tank={selectedTank} />
          ) : (
            <WeaponPreview weapon={selectedWeapon} />
          )}

          {/* Deploy button */}
          <div className="mt-auto pt-6">
            <button
              onClick={() => onSelect(selectedTank, selectedWeapon)}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-xl rounded-xl 
                         hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/30
                         hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-95"
            >
              ⚔️ DEPLOY TO BATTLE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TankPreview({ tank }: { tank: TankDefinition }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-xl flex items-center justify-center text-5xl"
          style={{ backgroundColor: tank.color + '30', border: `3px solid ${tank.color}` }}
        >
          🛡
        </div>
        <div>
          <h2 className="text-3xl font-black text-white">{tank.name}</h2>
          <p className="text-gray-400">{tank.description}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-white/10 rounded capitalize">{tank.class}</span>
            <span className="text-xs px-2 py-1 bg-white/10 rounded capitalize">{tank.chassisType}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatBar label="Health" value={tank.health} max={350} color="#ef4444" />
        <StatBar label="Speed" value={tank.speed * 20} max={130} color="#3b82f6" />
        <StatBar label="Rotation" value={tank.rotationSpeed * 500} max={60} color="#22c55e" />
        <StatBar label="Size" value={tank.size} max={40} color="#f59e0b" />
      </div>

      {tank.specialAbility && (
        <div className="p-4 bg-purple-900/30 border border-purple-500/30 rounded-xl">
          <div className="text-xs text-purple-400 uppercase tracking-wider font-bold mb-1">Special Ability</div>
          <div className="text-white font-bold capitalize">{tank.specialAbility.replace(/_/g, ' ')}</div>
        </div>
      )}

      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Default Weapon</div>
        <div className="text-white">{WEAPONS.find(w => w.id === tank.defaultWeapon)?.name || 'None'}</div>
      </div>
    </div>
  );
}

function WeaponPreview({ weapon }: { weapon: WeaponDefinition }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: weapon.color + '30', border: `3px solid ${weapon.color}` }}
        >
          <div className="w-10 h-10 rounded-full" style={{ backgroundColor: weapon.color, boxShadow: `0 0 20px ${weapon.color}` }} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white">{weapon.name}</h2>
          <p className="text-gray-400">{weapon.description}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-white/10 rounded capitalize">{weapon.category}</span>
            <span className="text-xs px-2 py-1 bg-white/10 rounded capitalize">{weapon.projectileBehavior}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatBar label="Damage" value={Math.abs(weapon.damage)} max={100} color="#ef4444" />
        <StatBar label="Fire Rate" value={1000 / weapon.fireRate * 10} max={30} color="#f59e0b" />
        <StatBar label="Range" value={weapon.range / 10} max={120} color="#3b82f6" />
        <StatBar label="Speed" value={weapon.projectileSpeed * 3} max={60} color="#22c55e" />
      </div>

      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Behavior</div>
        <div className="text-white capitalize">{weapon.projectileBehavior.replace(/_/g, ' ')}</div>
        <div className="text-xs text-gray-500 mt-1">
          {weapon.projectileBehavior === 'homing' && '• Tracks nearest enemy automatically'}
          {weapon.projectileBehavior === 'bouncing' && '• Bounces off surfaces up to 3 times'}
          {weapon.projectileBehavior === 'piercing' && '• Passes through multiple targets'}
          {weapon.projectileBehavior === 'explosive' && '• Creates explosion on impact'}
          {weapon.projectileBehavior === 'continuous_beam' && '• Continuous damage while firing'}
          {weapon.projectileBehavior === 'chain_lightning' && '• Chains to nearby enemies'}
          {weapon.projectileBehavior === 'gravity_well' && '• Pulls enemies toward center'}
          {weapon.projectileBehavior === 'flame_cone' && '• Wide cone of fire damage'}
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-bold">{Math.round(value)}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
