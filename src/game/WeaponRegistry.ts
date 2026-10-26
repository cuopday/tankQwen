// Weapon Registry - 100 weapons with unique behaviors
export interface WeaponDefinition {
  id: string;
  name: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  damage: number;
  fireRate: number; // ms between shots
  range: number;
  projectileSpeed: number;
  reloadTime: number;
  projectileType: string;
  projectileBehavior: string;
  color: string;
  secondaryColor?: string;
  specialEffect?: string;
  description: string;
}

export const WEAPONS: WeaponDefinition[] = [
  // === STANDARD BULLETS (1-15) ===
  { id: 'standard_bullet', name: 'Standard Cannon', category: 'bullet', rarity: 'common', damage: 15, fireRate: 400, range: 600, projectileSpeed: 12, reloadTime: 100, projectileType: 'bullet', projectileBehavior: 'standard', color: '#ffcc00', description: 'Reliable standard ammunition' },
  { id: 'tracer_round', name: 'Tracer Rounds', category: 'bullet', rarity: 'common', damage: 12, fireRate: 350, range: 650, projectileSpeed: 14, reloadTime: 80, projectileType: 'tracer', projectileBehavior: 'fast', color: '#ff6600', description: 'High-velocity tracer rounds' },
  { id: 'armor_piercing', name: 'Armor Piercing', category: 'bullet', rarity: 'uncommon', damage: 25, fireRate: 600, range: 500, projectileSpeed: 15, reloadTime: 150, projectileType: 'ap_bullet', projectileBehavior: 'piercing', color: '#aaaaaa', description: 'Penetrates multiple targets' },
  { id: 'ricochet_shot', name: 'Ricochet Rounds', category: 'bullet', rarity: 'uncommon', damage: 18, fireRate: 500, range: 700, projectileSpeed: 13, reloadTime: 120, projectileType: 'ricochet', projectileBehavior: 'bouncing', color: '#00ffcc', description: 'Bounces off surfaces' },
  { id: 'explosive_bullet', name: 'Explosive Rounds', category: 'bullet', rarity: 'rare', damage: 20, fireRate: 550, range: 550, projectileSpeed: 11, reloadTime: 140, projectileType: 'explosive_bullet', projectileBehavior: 'explosive', color: '#ff3300', description: 'Small explosion on impact' },
  { id: 'incendiary', name: 'Incendiary Rounds', category: 'bullet', rarity: 'uncommon', damage: 14, fireRate: 450, range: 600, projectileSpeed: 12, reloadTime: 110, projectileType: 'incendiary', projectileBehavior: 'burning', color: '#ff4400', description: 'Sets targets on fire' },
  { id: 'cryo_bullet', name: 'Cryo Rounds', category: 'bullet', rarity: 'uncommon', damage: 10, fireRate: 500, range: 580, projectileSpeed: 11, reloadTime: 130, projectileType: 'cryo', projectileBehavior: 'freezing', color: '#00ccff', description: 'Slows targets' },
  { id: 'toxic_shot', name: 'Toxic Rounds', category: 'bullet', rarity: 'uncommon', damage: 12, fireRate: 480, range: 590, projectileSpeed: 12, reloadTime: 125, projectileType: 'toxic', projectileBehavior: 'poison', color: '#00ff00', description: 'Applies poison damage over time' },
  { id: 'hollow_point', name: 'Hollow Point', category: 'bullet', rarity: 'common', damage: 22, fireRate: 520, range: 450, projectileSpeed: 10, reloadTime: 135, projectileType: 'hollow', projectileBehavior: 'high_damage', color: '#cc0000', description: 'Massive damage at close range' },
  { id: 'fragmentation', name: 'Fragmentation Rounds', category: 'bullet', rarity: 'rare', damage: 16, fireRate: 580, range: 520, projectileSpeed: 11, reloadTime: 145, projectileType: 'frag', projectileBehavior: 'fragment', color: '#ff9900', description: 'Splits into shrapnel on impact' },
  { id: 'gyrojet', name: 'Gyrojet Rounds', category: 'bullet', rarity: 'rare', damage: 18, fireRate: 500, range: 650, projectileSpeed: 8, reloadTime: 130, projectileType: 'gyrojet', projectileBehavior: 'accelerating', color: '#ff00ff', description: 'Accelerates during flight' },
  { id: 'smart_bullet', name: 'Smart Rounds', category: 'bullet', rarity: 'epic', damage: 20, fireRate: 600, range: 700, projectileSpeed: 10, reloadTime: 160, projectileType: 'smart', projectileBehavior: 'homing', color: '#00ff88', description: 'Slightly homing projectiles' },
  { id: 'rail_accel', name: 'Rail Accelerator', category: 'bullet', rarity: 'rare', damage: 30, fireRate: 800, range: 800, projectileSpeed: 20, reloadTime: 200, projectileType: 'rail_bullet', projectileBehavior: 'hyper_velocity', color: '#00ffff', description: 'Extremely high velocity' },
  { id: 'scatter_shot', name: 'Scatter Shot', category: 'bullet', rarity: 'uncommon', damage: 8, fireRate: 700, range: 400, projectileSpeed: 13, reloadTime: 180, projectileType: 'scatter', projectileBehavior: 'spread', color: '#ffaa00', description: 'Fires multiple pellets' },
  { id: 'penetrator', name: 'Penetrator', category: 'bullet', rarity: 'epic', damage: 35, fireRate: 900, range: 600, projectileSpeed: 18, reloadTime: 220, projectileType: 'penetrator', projectileBehavior: 'deep_pierce', color: '#ffffff', description: 'Pierces through everything' },

  // === ROCKETS & MISSILES (16-30) ===
  { id: 'basic_rocket', name: 'Basic Rocket', category: 'rocket', rarity: 'common', damage: 40, fireRate: 1200, range: 800, projectileSpeed: 8, reloadTime: 300, projectileType: 'rocket', projectileBehavior: 'explosive', color: '#ff6600', description: 'Standard explosive rocket' },
  { id: 'homing_missile', name: 'Homing Missile', category: 'rocket', rarity: 'rare', damage: 45, fireRate: 1500, range: 900, projectileSpeed: 7, reloadTime: 350, projectileType: 'homing', projectileBehavior: 'homing', color: '#ff0066', description: 'Tracks targets automatically' },
  { id: 'cluster_rocket', name: 'Cluster Rocket', category: 'rocket', rarity: 'rare', damage: 25, fireRate: 1800, range: 750, projectileSpeed: 9, reloadTime: 400, projectileType: 'cluster', projectileBehavior: 'cluster', color: '#ff9900', description: 'Splits into multiple warheads' },
  { id: 'napalm_rocket', name: 'Napalm Rocket', category: 'rocket', rarity: 'uncommon', damage: 35, fireRate: 1400, range: 700, projectileSpeed: 8, reloadTime: 320, projectileType: 'napalm', projectileBehavior: 'fire_area', color: '#ff4400', description: 'Creates fire area' },
  { id: 'emp_missile', name: 'EMP Missile', category: 'rocket', rarity: 'epic', damage: 20, fireRate: 2000, range: 850, projectileSpeed: 9, reloadTime: 450, projectileType: 'emp', projectileBehavior: 'emp_blast', color: '#00ccff', description: 'Disables electronics' },
  { id: 'nuke_missile', name: 'Tactical Nuke', category: 'rocket', rarity: 'legendary', damage: 100, fireRate: 5000, range: 1000, projectileSpeed: 6, reloadTime: 1000, projectileType: 'nuke', projectileBehavior: 'nuclear', color: '#ffff00', description: 'Massive nuclear explosion' },
  { id: 'freeze_missile', name: 'Cryo Missile', category: 'rocket', rarity: 'uncommon', damage: 30, fireRate: 1600, range: 750, projectileSpeed: 8, reloadTime: 380, projectileType: 'cryo_missile', projectileBehavior: 'freeze_area', color: '#00ffff', description: 'Freezes area on impact' },
  { id: 'acid_missile', name: 'Acid Missile', category: 'rocket', rarity: 'uncommon', damage: 28, fireRate: 1500, range: 720, projectileSpeed: 8, reloadTime: 360, projectileType: 'acid_missile', projectileBehavior: 'acid_pool', color: '#00ff00', description: 'Creates acid pool' },
  { id: 'pierce_missile', name: 'Penetrator Missile', category: 'rocket', rarity: 'rare', damage: 50, fireRate: 1700, range: 800, projectileSpeed: 10, reloadTime: 400, projectileType: 'pierce_missile', projectileBehavior: 'piercing', color: '#aaaaaa', description: 'Pierces through targets' },
  { id: 'swarm_missile', name: 'Swarm Missiles', category: 'rocket', rarity: 'epic', damage: 15, fireRate: 2500, range: 900, projectileSpeed: 9, reloadTime: 500, projectileType: 'swarm', projectileBehavior: 'swarm', color: '#ff00ff', description: 'Launches multiple homing missiles' },
  { id: 'gravity_missile', name: 'Gravity Missile', category: 'rocket', rarity: 'epic', damage: 35, fireRate: 2200, range: 850, projectileSpeed: 7, reloadTime: 480, projectileType: 'gravity', projectileBehavior: 'gravity_well', color: '#9900ff', description: 'Creates gravity well' },
  { id: 'time_missile', name: 'Temporal Missile', category: 'rocket', rarity: 'legendary', damage: 40, fireRate: 3000, range: 900, projectileSpeed: 8, reloadTime: 600, projectileType: 'time', projectileBehavior: 'time_slow', color: '#ff00ff', description: 'Slows time in area' },
  { id: 'portal_missile', name: 'Portal Rocket', category: 'rocket', rarity: 'epic', damage: 30, fireRate: 2000, range: 800, projectileSpeed: 9, reloadTime: 450, projectileType: 'portal', projectileBehavior: 'create_portal', color: '#ff00ff', description: 'Creates teleportation portal' },
  { id: 'chain_missile', name: 'Chain Missile', category: 'rocket', rarity: 'rare', damage: 35, fireRate: 1600, range: 850, projectileSpeed: 8, reloadTime: 380, projectileType: 'chain', projectileBehavior: 'chain_lightning', color: '#00ffff', description: 'Chains between targets' },
  { id: 'black_hole_missile', name: 'Singularity Missile', category: 'rocket', rarity: 'legendary', damage: 50, fireRate: 4000, range: 950, projectileSpeed: 6, reloadTime: 800, projectileType: 'blackhole', projectileBehavior: 'black_hole', color: '#000000', description: 'Creates black hole' },

  // === LASERS & BEAMS (31-45) ===
  { id: 'laser_beam', name: 'Laser Beam', category: 'beam', rarity: 'uncommon', damage: 8, fireRate: 50, range: 700, projectileSpeed: 0, reloadTime: 0, projectileType: 'laser', projectileBehavior: 'continuous_beam', color: '#ff0000', description: 'Continuous laser beam' },
  { id: 'pulse_laser', name: 'Pulse Laser', category: 'beam', rarity: 'uncommon', damage: 20, fireRate: 300, range: 650, projectileSpeed: 25, reloadTime: 80, projectileType: 'pulse', projectileBehavior: 'pulse', color: '#00ff00', description: 'Rapid laser pulses' },
  { id: 'heavy_laser', name: 'Heavy Laser', category: 'beam', rarity: 'rare', damage: 15, fireRate: 60, range: 800, projectileSpeed: 0, reloadTime: 0, projectileType: 'heavy_laser', projectileBehavior: 'continuous_beam', color: '#ff6600', description: 'Powerful continuous beam' },
  { id: 'plasma_beam', name: 'Plasma Beam', category: 'beam', rarity: 'rare', damage: 12, fireRate: 55, range: 750, projectileSpeed: 0, reloadTime: 0, projectileType: 'plasma_beam', projectileBehavior: 'continuous_beam', color: '#ff00ff', description: 'Superheated plasma beam' },
  { id: 'freeze_ray', name: 'Freeze Ray', category: 'beam', rarity: 'uncommon', damage: 5, fireRate: 70, range: 600, projectileSpeed: 0, reloadTime: 0, projectileType: 'freeze_ray', projectileBehavior: 'freeze_beam', color: '#00ffff', description: 'Freezes targets' },
  { id: 'disintegration_beam', name: 'Disintegration Beam', category: 'beam', rarity: 'epic', damage: 25, fireRate: 80, range: 850, projectileSpeed: 0, reloadTime: 0, projectileType: 'disintegrate', projectileBehavior: 'disintegrate', color: '#ff00ff', description: 'Disintegrates matter' },
  { id: 'healing_beam', name: 'Healing Beam', category: 'beam', rarity: 'rare', damage: -10, fireRate: 100, range: 500, projectileSpeed: 0, reloadTime: 0, projectileType: 'heal', projectileBehavior: 'heal_beam', color: '#00ff00', description: 'Heals allies' },
  { id: 'tractor_beam', name: 'Tractor Beam', category: 'beam', rarity: 'epic', damage: 0, fireRate: 100, range: 600, projectileSpeed: 0, reloadTime: 0, projectileType: 'tractor', projectileBehavior: 'pull', color: '#00ccff', description: 'Pulls objects' },
  { id: 'repulsor_beam', name: 'Repulsor Beam', category: 'beam', rarity: 'epic', damage: 0, fireRate: 100, range: 600, projectileSpeed: 0, reloadTime: 0, projectileType: 'repulsor', projectileBehavior: 'push', color: '#ff00ff', description: 'Pushes objects away' },
  { id: 'lightning_beam', name: 'Lightning Beam', category: 'beam', rarity: 'rare', damage: 10, fireRate: 65, range: 700, projectileSpeed: 0, reloadTime: 0, projectileType: 'lightning_beam', projectileBehavior: 'chain_lightning', color: '#ffff00', description: 'Chains to nearby targets' },
  { id: 'solar_beam', name: 'Solar Beam', category: 'beam', rarity: 'legendary', damage: 30, fireRate: 90, range: 900, projectileSpeed: 0, reloadTime: 0, projectileType: 'solar', projectileBehavior: 'solar_beam', color: '#ffff00', description: 'Concentrated solar energy' },
  { id: 'void_beam', name: 'Void Beam', category: 'beam', rarity: 'legendary', damage: 20, fireRate: 75, range: 800, projectileSpeed: 0, reloadTime: 0, projectileType: 'void', projectileBehavior: 'void_beam', color: '#9900ff', description: 'Erases matter from existence' },
  { id: 'prismatic_beam', name: 'Prismatic Beam', category: 'beam', rarity: 'epic', damage: 18, fireRate: 70, range: 750, projectileSpeed: 0, reloadTime: 0, projectileType: 'prismatic', projectileBehavior: 'prismatic', color: '#ff00ff', description: 'Cycles through colors' },
  { id: 'ion_beam', name: 'Ion Beam', category: 'beam', rarity: 'rare', damage: 12, fireRate: 60, range: 700, projectileSpeed: 0, reloadTime: 0, projectileType: 'ion', projectileBehavior: 'ion_beam', color: '#00ffff', description: 'Ionizes targets' },
  { id: 'gamma_beam', name: 'Gamma Beam', category: 'beam', rarity: 'epic', damage: 22, fireRate: 85, range: 850, projectileSpeed: 0, reloadTime: 0, projectileType: 'gamma', projectileBehavior: 'gamma_beam', color: '#00ff00', description: 'High-energy radiation' },

  // === PLASMA & ENERGY (46-60) ===
  { id: 'plasma_orb', name: 'Plasma Orb', category: 'plasma', rarity: 'uncommon', damage: 25, fireRate: 800, range: 600, projectileSpeed: 9, reloadTime: 200, projectileType: 'plasma', projectileBehavior: 'plasma_orb', color: '#ff00ff', description: 'Orbiting plasma sphere' },
  { id: 'plasma_wave', name: 'Plasma Wave', category: 'plasma', rarity: 'rare', damage: 20, fireRate: 1000, range: 500, projectileSpeed: 7, reloadTime: 250, projectileType: 'wave', projectileBehavior: 'wave', color: '#ff66ff', description: 'Expanding plasma wave' },
  { id: 'energy_ball', name: 'Energy Ball', category: 'plasma', rarity: 'common', damage: 18, fireRate: 700, range: 550, projectileSpeed: 10, reloadTime: 180, projectileType: 'energy', projectileBehavior: 'energy_ball', color: '#00ff88', description: 'Concentrated energy sphere' },
  { id: 'nova_blast', name: 'Nova Blast', category: 'plasma', rarity: 'epic', damage: 35, fireRate: 1500, range: 400, projectileSpeed: 6, reloadTime: 350, projectileType: 'nova', projectileBehavior: 'nova', color: '#ffff00', description: 'Expanding nova explosion' },
  { id: 'photon_torpedo', name: 'Photon Torpedo', category: 'plasma', rarity: 'rare', damage: 30, fireRate: 1200, range: 700, projectileSpeed: 11, reloadTime: 280, projectileType: 'photon', projectileBehavior: 'photon', color: '#00ffff', description: 'High-energy photon projectile' },
  { id: 'ion_cannon', name: 'Ion Cannon', category: 'plasma', rarity: 'uncommon', damage: 22, fireRate: 900, range: 650, projectileSpeed: 10, reloadTime: 220, projectileType: 'ion_cannon', projectileBehavior: 'ion', color: '#00ccff', description: 'Ionized energy blast' },
  { id: 'anti_matter', name: 'Anti-Matter Shell', category: 'plasma', rarity: 'legendary', damage: 50, fireRate: 2000, range: 800, projectileSpeed: 8, reloadTime: 450, projectileType: 'antimatter', projectileBehavior: 'antimatter', color: '#9900ff', description: 'Annihilates matter' },
  { id: 'dark_energy', name: 'Dark Energy Bolt', category: 'plasma', rarity: 'epic', damage: 28, fireRate: 1100, range: 750, projectileSpeed: 9, reloadTime: 260, projectileType: 'dark_energy', projectileBehavior: 'dark_energy', color: '#6600cc', description: 'Dark energy projection' },
  { id: 'quantum_shell', name: 'Quantum Shell', category: 'plasma', rarity: 'epic', damage: 32, fireRate: 1300, range: 780, projectileSpeed: 10, reloadTime: 300, projectileType: 'quantum', projectileBehavior: 'quantum', color: '#ff00ff', description: 'Quantum state projectile' },
  { id: 'fusion_bolt', name: 'Fusion Bolt', category: 'plasma', rarity: 'rare', damage: 26, fireRate: 1000, range: 700, projectileSpeed: 11, reloadTime: 240, projectileType: 'fusion', projectileBehavior: 'fusion', color: '#ffaa00', description: 'Fusion energy bolt' },
  { id: 'positron_beam', name: 'Positron Beam', category: 'plasma', rarity: 'rare', damage: 24, fireRate: 950, range: 720, projectileSpeed: 12, reloadTime: 230, projectileType: 'positron', projectileBehavior: 'positron', color: '#00ff00', description: 'Antimatter particle beam' },
  { id: 'neutrino_burst', name: 'Neutrino Burst', category: 'plasma', rarity: 'epic', damage: 30, fireRate: 1400, range: 800, projectileSpeed: 15, reloadTime: 320, projectileType: 'neutrino', projectileBehavior: 'neutrino', color: '#ffffff', description: 'Nearly massless particles' },
  { id: 'tachyon_lance', name: 'Tachyon Lance', category: 'plasma', rarity: 'legendary', damage: 40, fireRate: 1800, range: 900, projectileSpeed: 20, reloadTime: 400, projectileType: 'tachyon', projectileBehavior: 'tachyon', color: '#ff00ff', description: 'Faster-than-light projectile' },
  { id: 'graviton_pulse', name: 'Graviton Pulse', category: 'plasma', rarity: 'epic', damage: 25, fireRate: 1200, range: 600, projectileSpeed: 8, reloadTime: 280, projectileType: 'graviton', projectileBehavior: 'graviton', color: '#9900ff', description: 'Gravity manipulation pulse' },
  { id: 'singularity_bolt', name: 'Singularity Bolt', category: 'plasma', rarity: 'legendary', damage: 45, fireRate: 2200, range: 850, projectileSpeed: 7, reloadTime: 500, projectileType: 'singularity', projectileBehavior: 'singularity', color: '#000000', description: 'Micro black hole' },

  // === LIGHTNING & ELECTRIC (61-75) ===
  { id: 'lightning_bolt', name: 'Lightning Bolt', category: 'lightning', rarity: 'uncommon', damage: 20, fireRate: 600, range: 700, projectileSpeed: 30, reloadTime: 150, projectileType: 'lightning', projectileBehavior: 'lightning', color: '#ffff00', description: 'Electric lightning strike' },
  { id: 'chain_lightning', name: 'Chain Lightning', category: 'lightning', rarity: 'rare', damage: 15, fireRate: 800, range: 800, projectileSpeed: 25, reloadTime: 200, projectileType: 'chain_lightning', projectileBehavior: 'chain', color: '#00ffff', description: 'Chains between targets' },
  { id: 'tesla_bolt', name: 'Tesla Bolt', category: 'lightning', rarity: 'uncommon', damage: 18, fireRate: 700, range: 650, projectileSpeed: 28, reloadTime: 170, projectileType: 'tesla', projectileBehavior: 'tesla', color: '#ff00ff', description: 'Tesla coil discharge' },
  { id: 'storm_call', name: 'Storm Call', category: 'lightning', rarity: 'epic', damage: 25, fireRate: 1200, range: 900, projectileSpeed: 20, reloadTime: 300, projectileType: 'storm', projectileBehavior: 'storm', color: '#ffff00', description: 'Calls down lightning storm' },
  { id: 'emp_blast', name: 'EMP Blast', category: 'lightning', rarity: 'rare', damage: 10, fireRate: 1500, range: 500, projectileSpeed: 0, reloadTime: 350, projectileType: 'emp', projectileBehavior: 'emp', color: '#00ccff', description: 'Electromagnetic pulse' },
  { id: 'arc_discharge', name: 'Arc Discharge', category: 'lightning', rarity: 'uncommon', damage: 16, fireRate: 650, range: 680, projectileSpeed: 26, reloadTime: 160, projectileType: 'arc', projectileBehavior: 'arc', color: '#ff66ff', description: 'Electrical arc' },
  { id: 'thunder_strike', name: 'Thunder Strike', category: 'lightning', rarity: 'rare', damage: 22, fireRate: 900, range: 750, projectileSpeed: 32, reloadTime: 220, projectileType: 'thunder', projectileBehavior: 'thunder', color: '#ffff00', description: 'Powerful thunder bolt' },
  { id: 'plasma_lightning', name: 'Plasma Lightning', category: 'lightning', rarity: 'epic', damage: 28, fireRate: 1100, range: 800, projectileSpeed: 28, reloadTime: 260, projectileType: 'plasma_lightning', projectileBehavior: 'plasma_lightning', color: '#ff00ff', description: 'Superheated lightning' },
  { id: 'ion_storm', name: 'Ion Storm', category: 'lightning', rarity: 'epic', damage: 20, fireRate: 1000, range: 850, projectileSpeed: 22, reloadTime: 240, projectileType: 'ion_storm', projectileBehavior: 'ion_storm', color: '#00ffff', description: 'Ionized electrical storm' },
  { id: 'ball_lightning', name: 'Ball Lightning', category: 'lightning', rarity: 'rare', damage: 24, fireRate: 1300, range: 700, projectileSpeed: 6, reloadTime: 300, projectileType: 'ball_lightning', projectileBehavior: 'ball_lightning', color: '#ffff00', description: 'Floating lightning orb' },
  { id: 'static_discharge', name: 'Static Discharge', category: 'lightning', rarity: 'common', damage: 12, fireRate: 500, range: 600, projectileSpeed: 30, reloadTime: 120, projectileType: 'static', projectileBehavior: 'static', color: '#ffffff', description: 'Static electricity burst' },
  { id: 'volts', name: 'Volt Stream', category: 'lightning', rarity: 'uncommon', damage: 14, fireRate: 550, range: 650, projectileSpeed: 27, reloadTime: 140, projectileType: 'volt', projectileBehavior: 'volt', color: '#00ff00', description: 'Continuous volt stream' },
  { id: 'megavolt', name: 'Megavolt', category: 'lightning', rarity: 'epic', damage: 35, fireRate: 1600, range: 900, projectileSpeed: 35, reloadTime: 380, projectileType: 'megavolt', projectileBehavior: 'megavolt', color: '#ffff00', description: 'Massive electrical discharge' },
  { id: 'gigavolt', name: 'Gigavolt', category: 'lightning', rarity: 'legendary', damage: 50, fireRate: 2500, range: 1000, projectileSpeed: 40, reloadTime: 600, projectileType: 'gigavolt', projectileBehavior: 'gigavolt', color: '#ffffff', description: 'Devastating electrical power' },
  { id: 'teravolt', name: 'Teravolt', category: 'lightning', rarity: 'legendary', damage: 75, fireRate: 4000, range: 1200, projectileSpeed: 50, reloadTime: 1000, projectileType: 'teravolt', projectileBehavior: 'teravolt', color: '#ff00ff', description: 'Ultimate electrical weapon' },

  // === FLAMETHROWER & FIRE (76-90) ===
  { id: 'flamethrower', name: 'Flamethrower', category: 'fire', rarity: 'common', damage: 5, fireRate: 50, range: 400, projectileSpeed: 8, reloadTime: 0, projectileType: 'flame', projectileBehavior: 'flame_cone', color: '#ff6600', description: 'Continuous flame stream' },
  { id: 'inferno', name: 'Inferno', category: 'fire', rarity: 'uncommon', damage: 8, fireRate: 60, range: 450, projectileSpeed: 9, reloadTime: 0, projectileType: 'inferno', projectileBehavior: 'inferno', color: '#ff4400', description: 'Intense flame jet' },
  { id: 'firestorm', name: 'Firestorm', category: 'fire', rarity: 'rare', damage: 12, fireRate: 80, range: 500, projectileSpeed: 10, reloadTime: 0, projectileType: 'firestorm', projectileBehavior: 'firestorm', color: '#ff0000', description: 'Devastating fire storm' },
  { id: 'napalm_stream', name: 'Napalm Stream', category: 'fire', rarity: 'uncommon', damage: 7, fireRate: 70, range: 420, projectileSpeed: 8, reloadTime: 0, projectileType: 'napalm_stream', projectileBehavior: 'napalm', color: '#ff8800', description: 'Sticky burning napalm' },
  { id: 'plasma_fire', name: 'Plasma Fire', category: 'fire', rarity: 'rare', damage: 10, fireRate: 75, range: 480, projectileSpeed: 11, reloadTime: 0, projectileType: 'plasma_fire', projectileBehavior: 'plasma_fire', color: '#ff00ff', description: 'Superheated plasma flames' },
  { id: 'dragon_breath', name: 'Dragon Breath', category: 'fire', rarity: 'epic', damage: 15, fireRate: 90, range: 550, projectileSpeed: 12, reloadTime: 0, projectileType: 'dragon', projectileBehavior: 'dragon', color: '#ff6600', description: 'Ancient dragon fire' },
  { id: 'hellfire', name: 'Hellfire', category: 'fire', rarity: 'epic', damage: 18, fireRate: 100, range: 600, projectileSpeed: 13, reloadTime: 0, projectileType: 'hellfire', projectileBehavior: 'hellfire', color: '#ff0000', description: 'Demonic flames' },
  { id: 'solar_flare', name: 'Solar Flare', category: 'fire', rarity: 'legendary', damage: 25, fireRate: 120, range: 700, projectileSpeed: 15, reloadTime: 0, projectileType: 'solar_flare', projectileBehavior: 'solar_flare', color: '#ffff00', description: 'Solar corona fire' },
  { id: 'phoenix_fire', name: 'Phoenix Fire', category: 'fire', rarity: 'legendary', damage: 30, fireRate: 150, range: 750, projectileSpeed: 16, reloadTime: 0, projectileType: 'phoenix', projectileBehavior: 'phoenix', color: '#ff6600', description: 'Mythical phoenix flames' },
  { id: 'magma_stream', name: 'Magma Stream', category: 'fire', rarity: 'rare', damage: 11, fireRate: 85, range: 460, projectileSpeed: 7, reloadTime: 0, projectileType: 'magma', projectileBehavior: 'magma', color: '#ff4400', description: 'Molten rock stream' },
  { id: 'lava_spray', name: 'Lava Spray', category: 'fire', rarity: 'uncommon', damage: 9, fireRate: 75, range: 440, projectileSpeed: 9, reloadTime: 0, projectileType: 'lava', projectileBehavior: 'lava', color: '#ff6600', description: 'Spraying molten lava' },
  { id: 'ember_shower', name: 'Ember Shower', category: 'fire', rarity: 'uncommon', damage: 6, fireRate: 65, range: 410, projectileSpeed: 8, reloadTime: 0, projectileType: 'ember', projectileBehavior: 'ember', color: '#ff8800', description: 'Shower of burning embers' },
  { id: 'fireball', name: 'Fireball', category: 'fire', rarity: 'common', damage: 20, fireRate: 1000, range: 600, projectileSpeed: 10, reloadTime: 250, projectileType: 'fireball', projectileBehavior: 'fireball', color: '#ff6600', description: 'Classic fireball' },
  { id: 'meteor', name: 'Meteor', category: 'fire', rarity: 'epic', damage: 40, fireRate: 2000, range: 800, projectileSpeed: 8, reloadTime: 500, projectileType: 'meteor', projectileBehavior: 'meteor', color: '#ff4400', description: 'Falling meteor' },
  { id: 'supernova', name: 'Supernova', category: 'fire', rarity: 'legendary', damage: 60, fireRate: 3000, range: 1000, projectileSpeed: 6, reloadTime: 800, projectileType: 'supernova', projectileBehavior: 'supernova', color: '#ffff00', description: 'Stellar explosion' },

  // === SPECIAL & UTILITY (91-100) ===
  { id: 'heal_beam', name: 'Healing Beam', category: 'support', rarity: 'rare', damage: -15, fireRate: 100, range: 500, projectileSpeed: 0, reloadTime: 0, projectileType: 'heal_beam', projectileBehavior: 'heal', color: '#00ff00', description: 'Heals allied tanks' },
  { id: 'shield_projector', name: 'Shield Projector', category: 'support', rarity: 'rare', damage: 0, fireRate: 2000, range: 300, projectileSpeed: 0, reloadTime: 500, projectileType: 'shield', projectileBehavior: 'shield', color: '#00ccff', description: 'Creates protective shield' },
  { id: 'repair_drone', name: 'Repair Drone', category: 'support', rarity: 'epic', damage: -20, fireRate: 3000, range: 400, projectileSpeed: 5, reloadTime: 800, projectileType: 'drone', projectileBehavior: 'repair', color: '#00ff88', description: 'Deploy repair drone' },
  { id: 'teleport_device', name: 'Teleport Device', category: 'special', rarity: 'epic', damage: 0, fireRate: 5000, range: 0, projectileSpeed: 0, reloadTime: 1200, projectileType: 'teleport', projectileBehavior: 'teleport', color: '#ff00ff', description: 'Teleport to location' },
  { id: 'summon_turret', name: 'Turret Summoner', category: 'special', rarity: 'legendary', damage: 0, fireRate: 8000, range: 200, projectileSpeed: 0, reloadTime: 2000, projectileType: 'summon', projectileBehavior: 'summon', color: '#ffaa00', description: 'Summon auto-turret' },
  { id: 'gravity_well', name: 'Gravity Well', category: 'special', rarity: 'epic', damage: 0, fireRate: 3000, range: 400, projectileSpeed: 0, reloadTime: 800, projectileType: 'gravity_well', projectileBehavior: 'gravity_well', color: '#9900ff', description: 'Create gravity well' },
  { id: 'time_slow', name: 'Time Slow Field', category: 'special', rarity: 'legendary', damage: 0, fireRate: 4000, range: 500, projectileSpeed: 0, reloadTime: 1000, projectileType: 'time_slow', projectileBehavior: 'time_slow', color: '#ff00ff', description: 'Slow time in area' },
  { id: 'emp_field', name: 'EMP Field', category: 'special', rarity: 'epic', damage: 0, fireRate: 3500, range: 450, projectileSpeed: 0, reloadTime: 900, projectileType: 'emp_field', projectileBehavior: 'emp_field', color: '#00ccff', description: 'Disable electronics' },
  { id: 'black_hole_gen', name: 'Black Hole Generator', category: 'special', rarity: 'legendary', damage: 0, fireRate: 6000, range: 600, projectileSpeed: 0, reloadTime: 1500, projectileType: 'blackhole_gen', projectileBehavior: 'blackhole_gen', color: '#000000', description: 'Create black hole' },
  { id: 'chaos_orb', name: 'Chaos Orb', category: 'special', rarity: 'legendary', damage: 50, fireRate: 5000, range: 800, projectileSpeed: 7, reloadTime: 1200, projectileType: 'chaos', projectileBehavior: 'chaos', color: '#ff00ff', description: 'Unpredictable chaos effect' },
];

export function getWeaponById(id: string): WeaponDefinition | undefined {
  return WEAPONS.find(w => w.id === id);
}

export function getWeaponsByCategory(category: string): WeaponDefinition[] {
  return WEAPONS.filter(w => w.category === category);
}

export function getWeaponsByRarity(rarity: string): WeaponDefinition[] {
  return WEAPONS.filter(w => w.rarity === rarity);
}
