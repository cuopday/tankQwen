import { Tank, Bullet, Particle, Explosion, Obstacle, GameState, InputState, Vector2, ObstacleType } from './types';
import { addGroundDecal, clearDecals } from './renderer';

let nextId = 0;
const getId = () => `id_${nextId++}`;

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
export const MAP_WIDTH = 4800;
export const MAP_HEIGHT = 3600;

export function createPlayer(): Tank {
  return {
    id: getId(),
    position: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 },
    velocity: { x: 0, y: 0 },
    angle: -Math.PI / 2,
    targetAngle: -Math.PI / 2,
    turretAngle: -Math.PI / 2,
    health: 100,
    maxHealth: 100,
    speed: 4.5,
    rotationSpeed: 0.08,
    color: '#2563eb',
    accentColor: '#60a5fa',
    lastShot: 0,
    fireRate: 250,
    isPlayer: true,
    size: 26,
    height: 14,
    trackOffset: 0,
    shield: 0,
    kills: 0,
    moving: false,
  };
}

export function createEnemy(wave: number, playerPos: Vector2): Tank {
  const colors = [
    { color: '#dc2626', accentColor: '#f87171' },
    { color: '#7c3aed', accentColor: '#a78bfa' },
    { color: '#ea580c', accentColor: '#fb923c' },
    { color: '#059669', accentColor: '#34d399' },
    { color: '#d946ef', accentColor: '#f0abfc' },
  ];
  const colorSet = colors[Math.floor(Math.random() * colors.length)];
  const margin = 200;
  
  let x: number, y: number;
  let attempts = 0;
  do {
    x = margin + Math.random() * (MAP_WIDTH - margin * 2);
    y = margin + Math.random() * (MAP_HEIGHT - margin * 2);
    attempts++;
  } while (Math.sqrt((x - playerPos.x) ** 2 + (y - playerPos.y) ** 2) < 600 && attempts < 50);

  return {
    id: getId(),
    position: { x, y },
    velocity: { x: 0, y: 0 },
    angle: Math.random() * Math.PI * 2,
    targetAngle: Math.random() * Math.PI * 2,
    turretAngle: Math.random() * Math.PI * 2,
    health: 40 + wave * 15,
    maxHealth: 40 + wave * 15,
    speed: 2 + Math.random() * 1.5,
    rotationSpeed: 0.04,
    ...colorSet,
    lastShot: 0,
    fireRate: Math.max(800, 1800 - wave * 80),
    isPlayer: false,
    size: 22 + Math.random() * 6,
    height: 12 + Math.random() * 4,
    trackOffset: 0,
    shield: 0,
    kills: 0,
    moving: false,
  };
}

export function createBullet(tank: Tank, homing = false, explosive = false): Bullet {
  const speed = 12;
  const angle = tank.turretAngle;
  const barrelLength = tank.size * 1.5;
  
  return {
    id: getId(),
    position: {
      x: tank.position.x + Math.cos(angle) * barrelLength,
      y: tank.position.y + Math.sin(angle) * barrelLength,
    },
    velocity: {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    },
    angle,
    damage: tank.isPlayer ? 28 : 10 + Math.random() * 5,
    ownerId: tank.id,
    lifetime: 2500,
    trail: [],
    size: tank.isPlayer ? 5 : 4,
    height: 8,
    homing,
    explosive,
  };
}

export function createExplosion(position: Vector2, size: number, color = '#ff6b35'): Explosion {
  return {
    position: { ...position },
    radius: 0,
    maxRadius: size,
    lifetime: 600,
    maxLifetime: 600,
    color,
  };
}

