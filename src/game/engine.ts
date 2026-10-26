import { Tank, Bullet, Particle, Explosion, Obstacle, GameState, InputState, Vector2 } from './types';
import { addGroundDecal, clearDecals } from './renderer';

let nextId = 0;
const getId = () => `id_${nextId++}`;

// MUCH BIGGER MAP
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
    rotationSpeed: 0.08, // Faster rotation for responsive controls
    color: '#2563eb',
    accentColor: '#60a5fa',
    lastShot: 0,
    fireRate: 250,
    isPlayer: true,
    size: 26,
    height: 14, // 2.5D height
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
    { color: '#0891b2', accentColor: '#22d3ee' },
  ];
  const colorSet = colors[Math.floor(Math.random() * colors.length)];
  const margin = 200;
  
  // Spawn far from player
  let x: number, y: number;
  let attempts = 0;
  do {
    x = margin + Math.random() * (MAP_WIDTH - margin * 2);
    y = margin + Math.random() * (MAP_HEIGHT - margin * 2);
    attempts++;
  } while (
    Math.sqrt((x - playerPos.x) ** 2 + (y - playerPos.y) ** 2) < 600 && 
    attempts < 50
  );

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

export function createBullet(tank: Tank): Bullet {
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
    height: 8, // 2.5D bullet height
  };
}

export function createExplosion(position: Vector2, size: number): Explosion {
  return {
    position: { ...position },
    radius: 0,
    maxRadius: size,
    lifetime: 600,
    maxLifetime: 600,
    color: '#ff6b35',
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
                  1 + Math.random() * 3;
    
    const colors: Record<string, string[]> = {
      explosion: ['#ff6b35', '#ff9500', '#ffcc00', '#ff4444', '#ffffff'],
      smoke: ['#555555', '#666666', '#777777', '#888888'],
      spark: ['#ffcc00', '#ffffff', '#ff9500', '#ffee00'],
      debris: ['#8B4513', '#654321', '#555555', '#333333'],
      trail: ['#ff9500', '#ffcc00', '#ff6b35'],
      muzzle: ['#ffffff', '#ffee00', '#ffcc00', '#ff9500'],
      dust: ['#a0845c', '#8b7355', '#6b5b45', '#9c8b70'],
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
                400 + Math.random() * 600,
      maxLifetime: type === 'smoke' ? 2000 :
                   type === 'explosion' ? 800 :
                   type === 'spark' ? 600 :
                   type === 'muzzle' ? 300 :
                   type === 'dust' ? 1000 :
                   1000,
      size: type === 'smoke' ? 8 + Math.random() * 15 :
            type === 'explosion' ? 4 + Math.random() * 8 :
            type === 'spark' ? 2 + Math.random() * 3 :
            type === 'muzzle' ? 3 + Math.random() * 5 :
            type === 'dust' ? 5 + Math.random() * 8 :
            3 + Math.random() * 5,
      color: particleColor,
      type,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
      height: type === 'dust' ? Math.random() * 3 : 0,
    });
  }
  return particles;
}

