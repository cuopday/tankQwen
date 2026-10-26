export interface Vector2 {
  x: number;
  y: number;
}

export interface Tank {
  id: string;
  position: Vector2;
  velocity: Vector2;
  angle: number;
  targetAngle: number;
  turretAngle: number;
  health: number;
  maxHealth: number;
  speed: number;
  rotationSpeed: number;
  color: string;
  accentColor: string;
  lastShot: number;
  fireRate: number;
  isPlayer: boolean;
  size: number;
  height: number;
  trackOffset: number;
  shield: number;
  kills: number;
  moving: boolean;
  // Power-up effects
  rapidFire?: number;
  tripleShot?: number;
  speedBoost?: number;
  armorBoost?: number;
  invisibility?: number;
}

export interface Bullet {
  id: string;
  position: Vector2;
  velocity: Vector2;
  angle: number;
  damage: number;
  ownerId: string;
  lifetime: number;
  trail: Vector2[];
  size: number;
  height: number;
  homing?: boolean;
  explosive?: boolean;
}

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  lifetime: number;
  maxLifetime: number;
  size: number;
  color: string;
  type: 'explosion' | 'smoke' | 'spark' | 'debris' | 'trail' | 'muzzle' | 'dust' | 'firefly' | 'mist' | 'fire' | 'lightning' | 'confetti';
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  height: number;
}

export interface Explosion {
  position: Vector2;
  radius: number;
  maxRadius: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
}

export type ObstacleType = 
  // Vietnam village
  | 'stilt_house' | 'mud_hut' | 'bamboo' | 'rice_paddy' 
  | 'buddha' | 'well' | 'rice_stack' | 'fence' 
  | 'palm_tree' | 'banana_tree' | 'sampan' | 'market_stall'
  | 'stone_lantern' | 'village_gate' | 'wooden_bridge' | 'barrel'
  | 'cart' | 'water_buffalo'
  // Explosive objects
  | 'explosive_barrel' | 'tnt_crate' | 'gas_tank' | 'landmine' | 'proximity_mine'
  // Power-ups
  | 'health_pack' | 'speed_boost' | 'rapid_fire' | 'triple_shot' | 'shield' | 'armor_boost'
  // Hazards
  | 'lava_pool' | 'acid_lake' | 'quicksand' | 'ice_patch' | 'oil_spill' | 'tornado'
  // Moving obstacles
  | 'rolling_boulder' | 'moving_train' | 'spinning_blade'
  // Traps
  | 'auto_turret' | 'tesla_coil' | 'spike_trap' | 'flamethrower'
  // Interactive
  | 'teleport_portal' | 'jump_pad' | 'speed_ramp'
  // AI creatures
  | 'attack_drone' | 'kamikaze_drone' | 'giant_spider'
  // Chaos objects
  | 'black_hole' | 'meteor_shower' | 'chaos_core';

export interface Obstacle {
  position: Vector2;
  width: number;
  height: number;
  depth: number;
  type: ObstacleType;
  health: number;
  maxHealth: number;
  color: string;
  angle: number;
  variant: number;
  // Dynamic properties
  velocity?: Vector2;
  active?: boolean;
  cooldown?: number;
  targetId?: string;
  triggered?: boolean;
}

export interface GameState {
  player: Tank;
  enemies: Tank[];
  bullets: Bullet[];
  particles: Particle[];
  explosions: Explosion[];
  obstacles: Obstacle[];
  score: number;
  wave: number;
  gameOver: boolean;
  gameStarted: boolean;
  paused: boolean;
  screenShake: Vector2;
  time: number;
  waveAnnouncement: number;
  chaosLevel: number;
  chaosTimer: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  mouseX: number;
  mouseY: number;
}