export function createParticles(position: Vector2, count: number, type: Particle['type'], color?: string): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = type === 'explosion' ? 2 + Math.random() * 6 : 
                  type === 'spark' ? 4 + Math.random() * 8 :
                  type === 'smoke' ? 0.5 + Math.random() * 2 :
                  type === 'muzzle' ? 3 + Math.random() * 5 :
                  type === 'dust' ? 1 + Math.random() * 2 :
                  type === 'fire' ? 2 + Math.random() * 4 :
                  type === 'lightning' ? 8 + Math.random() * 12 :
                  type === 'confetti' ? 3 + Math.random() * 5 :
                  1 + Math.random() * 3;
    
    const colors: Record<string, string[]> = {
      explosion: ['#ff6b35', '#ff9500', '#ffcc00', '#ff4444', '#ffffff'],
      smoke: ['#555555', '#666666', '#777777', '#888888'],
      spark: ['#ffcc00', '#ffffff', '#ff9500', '#ffee00'],
      debris: ['#8B4513', '#654321', '#555555', '#333333'],
      trail: ['#ff9500', '#ffcc00', '#ff6b35'],
      muzzle: ['#ffffff', '#ffee00', '#ffcc00', '#ff9500'],
      dust: ['#a0845c', '#8b7355', '#6b5b45', '#9c8b70'],
      fire: ['#ff4500', '#ff6347', '#ff7f50', '#ffa500'],
      lightning: ['#00ffff', '#00ccff', '#ffffff', '#88ffff'],
      confetti: ['#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#00ff00', '#0000ff'],
    };
    
    const particleColors = colors[type] || colors.explosion;
    const particleColor = color || particleColors[Math.floor(Math.random() * particleColors.length)];
    
    particles.push({
      position: { ...position },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      lifetime: type === 'smoke' ? 800 + Math.random() * 1200 :
                type === 'explosion' ? 300 + Math.random() * 500 :
                type === 'spark' ? 200 + Math.random() * 400 :
                type === 'muzzle' ? 100 + Math.random() * 200 :
                type === 'dust' ? 400 + Math.random() * 600 :
                type === 'fire' ? 300 + Math.random() * 500 :
                type === 'lightning' ? 100 + Math.random() * 200 :
                type === 'confetti' ? 1000 + Math.random() * 1000 :
                400 + Math.random() * 600,
      maxLifetime: type === 'smoke' ? 2000 :
                   type === 'explosion' ? 800 :
                   type === 'spark' ? 600 :
                   type === 'muzzle' ? 300 :
                   type === 'dust' ? 1000 :
                   type === 'fire' ? 800 :
                   type === 'lightning' ? 300 :
                   type === 'confetti' ? 2000 :
                   1000,
      size: type === 'smoke' ? 8 + Math.random() * 15 :
            type === 'explosion' ? 4 + Math.random() * 8 :
            type === 'spark' ? 2 + Math.random() * 3 :
            type === 'muzzle' ? 3 + Math.random() * 5 :
            type === 'dust' ? 5 + Math.random() * 8 :
            type === 'fire' ? 3 + Math.random() * 5 :
            type === 'lightning' ? 1 + Math.random() * 2 :
            type === 'confetti' ? 2 + Math.random() * 3 :
            3 + Math.random() * 5,
      color: particleColor,
      type,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      opacity: 1,
      height: type === 'dust' ? Math.random() * 3 : 0,
    });
  }
  return particles;
}

