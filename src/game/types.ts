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
}

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  lifetime: number;
  maxLifetime: number;
  size: number;
  color: string;
  type: 'explosion' | 'smoke' | 'spark' | 'debris' | 'trail' | 'muzzle' | 'dust' | 'firefly' | 'mist';
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
  | 'stilt_house' | 'mud_hut' | 'bamboo' | 'rice_paddy' 
  | 'buddha' | 'well' | 'rice_stack' | 'fence' 
  | 'palm_tree' | 'banana_tree' | 'sampan' | 'market_stall'
  | 'stone_lantern' | 'village_gate' | 'wooden_bridge' | 'barrel'
  | 'cart' | 'water_buffalo';

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
  variant: number; // for visual variety
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
