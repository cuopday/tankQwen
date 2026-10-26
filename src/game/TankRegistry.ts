// Tank Registry - 50 unique tanks with distinct designs
export interface TankDefinition {
  id: string;
  name: string;
  class: 'light' | 'medium' | 'heavy' | 'artillery' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  health: number;
  speed: number;
  rotationSpeed: number;
  size: number;
  color: string;
  accentColor: string;
  defaultWeapon: string;
  secondaryWeapon?: string;
  specialAbility?: string;
  description: string;
  chassisType: 'wheeled' | 'tracked' | 'hover' | 'legs' | 'floating';
}

export const TANKS: TankDefinition[] = [
  // === LIGHT TANKS (1-12) - Fast, low armor ===
  { id: 'scout', name: 'Scout', class: 'light', rarity: 'common', health: 60, speed: 5.5, rotationSpeed: 0.1, size: 22, color: '#4ade80', accentColor: '#86efac', defaultWeapon: 'tracer_round', description: 'Fast reconnaissance tank', chassisType: 'tracked' },
  { id: 'raider', name: 'Raider', class: 'light', rarity: 'common', health: 65, speed: 5.2, rotationSpeed: 0.09, size: 23, color: '#f97316', accentColor: '#fb923c', defaultWeapon: 'ricochet_shot', description: 'Hit-and-run specialist', chassisType: 'tracked' },
  { id: 'interceptor', name: 'Interceptor', class: 'light', rarity: 'uncommon', health: 55, speed: 6.0, rotationSpeed: 0.11, size: 21, color: '#06b6d4', accentColor: '#22d3ee', defaultWeapon: 'smart_bullet', description: 'High-speed interceptor', chassisType: 'hover' },
  { id: 'phantom', name: 'Phantom', class: 'light', rarity: 'rare', health: 50, speed: 5.8, rotationSpeed: 0.1, size: 22, color: '#a855f7', accentColor: '#c084fc', defaultWeapon: 'cryo_bullet', specialAbility: 'invisibility', description: 'Stealth reconnaissance', chassisType: 'hover' },
  { id: 'viper', name: 'Viper', class: 'light', rarity: 'uncommon', health: 58, speed: 5.6, rotationSpeed: 0.095, size: 22, color: '#22c55e', accentColor: '#4ade80', defaultWeapon: 'toxic_shot', description: 'Venomous strike tank', chassisType: 'tracked' },
  { id: 'falcon', name: 'Falcon', class: 'light', rarity: 'common', health: 62, speed: 5.4, rotationSpeed: 0.1, size: 23, color: '#eab308', accentColor: '#facc15', defaultWeapon: 'standard_bullet', description: 'Agile light fighter', chassisType: 'wheeled' },
  { id: 'dart', name: 'Dart', class: 'light', rarity: 'common', health: 55, speed: 6.2, rotationSpeed: 0.12, size: 20, color: '#ec4899', accentColor: '#f472b6', defaultWeapon: 'scatter_shot', description: 'Ultra-fast skirmisher', chassisType: 'hover' },
  { id: 'wraith', name: 'Wraith', class: 'light', rarity: 'rare', health: 48, speed: 5.9, rotationSpeed: 0.11, size: 21, color: '#6366f1', accentColor: '#818cf8', defaultWeapon: 'incendiary', specialAbility: 'phase', description: 'Ethereal light tank', chassisType: 'floating' },
  { id: 'lynx', name: 'Lynx', class: 'light', rarity: 'uncommon', health: 60, speed: 5.5, rotationSpeed: 0.1, size: 22, color: '#f59e0b', accentColor: '#fbbf24', defaultWeapon: 'armor_piercing', description: 'Predatory light tank', chassisType: 'tracked' },
  { id: 'zephyr', name: 'Zephyr', class: 'light', rarity: 'rare', health: 52, speed: 6.1, rotationSpeed: 0.11, size: 21, color: '#14b8a6', accentColor: '#2dd4bf', defaultWeapon: 'gyrojet', specialAbility: 'dash', description: 'Wind-speed tank', chassisType: 'hover' },
  { id: 'spark', name: 'Spark', class: 'light', rarity: 'uncommon', health: 56, speed: 5.7, rotationSpeed: 0.1, size: 22, color: '#fbbf24', accentColor: '#fcd34d', defaultWeapon: 'static_discharge', description: 'Electric light tank', chassisType: 'wheeled' },
  { id: 'shadow', name: 'Shadow', class: 'light', rarity: 'epic', health: 45, speed: 6.3, rotationSpeed: 0.12, size: 20, color: '#1e1b4b', accentColor: '#312e81', defaultWeapon: 'void_beam', specialAbility: 'cloak', description: 'Ultimate stealth tank', chassisType: 'floating' },

  // === MEDIUM TANKS (13-24) - Balanced ===
  { id: 'guardian', name: 'Guardian', class: 'medium', rarity: 'common', health: 100, speed: 4.0, rotationSpeed: 0.07, size: 26, color: '#2563eb', accentColor: '#60a5fa', defaultWeapon: 'standard_bullet', description: 'Reliable medium tank', chassisType: 'tracked' },
  { id: 'vanguard', name: 'Vanguard', class: 'medium', rarity: 'uncommon', health: 110, speed: 3.8, rotationSpeed: 0.065, size: 27, color: '#dc2626', accentColor: '#f87171', defaultWeapon: 'basic_rocket', description: 'Frontline assault tank', chassisType: 'tracked' },
  { id: 'centurion', name: 'Centurion', class: 'medium', rarity: 'uncommon', health: 115, speed: 3.7, rotationSpeed: 0.06, size: 27, color: '#7c3aed', accentColor: '#a78bfa', defaultWeapon: 'homing_missile', description: 'Elite medium tank', chassisType: 'tracked' },
  { id: 'knight', name: 'Knight', class: 'medium', rarity: 'rare', health: 120, speed: 3.9, rotationSpeed: 0.07, size: 26, color: '#9ca3af', accentColor: '#d1d5db', defaultWeapon: 'armor_piercing', specialAbility: 'shield_bash', description: 'Armored knight tank', chassisType: 'tracked' },
  { id: 'paladin', name: 'Paladin', class: 'medium', rarity: 'rare', health: 105, speed: 4.1, rotationSpeed: 0.075, size: 26, color: '#f59e0b', accentColor: '#fbbf24', defaultWeapon: 'healing_beam', specialAbility: 'heal_aura', description: 'Holy support tank', chassisType: 'tracked' },
  { id: 'templar', name: 'Templar', class: 'medium', rarity: 'epic', health: 125, speed: 3.6, rotationSpeed: 0.06, size: 28, color: '#ffffff', accentColor: '#e5e7eb', defaultWeapon: 'laser_beam', specialAbility: 'holy_shield', description: 'Sacred warrior tank', chassisType: 'tracked' },
  { id: 'crusader', name: 'Crusader', class: 'medium', rarity: 'uncommon', health: 108, speed: 3.9, rotationSpeed: 0.07, size: 26, color: '#b91c1c', accentColor: '#ef4444', defaultWeapon: 'flamethrower', description: 'Fire-support tank', chassisType: 'tracked' },
  { id: 'samurai', name: 'Samurai', class: 'medium', rarity: 'rare', health: 95, speed: 4.3, rotationSpeed: 0.08, size: 25, color: '#be123c', accentColor: '#f43f5e', defaultWeapon: 'rail_accel', specialAbility: 'quick_draw', description: 'Precision strike tank', chassisType: 'tracked' },
  { id: 'ronin', name: 'Ronin', class: 'medium', rarity: 'rare', health: 90, speed: 4.5, rotationSpeed: 0.085, size: 25, color: '#1e293b', accentColor: '#475569', defaultWeapon: 'plasma_orb', description: 'Masterless warrior', chassisType: 'hover' },
  { id: 'warlord', name: 'Warlord', class: 'medium', rarity: 'epic', health: 130, speed: 3.5, rotationSpeed: 0.055, size: 28, color: '#7f1d1d', accentColor: '#991b1b', defaultWeapon: 'cluster_rocket', specialAbility: 'rally_cry', description: 'Command tank', chassisType: 'tracked' },
  { id: 'gladiator', name: 'Gladiator', class: 'medium', rarity: 'uncommon', health: 112, speed: 3.8, rotationSpeed: 0.065, size: 27, color: '#a16207', accentColor: '#ca8a04', defaultWeapon: 'scatter_shot', description: 'Arena combat tank', chassisType: 'tracked' },
  { id: 'champion', name: 'Champion', class: 'medium', rarity: 'legendary', health: 140, speed: 4.2, rotationSpeed: 0.08, size: 26, color: '#fbbf24', accentColor: '#fcd34d', defaultWeapon: 'tachyon_lance', specialAbility: 'unstoppable', description: 'Ultimate medium tank', chassisType: 'hover' },

  // === HEAVY TANKS (25-36) - Slow, high armor ===
  { id: 'fortress', name: 'Fortress', class: 'heavy', rarity: 'common', health: 180, speed: 2.5, rotationSpeed: 0.04, size: 32, color: '#374151', accentColor: '#6b7280', defaultWeapon: 'basic_rocket', description: 'Mobile fortress', chassisType: 'tracked' },
  { id: 'juggernaut', name: 'Juggernaut', class: 'heavy', rarity: 'uncommon', health: 200, speed: 2.3, rotationSpeed: 0.035, size: 33, color: '#1f2937', accentColor: '#374151', defaultWeapon: 'heavy_laser', description: 'Unstoppable force', chassisType: 'tracked' },
  { id: 'titan', name: 'Titan', class: 'heavy', rarity: 'rare', health: 220, speed: 2.2, rotationSpeed: 0.03, size: 34, color: '#451a03', accentColor: '#78350f', defaultWeapon: 'napalm_rocket', description: 'Ancient war machine', chassisType: 'tracked' },
  { id: 'behemoth', name: 'Behemoth', class: 'heavy', rarity: 'rare', health: 240, speed: 2.0, rotationSpeed: 0.025, size: 35, color: '#581c87', accentColor: '#7e22ce', defaultWeapon: 'nuke_missile', description: 'Colossal destroyer', chassisType: 'tracked' },
  { id: 'mammoth', name: 'Mammoth', class: 'heavy', rarity: 'epic', health: 260, speed: 1.8, rotationSpeed: 0.02, size: 36, color: '#78350f', accentColor: '#92400e', defaultWeapon: 'cluster_missile', specialAbility: 'unstoppable', description: 'Prehistoric tank', chassisType: 'tracked' },
  { id: 'colossus', name: 'Colossus', class: 'heavy', rarity: 'epic', health: 280, speed: 1.7, rotationSpeed: 0.018, size: 37, color: '#1e3a8a', accentColor: '#1e40af', defaultWeapon: 'disintegration_beam', specialAbility: 'siege_mode', description: 'Walking apocalypse', chassisType: 'legs' },
  { id: 'leviathan', name: 'Leviathan', class: 'heavy', rarity: 'legendary', health: 300, speed: 1.5, rotationSpeed: 0.015, size: 38, color: '#0c4a6e', accentColor: '#075985', defaultWeapon: 'black_hole_missile', specialAbility: 'devour', description: 'Ocean-depth tank', chassisType: 'floating' },
  { id: 'doomhammer', name: 'Doomhammer', class: 'heavy', rarity: 'uncommon', health: 190, speed: 2.4, rotationSpeed: 0.038, size: 33, color: '#7c2d12', accentColor: '#9a3412', defaultWeapon: 'penetrator', description: 'Heavy hitter', chassisType: 'tracked' },
  { id: 'ironclad', name: 'Ironclad', class: 'heavy', rarity: 'uncommon', health: 210, speed: 2.2, rotationSpeed: 0.032, size: 34, color: '#44403c', accentColor: '#57534e', defaultWeapon: 'pierce_missile', description: 'Armored to the teeth', chassisType: 'tracked' },
  { id: 'bulwark', name: 'Bulwark', class: 'heavy', rarity: 'rare', health: 230, speed: 2.1, rotationSpeed: 0.028, size: 35, color: '#365314', accentColor: '#4d7c0f', defaultWeapon: 'emp_missile', specialAbility: 'fortify', description: 'Immovable defense', chassisType: 'tracked' },
  { id: 'rampart', name: 'Rampart', class: 'heavy', rarity: 'rare', health: 250, speed: 1.9, rotationSpeed: 0.023, size: 36, color: '#713f12', accentColor: '#854d0e', defaultWeapon: 'shield_projector', specialAbility: 'shield_wall', description: 'Living wall', chassisType: 'tracked' },
  { id: 'apocalypse', name: 'Apocalypse', class: 'heavy', rarity: 'legendary', health: 350, speed: 1.5, rotationSpeed: 0.015, size: 40, color: '#450a0a', accentColor: '#7f1d1d', defaultWeapon: 'supernova', specialAbility: 'doom', description: 'End of days tank', chassisType: 'legs' },

  // === ARTILLERY TANKS (37-44) - Long range ===
  { id: 'catapult', name: 'Catapult', class: 'artillery', rarity: 'common', health: 80, speed: 3.0, rotationSpeed: 0.05, size: 28, color: '#78716c', accentColor: '#a8a29e', defaultWeapon: 'basic_rocket', description: 'Siege catapult', chassisType: 'tracked' },
  { id: 'ballista', name: 'Ballista', class: 'artillery', rarity: 'uncommon', health: 75, speed: 3.2, rotationSpeed: 0.055, size: 27, color: '#57534e', accentColor: '#78716c', defaultWeapon: 'rail_accel', description: 'Precision siege weapon', chassisType: 'tracked' },
  { id: 'cannon', name: 'Cannon', class: 'artillery', rarity: 'uncommon', health: 85, speed: 2.8, rotationSpeed: 0.045, size: 29, color: '#44403c', accentColor: '#57534e', defaultWeapon: 'penetrator', description: 'Heavy siege cannon', chassisType: 'tracked' },
  { id: 'howitzer', name: 'Howitzer', class: 'artillery', rarity: 'rare', health: 90, speed: 2.6, rotationSpeed: 0.04, size: 30, color: '#292524', accentColor: '#44403c', defaultWeapon: 'cluster_rocket', description: 'Area denial artillery', chassisType: 'tracked' },
  { id: 'mortar', name: 'Mortar', class: 'artillery', rarity: 'rare', health: 70, speed: 3.5, rotationSpeed: 0.06, size: 26, color: '#1c1917', accentColor: '#292524', defaultWeapon: 'napalm_rocket', description: 'Indirect fire support', chassisType: 'tracked' },
  { id: 'siege_breaker', name: 'Siege Breaker', class: 'artillery', rarity: 'epic', health: 95, speed: 2.4, rotationSpeed: 0.035, size: 31, color: '#7c2d12', accentColor: '#9a3412', defaultWeapon: 'nuke_missile', specialAbility: 'siege_mode', description: 'Fortress destroyer', chassisType: 'tracked' },
  { id: 'thor', name: 'Thor', class: 'artillery', rarity: 'epic', health: 100, speed: 2.2, rotationSpeed: 0.03, size: 32, color: '#1e3a8a', accentColor: '#1e40af', defaultWeapon: 'storm_call', specialAbility: 'thunder_strike', description: 'God of thunder', chassisType: 'tracked' },
  { id: 'odin', name: 'Odin', class: 'artillery', rarity: 'legendary', health: 120, speed: 2.0, rotationSpeed: 0.025, size: 34, color: '#4c1d95', accentColor: '#6d28d9', defaultWeapon: 'gigavolt', specialAbility: 'all_father', description: 'All-father of artillery', chassisType: 'floating' },

  // === SPECIAL TANKS (45-50) - Unique abilities ===
  { id: 'engineer', name: 'Engineer', class: 'special', rarity: 'rare', health: 90, speed: 3.8, rotationSpeed: 0.07, size: 25, color: '#0891b2', accentColor: '#06b6d4', defaultWeapon: 'repair_drone', specialAbility: 'build_turret', description: 'Construction specialist', chassisType: 'wheeled' },
  { id: 'medic', name: 'Medic', class: 'special', rarity: 'rare', health: 85, speed: 4.0, rotationSpeed: 0.075, size: 24, color: '#16a34a', accentColor: '#22c55e', defaultWeapon: 'healing_beam', specialAbility: 'heal_aura', description: 'Combat medic', chassisType: 'wheeled' },
  { id: 'technomancer', name: 'Technomancer', class: 'special', rarity: 'epic', health: 80, speed: 4.2, rotationSpeed: 0.08, size: 24, color: '#7c3aed', accentColor: '#a855f7', defaultWeapon: 'emp_blast', specialAbility: 'hack', description: 'Tech wizard', chassisType: 'hover' },
  { id: 'chronomancer', name: 'Chronomancer', class: 'special', rarity: 'legendary', health: 75, speed: 4.5, rotationSpeed: 0.09, size: 23, color: '#c026d3', accentColor: '#d946ef', defaultWeapon: 'time_missile', specialAbility: 'time_rewind', description: 'Time manipulator', chassisType: 'floating' },
  { id: 'summoner', name: 'Summoner', class: 'special', rarity: 'epic', health: 70, speed: 4.3, rotationSpeed: 0.085, size: 24, color: '#ea580c', accentColor: '#f97316', defaultWeapon: 'summon_turret', specialAbility: 'summon_ally', description: 'Unit summoner', chassisType: 'floating' },
  { id: 'chaos_lord', name: 'Chaos Lord', class: 'special', rarity: 'legendary', health: 150, speed: 4.0, rotationSpeed: 0.08, size: 28, color: '#be185d', accentColor: '#ec4899', defaultWeapon: 'chaos_orb', specialAbility: 'chaos_realm', description: 'Master of chaos', chassisType: 'floating' },
];

export function getTankById(id: string): TankDefinition | undefined {
  return TANKS.find(t => t.id === id);
}

export function getTanksByClass(tankClass: string): TankDefinition[] {
  return TANKS.filter(t => t.class === tankClass);
}

export function getTanksByRarity(rarity: string): TankDefinition[] {
  return TANKS.filter(t => t.rarity === rarity);
}