export function createObstacles(): Obstacle[] {
  const obstacles: Obstacle[] = [];
  
  // Buildings - spread across the big map
  for (let i = 0; i < 20; i++) {
    obstacles.push({
      position: {
        x: 300 + Math.random() * (MAP_WIDTH - 600),
        y: 300 + Math.random() * (MAP_HEIGHT - 600),
      },
      width: 70 + Math.random() * 100,
      height: 70 + Math.random() * 100,
      depth: 40 + Math.random() * 30, // 2.5D depth
      type: 'building',
      health: 250,
      maxHealth: 250,
      color: '#4a5568',
      angle: 0,
    });
  }
  
  // Rocks
  for (let i = 0; i < 25; i++) {
    const size = 25 + Math.random() * 40;
    obstacles.push({
      position: {
        x: 200 + Math.random() * (MAP_WIDTH - 400),
        y: 200 + Math.random() * (MAP_HEIGHT - 400),
      },
      width: size,
      height: size * (0.8 + Math.random() * 0.4),
      depth: size * 0.6,
      type: 'rock',
      health: 100,
      maxHealth: 100,
      color: '#6b7280',
      angle: Math.random() * Math.PI * 2,
    });
  }
  
  // Crates
  for (let i = 0; i < 30; i++) {
    const size = 28 + Math.random() * 25;
    obstacles.push({
      position: {
        x: 150 + Math.random() * (MAP_WIDTH - 300),
        y: 150 + Math.random() * (MAP_HEIGHT - 300),
      },
      width: size,
      height: size,
      depth: size * 0.8,
      type: 'crate',
      health: 60,
      maxHealth: 60,
      color: '#8B4513',
      angle: 0,
    });
  }
  
  // Walls
  for (let i = 0; i < 18; i++) {
    const isHorizontal = Math.random() > 0.5;
    obstacles.push({
      position: {
        x: 300 + Math.random() * (MAP_WIDTH - 600),
        y: 300 + Math.random() * (MAP_HEIGHT - 600),
      },
      width: isHorizontal ? 120 + Math.random() * 180 : 25,
      height: isHorizontal ? 25 : 120 + Math.random() * 180,
      depth: 30 + Math.random() * 20,
      type: 'wall',
      health: 350,
      maxHealth: 350,
      color: '#374151',
      angle: 0,
    });
  }
  
  // Trees (decorative but collidable)
  for (let i = 0; i < 35; i++) {
    obstacles.push({
      position: {
        x: 200 + Math.random() * (MAP_WIDTH - 400),
        y: 200 + Math.random() * (MAP_HEIGHT - 400),
      },
      width: 20 + Math.random() * 15,
      height: 20 + Math.random() * 15,
      depth: 50 + Math.random() * 30,
      type: 'tree',
      health: 40,
      maxHealth: 40,
      color: '#166534',
      angle: 0,
    });
  }
  
  return obstacles;
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

function rectCollision(
  pos: Vector2,
  size: number,
  obstacle: Obstacle
): boolean {
  const halfSize = size * 0.7;
  const closestX = Math.max(obstacle.position.x - obstacle.width / 2, 
    Math.min(pos.x, obstacle.position.x + obstacle.width / 2));
  const closestY = Math.max(obstacle.position.y - obstacle.height / 2, 
    Math.min(pos.y, obstacle.position.y + obstacle.height / 2));
  
  const dx = pos.x - closestX;
  const dy = pos.y - closestY;
  return (dx * dx + dy * dy) < (halfSize * halfSize);
}

export function updateGame(state: GameState, input: InputState, deltaTime: number): GameState {
  if (state.gameOver || state.paused || !state.gameStarted) return state;
  
  const dt = Math.min(deltaTime, 32);
  const newState = { ...state };
  newState.time += dt;
  
  // ===== EASIER CONTROLS - Player Update =====
  const player = { ...newState.player };
  
  // Calculate desired movement direction from input
  let moveX = 0;
  let moveY = 0;
  if (input.up) moveY -= 1;
  if (input.down) moveY += 1;
  if (input.left) moveX -= 1;
  if (input.right) moveX += 1;
  
  // Normalize diagonal movement
  const moveLen = Math.sqrt(moveX * moveX + moveY * moveY);
  if (moveLen > 0) {
    moveX /= moveLen;
    moveY /= moveLen;
  }
  
  player.moving = moveLen > 0;
  
  // EASY CONTROL: Tank body rotates towards movement direction smoothly
  if (player.moving) {
    player.targetAngle = Math.atan2(moveY, moveX);
  }
  
  // Smooth rotation towards target
  const bodyAngleDiff = angleDiff(player.angle, player.targetAngle);
  const rotateSpeed = player.moving ? 0.12 : 0.06; // Faster rotation when moving
  player.angle += bodyAngleDiff * rotateSpeed;
  
  // Apply acceleration - smooth and responsive
  const accel = 0.5;
  const decel = 0.88; // Friction
  
  if (player.moving) {
    player.velocity.x += moveX * accel;
    player.velocity.y += moveY * accel;
    player.trackOffset += 0.4;
  }
  
  // Friction
  player.velocity.x *= decel;
  player.velocity.y *= decel;
  
  // Speed limit
  const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
  if (speed > player.speed) {
    player.velocity.x = (player.velocity.x / speed) * player.speed;
    player.velocity.y = (player.velocity.y / speed) * player.speed;
  }
  
  // Stop completely when very slow
  if (speed < 0.1 && !player.moving) {
    player.velocity.x = 0;
    player.velocity.y = 0;
  }
  
  // Move player
  player.position.x += player.velocity.x;
  player.position.y += player.velocity.y;
  
  // Dust trail when moving
  if (speed > 1.5 && Math.random() > 0.5) {
    const dustPos = {
      x: player.position.x - player.velocity.x * 2 + (Math.random() - 0.5) * 15,
      y: player.position.y - player.velocity.y * 2 + (Math.random() - 0.5) * 15,
    };
    newState.particles = [...newState.particles, ...createParticles(dustPos, 1, 'dust')];
  }
  
  // Bounds
  player.position.x = Math.max(player.size, Math.min(MAP_WIDTH - player.size, player.position.x));
  player.position.y = Math.max(player.size, Math.min(MAP_HEIGHT - player.size, player.position.y));
  
  // EASY CONTROL: Turret smoothly follows mouse (in world coordinates)
  const cameraX = player.position.x - CANVAS_WIDTH / 2;
  const cameraY = player.position.y - CANVAS_HEIGHT / 2;
  const worldMouseX = input.mouseX + cameraX;
  const worldMouseY = input.mouseY + cameraY;
  const targetTurretAngle = Math.atan2(worldMouseY - player.position.y, worldMouseX - player.position.x);
  
  // Smooth turret rotation
  const turretDiff = angleDiff(player.turretAngle, targetTurretAngle);
  player.turretAngle += turretDiff * 0.15; // Smooth tracking
  
  // Player shooting
  if (input.shoot && newState.time - player.lastShot > player.fireRate) {
    player.lastShot = newState.time;
    const bullet = createBullet(player);
    newState.bullets = [...newState.bullets, bullet];
    newState.particles = [...newState.particles, 
      ...createParticles(bullet.position, 10, 'muzzle')
    ];
    // Screen shake
    newState.screenShake = {
      x: (Math.random() - 0.5) * 5,
      y: (Math.random() - 0.5) * 5,
    };
  }
  
  // Obstacle collision for player
  for (const obs of newState.obstacles) {
    if (rectCollision(player.position, player.size, obs)) {
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
  
  newState.player = player;
  
  // Fire trails for damaged player
  if (player.health < player.maxHealth * 0.3 && Math.random() > 0.6) {
    newState.particles = [...newState.particles, ...createParticles(
      { x: player.position.x + (Math.random() - 0.5) * player.size, 
        y: player.position.y + (Math.random() - 0.5) * player.size }, 
      1, 'smoke'
    )];
  }
  
  // ===== Enemy AI =====
  newState.enemies = newState.enemies.map(enemy => {
    const e = { ...enemy };
    
    // Fire trail for damaged enemies
    if (e.health < e.maxHealth * 0.3 && Math.random() > 0.7) {
      newState.particles = [...newState.particles, ...createParticles(
        { x: e.position.x + (Math.random() - 0.5) * e.size, 
          y: e.position.y + (Math.random() - 0.5) * e.size }, 
        1, 'smoke'
      )];
    }
    
    const toPlayer = {
      x: player.position.x - e.position.x,
      y: player.position.y - e.position.y,
    };
    const distToPlayer = Math.sqrt(toPlayer.x ** 2 + toPlayer.y ** 2);
    const angleToPlayer = Math.atan2(toPlayer.y, toPlayer.x);
    
    // Turret aims at player (smoothly)
    const turretDiff = angleDiff(e.turretAngle, angleToPlayer);
    e.turretAngle += turretDiff * 0.06;
    
    // Movement AI - circle strafe behavior
    let targetMoveAngle = angleToPlayer;
    const idealDist = 300;
    
    if (distToPlayer > idealDist + 100) {
      // Move towards player
      targetMoveAngle = angleToPlayer;
    } else if (distToPlayer < idealDist - 100) {
      // Back away
      targetMoveAngle = angleToPlayer + Math.PI;
    } else {
      // Strafe around player
      const strafeDir = Math.sin(newState.time * 0.002 + parseFloat(e.id.split('_')[1]) * 3) > 0 ? 1 : -1;
      targetMoveAngle = angleToPlayer + (Math.PI / 2) * strafeDir;
    }
    
    // Smooth body rotation towards movement
    const bodyDiff = angleDiff(e.angle, targetMoveAngle);
    e.angle += bodyDiff * 0.06;
    
    // Apply movement
    const moveForce = 0.25;
    e.velocity.x += Math.cos(e.angle) * moveForce;
    e.velocity.y += Math.sin(e.angle) * moveForce;
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
    
    // Dust trail for enemies
    if (eSpeed > 1 && Math.random() > 0.7) {
      newState.particles = [...newState.particles, ...createParticles(
        { x: e.position.x - e.velocity.x * 2 + (Math.random() - 0.5) * 10,
          y: e.position.y - e.velocity.y * 2 + (Math.random() - 0.5) * 10 },
        1, 'dust'
      )];
    }
    
    // Obstacle collision for enemies
    for (const obs of newState.obstacles) {
      if (rectCollision(e.position, e.size, obs)) {
        const pushDir = normalize({
          x: e.position.x - obs.position.x,
          y: e.position.y - obs.position.y,
        });
        e.position.x += pushDir.x * 3;
        e.position.y += pushDir.y * 3;
        // Try to navigate around
        e.angle += 0.3;
      }
    }
    
    // Enemy shooting - only when turret is aimed
    if (Math.abs(turretDiff) < 0.25 && distToPlayer < 600 && newState.time - e.lastShot > e.fireRate) {
      e.lastShot = newState.time;
      const bullet = createBullet(e);
      newState.bullets = [...newState.bullets, bullet];
      newState.particles = [...newState.particles, ...createParticles(bullet.position, 6, 'muzzle')];
    }
    
    return e;
  });
  
  // ===== Update bullets =====
  newState.bullets = newState.bullets.filter(bullet => {
    const b = { ...bullet };
    b.trail = [...b.trail, { ...b.position }].slice(-10);
    b.position.x += b.velocity.x;
    b.position.y += b.velocity.y;
    b.lifetime -= dt;
    
    if (b.lifetime <= 0 || b.position.x < 0 || b.position.x > MAP_WIDTH || 
        b.position.y < 0 || b.position.y > MAP_HEIGHT) {
      if (b.position.x > 0 && b.position.x < MAP_WIDTH && b.position.y > 0 && b.position.y < MAP_HEIGHT) {
        addGroundDecal(b.position.x, b.position.y, 8, 'scorch');
      }
      return false;
    }
    
    // Bullet-obstacle collision
    for (let i = 0; i < newState.obstacles.length; i++) {
      const obs = newState.obstacles[i];
      if (b.position.x > obs.position.x - obs.width / 2 &&
          b.position.x < obs.position.x + obs.width / 2 &&
          b.position.y > obs.position.y - obs.height / 2 &&
          b.position.y < obs.position.y + obs.height / 2) {
        newState.particles = [...newState.particles, ...createParticles(b.position, 8, 'spark')];
        newState.particles = [...newState.particles, ...createParticles(b.position, 3, 'debris')];
        newState.obstacles = [...newState.obstacles];
        newState.obstacles[i] = { ...obs, health: obs.health - b.damage };
        addGroundDecal(b.position.x, b.position.y, 6, 'scorch');
        return false;
      }
    }
    
    // Bullet-player collision
    if (b.ownerId !== player.id && distance(b.position, player.position) < player.size) {
      newState.player = { ...newState.player, health: newState.player.health - b.damage };
      newState.particles = [...newState.particles, ...createParticles(b.position, 10, 'spark')];
      newState.screenShake = { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 };
      if (newState.player.health <= 0) {
        newState.gameOver = true;
        newState.explosions = [...newState.explosions, createExplosion(player.position, 100)];
        newState.particles = [...newState.particles, ...createParticles(player.position, 50, 'explosion')];
        newState.particles = [...newState.particles, ...createParticles(player.position, 25, 'smoke')];
        newState.particles = [...newState.particles, ...createParticles(player.position, 15, 'spark')];
        addGroundDecal(player.position.x, player.position.y, 60, 'crater');
        addGroundDecal(player.position.x, player.position.y, 80, 'scorch');
      }
      return false;
    }
    
    // Bullet-enemy collision
    for (let i = 0; i < newState.enemies.length; i++) {
      const enemy = newState.enemies[i];
      if (b.ownerId === player.id && distance(b.position, enemy.position) < enemy.size) {
        newState.enemies = [...newState.enemies];
        newState.enemies[i] = { ...enemy, health: enemy.health - b.damage };
        newState.particles = [...newState.particles, ...createParticles(b.position, 8, 'spark')];
        
        if (newState.enemies[i].health <= 0) {
          newState.explosions = [...newState.explosions, createExplosion(enemy.position, 70)];
          newState.particles = [...newState.particles, ...createParticles(enemy.position, 35, 'explosion')];
          newState.particles = [...newState.particles, ...createParticles(enemy.position, 18, 'smoke')];
          newState.particles = [...newState.particles, ...createParticles(enemy.position, 12, 'debris')];
          newState.particles = [...newState.particles, ...createParticles(enemy.position, 10, 'spark')];
          addGroundDecal(enemy.position.x, enemy.position.y, 40, 'crater');
          addGroundDecal(enemy.position.x, enemy.position.y, 60, 'scorch');
          newState.enemies = newState.enemies.filter((_, idx) => idx !== i);
          newState.score += 100;
          newState.player = { ...newState.player, kills: newState.player.kills + 1 };
          newState.screenShake = { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 };
        }
        return false;
      }
    }
    
    // Trail particles
    if (Math.random() > 0.6) {
      newState.particles = [...newState.particles, ...createParticles(b.position, 1, 'trail')];
    }
    
    return true;
  });
  
  // Remove destroyed obstacles
  newState.obstacles = newState.obstacles.filter(obs => {
    if (obs.health <= 0) {
      newState.particles = [...newState.particles, ...createParticles(obs.position, 15, 'debris')];
      newState.explosions = [...newState.explosions, createExplosion(obs.position, 40)];
      addGroundDecal(obs.position.x, obs.position.y, 25, 'scorch');
      return false;
    }
    return true;
  });
  
  // Update particles
  newState.particles = newState.particles.filter(p => {
    p.position.x += p.velocity.x;
    p.position.y += p.velocity.y;
    p.velocity.x *= 0.95;
    p.velocity.y *= 0.95;
    if (p.type === 'smoke') {
      p.velocity.y -= 0.03;
      p.size += 0.15;
    }
    if (p.type === 'dust') {
      p.size += 0.08;
    }
    p.rotation += p.rotationSpeed;
    p.lifetime -= dt;
    p.opacity = Math.max(0, p.lifetime / p.maxLifetime);
    return p.lifetime > 0;
  });
  
  // Limit particles
  if (newState.particles.length > 500) {
    newState.particles = newState.particles.slice(-500);
  }
  
  // Update explosions
  newState.explosions = newState.explosions.filter(e => {
    e.lifetime -= dt;
    e.radius = e.maxRadius * (1 - e.lifetime / e.maxLifetime);
    return e.lifetime > 0;
  });
  
  // Screen shake decay
  newState.screenShake = {
    x: newState.screenShake.x * 0.88,
    y: newState.screenShake.y * 0.88,
  };
  
  // Wave management
  if (newState.enemies.length === 0) {
    newState.wave += 1;
    newState.waveAnnouncement = 2500;
    const enemyCount = Math.min(12, 3 + newState.wave * 2);
    for (let i = 0; i < enemyCount; i++) {
      newState.enemies = [...newState.enemies, createEnemy(newState.wave, player.position)];
    }
  }
  
  // Wave announcement countdown
  if (newState.waveAnnouncement > 0) {
    newState.waveAnnouncement = Math.max(0, newState.waveAnnouncement - dt);
  }
  
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
    obstacles: createObstacles(),
    score: 0,
    wave: 1,
    gameOver: false,
    gameStarted: false,
    paused: false,
    screenShake: { x: 0, y: 0 },
    time: 0,
    waveAnnouncement: 2000,
  };
}