function distance(a: Vector2, b: Vector2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function angleDiff(from: number, to: number): number {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function rectCollision(pos: Vector2, size: number, obstacle: Obstacle): boolean {
  const halfSize = size * 0.7;
  const closestX = Math.max(obstacle.position.x - obstacle.width / 2, 
    Math.min(pos.x, obstacle.position.x + obstacle.width / 2));
  const closestY = Math.max(obstacle.position.y - obstacle.height / 2, 
    Math.min(pos.y, obstacle.position.y + obstacle.height / 2));
  
  const dx = pos.x - closestX;
  const dy = pos.y - closestY;
  return (dx * dx + dy * dy) < (halfSize * halfSize);
}

export function createObstacles(chaosLevel: number): Obstacle[] {
  const obstacles: Obstacle[] = [];
  const margin = 300;
  
  const isNearCenter = (x: number, y: number) => {
    const cx = MAP_WIDTH / 2, cy = MAP_HEIGHT / 2;
    return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < 200;
  };
  
  const randPos = () => {
    let x, y, attempts = 0;
    do {
      x = margin + Math.random() * (MAP_WIDTH - margin * 2);
      y = margin + Math.random() * (MAP_HEIGHT - margin * 2);
      attempts++;
    } while (isNearCenter(x, y) && attempts < 20);
    return { x, y };
  };
  
  // Vietnam village objects
  for (let i = 0; i < 10; i++) {
    const pos = randPos();
    obstacles.push({
      position: pos,
      width: 80 + Math.random() * 50,
      height: 60 + Math.random() * 30,
      depth: 55 + Math.random() * 20,
      type: 'stilt_house',
      health: 200,
      maxHealth: 200,
      color: '#8B6914',
      angle: (Math.floor(Math.random() * 4)) * Math.PI / 2,
      variant: Math.floor(Math.random() * 3),
    });
  }
  
  for (let i = 0; i < 15; i++) {
    const pos = randPos();
    obstacles.push({
      position: pos,
      width: 30 + Math.random() * 25,
      height: 30 + Math.random() * 25,
      depth: 70 + Math.random() * 40,
      type: 'bamboo',
      health: 50,
      maxHealth: 50,
      color: '#4a7c3a',
      angle: Math.random() * Math.PI * 2,
      variant: Math.floor(Math.random() * 4),
    });
  }
  
  // CHAOS OBJECTS - Scale with chaos level
  
  // Explosive barrels
  const barrelCount = 15 + chaosLevel * 5;
  for (let i = 0; i < barrelCount; i++) {
    const pos = randPos();
    obstacles.push({
      position: pos,
      width: 20,
      height: 20,
      depth: 25,
      type: 'explosive_barrel',
      health: 30,
      maxHealth: 30,
      color: '#dc2626',
      angle: 0,
      variant: 0,
    });
  }
  
  // TNT crates
  const tntCount = 5 + chaosLevel * 3;
  for (let i = 0; i < tntCount; i++) {
    const pos = randPos();
    obstacles.push({
      position: pos,
      width: 30,
      height: 30,
      depth: 30,
      type: 'tnt_crate',
      health: 50,
      maxHealth: 50,
      color: '#991b1b',
      angle: 0,
      variant: 0,
    });
  }
  
  // Power-ups
  const powerUpTypes: ObstacleType[] = ['health_pack', 'speed_boost', 'rapid_fire', 'triple_shot', 'shield', 'armor_boost'];
  const powerUpCount = 8 + chaosLevel * 2;
  for (let i = 0; i < powerUpCount; i++) {
    const pos = randPos();
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    obstacles.push({
      position: pos,
      width: 25,
      height: 25,
      depth: 15,
      type,
      health: 9999,
      maxHealth: 9999,
      color: '#ffffff',
      angle: 0,
      variant: 0,
      active: true,
      cooldown: 0,
    });
  }
  
  // Hazards (scale with chaos)
  if (chaosLevel >= 1) {
    for (let i = 0; i < 5 + chaosLevel * 2; i++) {
      const pos = randPos();
      const hazardTypes: ObstacleType[] = ['lava_pool', 'acid_lake', 'quicksand', 'ice_patch', 'oil_spill'];
      obstacles.push({
        position: pos,
        width: 60 + Math.random() * 40,
        height: 60 + Math.random() * 40,
        depth: 5,
        type: hazardTypes[Math.floor(Math.random() * hazardTypes.length)],
        health: 9999,
        maxHealth: 9999,
        color: '#ff4500',
        angle: 0,
        variant: 0,
      });
    }
  }
  
  // Tornadoes (chaos level 2+)
  if (chaosLevel >= 2) {
    for (let i = 0; i < chaosLevel; i++) {
      const pos = randPos();
      obstacles.push({
        position: pos,
        width: 80,
        height: 80,
        depth: 100,
        type: 'tornado',
        health: 9999,
        maxHealth: 9999,
        color: '#6b7280',
        angle: 0,
        variant: 0,
        velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
      });
    }
  }
  
  // Auto turrets (chaos level 2+)
  if (chaosLevel >= 2) {
    for (let i = 0; i < 3 + chaosLevel; i++) {
      const pos = randPos();
      obstacles.push({
        position: pos,
        width: 30,
        height: 30,
        depth: 40,
        type: 'auto_turret',
        health: 150,
        maxHealth: 150,
        color: '#374151',
        angle: Math.random() * Math.PI * 2,
        variant: 0,
        cooldown: 0,
        targetId: undefined,
      });
    }
  }
  
  // Teleport portals (chaos level 3+)
  if (chaosLevel >= 3) {
    for (let i = 0; i < 2; i++) {
      const pos = randPos();
      obstacles.push({
        position: pos,
        width: 50,
        height: 50,
        depth: 60,
        type: 'teleport_portal',
        health: 9999,
        maxHealth: 9999,
        color: '#a855f7',
        angle: 0,
        variant: i,
      });
    }
  }
  
  // Rolling boulders (chaos level 3+)
  if (chaosLevel >= 3) {
    for (let i = 0; i < chaosLevel; i++) {
      const pos = randPos();
      obstacles.push({
        position: pos,
        width: 40,
        height: 40,
        depth: 40,
        type: 'rolling_boulder',
        health: 200,
        maxHealth: 200,
        color: '#6b7280',
        angle: 0,
        variant: 0,
        velocity: { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3 },
      });
    }
  }
  
  // Attack drones (chaos level 4+)
  if (chaosLevel >= 4) {
    for (let i = 0; i < chaosLevel - 1; i++) {
      const pos = randPos();
      obstacles.push({
        position: pos,
        width: 25,
        height: 25,
        depth: 30,
        type: 'attack_drone',
        health: 80,
        maxHealth: 80,
        color: '#ef4444',
        angle: 0,
        variant: 0,
        velocity: { x: 0, y: 0 },
        targetId: undefined,
      });
    }
  }
  
  // Black holes (chaos level 5)
  if (chaosLevel >= 5) {
    const pos = randPos();
    obstacles.push({
      position: pos,
      width: 100,
      height: 100,
      depth: 100,
      type: 'black_hole',
      health: 9999,
      maxHealth: 9999,
      color: '#000000',
      angle: 0,
      variant: 0,
    });
  }
  
  return obstacles;
}

export function updateGame(state: GameState, input: InputState, deltaTime: number): GameState {
  if (state.gameOver || state.paused || !state.gameStarted) return state;
  
  const dt = Math.min(deltaTime, 32);
  const newState = { ...state };
  newState.time += dt;
  
  // Chaos level escalation
  newState.chaosTimer += dt;
  if (newState.chaosTimer > 30000 && newState.chaosLevel < 5) { // Every 30 seconds
    newState.chaosLevel += 1;
    newState.chaosTimer = 0;
    // Add more chaos objects
    const newObstacles = createObstacles(newState.chaosLevel).filter(o => 
      !['stilt_house', 'bamboo'].includes(o.type)
    );
    newState.obstacles = [...newState.obstacles, ...newObstacles];
  }
  
  // Player update (same as before)
  const player = { ...newState.player };
  let moveX = 0, moveY = 0;
  if (input.up) moveY -= 1;
  if (input.down) moveY += 1;
  if (input.left) moveX -= 1;
  if (input.right) moveX += 1;
  
  const moveLen = Math.sqrt(moveX * moveX + moveY * moveY);
  if (moveLen > 0) {
    moveX /= moveLen;
    moveY /= moveLen;
  }
  
  player.moving = moveLen > 0;
  if (player.moving) {
    player.targetAngle = Math.atan2(moveY, moveX);
  }
  
  const bodyAngleDiff = angleDiff(player.angle, player.targetAngle);
  player.angle += bodyAngleDiff * (player.moving ? 0.12 : 0.06);
  
  const accel = 0.5;
  const decel = 0.88;
  
  if (player.moving) {
    player.velocity.x += moveX * accel;
    player.velocity.y += moveY * accel;
    player.trackOffset += 0.4;
  }
  
  player.velocity.x *= decel;
  player.velocity.y *= decel;
  
  const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
  const maxSpeed = player.speed * (player.speedBoost ? 1.5 : 1);
  if (speed > maxSpeed) {
    player.velocity.x = (player.velocity.x / speed) * maxSpeed;
    player.velocity.y = (player.velocity.y / speed) * maxSpeed;
  }
  
  if (speed < 0.1 && !player.moving) {
    player.velocity.x = 0;
    player.velocity.y = 0;
  }
  
  player.position.x += player.velocity.x;
  player.position.y += player.velocity.y;
  
  if (speed > 1.5 && Math.random() > 0.5) {
    const dustPos = {
      x: player.position.x - player.velocity.x * 2 + (Math.random() - 0.5) * 15,
      y: player.position.y - player.velocity.y * 2 + (Math.random() - 0.5) * 15,
    };
    newState.particles = [...newState.particles, ...createParticles(dustPos, 1, 'dust')];
  }
  
  player.position.x = Math.max(player.size, Math.min(MAP_WIDTH - player.size, player.position.x));
  player.position.y = Math.max(player.size, Math.min(MAP_HEIGHT - player.size, player.position.y));
  
  const cameraX = player.position.x - CANVAS_WIDTH / 2;
  const cameraY = player.position.y - CANVAS_HEIGHT / 2;
  const worldMouseX = input.mouseX + cameraX;
  const worldMouseY = input.mouseY + cameraY;
  const targetTurretAngle = Math.atan2(worldMouseY - player.position.y, worldMouseX - player.position.x);
  
  const turretDiff = angleDiff(player.turretAngle, targetTurretAngle);
  player.turretAngle += turretDiff * 0.15;
  
  // Shooting with power-ups
  const fireRate = player.rapidFire ? player.fireRate * 0.4 : player.fireRate;
  if (input.shoot && newState.time - player.lastShot > fireRate) {
    player.lastShot = newState.time;
    
    if (player.tripleShot) {
      // Triple shot
      for (let i = -1; i <= 1; i++) {
        const spreadAngle = player.turretAngle + i * 0.15;
        const tempTank = { ...player, turretAngle: spreadAngle };
        const bullet = createBullet(tempTank);
        newState.bullets = [...newState.bullets, bullet];
      }
    } else {
      const bullet = createBullet(player);
      newState.bullets = [...newState.bullets, bullet];
    }
    
    newState.particles = [...newState.particles, ...createParticles(
      { x: player.position.x + Math.cos(player.turretAngle) * player.size * 1.5,
        y: player.position.y + Math.sin(player.turretAngle) * player.size * 1.5 },
      10, 'muzzle'
    )];
    newState.screenShake = { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 };
  }
  
  // Obstacle collision
  for (const obs of newState.obstacles) {
    if (obs.type === 'rice_paddy') continue;
    
    if (rectCollision(player.position, player.size, obs)) {
      // Power-up collection
      if (['health_pack', 'speed_boost', 'rapid_fire', 'triple_shot', 'shield', 'armor_boost'].includes(obs.type)) {
        if (obs.active !== false) {
          switch (obs.type) {
            case 'health_pack':
              player.health = Math.min(player.maxHealth, player.health + 30);
              break;
            case 'speed_boost':
              player.speedBoost = 10000; // 10 seconds
              break;
            case 'rapid_fire':
              player.rapidFire = 8000; // 8 seconds
              break;
            case 'triple_shot':
              player.tripleShot = 6000; // 6 seconds
              break;
            case 'shield':
              player.shield = 50;
              break;
            case 'armor_boost':
              player.armorBoost = 12000; // 12 seconds
              break;
          }
          obs.active = false;
          obs.cooldown = 15000; // Respawn after 15 seconds
          newState.particles = [...newState.particles, ...createParticles(obs.position, 15, 'confetti')];
        }
        continue;
      }
      
      // Hazard effects
      if (obs.type === 'lava_pool' || obs.type === 'acid_lake') {
        player.health -= 0.5;
        if (Math.random() > 0.7) {
          newState.particles = [...newState.particles, ...createParticles(player.position, 1, 'fire')];
        }
      } else if (obs.type === 'quicksand') {
        player.velocity.x *= 0.95;
        player.velocity.y *= 0.95;
      } else if (obs.type === 'ice_patch') {
        player.velocity.x *= 0.98;
        player.velocity.y *= 0.98;
      } else if (obs.type === 'oil_spill') {
        player.angle += (Math.random() - 0.5) * 0.05;
      }
      
      const pushDir = normalize({
        x: player.position.x - obs.position.x,
        y: player.position.y - obs.position.y,
      });
      player.position.x += pushDir.x * 4;
      player.position.y += pushDir.y * 4;
      player.velocity.x *= 0.3;
      player.velocity.y *= 0.3;
    }
  }
  
  // Update power-up timers
  if (player.rapidFire && player.rapidFire > 0) player.rapidFire -= dt;
  if (player.tripleShot && player.tripleShot > 0) player.tripleShot -= dt;
  if (player.speedBoost && player.speedBoost > 0) player.speedBoost -= dt;
  if (player.armorBoost && player.armorBoost > 0) player.armorBoost -= dt;
  
  // Respawn power-ups
  newState.obstacles.forEach(obs => {
    if (['health_pack', 'speed_boost', 'rapid_fire', 'triple_shot', 'shield', 'armor_boost'].includes(obs.type)) {
      if (obs.active === false && obs.cooldown && obs.cooldown > 0) {
        obs.cooldown -= dt;
        if (obs.cooldown <= 0) {
          obs.active = true;
        }
      }
    }
  });
  
  newState.player = player;
  
  // Enemy AI (simplified - same as before)
  newState.enemies = newState.enemies.map(enemy => {
    const e = { ...enemy };
    const toPlayer = { x: player.position.x - e.position.x, y: player.position.y - e.position.y };
    const distToPlayer = Math.sqrt(toPlayer.x ** 2 + toPlayer.y ** 2);
    const angleToPlayer = Math.atan2(toPlayer.y, toPlayer.x);
    
    const turretDiff = angleDiff(e.turretAngle, angleToPlayer);
    e.turretAngle += turretDiff * 0.06;
    
    const bodyDiff = angleDiff(e.angle, angleToPlayer);
    e.angle += bodyDiff * 0.06;
    
    e.velocity.x += Math.cos(e.angle) * 0.25;
    e.velocity.y += Math.sin(e.angle) * 0.25;
    e.trackOffset += 0.25;
    e.moving = true;
    
    e.velocity.x *= 0.9;
    e.velocity.y *= 0.9;
    
    const eSpeed = Math.sqrt(e.velocity.x ** 2 + e.velocity.y ** 2);
    if (eSpeed > e.speed) {
      e.velocity.x = (e.velocity.x / eSpeed) * e.speed;
      e.velocity.y = (e.velocity.y / eSpeed) * e.speed;
    }
    
    e.position.x += e.velocity.x;
    e.position.y += e.velocity.y;
    e.position.x = Math.max(e.size, Math.min(MAP_WIDTH - e.size, e.position.x));
    e.position.y = Math.max(e.size, Math.min(MAP_HEIGHT - e.size, e.position.y));
    
    if (Math.abs(turretDiff) < 0.25 && distToPlayer < 600 && newState.time - e.lastShot > e.fireRate) {
      e.lastShot = newState.time;
      const bullet = createBullet(e);
      newState.bullets = [...newState.bullets, bullet];
    }
    
    return e;
  });
  
  // Update bullets
  newState.bullets = newState.bullets.filter(bullet => {
    const b = { ...bullet };
    
    // Homing behavior
    if (b.homing && newState.enemies.length > 0) {
      let closestEnemy = newState.enemies[0];
      let closestDist = distance(b.position, closestEnemy.position);
      newState.enemies.forEach(e => {
        const d = distance(b.position, e.position);
        if (d < closestDist) {
          closestDist = d;
          closestEnemy = e;
        }
      });
      
      const toEnemy = normalize({ x: closestEnemy.position.x - b.position.x, y: closestEnemy.position.y - b.position.y });
      b.velocity.x = b.velocity.x * 0.95 + toEnemy.x * 0.5;
      b.velocity.y = b.velocity.y * 0.95 + toEnemy.y * 0.5;
    }
    
    b.trail = [...b.trail, { ...b.position }].slice(-10);
    b.position.x += b.velocity.x;
    b.position.y += b.velocity.y;
    b.lifetime -= dt;
    
    if (b.lifetime <= 0 || b.position.x < 0 || b.position.x > MAP_WIDTH || 
        b.position.y < 0 || b.position.y > MAP_HEIGHT) {
      if (b.explosive) {
        newState.explosions = [...newState.explosions, createExplosion(b.position, 50)];
        newState.particles = [...newState.particles, ...createParticles(b.position, 20, 'explosion')];
      }
      return false;
    }
    
    // Bullet-obstacle collision
    for (let i = 0; i < newState.obstacles.length; i++) {
      const obs = newState.obstacles[i];
      if (obs.type === 'rice_paddy') continue;
      
      if (b.position.x > obs.position.x - obs.width / 2 &&
          b.position.x < obs.position.x + obs.width / 2 &&
          b.position.y > obs.position.y - obs.height / 2 &&
          b.position.y < obs.position.y + obs.height / 2) {
        
        // Explosive barrels chain reaction
        if (obs.type === 'explosive_barrel' || obs.type === 'tnt_crate') {
          const explosionSize = obs.type === 'tnt_crate' ? 80 : 50;
          newState.explosions = [...newState.explosions, createExplosion(obs.position, explosionSize)];
          newState.particles = [...newState.particles, ...createParticles(obs.position, 30, 'explosion')];
          newState.obstacles = newState.obstacles.filter((_, idx) => idx !== i);
          
          // Chain reaction - damage nearby explosives
          newState.obstacles.forEach(nearbyObs => {
            if ((nearbyObs.type === 'explosive_barrel' || nearbyObs.type === 'tnt_crate') &&
                distance(obs.position, nearbyObs.position) < explosionSize * 2) {
              nearbyObs.health = 0;
            }
          });
        } else {
          newState.particles = [...newState.particles, ...createParticles(b.position, 8, 'spark')];
          obs.health -= b.damage;
        }
        
        if (b.explosive) {
          newState.explosions = [...newState.explosions, createExplosion(b.position, 50)];
          newState.particles = [...newState.particles, ...createParticles(b.position, 20, 'explosion')];
        }
        
        return false;
      }
    }
    
    // Bullet-enemy collision
    for (let i = 0; i < newState.enemies.length; i++) {
      const enemy = newState.enemies[i];
      if (b.ownerId === player.id && distance(b.position, enemy.position) < enemy.size) {
        newState.enemies[i] = { ...enemy, health: enemy.health - b.damage };
        newState.particles = [...newState.particles, ...createParticles(b.position, 8, 'spark')];
        
        if (newState.enemies[i].health <= 0) {
          newState.explosions = [...newState.explosions, createExplosion(enemy.position, 70)];
          newState.particles = [...newState.particles, ...createParticles(enemy.position, 35, 'explosion')];
          newState.enemies = newState.enemies.filter((_, idx) => idx !== i);
          newState.score += 100;
          newState.player.kills += 1;
        }
        return false;
      }
    }
    
    return true;
  });
  
  // Remove destroyed obstacles
  newState.obstacles = newState.obstacles.filter(obs => obs.health > 0);
  
  // Update particles
  newState.particles = newState.particles.filter(p => {
    p.position.x += p.velocity.x;
    p.position.y += p.velocity.y;
    p.velocity.x *= 0.95;
    p.velocity.y *= 0.95;
    if (p.type === 'smoke') p.velocity.y -= 0.03;
    p.rotation += p.rotationSpeed;
    p.lifetime -= dt;
    p.opacity = Math.max(0, p.lifetime / p.maxLifetime);
    return p.lifetime > 0;
  });
  
  if (newState.particles.length > 500) newState.particles = newState.particles.slice(-500);
  
  // Update explosions
  newState.explosions = newState.explosions.filter(e => {
    e.lifetime -= dt;
    e.radius = e.maxRadius * (1 - e.lifetime / e.maxLifetime);
    return e.lifetime > 0;
  });
  
  newState.screenShake = { x: newState.screenShake.x * 0.88, y: newState.screenShake.y * 0.88 };
  
  // Wave management
  if (newState.enemies.length === 0) {
    newState.wave += 1;
    newState.waveAnnouncement = 2500;
    const enemyCount = Math.min(12, 3 + newState.wave * 2);
    for (let i = 0; i < enemyCount; i++) {
      newState.enemies = [...newState.enemies, createEnemy(newState.wave, player.position)];
    }
  }
  
  if (newState.waveAnnouncement > 0) newState.waveAnnouncement = Math.max(0, newState.waveAnnouncement - dt);
  
  return newState;
}

export function initGameState(): GameState {
  clearDecals();
  const player = createPlayer();
  const enemies: Tank[] = [];
  for (let i = 0; i < 5; i++) {
    enemies.push(createEnemy(1, player.position));
  }
  
  return {
    player,
    enemies,
    bullets: [],
    particles: [],
    explosions: [],
    obstacles: createObstacles(1),
    score: 0,
    wave: 1,
    gameOver: false,
    gameStarted: false,
    paused: false,
    screenShake: { x: 0, y: 0 },
    time: 0,
    waveAnnouncement: 2000,
    chaosLevel: 1,
    chaosTimer: 0,
  };
}
